import { Request, Response } from 'express';
import { Loan } from '../models/Loan';
import { Equipment } from '../models/Equipment';
import { Config } from '../models/Config'; // opcional para multa
// import { Op } from 'sequelize'; // si luego filtras por fechas/estado

export async function listLoans(req: Request, res: Response) {
  const where: any = {};
  if (req.query.equipmentId) where.equipmentId = req.query.equipmentId;
  if (req.query.status) where.status = req.query.status;

  const items = await Loan.findAll({
    where,
    order: [['createdAt', 'DESC']],
    include: [Equipment],
  });
  res.json(items);
}

export async function getLoan(req: Request, res: Response) {
  const loan = await Loan.findByPk(req.params.id, { include: [Equipment] });
  if (!loan) return res.status(404).json({ message: 'Préstamo no encontrado' });
  res.json(loan);
}

export async function createLoan(req: Request, res: Response) {
  const { equipmentId, borrowerName, dueDate } = req.body;
  if (!equipmentId || !borrowerName || !dueDate) {
    return res.status(400).json({ message: 'equipmentId, borrowerName y dueDate son requeridos' });
  }

  const eq = await Equipment.findByPk(equipmentId);
  if (!eq) return res.status(404).json({ message: 'Equipo no encontrado' });
  if (eq.status !== 'disponible') {
    return res.status(409).json({ message: 'El equipo no está disponible' });
  }

  const loan = await Loan.create({
    equipmentId,
    borrowerName,
    loanDate: new Date(),
    dueDate,
    status: 'prestado',
  });

  await eq.update({ status: 'prestado' });
  res.status(201).json(loan);
}

export async function returnLoan(req: Request, res: Response) {
  const { id } = req.params;
  const { returnDate } = req.body;

  const loan = await Loan.findByPk(id);
  if (!loan) return res.status(404).json({ message: 'Préstamo no encontrado' });
  if (loan.status === 'devuelto') return res.json(loan);

  const rd = returnDate ? new Date(returnDate) : new Date();
  const due = new Date(loan.dueDate as any);

  const diffDays = Math.ceil((rd.getTime() - due.getTime()) / (24 * 60 * 60 * 1000));
  const overdueDays = diffDays > 0 ? diffDays : 0;

  // multa opcional (lee de Config si existe)
  let totalFine = 0;
  try {
    const cfg = await Config.findOne({ where: { key: 'fine_per_day' } });
    const rate = cfg ? Number(cfg.value) : 0;
    totalFine = overdueDays * rate;
  } catch {
    /* ignore */
  }

  await loan.update({
    returnDate: rd,
    status: 'devuelto',
    overdueDays,
    totalFine,
  });

  const eq = await Equipment.findByPk(loan.equipmentId);
  if (eq) await eq.update({ status: 'disponible' });

  res.json(loan);
}
