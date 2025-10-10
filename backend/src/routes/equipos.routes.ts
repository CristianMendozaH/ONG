import { Router, Request, Response, NextFunction } from 'express';
import { body, param, validationResult } from 'express-validator';
import { Op } from 'sequelize';
import QRCode from 'qrcode';

import { Equipment } from '../models/Equipment.js';
import { User } from '../models/User.js';
import { auth } from '../middleware/auth.js';

const router = Router();

// Middleware de autenticación para todas las rutas de este archivo
router.use(auth);

// Interfaz para dar tipo al objeto 'req' después de la autenticación
interface AuthenticatedRequest extends Request {
  user?: { sub: string };
}

// Tipos de equipos permitidos
const allowedTypes = [
  'Laptop', 'PC / Gabinete', 'Proyector', 'Tablet', 'Cámara',
  'Monitor', 'Impresora', 'Equipo de Red', 'UPS / Regulador', 'Otro'
];

// =======================================================================
// RUTA: Listar todos los equipos (GET /)
// =======================================================================
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { search, status, type } = req.query as { search?: string, status?: string, type?: string };
    const where: any = {};

    if (search && search.trim()) {
      const searchTerm = `%${search.trim()}%`;
      where[Op.or] = [
        { name: { [Op.iLike]: searchTerm } },
        { code: { [Op.iLike]: searchTerm } },
        { serial: { [Op.iLike]: searchTerm } },
      ];
    }

    if (status) {
      where.status = status;
    }

    if (type) {
      where.type = type;
    }

    const rows = await Equipment.findAll({
      where,
      order: [['code', 'DESC']],
      include: [{
        model: User,
        as: 'creator',
        attributes: ['id', 'name']
      }]
    });
    res.json(rows);
  } catch (e) {
    next(e);
  }
});

// =======================================================================
// RUTA: Crear un nuevo equipo (POST /)
// =======================================================================
router.post(
  '/',
  body('code').trim().notEmpty().withMessage('El código es obligatorio.'),
  body('name').trim().notEmpty().withMessage('El nombre es obligatorio.').isLength({ min: 3, max: 100 }).withMessage('El nombre debe tener entre 3 y 100 caracteres.'),
  body('type').notEmpty().withMessage('El tipo es obligatorio.').isIn(allowedTypes).withMessage('El tipo de equipo no es válido.'),
  body('serial').optional({ checkFalsy: true }).trim().isLength({ max: 100 }).withMessage('El número de serie no puede exceder los 100 caracteres.'),
  body('description').optional().trim().isLength({ max: 500 }).withMessage('La descripción no puede exceder los 500 caracteres.'),

  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { code, name, type, description, serial, status } = req.body;
      const createdBy = req.user?.sub; // Acceso seguro a req.user

      const existingCode = await Equipment.findOne({ where: { code: { [Op.iLike]: code } } });
      if (existingCode) {
        return res.status(409).json({ message: `El código '${code}' ya existe.` });
      }
      if (serial) {
        const existingSerial = await Equipment.findOne({ where: { serial: { [Op.iLike]: serial } } });
        if (existingSerial) {
          return res.status(409).json({ message: `El número de serie '${serial}' ya existe.` });
        }
      }

      const newEquipment = await Equipment.create({ code, name, type, description, serial, createdBy, status });
      res.status(201).json(newEquipment);

    } catch (e) {
      next(e);
    }
  }
);

// =======================================================================
// RUTA: Obtener un equipo por ID (GET /:id)
// =======================================================================
router.get(
  '/:id',
  param('id').isUUID().withMessage('El ID proporcionado no es un UUID válido.'),
  async (req: Request<{ id: string }>, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { id } = req.params; // req.params ahora está correctamente tipado
      const equipment = await Equipment.findByPk(id, {
        include: [{ model: User, as: 'creator', attributes: ['id', 'name'] }]
      });
      if (!equipment) {
        return res.status(404).json({ message: 'Equipo no encontrado' });
      }
      res.json(equipment);
    } catch (e) {
      next(e);
    }
  }
);

// =======================================================================
// RUTA: Actualizar un equipo (PUT /:id)
// =======================================================================
router.put(
  '/:id',
  param('id').isUUID().withMessage('El ID proporcionado no es un UUID válido.'),
  body('name').optional().trim().notEmpty().withMessage('El nombre no puede estar vacío.').isLength({ min: 3, max: 100 }),
  body('type').optional().trim().isIn(allowedTypes).withMessage('El tipo de equipo no es válido.'),
  body('status').optional().isIn(['disponible', 'prestado', 'mantenimiento', 'dañado', 'asignado']),
  body('serial').optional({ checkFalsy: true }).trim().isLength({ max: 100 }),

  async (req: Request<{ id: string }>, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { id } = req.params; // req.params ahora está correctamente tipado
      const equipment = await Equipment.findByPk(id);
      if (!equipment) {
        return res.status(404).json({ message: 'Equipo no encontrado' });
      }
      
      const { serial } = req.body;

      if (serial && serial.toLowerCase() !== (equipment.serial || '').toLowerCase()) {
        const existingSerial = await Equipment.findOne({
            where: { serial: { [Op.iLike]: serial }, id: { [Op.ne]: id } }
        });
        if (existingSerial) {
            return res.status(409).json({ message: `El número de serie '${serial}' ya existe en otro equipo.` });
        }
      }

      delete req.body.createdBy;
      delete req.body.id;
      delete req.body.code;
      
      if (req.body.serial !== undefined && req.body.serial.trim() === '') {
        req.body.serial = null;
      }

      await equipment.update(req.body);
      res.json(equipment);

    } catch (e) {
      next(e);
    }
  }
);

// =======================================================================
// RUTA: Eliminar un equipo (DELETE /:id)
// =======================================================================
router.delete(
  '/:id',
  param('id').isUUID().withMessage('El ID proporcionado no es un UUID válido.'),
  async (req: Request<{ id: string }>, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { id } = req.params; // req.params ahora está correctamente tipado
      const equipment = await Equipment.findByPk(id);
      if (!equipment) {
        return res.status(404).json({ message: 'Equipo no encontrado' });
      }

      await equipment.destroy();
      res.status(204).send();

    } catch (e) {
      next(e);
    }
  }
);

// =======================================================================
// RUTA: Generar QR de un equipo (GET /:id/qr)
// =======================================================================
router.get(
  '/:id/qr',
  param('id').isUUID().withMessage('El ID proporcionado no es un UUID válido.'),
  async (req: Request<{ id: string }>, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { id } = req.params; // req.params ahora está correctamente tipado
      const equipment = await Equipment.findByPk(id);
      if (!equipment) {
        return res.status(404).json({ message: 'Equipo no encontrado' });
      }

      const qrPayload = JSON.stringify({
        id: equipment.id,
        code: equipment.code,
        name: equipment.name
      });

      const pngBuffer = await QRCode.toBuffer(qrPayload, {
        type: 'png', width: 256, errorCorrectionLevel: 'M'
      });

      res.setHeader('Content-Type', 'image/png');
      res.send(pngBuffer);

    } catch (e) {
      next(e);
    }
  }
);

export default router;