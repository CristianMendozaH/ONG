import { Router } from 'express';
import authRoutes from './auth.routes.js';
import usersRoutes from './users.routes.js';
import equiposRoutes from './equipos.routes.js';
import prestamosRoutes from './prestamos.routes.js';
import maintenancesRoutes from './maintenances.routes.js';
import reportsRoutes from './reports.routes.js';
import configRoutes from './config.routes.js';
import healthRoutes from './health.routes.js';
import assignmentsRoutes from './assignments.routes.js'; // ---> NUEVO
import collaboratorsRoutes from './collaborators.routes.js'; // ---> NUEVO

const router = Router();

router.use('/auth', authRoutes);
router.use('/users', usersRoutes);
router.use('/equipments', equiposRoutes); // <-- CAMBIO AQUÍ
router.use('/prestamos', prestamosRoutes);
router.use('/assignments', assignmentsRoutes);     // ---> NUEVO
router.use('/collaborators', collaboratorsRoutes); // ---> NUEVO

router.use('/maintenances', maintenancesRoutes);
router.use('/mantenimientos', maintenancesRoutes); // alias ES

router.use('/reports', reportsRoutes);
router.use('/config', configRoutes);

router.use('/health', healthRoutes);

export default router;