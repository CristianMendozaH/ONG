import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import { equipmentKpis, loansDueSoon, loansOverdue, maintDueSoon, maintKpis } from '../controllers/reports.controller';

const router = Router();
router.use(authMiddleware);

// Equipos
router.get('/kpis', equipmentKpis);

// Préstamos
router.get('/loans/due-soon', loansDueSoon);
router.get('/loans/overdue', loansOverdue);

// Mantenimientos
router.get('/maintenances/due-soon', maintDueSoon);
router.get('/maintenances/kpis', maintKpis);

export default router;
