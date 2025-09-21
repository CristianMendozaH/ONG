import { Router } from 'express';
import { Equipment } from '../models/Equipment';
import QRCode from 'qrcode';
import { Op } from 'sequelize';

const router = Router();

// =======================================================================
// RUTA LISTAR (CON LA ORDENACIÓN CORREGIDA)
// =======================================================================
router.get('/', async (req, res) => {
  // Se extraen los parámetros de la consulta (query)
  const { search, status, type } = req.query;
  
  // Se crea un objeto 'where' para construir la consulta dinámicamente
  const where: any = {};

  // 1. Lógica para el filtro de búsqueda (search)
  if (search && typeof search === 'string' && search.trim()) {
    const searchTerm = `%${search.trim()}%`;
    where[Op.or] = [
      { name: { [Op.iLike]: searchTerm } }, // Busca en el nombre (insensible a mayúsculas)
      { code: { [Op.iLike]: searchTerm } }, // Busca en el código (insensible a mayúsculas)
    ];
  }

  // 2. Lógica para el filtro de estado (status)
  if (status && typeof status === 'string') {
    // Si el estado es 'mantenimiento', busca en la base de datos los estados 'Programada' o 'En proceso'
    if (status === 'mantenimiento') {
      where.status = { [Op.in]: ['programada', 'en-proceso'] };
    } else {
      where.status = status;
    }
  }

  // 3. Lógica para el filtro de tipo (type)
  if (type && typeof type === 'string') {
    where.type = { [Op.iLike]: type }; 
  }

  // Se ejecuta la consulta con los filtros construidos y el orden corregido
  const rows = await Equipment.findAll({ 
    where, 
    order: [['createdAt', 'DESC']]  // <-- ÚNICO CAMBIO REALIZADO AQUÍ
  });
  
  res.json(rows);
});

// =======================================================================
// OTRAS RUTAS (SIN CAMBIOS)
// =======================================================================

// Crear
router.post('/', async (req, res, next) => {
  try {
    const { code, name, type, description } = req.body;
    const eq = await Equipment.create({ code, name, type, description });
    res.status(201).json(eq);
  } catch (e) { next(e); }
});

// Detalle
router.get('/:id', async (req, res, next) => {
  try {
    const eq = await Equipment.findByPk(req.params.id);
    if (!eq) return res.status(404).json({ message: 'Equipo no encontrado' });
    res.json(eq);
  } catch (e) { next(e); }
});

// Actualizar
router.put('/:id', async (req, res, next) => {
  try {
    const eq = await Equipment.findByPk(req.params.id);
    if (!eq) return res.status(404).json({ message: 'Equipo no encontrado' });
    await eq.update(req.body);
    res.json(eq);
  } catch (e) { next(e); }
});

// Eliminar
router.delete('/:id', async (req, res, next) => {
  try {
    const eq = await Equipment.findByPk(req.params.id);
    if (!eq) return res.status(404).json({ message: 'Equipo no encontrado' });
    await eq.destroy();
    res.json({ ok: true });
  } catch (e) { next(e); }
});

// QR del equipo (PNG)
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