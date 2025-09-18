import { Op } from 'sequelize';
import { Request, Response } from 'express';
import { Equipment } from '../models/Equipment';
import { Loan } from '../models/Loan';
import { Maintenance } from '../models/Maintenance';

// === NUEVA FUNCIÓN UNIFICADA PARA EL DASHBOARD ===

export async function getDashboardKpis(_req: Request, res: Response) {
  try {
    // 1. Contar el total de equipos
    const totalEquipos = await Equipment.count();

    // 2. Contar préstamos activos
    const prestados = await Loan.count({ where: { status: 'prestado' } });

    // 3. Contar préstamos vencidos (atrasos)
    const atrasos = await Loan.count({
      where: {
        status: 'prestado',
        dueDate: { [Op.lt]: new Date().toISOString().slice(0, 10) }
      }
    });

    // 4. Contar mantenimientos activos (¡LA LÓGICA CLAVE!)
    // Sumamos los que están 'programado' y 'en-proceso'
    const enMantenimiento = await Maintenance.count({
      where: {
        status: {
          [Op.or]: ['programado', 'en-proceso']
        }
      }
    });

    // 5. Devolver todo en un solo objeto JSON
    res.json({
      totalEquipos,
      prestados,
      atrasos,
      enMantenimiento
    });

  } catch (error) {
    console.error("Error al generar los KPIs del dashboard:", error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
}


// --- El resto de tus funciones pueden permanecer por si las usas en otras partes ---

const iso = (d: Date | string) => new Date(d).toISOString().slice(0, 10);

export async function equipmentKpis(_req: Request, res: Response) {
    // ...código original...
}
export async function loansDueSoon(req: Request, res: Response) {
    // ...código original...
}
export async function loansOverdue(_req: Request, res: Response) {
    // ...código original...
}
export async function maintDueSoon(req: Request, res: Response) {
    // ...código original...
}
export async function maintKpis(_req: Request, res: Response) {
    // ...código original...
}