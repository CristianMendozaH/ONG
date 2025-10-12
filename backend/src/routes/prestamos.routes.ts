// Archivo completo: src/routes/prestamos.routes.ts (CORREGIDO)

import { Router } from 'express';
import { Loan } from '../models/Loan.js';
import { Equipment } from '../models/Equipment.js';
import { Config } from '../models/Config.js';
import { sequelize } from '../db/sequelize.js';
import { auth } from '../middleware/auth.js';
import { User } from '../models/User.js';

const router = Router();

/**
 * @route   POST /api/prestamos
 * @desc    Crear un nuevo préstamo
 * @access  Private
 */
router.post('/', auth, async (req: any, res, next) => {
  try {
    const {
      equipmentId,
      borrowerName,
      borrowerType,
      borrowerContact,
      responsiblePartyName,
      dueDate,
      accessories, // <-- 1. LEER accessories DE LA PETICIÓN
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
      const eq = await Equipment.findByPk(equipmentId, { transaction: t, lock: t.LOCK.UPDATE });
      
      if (!eq) {
        throw { status: 404, message: 'Equipo no encontrado' };
      }
      if (eq.status !== 'disponible') {
        throw { status: 409, message: `El equipo no está disponible (estado actual: ${eq.status})` };
      }

      // 3. Creación del registro del préstamo usando req.user.sub
      const loan = await Loan.create({
        equipmentId,
        borrowerName,
        borrowerType,
        borrowerContact,
        responsiblePartyName: responsiblePartyName || borrowerName, 
        loanDate,
        dueDate,
        status: 'prestado',
        registeredById: req.user.sub,
        accessories, // <-- 2. PASAR accessories AL MÉTODO create
      }, { transaction: t });

      // 4. Actualización del estado del equipo
      await eq.update({ status: 'prestado' }, { transaction: t });

      return loan;
    });

    res.status(201).json(result);
  } catch (e: any) {
    if (e?.status) return res.status(e.status).json({ message: e.message });
    console.error("Error al crear préstamo:", e);
    next(e);
  }
});


// --- EL RESTO DE LAS RUTAS PERMANECEN IGUAL ---


/**
 * @route   POST /api/prestamos/:id/return
 * @desc    Procesar la devolución de un préstamo
 * @access  Private
 */
router.post('/:id/return', auth, async (req: any, res, next) => {
  try {
    const { returnDate: returnDateStr, observations, condition } = req.body;
    
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

      const fineConfig = await Config.findOne({ where: { key: 'finePerDay' }, transaction: t });
      const finePerDay = fineConfig ? Number(fineConfig.value) : 5.00;

      const dueDate = new Date(loan.dueDate);
      const timeDiff = returnDate.getTime() - dueDate.getTime();
      const overdueDays = Math.max(0, Math.ceil(timeDiff / (1000 * 60 * 60 * 24)));
      const totalFine = overdueDays * finePerDay;
      
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
      include: [
        { model: Equipment, attributes: ['name', 'code'] },
        { model: User, as: 'registrar', attributes: ['id', 'name'] }
      ],
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
    const loan = await Loan.findByPk(req.params.id, { 
      include: [
        { model: Equipment },
        { model: User, as: 'registrar', attributes: ['id', 'name'] }
      ] 
    });
    if (!loan) {
      return res.status(404).json({ message: 'Préstamo no encontrado' });
    }
    res.json(loan);
  } catch (e) { 
    next(e); 
  }
});

/**
 * @route   PATCH /api/prestamos/:id/extend
 * @desc    Extender la fecha de devolución de un préstamo
 * @access  Private
 */
router.patch('/:id/extend', auth, async (req, res, next) => {
  try {
    const { newDueDate: dueDate, reason, comments } = req.body;

    if (!dueDate) {
      return res.status(400).json({ message: 'El campo newDueDate es requerido' });
    }

    const newDueDateObj = new Date(dueDate);
    if (isNaN(newDueDateObj.getTime())) {
      return res.status(400).json({ message: 'Formato de newDueDate inválido' });
    }

    const loan = await Loan.findByPk(req.params.id);
    if (!loan) {
      return res.status(404).json({ message: 'Préstamo no encontrado' });
    }
    if (loan.status === 'devuelto') {
      return res.status(409).json({ message: 'No se puede extender un préstamo que ya fue devuelto' });
    }

    const currentDueDate = new Date(loan.dueDate);
    if (newDueDateObj <= currentDueDate) {
      return res.status(400).json({ message: 'La nueva fecha debe ser posterior a la fecha de devolución actual' });
    }

    await loan.update({ 
        dueDate,
        // Opcional: Si tu modelo Loan tiene campos para guardar esto, descomenta las líneas.
        // extensionReason: reason,
        // extensionComments: comments,
    });

    res.json(loan);
  } catch (e) {
    next(e);
  }
});

export default router;