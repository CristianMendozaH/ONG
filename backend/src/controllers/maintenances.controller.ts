import { Request, Response, NextFunction } from 'express';
import { Maintenance } from '../models/Maintenance';
import { Equipment } from '../models/Equipment';
import { sequelize } from '../db/sequelize';
import { Op } from 'sequelize'; // Importa Op de Sequelize

export async function list(req: Request, res: Response) {
  // Obtenemos los filtros desde los query params de la URL
  const { status, type } = req.query;

  // Creamos un objeto 'where' para la consulta
  const where: any = {};

  if (status && typeof status === 'string' && status.trim() !== '') {
    where.status = status;
  }
  if (type && typeof type === 'string' && type.trim() !== '') {
    where.type = type;
  }

  const rows = await Maintenance.findAll({
    where, // Aplicamos el filtro aquí
    include: [{ model: Equipment, as: 'equipment', attributes: ['id', 'code', 'name', 'type'] }],
    order: [['createdAt', 'DESC']]
  });
  res.json(rows);
}

export async function getById(req: Request, res: Response) {
  const row = await Maintenance.findByPk(req.params.id, {
    include: [{ model: Equipment, as: 'equipment', attributes: ['id', 'code', 'name', 'type'] }]
  });
  if (!row) return res.status(404).json({ message: 'No encontrado' });
  res.json(row);
}

export async function create(req: Request, res: Response, next: NextFunction) {
  const t = await sequelize.transaction();
  try {
    const { equipmentId, scheduledDate, type, priority, technician, description } = req.body;
    if (!equipmentId || !scheduledDate || !type || !priority) {
      return res.status(400).json({ message: 'equipmentId, scheduledDate, type y priority son obligatorios' });
    }

    const newMaintenance = await Maintenance.create({
      equipmentId, scheduledDate, type, priority, technician, description, status: 'programado'
    }, { transaction: t });

    await Equipment.update(
      { status: 'programado' },
      { where: { id: equipmentId }, transaction: t }
    );

    await t.commit();
    res.status(201).json(newMaintenance);
  } catch (error) {
    await t.rollback();
    next(error);
  }
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

export async function start(req: Request, res: Response, next: NextFunction) {
  const t = await sequelize.transaction();
  try {
    const maintenance = await Maintenance.findByPk(req.params.id, { transaction: t });
    if (!maintenance) {
      await t.rollback();
      return res.status(404).json({ message: 'No encontrado' });
    }
    await maintenance.update({ status: 'en-proceso' }, { transaction: t });

    if (maintenance.equipmentId) {
      await Equipment.update(
        { status: 'en-proceso' },
        { where: { id: maintenance.equipmentId }, transaction: t }
      );
    }
    await t.commit();
    res.json(maintenance);
  } catch (error) {
    await t.rollback();
    next(error);
  }
}

export async function complete(req: Request, res: Response, next: NextFunction) {
  const t = await sequelize.transaction();
  try {
    const { performedDate } = req.body;
    if (!performedDate) {
      return res.status(400).json({ message: 'El campo performedDate es obligatorio' });
    }

    const maintenance = await Maintenance.findByPk(req.params.id, { transaction: t });
    if (!maintenance) {
      await t.rollback();
      return res.status(404).json({ message: 'No encontrado' });
    }
    
    await maintenance.update(
      { 
        status: 'completado', 
        performedDate: performedDate
      }, 
      { transaction: t }
    );

    if (maintenance.equipmentId) {
      await Equipment.update(
        { status: 'disponible' },
        { where: { id: maintenance.equipmentId }, transaction: t }
      );
    }
    await t.commit();
    res.json(maintenance);
  } catch (error) {
    await t.rollback();
    next(error);
  }
}

export async function cancel(req: Request, res: Response, next: NextFunction) {
  const t = await sequelize.transaction();
  try {
    const maintenance = await Maintenance.findByPk(req.params.id, { transaction: t });
    if (!maintenance) {
      await t.rollback();
      return res.status(404).json({ message: 'No encontrado' });
    }
    await maintenance.update({ status: 'cancelado' }, { transaction: t });

    if (maintenance.equipmentId) {
      await Equipment.update(
        { status: 'disponible' },
        { where: { id: maintenance.equipmentId }, transaction: t }
      );
    }
    await t.commit();
    res.json(maintenance);
  } catch (error) {
    await t.rollback();
    next(error);
  }
}