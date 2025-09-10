import { Router } from 'express';
import authRoutes from './auth.routes';
import usersRoutes from './users.routes';
import equiposRoutes from './equipos.routes';
import prestamosRoutes from './prestamos.routes';
import maintenancesRoutes from './maintenances.routes';
import reportsRoutes from './reports.routes';
import configRoutes from './config.routes';
import healthRoutes from './health.routes'; 

const router = Router();

router.use('/auth', authRoutes);
router.use('/users', usersRoutes);
router.use('/equipos', equiposRoutes);
router.use('/prestamos', prestamosRoutes);

router.use('/maintenances', maintenancesRoutes);
router.use('/mantenimientos', maintenancesRoutes); // alias ES

router.use('/reports', reportsRoutes);
router.use('/config', configRoutes);

router.use('/health', healthRoutes);

export default router;
