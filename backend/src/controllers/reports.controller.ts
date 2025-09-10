import { Op } from 'sequelize';
import { Request, Response } from 'express';
import { Equipment } from '../models/Equipment';
import { Loan } from '../models/Loan';
import { Maintenance } from '../models/Maintenance';

const iso = (d: Date | string) => new Date(d).toISOString().slice(0, 10);

// === Equipos ===
export async function equipmentKpis(_req: Request, res: Response) {
  const [disponible, prestado, mantenimiento, danado] = await Promise.all([
    Equipment.count({ where: { status: 'disponible' } }),
    Equipment.count({ where: { status: 'prestado' } }),
    Equipment.count({ where: { status: 'mantenimiento' } }),
    Equipment.count({ where: { status: 'dañado' } }),
  ]);
  res.json({ disponible, prestado, mantenimiento, danado });
}

// === Préstamos ===
export async function loansDueSoon(req: Request, res: Response) {
  const days = Number(req.query.days || 3);
  const today = new Date();
  const to = new Date(); to.setDate(today.getDate() + days);

  const rows = await Loan.findAll({
    where: { status: 'prestado', dueDate: { [Op.between]: [iso(today), iso(to)] } },
    order: [['dueDate', 'ASC']],
  });

  res.json({ days, count: rows.length, items: rows });
}

export async function loansOverdue(_req: Request, res: Response) {
  const today = new Date();
  const rows = await Loan.findAll({
    where: { status: 'prestado', dueDate: { [Op.lt]: iso(today) } },
    order: [['dueDate', 'ASC']],
  });

  const items = rows.map((r: any) => {
    const due = new Date(r.dueDate);
    const diff = Math.ceil((today.getTime() - due.getTime()) / (1000*60*60*24));
    const overdueDays = Math.max(diff, 0);
    const totalFine = overdueDays * 5; // ejemplo
    return { ...r.get({ plain: true }), overdueDays, totalFine };
  });

  res.json({ count: items.length, items });
}

// === Mantenimientos ===
export async function maintDueSoon(req: Request, res: Response) {
  const days = Number(req.query.days || 7);
  const today = new Date();
  const to = new Date(); to.setDate(today.getDate() + days);

  const rows = await Maintenance.findAll({
    where: { status: 'programado', scheduledDate: { [Op.between]: [iso(today), iso(to)] } },
    order: [['scheduledDate', 'ASC']],
  });

  res.json({ days, count: rows.length, items: rows });
}

export async function maintKpis(_req: Request, res: Response) {
  const [programado, enProceso, completado, cancelado] = await Promise.all([
    Maintenance.count({ where: { status: 'programado' } }),
    Maintenance.count({ where: { status: 'en-proceso' } }),
    Maintenance.count({ where: { status: 'completado' } }),
    Maintenance.count({ where: { status: 'cancelado' } }),
  ]);
  res.json({ programado, enProceso, completado, cancelado });
}
