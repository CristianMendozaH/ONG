import { Router } from 'express';
import { Equipment } from '../models/Equipment';
import QRCode from 'qrcode';

const router = Router();

// Listar
router.get('/', async (_req, res) => {
  const rows = await Equipment.findAll({ order: [['createdAt', 'DESC']] });
  res.json(rows);
});

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
