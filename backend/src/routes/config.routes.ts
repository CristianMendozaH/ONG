import { Router } from 'express';
import { authMiddleware, requireRole } from '../middleware/auth';
import { getAll, getKey, setKey } from '../controllers/config.controller';

const router = Router();
router.use(authMiddleware);
router.use(requireRole('admin')); // solo admin cambia config

router.get('/', getAll);
router.get('/:key', getKey);
router.put('/:key', setKey);

export default router;
