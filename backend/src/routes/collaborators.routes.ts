// src/routes/collaborators.routes.ts

import { Router } from 'express';
import { auth } from '../middleware/auth';
import { Collaborator } from '../models/Collaborator';

const router = Router();

/**
 * @route   GET /api/collaborators
 * @desc    Obtener una lista de todos los colaboradores activos
 * @access  Private
 */
router.get('/', auth, async (req, res, next) => {
  try {
    const collaborators = await Collaborator.findAll({
      where: { isActive: true },
      order: [['fullName', 'ASC']],
    });
    res.json(collaborators);
  } catch (e) {
    next(e);
  }
});

/**
 * @route   POST /api/collaborators
 * @desc    Crear un nuevo colaborador
 * @access  Private (Probablemente solo para admins)
 */
router.post('/', auth, async (req, res, next) => {
    try {
        const { fullName, position, program, contact } = req.body;
        if (!fullName || !position || !program) {
            return res.status(400).json({ message: 'fullName, position, y program son requeridos.' });
        }

        const newCollaborator = await Collaborator.create({
            fullName,
            position,
            program,
            contact
        });

        res.status(201).json(newCollaborator);
    } catch (e) {
        next(e);
    }
});


export default router;