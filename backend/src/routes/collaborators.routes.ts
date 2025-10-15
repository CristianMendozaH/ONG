// Archivo completo: src/routes/collaborators.routes.ts

import { Router, Request, Response, NextFunction } from 'express';
import { Op } from 'sequelize'; // Importamos el operador de Sequelize para búsquedas complejas
import { auth } from '../middleware/auth.js';
import { Collaborator } from '../models/Collaborator.js';
import { User } from '../models/User.js';

// Interfaz para que TypeScript reconozca la propiedad 'user' en el objeto 'req'
interface AuthRequest extends Request {
  user?: {
    sub: string;
    name: string;
  };
}

const router = Router();

/**
 * @route   GET /api/collaborators
 * @desc    Listar y buscar colaboradores con filtros.
 * @access  Private
 */
router.get('/', auth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Extraemos los parámetros de búsqueda y filtro de la URL (query params)
    const { search, type, includeInactive } = req.query;
    
    // Construimos la cláusula 'where' de forma dinámica
    const whereClause: any = {};

    // Por defecto, solo mostramos los activos, a menos que se pida explícitamente lo contrario
    if (includeInactive !== 'true') {
      whereClause.isActive = true;
    }

    // Si se especifica un 'tipo', lo añadimos al filtro
    if (type) {
      whereClause.type = type;
    }

    // Si hay un término de búsqueda, buscamos en múltiples columnas
    if (search && typeof search === 'string' && search.trim() !== '') {
      const searchTerm = `%${search.trim()}%`;
      whereClause[Op.or] = [
        { fullName: { [Op.iLike]: searchTerm } },
        { position: { [Op.iLike]: searchTerm } },
        { program: { [Op.iLike]: searchTerm } }
      ];
    }
    
    const collaborators = await Collaborator.findAll({
      where: whereClause,
      include: [{
        model: User,
        as: 'creator', // Alias definido en las asociaciones
        attributes: ['name'] // Solo traemos el nombre del usuario
      }],
      order: [['createdAt', 'DESC']] // Ordenamos por fecha de creación, los más nuevos primero
    });
    res.json(collaborators);
  } catch (e) {
    next(e);
  }
});


/**
 * @route   POST /api/collaborators
 * @desc    Crear un nuevo colaborador o becado.
 * @access  Private
 */
router.post('/', auth, async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { fullName, position, program, contact, type } = req.body;
        
        if (!fullName || !type) {
            return res.status(400).json({ message: 'Nombre completo y tipo ("Colaborador" o "Becado") son requeridos.' });
        }

        const newCollaborator = await Collaborator.create({
            fullName,
            position,
            program,
            contact,
            type,
            createdById: req.user!.sub // Guardamos el ID del usuario logueado
        });

        res.status(201).json(newCollaborator);
    } catch (e) {
        next(e);
    }
});


/**
 * @route   PATCH /api/collaborators/:id
 * @desc    Actualizar un colaborador (incluyendo activar/desactivar).
 * @access  Private
 */
router.patch('/:id', auth, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { fullName, position, program, contact, type, isActive } = req.body;
        
        const collaborator = await Collaborator.findByPk(req.params.id);
        if (!collaborator) {
            return res.status(404).json({ message: 'Colaborador no encontrado.' });
        }

        // El método update solo actualizará los campos que se envíen en el body
        await collaborator.update({
            fullName,
            position,
            program,
            contact,
            type,
            isActive
        });
        
        res.json(collaborator);
    } catch (e) {
        next(e);
    }
});

export default router;

