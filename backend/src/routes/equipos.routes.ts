import { Router } from 'express';
import { Equipment } from '../models/Equipment';
import { User } from '../models/User'; // ++ AÑADIDO: Importa el modelo de Usuario
import QRCode from 'qrcode';
import { Op } from 'sequelize';

const router = Router();

// =======================================================================
// RUTA LISTAR (CON BÚSQUEDA Y DATOS DEL CREADOR)
// =======================================================================
router.get('/', async (req, res) => {
  const { search, status, type } = req.query;
  const where: any = {};

  if (search && typeof search === 'string' && search.trim()) {
    const searchTerm = `%${search.trim()}%`;
    where[Op.or] = [
      { name: { [Op.iLike]: searchTerm } },
      { code: { [Op.iLike]: searchTerm } },
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
    // ++ MODIFICADO: Incluye la información del usuario creador
    include: [{
      model: User,
      as: 'creator', // Usa el alias definido en la relación
      attributes: ['id', 'name']
    }]
  });

  res.json(rows);
});

// =======================================================================
// RUTA CREAR (ACEPTANDO 'createdBy')
// =======================================================================
router.post('/', async (req, res, next) => {
  try {
    // ++ MODIFICADO: Se extrae 'createdBy' del cuerpo de la petición
    const { code, name, type, description, serial, createdBy } = req.body;

    // Se valida que 'createdBy' no esté vacío
    if (!createdBy) {
      return res.status(400).json({ message: 'El campo createdBy es obligatorio.' });
    }

    const eq = await Equipment.create({ code, name, type, description, serial, createdBy });
    res.status(201).json(eq);
  } catch (e) {
    if (e instanceof Error && e.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({ message: 'El código o número de serie ya existe.' });
    }
    next(e);
  }
});

// =======================================================================
// RUTA DETALLE (CON DATOS DEL CREADOR)
// =======================================================================
router.get('/:id', async (req, res, next) => {
  try {
    const eq = await Equipment.findByPk(req.params.id, {
      // ++ MODIFICADO: Incluye la información del usuario creador también aquí
      include: [{
        model: User,
        as: 'creator',
        attributes: ['id', 'name']
      }]
    });
    if (!eq) return res.status(404).json({ message: 'Equipo no encontrado' });
    res.json(eq);
  } catch (e) { next(e); }
});

// =======================================================================
// RUTA ACTUALIZAR (PROTEGIDA CONTRA CAMBIOS EN 'createdBy')
// =======================================================================
router.put('/:id', async (req, res, next) => {
  try {
    const eq = await Equipment.findByPk(req.params.id);
    if (!eq) return res.status(404).json({ message: 'Equipo no encontrado' });

    // ++ MODIFICADO: Se elimina 'createdBy' del body para evitar que se actualice
    delete req.body.createdBy;

    await eq.update(req.body);
    res.json(eq);
  } catch (e) {
    if (e instanceof Error && e.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({ message: 'El código o número de serie ya existe.' });
    }
    next(e);
  }
});

// =======================================================================
// RUTA ELIMINAR (Sin cambios)
// =======================================================================
router.delete('/:id', async (req, res, next) => {
  try {
    const eq = await Equipment.findByPk(req.params.id);
    if (!eq) return res.status(404).json({ message: 'Equipo no encontrado' });
    await eq.destroy();
    res.status(204).send();
  } catch (e) { next(e); }
});

// =======================================================================
// RUTA QR (Sin cambios)
// =======================================================================
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