import { Request, Response, NextFunction } from 'express';
import { Maintenance } from '../models/Maintenance';
import { Equipment } from '../models/Equipment';
// --- IMPORTANTE: Importa tu instancia de sequelize para usar transacciones
import { sequelize } from '../db/sequelize'; // (Asegúrate de que la ruta a tu archivo de conexión sea correcta)

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

export async function create(req: Request, res: Response, next: NextFunction) {
  const t = await sequelize.transaction();
  try {
    const { equipmentId, scheduledDate, type, priority, technician, description } = req.body;
    if (!equipmentId || !scheduledDate || !type || !priority) {
      return res.status(400).json({ message: 'equipmentId, scheduledDate, type y priority son obligatorios' });
    }

    // 1. Crear el mantenimiento
    const newMaintenance = await Maintenance.create({
      equipmentId, scheduledDate, type, priority, technician, description, status: 'programado'
    }, { transaction: t });

    // 2. Actualizar el estado del equipo a 'programado'
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
  // Nota: La actualización general no modifica el estado del equipo, solo los datos del mantenimiento.
  // Los cambios de estado se manejan en las funciones específicas (start, complete, etc).
  const row = await Maintenance.findByPk(req.params.id);
  if (!row) return res.status(404).json({ message: 'No encontrado' });
  await row.update(req.body);
  res.json(row);
}

export async function remove(req: Request, res: Response) {
  // Nota: Al eliminar un mantenimiento, se podría requerir una lógica para restaurar el estado del equipo.
  // Por ahora, solo se elimina el registro del mantenimiento.
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
    // 1. Actualizar mantenimiento
    await maintenance.update({ status: 'en-proceso' }, { transaction: t });

    // 2. Actualizar equipo
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

// ==========================================================
// ========= FUNCIÓN MODIFICADA Y CORREGIDA AQUÍ ============
// ==========================================================
export async function complete(req: Request, res: Response, next: NextFunction) {
  const t = await sequelize.transaction();
  try {
    // 1. OBTENER LA FECHA DEL BODY DE LA PETICIÓN
    const { performedDate } = req.body; 
    if (!performedDate) {
      await t.rollback();
      return res.status(400).json({ message: 'El campo performedDate es obligatorio' });
    }

    const maintenance = await Maintenance.findByPk(req.params.id, { transaction: t });
    if (!maintenance) {
      await t.rollback();
      return res.status(404).json({ message: 'No encontrado' });
    }
    
    // 2. ACTUALIZAR EL ESTADO Y LA FECHA DE REALIZACIÓN
    await maintenance.update(
      { 
        status: 'completado', 
        performedDate: performedDate 
      }, 
      { transaction: t }
    );

    // 3. ACTUALIZAR EL ESTADO DEL EQUIPO A 'DISPONIBLE'
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
// ==========================================================
// =================== FIN DE LA MODIFICACIÓN ===============
// ==========================================================

export async function cancel(req: Request, res: Response, next: NextFunction) {
  const t = await sequelize.transaction();
  try {
    const maintenance = await Maintenance.findByPk(req.params.id, { transaction: t });
    if (!maintenance) {
      await t.rollback();
      return res.status(404).json({ message: 'No encontrado' });
    }
    // 1. Actualizar mantenimiento a 'cancelado'
    await maintenance.update({ status: 'cancelado' }, { transaction: t });

    // 2. Si se cancela, el equipo vuelve a estar disponible
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