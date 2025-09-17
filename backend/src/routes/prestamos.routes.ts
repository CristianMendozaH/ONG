import { Router } from 'express';
import { Loan } from '../models/Loan';
import { Equipment } from '../models/Equipment';
import { sequelize } from '../db/sequelize';   // 👈 para transacciones
import { auth } from '../middleware/auth';     // 👈 protege las rutas
import { env } from '../config/env';

const router = Router();

/**
 * Crear préstamo
 * body: { equipmentId, borrowerName, dueDate (YYYY-MM-DD) }
 */
router.post('/', auth, async (req, res, next) => {
  try {
    const { equipmentId, borrowerName, dueDate } = req.body;
    if (!equipmentId || !borrowerName || !dueDate) {
      return res.status(400).json({ message: 'equipmentId, borrowerName y dueDate son requeridos' });
    }

    const loanDate = new Date(); // hora del servidor
    const due = new Date(dueDate);
    if (isNaN(due.getTime()) || due < loanDate) {
      return res.status(400).json({ message: 'dueDate inválido' });
    }

    const result = await sequelize.transaction(async (t) => {
      // lock para evitar carreras si dos usuarios intentan prestar el mismo equipo a la vez
      const eq = await Equipment.findByPk(equipmentId, { transaction: t, lock: t.LOCK.UPDATE });
      if (!eq) throw { status: 404, message: 'Equipo no encontrado' };
      if (eq.status !== 'disponible') throw { status: 409, message: 'El equipo no está disponible' };

      const loan = await Loan.create(
        {
          equipmentId,
          borrowerName,
          loanDate,
          dueDate,
          status: 'prestado',
        },
        { transaction: t }
      );

      await eq.update({ status: 'prestado' }, { transaction: t });

      return loan;
    });

    res.status(201).json(result);
  } catch (e: any) {
    if (e?.status) return res.status(e.status).json({ message: e.message });
    next(e);
  }
});

/**
 * Devolver equipo
 * body: { returnDate? (YYYY-MM-DD) }
 */
router.post('/:id/return', auth, async (req, res, next) => {
  try {
    const { returnDate: returnDateStr, observations } = req.body;
    const returnDate = returnDateStr ? new Date(returnDateStr) : new Date();
    if (isNaN(returnDate.getTime())) return res.status(400).json({ message: 'returnDate inválido' });

    const loan = await Loan.findByPk(req.params.id);
    if (!loan) return res.status(404).json({ message: 'Préstamo no encontrado' });
    if (loan.status === 'devuelto') return res.status(409).json({ message: 'El préstamo ya fue devuelto' });

    const updated = await sequelize.transaction(async (t) => {
      const eq = await Equipment.findByPk(loan.equipmentId, { transaction: t, lock: t.LOCK.UPDATE });
      if (!eq) throw { status: 404, message: 'Equipo no encontrado' };

      const due = new Date(loan.dueDate as any);
      const ms = +returnDate - +due;
      const overdueDays = Math.max(0, Math.ceil(ms / 86_400_000));
      const finePerDay = Number(env.finePerDay || 0);
      const totalFine = overdueDays * finePerDay;

      await loan.update(
      { returnDate, overdueDays, totalFine, status: 'devuelto', observations },
      { transaction: t }
      );
      await eq.update({ status: 'disponible' }, { transaction: t });

      return loan;
    });

    res.json(updated);
  } catch (e: any) {
    if (e?.status) return res.status(e.status).json({ message: e.message });
    next(e);
  }
});

/** Listar préstamos */
router.get('/', auth, async (_req, res, next) => {
  try {
    const rows = await Loan.findAll({
      include: [Equipment],
      order: [['createdAt', 'DESC']],
    });
    res.json(rows);
  } catch (e) { next(e); }
});

/** Obtener préstamo por id */
router.get('/:id', auth, async (req, res, next) => {
  try {
    const loan = await Loan.findByPk(req.params.id, { include: [Equipment] });
    if (!loan) return res.status(404).json({ message: 'Préstamo no encontrado' });
    res.json(loan);
  } catch (e) { next(e); }
});

// --- RUTA AÑADIDA PARA EXTENDER PRÉSTAMO ---
/**
 * Extender fecha de devolución (Actualizar préstamo)
 * Usa PATCH para actualizar un campo específico del préstamo.
 * body: { dueDate (YYYY-MM-DD) }
 */
router.patch('/:id', auth, async (req, res, next) => {
  try {
    const { dueDate } = req.body;
    // 1. Validar que la nueva fecha de devolución fue enviada
    if (!dueDate) {
      return res.status(400).json({ message: 'El campo dueDate es requerido' });
    }

    const newDueDate = new Date(dueDate);
    if (isNaN(newDueDate.getTime())) {
      return res.status(400).json({ message: 'Formato de dueDate inválido' });
    }

    // 2. Buscar el préstamo en la base de datos
    const loan = await Loan.findByPk(req.params.id);
    if (!loan) {
      return res.status(404).json({ message: 'Préstamo no encontrado' });
    }

    // 3. Validar el estado del préstamo
    if (loan.status === 'devuelto') {
      return res.status(409).json({ message: 'No se puede extender un préstamo que ya fue devuelto' });
    }

    const currentDueDate = new Date(loan.dueDate);
    if (newDueDate <= currentDueDate) {
      return res.status(400).json({ message: 'La nueva fecha debe ser posterior a la fecha de devolución actual' });
    }

    // 4. Actualizar el préstamo con la nueva fecha y guardar en la BD
    const updatedLoan = await loan.update({ dueDate });

    // 5. Devolver el préstamo actualizado al frontend
    res.json(updatedLoan);

  } catch (e) {
    next(e);
  }
});

export default router;