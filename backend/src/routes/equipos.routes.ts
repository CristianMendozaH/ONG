import { Router } from 'express';
import { Equipment } from '../models/Equipment';
import QRCode from 'qrcode';
import { Op } from 'sequelize';

const router = Router();

// =======================================================================
// RUTA LISTAR (CON BÚSQUEDA POR SERIAL)
// =======================================================================
router.get('/', async (req, res) => {
  const { search, status, type } = req.query;
  const where: any = {};

  if (search && typeof search === 'string' && search.trim()) {
    const searchTerm = `%${search.trim()}%`;
    where[Op.or] = [
      { name: { [Op.iLike]: searchTerm } },
      { code: { [Op.iLike]: searchTerm } },
      // ===============================================================
      // ++ CAMBIO REALIZADO AQUÍ ++
      // Se añade la búsqueda por el campo 'serial'. Ahora el buscador
      // también encontrará equipos por su número de serie.
      // ===============================================================
      { serial: { [Op.iLike]: searchTerm } },
    ];
  }

  if (status && typeof status === 'string') {
    if (status === 'mantenimiento') {
      where.status = { [Op.in]: ['programada', 'en-proceso'] };
    } else {
      where.status = status;
    }
  }

  if (type && typeof type === 'string') {
    where.type = { [Op.iLike]: type };
  }

  const rows = await Equipment.findAll({
    where,
    order: [['createdAt', 'DESC']],
  });

  res.json(rows);
});

// =======================================================================
// RUTA CREAR (ACEPTANDO EL CAMPO SERIAL)
// =======================================================================
router.post('/', async (req, res, next) => {
  try {
    // ===============================================================
    // ++ CAMBIO REALIZADO AQUÍ ++
    // Se extrae 'serial' del cuerpo de la petición (req.body).
    // Si no viene, será 'undefined' y no se guardará, lo cual es correcto.
    // ===============================================================
    const { code, name, type, description, serial } = req.body;
    const eq = await Equipment.create({ code, name, type, description, serial });
    res.status(201).json(eq);
  } catch (e) {
    // Manejo de error de unicidad para 'serial'
    if (e instanceof Error && e.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({ message: 'El código o número de serie ya existe.' });
    }
    next(e);
  }
});

// Detalle (Sin cambios)
router.get('/:id', async (req, res, next) => {
  try {
    const eq = await Equipment.findByPk(req.params.id);
    if (!eq) return res.status(404).json({ message: 'Equipo no encontrado' });
    res.json(eq);
  } catch (e) { next(e); }
});

// =======================================================================
// RUTA ACTUALIZAR (ACEPTANDO EL CAMPO SERIAL)
// =======================================================================
router.put('/:id', async (req, res, next) => {
  try {
    const eq = await Equipment.findByPk(req.params.id);
    if (!eq) return res.status(404).json({ message: 'Equipo no encontrado' });

    // ===============================================================
    // ++ CAMBIO REALIZADO AQUÍ ++
    // El método `update` de Sequelize recibe los campos del body.
    // Si `req.body` incluye `serial`, intentará actualizarlo.
    // No se necesita lógica extra aquí, pero es importante asegurarse
    // que el frontend lo envíe correctamente.
    // ===============================================================
    await eq.update(req.body);
    res.json(eq);
  } catch (e) {
    // Manejo de error de unicidad para 'serial'
    if (e instanceof Error && e.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({ message: 'El código o número de serie ya existe.' });
    }
    next(e);
  }
});


// Eliminar (Sin cambios)
router.delete('/:id', async (req, res, next) => {
  try {
    const eq = await Equipment.findByPk(req.params.id);
    if (!eq) return res.status(404).json({ message: 'Equipo no encontrado' });
    await eq.destroy();
    res.status(204).send(); // Es una mejor práctica devolver 204 No Content en un DELETE exitoso.
  } catch (e) { next(e); }
});

// QR del equipo (Sin cambios)
router.get('/:id/qr', async (req, res, next) => {
  try {
    const eq = await Equipment.findByPk(req.params.id);
    if (!eq) return res.status(404).json({ message: 'Equipo no encontrado' });
    const qrPayload = JSON.stringify({ id: eq.id, code: eq.code, name: eq.name });
    const png = await QRCode.toBuffer(qrPayload, { type: 'png', width: 256, errorCorrectionLevel: 'M' });
    res.setHeader('Content-Type', 'image/png');
    res.send(png);
  } catch (e) { next(e); }
});

export default router;