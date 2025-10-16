import { Request, Response, NextFunction } from 'express';
import { Maintenance } from '../models/Maintenance.js';
import { Equipment } from '../models/Equipment.js';
import { sequelize } from '../db/sequelize.js';
import { QueryTypes } from 'sequelize';

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
    // CAMBIO: Se corrigió el alias para que coincida con associations.ts
    include: [{ model: Equipment, as: 'equipmentUnderMaintenance', attributes: ['id', 'code', 'name', 'type'] }],
    order: [['createdAt', 'DESC']]
  });
  res.json(rows);
}

export async function getById(req: Request, res: Response) {
  // CAMBIO: Se corrigió el alias para que coincida con associations.ts
  const row = await Maintenance.findByPk(req.params.id, {
    include: [{ model: Equipment, as: 'equipmentUnderMaintenance', attributes: ['id', 'code', 'name', 'type'] }]
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

    // ----- ACTUALIZACIÓN: Se eliminó la actualización del estado del equipo -----

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
      // ----- ACTUALIZACIÓN: Se cambió el estado del equipo a 'en mantenimiento' -----
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
    const { performedDate } = req.body;
    if (!performedDate) {
      return res.status(400).json({ message: 'El campo performedDate es obligatorio' });
    }
    const maintenance = await Maintenance.findByPk(req.params.id, { transaction: t });
    if (!maintenance) {
      await t.rollback();
      return res.status(404).json({ message: 'No encontrado' });
    }
    await maintenance.update({ status: 'completado', performedDate: performedDate }, { transaction: t });
    if (maintenance.equipmentId) {
      await Equipment.update({ status: 'disponible' }, { where: { id: maintenance.equipmentId }, transaction: t });
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
      await Equipment.update({ status: 'disponible' }, { where: { id: maintenance.equipmentId }, transaction: t });
    }
    await t.commit();
    res.json(maintenance);
  } catch (error) {
    await t.rollback();
    next(error);
  }
}

/**
 * @function getPredictiveMaintenance
 * @description Analiza el historial de mantenimientos para predecir qué equipos necesitan servicio.
 * Ejecuta una consulta SQL directa para calcular la fecha del último mantenimiento completado
 * de cada equipo, los días transcurridos desde entonces y un estado predictivo.
 * @param {Request} req - Objeto de solicitud de Express.
 * @param {Response} res - Objeto de respuesta de Express.
 * @param {NextFunction} next - Función de middleware para manejo de errores.
 */
export async function getPredictiveMaintenance(req: Request, res: Response, next: NextFunction) {
  try {
    // Consulta SQL pura para obtener la lógica predictiva.
    // Esta es la forma más eficiente de realizar cálculos complejos y uniones de datos.
    const query = `
      SELECT
          e.id,
          e.name,
          -- Seleccionamos la fecha máxima de mantenimiento 'completado' como el último mantenimiento.
          MAX(m."performedDate") AS "lastMaintenance",
          -- Calculamos los días transcurridos. Usamos COALESCE para manejar equipos
          -- que nunca han tenido mantenimiento, usando su fecha de creación como punto de partida.
          -- Se usa FLOOR para obtener un número entero de días.
          FLOOR(EXTRACT(EPOCH FROM (NOW() - COALESCE(MAX(m."performedDate"), e."createdAt"))) / 86400) AS "daysSince",
          -- Generamos un estado condicional usando CASE. Si han pasado más de 30 días,
          -- el equipo requiere mantenimiento. De lo contrario, se considera operativo.
          CASE
              WHEN FLOOR(EXTRACT(EPOCH FROM (NOW() - COALESCE(MAX(m."performedDate"), e."createdAt"))) / 86400) > 30
              THEN 'Mantenimiento requerido'
              ELSE 'Operativo'
          END AS status
      FROM
          equipments AS e
      -- Usamos LEFT JOIN para asegurar que todos los equipos sean incluidos en el análisis,
      -- incluso si no tienen registros de mantenimiento.
      -- Solo consideramos los mantenimientos con estado 'completado'.
      LEFT JOIN
          maintenances AS m ON e.id = m."equipmentId" AND m.status = 'completado'
      -- Agrupamos por equipo para que la función MAX() funcione correctamente por cada uno.
      GROUP BY
          e.id, e.name
      -- Ordenamos para mostrar primero los equipos que más urgentemente necesitan mantenimiento.
      ORDER BY
          "daysSince" DESC;
    `;

    // Sequelize ejecuta la consulta SQL que definimos arriba.
    const predictiveMaintenances = await sequelize.query(query, {
      type: QueryTypes.SELECT
    });

    // Se devuelve el resultado en formato JSON, cumpliendo con la salida esperada.
    res.json(predictiveMaintenances);

  } catch (error) {
    // En caso de un error en la base de datos o en la lógica, se notifica al cliente.
    console.error('Error al obtener datos de mantenimiento predictivo:', error);
    res.status(500).json({ message: 'Ocurrió un error al procesar la solicitud de mantenimiento predictivo.' });
  }
}

/**
 * @function getPredictiveMaintenanceView
 * @description Obtiene los datos de mantenimiento predictivo directamente desde la vista SQL optimizada.
 * Esta es la forma más eficiente ya que la base de datos realiza todos los cálculos.
 * @param {Request} req - Objeto de solicitud de Express.
 * @param {Response} res - Objeto de respuesta de Express.
 * @param {NextFunction} next - Función de middleware para manejo de errores.
 */
export async function getPredictiveMaintenanceView(req: Request, res: Response, next: NextFunction) {
  try {
    // La consulta SQL es simple: solo selecciona todo de la vista pre-calculada.
    const query = 'SELECT * FROM public.vista_mantenimiento_predictivo;';

    // Sequelize ejecuta la consulta SQL. QueryTypes.SELECT asegura que el resultado
    // sea un arreglo de objetos JSON, sin metadatos adicionales.
    const results = await sequelize.query(query, {
      type: QueryTypes.SELECT
    });

    // Se devuelve el resultado directamente al cliente.
    res.json(results);

  } catch (error) {
    // Si la vista no existe o hay otro error en la BD, se captura aquí.
    console.error('Error al consultar la vista de mantenimiento predictivo:', error);
    res.status(500).json({ message: 'Ocurrió un error al obtener los datos de la vista predictiva.' });
  }
}