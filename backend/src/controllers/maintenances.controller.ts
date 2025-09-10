import { Request, Response } from 'express';
import { Maintenance } from '../models/Maintenance';
import { Equipment } from '../models/Equipment';

export async function list(_req: Request, res: Response) {
  const rows = await Maintenance.findAll({
    include: [{ model: Equipment, as: 'equipment', attributes: ['id','code','name','type'] }],
    order: [['createdAt','DESC']]
  });
  res.json(rows);
}

export async function getById(req: Request, res: Response) {
  const row = await Maintenance.findByPk(req.params.id, {
    include: [{ model: Equipment, as: 'equipment', attributes: ['id','code','name','type'] }]
  });
  if (!row) return res.status(404).json({ message: 'No encontrado' });
  res.json(row);
}

export async function create(req: Request, res: Response) {
  const { equipmentId, scheduledDate, type, priority, technician, description } = req.body;
  if (!equipmentId || !scheduledDate || !type || !priority) {
    return res.status(400).json({ message: 'equipmentId, scheduledDate, type y priority son obligatorios' });
  }
  const created = await Maintenance.create({
    equipmentId, scheduledDate, type, priority, technician, description, status: 'programado'
  });
  res.status(201).json(created);
}

export async function update(req: Request, res: Response) {
  const row = await Maintenance.findByPk(req.params.id);
  if (!row) return res.status(404).json({ message: 'No encontrado' });
  await row.update(req.body);
  res.json(row);
}

export async function remove(req: Request, res: Response) {
  const row = await Maintenance.findByPk(req.params.id);
  if (!row) return res.status(404).json({ message: 'No encontrado' });
  await row.destroy();
  res.json({ ok: true });
}

export async function start(req: Request, res: Response) {
  const row = await Maintenance.findByPk(req.params.id);
  if (!row) return res.status(404).json({ message: 'No encontrado' });
  await row.update({ status: 'en-proceso' });
  res.json(row);
}

export async function complete(req: Request, res: Response) {
  const row = await Maintenance.findByPk(req.params.id);
  if (!row) return res.status(404).json({ message: 'No encontrado' });
  await row.update({ status: 'completado' });
  res.json(row);
}

export async function cancel(req: Request, res: Response) {
  const row = await Maintenance.findByPk(req.params.id);
  if (!row) return res.status(404).json({ message: 'No encontrado' });
  await row.update({ status: 'cancelado' });
  res.json(row);
}
