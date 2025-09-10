import { Router } from 'express';
// ajusta esta ruta si tu sequelize.ts está en otra carpeta
import { sequelize } from '../db/sequelize'; 

const router = Router();

router.get('/', async (_req, res) => {
  try {
    // opcional: chequeo de BD
    await sequelize.authenticate();
    res.json({
      ok: true,
      status: 'up',
      db: 'up',
      time: new Date().toISOString(),
      uptime: process.uptime(),
    });
  } catch (err: any) {
    res.status(500).json({
      ok: false,
      status: 'up',
      db: 'down',
      error: err?.message ?? 'DB error',
    });
  }
});

export default router;
