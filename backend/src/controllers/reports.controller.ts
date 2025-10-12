import { Op } from 'sequelize';
import { Request, Response } from 'express';
import { Equipment } from '../models/Equipment';
import { Loan } from '../models/Loan';
import { Maintenance } from '../models/Maintenance';
import { User } from '../models/User'; // Asegúrate de que el modelo User esté importado

// === FUNCIÓN UNIFICADA PARA KPIs DEL DASHBOARD ===

export async function getDashboardKpis(_req: Request, res: Response) {
  try {
    // 1. Contar préstamos activos
    const prestados = await Loan.count({ where: { status: 'prestado' } });

    // 2. Contar préstamos vencidos (atrasos)
    const atrasos = await Loan.count({
      where: {
        status: 'prestado',
        dueDate: { [Op.lt]: new Date() }
      }
    });

    // 3. Contar mantenimientos activos ('programado' y 'en-proceso')
    const enMantenimiento = await Maintenance.count({
      where: {
        status: {
          [Op.or]: ['programado', 'en-proceso']
        }
      }
    });

    // 4. Calcular total y disponibles
    const totalEquipos = await Equipment.count();
    const disponibles = totalEquipos - prestados - enMantenimiento;


    // 5. Devolver todo en un solo objeto JSON
    res.json({
      disponibles,
      prestados,
      atrasos,
      enMantenimiento,
      totalEquipos,
    });

  } catch (error) {
    console.error("Error al generar los KPIs del dashboard:", error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
}

// === NUEVA FUNCIÓN PARA GENERAR NOTIFICACIONES (CORREGIDA) ===

export async function getNotifications(_req: Request, res: Response) {
  try {
    const notifications = [];

    // 1. Buscar préstamos atrasados
    const overdueLoans = await Loan.findAll({
      where: {
        status: 'prestado',
        dueDate: { [Op.lt]: new Date() }
      },
      include: [Equipment, User], // Incluir modelos asociados para obtener nombres
      order: [['dueDate', 'ASC']]
    });

    for (const loan of overdueLoans) {
      // Usamos '?' para acceder de forma segura y '??' para dar un valor por defecto
      const equipmentName = (loan as any).equipment?.name ?? 'Equipo Desconocido';
      const userName = (loan as any).user?.name ?? 'Usuario Desconocido';

      notifications.push({
        id: `loan-${loan.id}`,
        message: `La devolución del equipo "${equipmentName}" por "${userName}" está atrasada.`,
        type: 'error',
        createdAt: loan.dueDate, // Usamos la fecha de vencimiento como referencia
        link: '/prestamos'      // Enlace a la sección de préstamos
      });
    }

    // 2. Buscar mantenimientos programados o en proceso
    const activeMaintenances = await Maintenance.findAll({
      where: {
        status: { [Op.or]: ['programado', 'en-proceso'] }
      },
      include: [Equipment], // Incluir el equipo para obtener el nombre
      order: [['startDate', 'DESC']]
    });

    for (const maint of activeMaintenances) {
      // Hacemos lo mismo aquí
      const equipmentName = (maint as any).equipment?.name ?? 'Equipo Desconocido';
      
      notifications.push({
        id: `maint-${maint.id}`,
        message: `El equipo "${equipmentName}" tiene un mantenimiento en estado "${maint.status}".`,
        type: 'warning',
        createdAt: maint.createdAt, // Usamos la fecha de creación del registro
        link: '/mantenimiento' // Enlace a la sección de mantenimiento
      });
    }

    // 3. Ordenar todas las notificaciones por fecha (más recientes primero)
    notifications.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    res.json(notifications);

  } catch (error) {
    console.error("Error al generar las notificaciones:", error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
}


// --- El resto de tus funciones ---

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