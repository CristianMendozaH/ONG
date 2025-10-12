import { Request, Response, NextFunction } from 'express';
import { Maintenance } from '../models/Maintenance';
import { Equipment } from '../models/Equipment';
import { sequelize } from '../db/sequelize';
import { Op } from 'sequelize';

export async function list(req: Request, res: Response) {
  const { status, type } = req.query;
  const where: any = {};

  if (status && typeof status === 'string' && status.trim() !== '') {
    where.status = status;
  }
  if (type && typeof type === 'string' && type.trim() !== '') {
    where.type = type;
  }

  const rows = await Maintenance.findAll({
    where,
    include: [{ model: Equipment, as: 'equipment', attributes: ['id', 'code', 'name', 'type', 'status'] }],
    order: [['createdAt', 'DESC']]
  });
  res.json(rows);
}

export async function getById(req: Request, res: Response) {
  const row = await Maintenance.findByPk(req.params.id, {
    include: [{ model: Equipment, as: 'equipment', attributes: ['id', 'code', 'name', 'type', 'status'] }]
  });
  if (!row) return res.status(404).json({ message: 'No encontrado' });
  res.json(row);
}

export async function create(req: Request, res: Response, next: NextFunction) {
  const t = await sequelize.transaction();
  try {
    const { equipmentId, scheduledDate, type, priority, technician, description } = req.body;
    if (!equipmentId || !scheduledDate || !type || !priority) {
      await t.rollback();
      return res.status(400).json({ message: 'Campos requeridos faltantes.' });
    }

    // --- ✅ INICIO DEL CINTURÓN DE SEGURIDAD ---

    // 1. Verificar si el equipo ya tiene un mantenimiento activo.
    const existingMaintenance = await Maintenance.findOne({
      where: {
        equipmentId: equipmentId,
        status: {
          [Op.in]: ['programado', 'en-proceso']
        }
      },
      transaction: t
    });

    if (existingMaintenance) {
      await t.rollback();
      return res.status(409).json({ message: 'Conflicto: El equipo ya tiene un mantenimiento programado o en proceso.' });
    }

    // 2. Verificar el estado actual del equipo.
    const equipment = await Equipment.findByPk(equipmentId, { transaction: t });
    if (!equipment) {
      await t.rollback();
      return res.status(404).json({ message: 'El equipo seleccionado no existe.' });
    }
    
    const validStates = ['disponible', 'dañado'];
    if (!validStates.includes(equipment.status)) {
      await t.rollback();
      return res.status(409).json({ message: `Conflicto: El equipo no está disponible, su estado actual es '${equipment.status}'.` });
    }

    // --- ✅ FIN DEL CINTURÓN DE SEGURIDAD ---

    const newMaintenance = await Maintenance.create({
      equipmentId, scheduledDate, type, priority, technician, description, status: 'programado'
    }, { transaction: t });

    await t.commit();
    res.status(201).json(newMaintenance);
  } catch (error) {
    await t.rollback();
    next(error);
  }
}

export async function update(req: Request, res: Response, next: NextFunction) {
  try {
    const row = await Maintenance.findByPk(req.params.id);
    if (!row) return res.status(404).json({ message: 'No encontrado' });
    
    // Evitar que se cambie el ID del equipo en una actualización
    delete req.body.equipmentId;

    await row.update(req.body);
    res.json(row);
  } catch(error) {
    next(error);
  }
}

export async function remove(req: Request, res: Response, next: NextFunction) {
  try {
    const row = await Maintenance.findByPk(req.params.id);
    if (!row) return res.status(404).json({ message: 'No encontrado' });
    
    if (row.status === 'en-proceso') {
      return res.status(400).json({ message: 'No se puede eliminar un mantenimiento que está en proceso.' });
    }

    await row.destroy();
    res.status(204).send();
  } catch(error) {
    next(error);
  }
}

export async function start(req: Request, res: Response, next: NextFunction) {
  const t = await sequelize.transaction();
  try {
    const maintenance = await Maintenance.findByPk(req.params.id, { transaction: t });
    if (!maintenance) {
      await t.rollback();
      return res.status(404).json({ message: 'No encontrado' });
    }
    
    if (maintenance.status !== 'programado') {
      await t.rollback();
      return res.status(400).json({ message: `Solo se puede iniciar un mantenimiento programado. Estado actual: ${maintenance.status}` });
    }

    await maintenance.update({ status: 'en-proceso' }, { transaction: t });

    if (maintenance.equipmentId) {
      await Equipment.update(
        { status: 'mantenimiento' },
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
    const { performedDate, notes } = req.body;
    if (!performedDate) {
      await t.rollback();
      return res.status(400).json({ message: 'El campo performedDate es obligatorio' });
    }

    const maintenance = await Maintenance.findByPk(req.params.id, { transaction: t });
    if (!maintenance) {
      await t.rollback();
      return res.status(404).json({ message: 'No encontrado' });
    }
    
    const updateData: { status: string; performedDate: string; description?: string } = { 
      status: 'completado', 
      performedDate: performedDate
    };

    if (notes) {
      const newDescription = maintenance.description 
        ? `${maintenance.description}\n\n--- Notas de finalización ---\n${notes}`
        : `--- Notas de finalización ---\n${notes}`;
      updateData.description = newDescription;
    }
    
    await maintenance.update(updateData, { transaction: t });

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