import { Router } from 'express';
import { Loan } from '../models/Loan';
import { Equipment } from '../models/Equipment';
import { Config } from '../models/Config';
import { sequelize } from '../db/sequelize';
import { auth } from '../middleware/auth';

const router = Router();

/**
 * @route   POST /api/prestamos
 * @desc    Crear un nuevo préstamo
 * @access  Private
 * @body    { 
 * equipmentId: string, 
 * borrowerName: string, 
 * borrowerType: 'Colaborador' | 'Participante', 
 * borrowerContact?: string, 
 * responsiblePartyName?: string, 
 * dueDate: string (YYYY-MM-DD) 
 * }
 */
router.post('/', auth, async (req, res, next) => {
  try {
    const {
      equipmentId,
      borrowerName,
      borrowerType,
      borrowerContact,
      responsiblePartyName,
      dueDate,
    } = req.body;

    // 1. Validaciones de campos requeridos
    if (!equipmentId || !borrowerName || !dueDate || !borrowerType) {
      return res.status(400).json({ message: 'Campos requeridos: equipmentId, borrowerName, borrowerType, dueDate' });
    }

    const loanDate = new Date();
    const due = new Date(dueDate);
    if (isNaN(due.getTime()) || due < loanDate) {
      return res.status(400).json({ message: 'La fecha de devolución (dueDate) no es válida' });
    }

    // 2. Transacción para garantizar la integridad de los datos
    const result = await sequelize.transaction(async (t) => {
      // Bloqueamos la fila del equipo para evitar que se preste dos veces al mismo tiempo
      const eq = await Equipment.findByPk(equipmentId, { transaction: t, lock: t.LOCK.UPDATE });
      
      if (!eq) {
        throw { status: 404, message: 'Equipo no encontrado' };
      }
      if (eq.status !== 'disponible') {
        throw { status: 409, message: `El equipo no está disponible (estado actual: ${eq.status})` };
      }

      // 3. Creación del registro del préstamo con todos los datos
      const loan = await Loan.create({
        equipmentId,
        borrowerName,
        borrowerType,
        borrowerContact,
        // Si no se especifica un responsable, el solicitante es el responsable
        responsiblePartyName: responsiblePartyName || borrowerName, 
        loanDate,
        dueDate,
        status: 'prestado', // Estado inicial
      }, { transaction: t });

      // 4. Actualización del estado del equipo
      await eq.update({ status: 'prestado' }, { transaction: t });

      return loan;
    });

    res.status(201).json(result);
  } catch (e: any) {
    // Manejo centralizado de errores
    if (e?.status) return res.status(e.status).json({ message: e.message });
    console.error("Error al crear préstamo:", e);
    next(e);
  }
});

/**
 * @route   POST /api/prestamos/:id/return
 * @desc    Procesar la devolución de un préstamo
 * @access  Private
 * @body    { 
 * returnDate?: string (YYYY-MM-DD), 
 * observations?: string,
 * condition: 'excelente' | 'bueno' | 'regular' | 'dañado'
 * }
 */
router.post('/:id/return', auth, async (req, res, next) => {
  try {
    const { returnDate: returnDateStr, observations, condition } = req.body;
    
    // La condición del equipo al devolverlo es obligatoria
    if (!condition) {
        return res.status(400).json({ message: 'La condición del equipo es requerida para procesar la devolución.' });
    }

    const returnDate = returnDateStr ? new Date(returnDateStr) : new Date();
    if (isNaN(returnDate.getTime())) {
      return res.status(400).json({ message: 'El formato de returnDate no es válido' });
    }

    const loan = await Loan.findByPk(req.params.id);
    if (!loan) {
      return res.status(404).json({ message: 'Préstamo no encontrado' });
    }
    if (loan.status === 'devuelto') {
      return res.status(409).json({ message: 'Este préstamo ya fue devuelto anteriormente' });
    }

    const updatedLoan = await sequelize.transaction(async (t) => {
      const eq = await Equipment.findByPk(loan.equipmentId, { transaction: t, lock: t.LOCK.UPDATE });
      if (!eq) {
        throw { status: 404, message: 'El equipo asociado a este préstamo ya no existe' };
      }

      // Lógica para calcular la multa
      const fineConfig = await Config.findOne({ where: { key: 'finePerDay' }, transaction: t });
      const finePerDay = fineConfig ? Number(fineConfig.value) : 5.00; // Multa por defecto: 5.00

      const dueDate = new Date(loan.dueDate);
      const timeDiff = returnDate.getTime() - dueDate.getTime();
      const overdueDays = Math.max(0, Math.ceil(timeDiff / (1000 * 60 * 60 * 24)));
      const totalFine = overdueDays * finePerDay;
      
      // El nuevo estado del equipo dependerá de la condición en que se devuelve
      const newEquipmentStatus = (condition === 'dañado' || condition === 'regular') ? 'mantenimiento' : 'disponible';
      
      await loan.update({
        returnDate,
        overdueDays,
        totalFine,
        status: 'devuelto',
        observations,
        conditionOnReturn: condition
      }, { transaction: t });
      
      await eq.update({ status: newEquipmentStatus }, { transaction: t });
      
      return loan;
    });

    res.json(updatedLoan);
  } catch (e: any) {
    if (e?.status) return res.status(e.status).json({ message: e.message });
    console.error("Error al devolver préstamo:", e);
    next(e);
  }
});

/**
 * @route   GET /api/prestamos
 * @desc    Listar todos los préstamos
 * @access  Private
 */
router.get('/', auth, async (req, res, next) => {
  try {
    const loans = await Loan.findAll({
      include: [{ model: Equipment, attributes: ['name', 'code'] }], // Incluir solo info relevante del equipo
      order: [['createdAt', 'DESC']],
    });
    res.json(loans);
  } catch (e) { 
    next(e); 
  }
});

/**
 * @route   GET /api/prestamos/:id
 * @desc    Obtener un préstamo por su ID
 * @access  Private
 */
router.get('/:id', auth, async (req, res, next) => {
  try {
    const loan = await Loan.findByPk(req.params.id, { include: [Equipment] });
    if (!loan) {
      return res.status(404).json({ message: 'Préstamo no encontrado' });
    }
    res.json(loan);
  } catch (e) { 
    next(e); 
  }
});

/**
 * @route   PATCH /api/prestamos/:id
 * @desc    Extender la fecha de devolución de un préstamo
 * @access  Private
 * @body    { dueDate: string (YYYY-MM-DD) }
 */
router.patch('/:id', auth, async (req, res, next) => {
  try {
    const { dueDate } = req.body;
    if (!dueDate) {
      return res.status(400).json({ message: 'El campo dueDate es requerido' });
    }

    const newDueDate = new Date(dueDate);
    if (isNaN(newDueDate.getTime())) {
      return res.status(400).json({ message: 'Formato de dueDate inválido' });
    }

    const loan = await Loan.findByPk(req.params.id);
    if (!loan) {
      return res.status(404).json({ message: 'Préstamo no encontrado' });
    }
    if (loan.status === 'devuelto') {
      return res.status(409).json({ message: 'No se puede extender un préstamo que ya fue devuelto' });
    }

    const currentDueDate = new Date(loan.dueDate);
    if (newDueDate <= currentDueDate) {
      return res.status(400).json({ message: 'La nueva fecha debe ser posterior a la fecha de devolución actual' });
    }

    await loan.update({ dueDate });

    res.json(loan);
  } catch (e) {
    next(e);
  }
});

export default router;