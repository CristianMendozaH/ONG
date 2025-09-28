// src/routes/assignments.routes.ts

import { Router } from 'express';
import { sequelize } from '../db/sequelize';
import { auth } from '../middleware/auth';
import { Assignment } from '../models/Assignment';
import { Equipment } from '../models/Equipment';
import { Collaborator } from '../models/Collaborator';

const router = Router();

/**
 * @route   POST /api/assignments
 * @desc    Crear una nueva asignación de equipo
 * @access  Private
 */
router.post('/', auth, async (req, res, next) => {
  try {
    const { equipmentId, collaboratorId, assignmentDate, observations } = req.body;

    if (!equipmentId || !collaboratorId || !assignmentDate) {
      return res.status(400).json({ message: 'Campos requeridos: equipmentId, collaboratorId, assignmentDate' });
    }

    const result = await sequelize.transaction(async (t) => {
      const eq = await Equipment.findByPk(equipmentId, { transaction: t, lock: t.LOCK.UPDATE });
      if (!eq) {
        throw { status: 404, message: 'Equipo no encontrado' };
      }
      if (eq.status !== 'disponible') {
        throw { status: 409, message: `El equipo no está disponible (estado actual: ${eq.status})` };
      }

      const collaborator = await Collaborator.findByPk(collaboratorId, { transaction: t });
      if (!collaborator || !collaborator.isActive) {
          throw { status: 404, message: 'Colaborador no encontrado o inactivo.' };
      }

      const assignment = await Assignment.create({
        equipmentId,
        collaboratorId,
        assignmentDate,
        observations,
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
router.get('/', auth, async (req, res, next) => {
  try {
    const assignments = await Assignment.findAll({
      include: [
        { model: Equipment, attributes: ['name', 'code'] },
        // ---> CAMBIO: Añadimos 'type' para diferenciar Becados de Colaboradores en el frontend
        { model: Collaborator, attributes: ['fullName', 'program', 'type', 'position'] }
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
router.get('/:id', auth, async (req, res, next) => {
  try {
    const assignment = await Assignment.findByPk(req.params.id, {
        include: [Equipment, Collaborator]
    });
    if (!assignment) {
      return res.status(404).json({ message: 'Asignación no encontrada' });
    }
    res.json(assignment);
  } catch (e) {
    next(e);
  }
});

// ---> NUEVA RUTA: Para actualizar una asignación (Editar)
/**
 * @route   PATCH /api/assignments/:id
 * @desc    Actualizar una asignación existente
 * @access  Private
 */
router.patch('/:id', auth, async (req, res, next) => {
  try {
    const { equipmentId, collaboratorId, assignmentDate, observations } = req.body;
    
    const result = await sequelize.transaction(async (t) => {
        const assignment = await Assignment.findByPk(req.params.id, { transaction: t });
        if (!assignment) {
            throw { status: 404, message: 'Asignación no encontrada' };
        }

        // Lógica para manejar el cambio de equipo (si se edita y se cambia el equipo)
        if (equipmentId && equipmentId !== assignment.equipmentId) {
            // 1. Liberar el equipo antiguo para que quede disponible
            const oldEq = await Equipment.findByPk(assignment.equipmentId, { transaction: t });
            if (oldEq) await oldEq.update({ status: 'disponible' }, { transaction: t });

            // 2. Ocupar el equipo nuevo
            const newEq = await Equipment.findByPk(equipmentId, { transaction: t, lock: t.LOCK.UPDATE });
            if (!newEq || newEq.status !== 'disponible') {
                throw { status: 409, message: 'El nuevo equipo seleccionado no está disponible.' };
            }
            await newEq.update({ status: 'asignado' }, { transaction: t });
        }

        await assignment.update({
            equipmentId,
            collaboratorId,
            assignmentDate,
            observations
        }, { transaction: t });

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
router.post('/:id/release', auth, async (req, res, next) => {
  try {
    const { releaseDate: releaseDateStr, observations, condition } = req.body;
    
    if (!condition) {
        return res.status(400).json({ message: 'La condición del equipo es requerida.' });
    }

    const releaseDate = releaseDateStr ? new Date(releaseDateStr) : new Date();

    const updatedAssignment = await sequelize.transaction(async (t) => {
        const assignment = await Assignment.findByPk(req.params.id, { transaction: t });
        if (!assignment) {
            throw { status: 404, message: 'Asignación no encontrada' };
        }
        if (assignment.status !== 'assigned') {
            throw { status: 409, message: 'Esta asignación no se puede liberar.' };
        }

        const eq = await Equipment.findByPk(assignment.equipmentId, { transaction: t, lock: t.LOCK.UPDATE });
        if (!eq) {
            throw { status: 404, message: 'El equipo asociado ya no existe' };
        }
        
        const newEquipmentStatus = (condition === 'dañado' || condition === 'regular') ? 'mantenimiento' : 'disponible';
        
        await assignment.update({
            releaseDate,
            status: 'released',
            observations,
        }, { transaction: t });
        
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


// ---> NUEVA RUTA: Para registrar un equipo como donado (para Becados)
/**
 * @route   POST /api/assignments/:id/donate
 * @desc    Registrar la donación de un equipo asignado a un becado
 * @access  Private
 */
router.post('/:id/donate', auth, async (req, res, next) => {
    try {
      const updatedAssignment = await sequelize.transaction(async (t) => {
        const assignment = await Assignment.findByPk(req.params.id, { transaction: t });
        if (!assignment) {
          throw { status: 404, message: 'Asignación no encontrada' };
        }
        if (assignment.status !== 'assigned') {
            throw { status: 409, message: 'Esta asignación no se puede donar porque no está activa.' };
        }
  
        const eq = await Equipment.findByPk(assignment.equipmentId, { transaction: t, lock: t.LOCK.UPDATE });
        if (!eq) {
          throw { status: 404, message: 'El equipo asociado ya no existe' };
        }
  
        // 1. Actualizamos la asignación al estado final 'donated'
        await assignment.update({ status: 'donated', releaseDate: new Date() }, { transaction: t });
  
        // 2. Actualizamos el equipo a un estado final para sacarlo del inventario
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