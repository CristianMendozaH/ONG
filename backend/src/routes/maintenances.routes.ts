import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import { list, getById, create, update, remove, start, complete, cancel } from '../controllers/maintenances.controller';

const router = Router();
router.use(authMiddleware);

router.get('/', list);
router.get('/:id', getById);
router.post('/', create);
router.put('/:id', update);
router.delete('/:id', remove);

router.post('/:id/start', start);
router.post('/:id/complete', complete);
router.post('/:id/cancel', cancel);

export default router;
