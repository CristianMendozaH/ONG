import { Router, Request, Response, NextFunction } from 'express';
import { sequelize } from '../db/sequelize.js';
import { auth } from '../middleware/auth.js';
import { Assignment } from '../models/Assignment.js';
import { Equipment } from '../models/Equipment.js';
import { Collaborator } from '../models/Collaborator.js';
import { User } from '../models/User.js';

interface AuthRequest extends Request {
  user?: {
    sub: string;
    name: string;
  };
}

const router = Router();

/**
 * @route   POST /api/assignments
 * @desc    Crear una nueva asignación de equipo
 * @access  Private
 */
router.post('/', auth, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { equipmentId, collaboratorId, assignmentDate, observations, accessories } = req.body;
    if (!equipmentId || !collaboratorId || !assignmentDate) {
      return res.status(400).json({ message: 'Campos requeridos: equipmentId, collaboratorId, assignmentDate' });
    }
    const result = await sequelize.transaction(async (t) => {
      const eq = await Equipment.findByPk(equipmentId, { transaction: t, lock: t.LOCK.UPDATE });
      if (!eq) throw { status: 404, message: 'Equipo no encontrado' };
      if (eq.status !== 'disponible') throw { status: 409, message: `El equipo no está disponible (estado actual: ${eq.status})` };
      const collaborator = await Collaborator.findByPk(collaboratorId, { transaction: t });
      if (!collaborator || !collaborator.isActive) throw { status: 404, message: 'Colaborador no encontrado o inactivo.' };
      const assignment = await Assignment.create({
        equipmentId,
        collaboratorId,
        assignmentDate,
        observations,
        accessories,
        createdById: req.user!.sub,
        status: 'assigned',
      }, { transaction: t });
      await eq.update({ status: 'asignado' }, { transaction: t });
      return assignment;
    });
    res.status(201).json(result);
  } catch (e: any) {
    if (e?.status) return res.status(e.status).json({ message: e.message });
    console.error("Error al crear asignación:", e);
    next(e);
  }
});

/**
 * @route   GET /api/assignments
 * @desc    Listar todas las asignaciones
 * @access  Private
 */
router.get('/', auth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const assignments = await Assignment.findAll({
      include: [
        { model: Equipment, as: 'assignedEquipment', attributes: ['name', 'code'] },
        // --- 👇 INICIO DE LA CORRECCIÓN 👇 ---
        { 
          model: Collaborator, 
          as: 'collaborator', 
          attributes: ['fullName', 'program', 'type'] // ✅ AÑADIMOS 'type' A LOS ATRIBUTOS
        },
        // --- 👆 FIN DE LA CORRECCIÓN 👆 ---
        { model: User, as: 'creator', attributes: ['name'] }
      ],
      order: [['createdAt', 'DESC']],
    });
    res.json(assignments);
  } catch (e) {
    next(e);
  }
});

/**
 * @route   GET /api/assignments/:id
 * @desc    Obtener una asignación por su ID
 * @access  Private
 */
router.get('/:id', auth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const assignment = await Assignment.findByPk(req.params.id, {
        include: [
          { model: Equipment, as: 'assignedEquipment' },
          { model: Collaborator, as: 'collaborator' }, // En la vista de detalle, traemos todo el colaborador
          { model: User, as: 'creator', attributes: ['name'] }
        ]
    });
    if (!assignment) return res.status(404).json({ message: 'Asignación no encontrada' });
    res.json(assignment);
  } catch (e) {
    next(e);
  }
});

/**
 * @route   PATCH /api/assignments/:id
 * @desc    Actualizar una asignación existente
 * @access  Private
 */
router.patch('/:id', auth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { equipmentId, collaboratorId, assignmentDate, observations, accessories } = req.body;
    const result = await sequelize.transaction(async (t) => {
        const assignment = await Assignment.findByPk(req.params.id, { transaction: t });
        if (!assignment) throw { status: 404, message: 'Asignación no encontrada' };
        if (equipmentId && equipmentId !== assignment.equipmentId) {
            const oldEq = await Equipment.findByPk(assignment.equipmentId, { transaction: t });
            if (oldEq) await oldEq.update({ status: 'disponible' }, { transaction: t });
            const newEq = await Equipment.findByPk(equipmentId, { transaction: t, lock: t.LOCK.UPDATE });
            if (!newEq || newEq.status !== 'disponible') throw { status: 409, message: 'El nuevo equipo seleccionado no está disponible.' };
            await newEq.update({ status: 'asignado' }, { transaction: t });
        }
        await assignment.update({ equipmentId, collaboratorId, assignmentDate, observations, accessories }, { transaction: t });
        return assignment;
    });
    res.json(result);
  } catch (e: any) {
    if (e?.status) return res.status(e.status).json({ message: e.message });
    console.error("Error al actualizar asignación:", e);
    next(e);
  }
});

/**
 * @route   POST /api/assignments/:id/release
 * @desc    Procesar la liberación de un equipo asignado
 * @access  Private
 */
router.post('/:id/release', auth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { releaseDate: releaseDateStr, observations, condition } = req.body;
    if (!condition) return res.status(400).json({ message: 'La condición del equipo es requerida.' });
    const releaseDate = releaseDateStr ? new Date(releaseDateStr) : new Date();
    const updatedAssignment = await sequelize.transaction(async (t) => {
        const assignment = await Assignment.findByPk(req.params.id, { transaction: t });
        if (!assignment) throw { status: 404, message: 'Asignación no encontrada' };
        if (assignment.status !== 'assigned') throw { status: 409, message: 'Esta asignación no se puede liberar.' };
        const eq = await Equipment.findByPk(assignment.equipmentId, { transaction: t, lock: t.LOCK.UPDATE });
        if (!eq) throw { status: 404, message: 'El equipo asociado ya no existe' };
        const newEquipmentStatus = (condition === 'dañado' || condition === 'regular') ? 'mantenimiento' : 'disponible';
        await assignment.update({ releaseDate, status: 'released', observations, }, { transaction: t });
        await eq.update({ status: newEquipmentStatus }, { transaction: t });
        return assignment;
    });
    res.json(updatedAssignment);
  } catch (e: any) {
    if (e?.status) return res.status(e.status).json({ message: e.message });
    console.error("Error al liberar asignación:", e);
    next(e);
  }
});

/**
 * @route   POST /api/assignments/:id/donate
 * @desc    Registrar la donación de un equipo asignado a un becado
 * @access  Private
 */
router.post('/:id/donate', auth, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const updatedAssignment = await sequelize.transaction(async (t) => {
        const assignment = await Assignment.findByPk(req.params.id, { transaction: t });
        if (!assignment) throw { status: 404, message: 'Asignación no encontrada' };
        if (assignment.status !== 'assigned') throw { status: 409, message: 'Esta asignación no se puede donar porque no está activa.' };
        const eq = await Equipment.findByPk(assignment.equipmentId, { transaction: t, lock: t.LOCK.UPDATE });
        if (!eq) throw { status: 404, message: 'El equipo asociado ya no existe' };
        await assignment.update({ status: 'donated', releaseDate: new Date() }, { transaction: t });
        await eq.update({ status: 'donado' }, { transaction: t });
        return assignment;
      });
      res.json(updatedAssignment);
    } catch (e: any) {
      if (e?.status) return res.status(e.status).json({ message: e.message });
      console.error("Error al donar asignación:", e);
      next(e);
    }
});

export default router;
