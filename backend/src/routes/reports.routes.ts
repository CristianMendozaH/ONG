import { Router } from 'express';
import { sequelize } from '../db/sequelize';
import { QueryTypes } from 'sequelize';
import { authMiddleware } from '../middleware/auth';
import PDFDocument from 'pdfkit';
import ExcelJS from 'exceljs';

const router = Router();
router.use(authMiddleware);

// ==========================================================
// RUTAS PARA EL DASHBOARD
// ==========================================================

/**
 * KPI: Indicadores clave de rendimiento para el dashboard.
 * VERSIÓN FINAL: Ajustada a los datos reales de Postman.
 */
router.get('/kpis', async (req, res, next) => {
  try {
    // PASO 1: Actualizar préstamos vencidos
    await sequelize.query(`
      UPDATE loans
      SET status = 'atrasado'
      WHERE "dueDate" < CURRENT_DATE AND status = 'prestado' AND "returnDate" IS NULL;
    `);

    // PASO 2: Realizar todas las consultas de conteo en paralelo
    const queries = {
      // Cuenta equipos disponibles
      disponibles: `SELECT COUNT(*) as count FROM equipments WHERE LOWER(status) = 'disponible'`,
      // ✅ CAMBIO: Ahora cuenta directamente los préstamos activos
      prestados: `SELECT COUNT(*) as count FROM loans WHERE status = 'prestado'`,
      // ✅ CAMBIO: Ahora busca el estado 'en-proceso' en la tabla de equipos
      enMantenimiento: `SELECT COUNT(*) as count FROM equipments WHERE LOWER(status) = 'en-proceso'`,
      // Cuenta préstamos atrasados
      atrasados: `SELECT COUNT(*) as count FROM loans WHERE status = 'atrasado'`,
      // Cuenta el total de equipos para la estadística general
      totalEquipos: `SELECT COUNT(*) as count FROM equipments`
    };

    const [
      disponiblesResult,
      prestadosResult,
      mantenimientoResult,
      atrasosResult,
      totalEquiposResult
    ] = await Promise.all([
      sequelize.query(queries.disponibles, { type: QueryTypes.SELECT }),
      sequelize.query(queries.prestados, { type: QueryTypes.SELECT }),
      sequelize.query(queries.enMantenimiento, { type: QueryTypes.SELECT }),
      sequelize.query(queries.atrasados, { type: QueryTypes.SELECT }),
      sequelize.query(queries.totalEquipos, { type: QueryTypes.SELECT })
    ]);

    // PASO 3: Construir el objeto de respuesta final
    res.json({
      disponibles: parseInt((disponiblesResult[0] as any).count, 10),
      prestados: parseInt((prestadosResult[0] as any).count, 10),
      enMantenimiento: parseInt((mantenimientoResult[0] as any).count, 10),
      atrasos: parseInt((atrasosResult[0] as any).count, 10),
      totalEquipos: parseInt((totalEquiposResult[0] as any).count, 10)
    });

  } catch (error) {
    console.error('Error obteniendo KPIs:', error);
    next(error);
  }
});


/**
 * ACTIVITY: Devuelve los 5 movimientos más recientes.
 */
router.get('/activity', async (req, res, next) => {
  try {
    const query = `
      SELECT
        id,
        descripcion,
        fecha,
        tipo
      FROM (
        SELECT 
          l.id,
          'Préstamo de ' || e.name || ' a ' || l."borrowerName" as descripcion,
          l."loanDate" as fecha,
          'prestamo' as tipo
        FROM loans l
        JOIN equipments e ON e.id = l."equipmentId"
        
        UNION ALL
        
        SELECT 
          m.id,
          'Mantenimiento (' || m.type || ') para ' || e.name as descripcion,
          m."scheduledDate" as fecha,
          'mantenimiento' as tipo
        FROM maintenances m
        JOIN equipments e ON e.id = m."equipmentId"
      ) as actividad_reciente
      ORDER BY fecha DESC
      LIMIT 5
    `;

    const recentActivity = await sequelize.query(query, { type: QueryTypes.SELECT });
    res.json(recentActivity);

  } catch (error) {
    console.error('Error obteniendo actividad reciente:', error);
    next(error);
  }
});


/**
 * WEEKLY-ACTIVITY: Datos para la gráfica de barras de los últimos 7 días.
 */
router.get('/weekly-activity', async (req, res, next) => {
  try {
    const query = `
      WITH last_7_days AS (
        SELECT generate_series(CURRENT_DATE - INTERVAL '6 days', CURRENT_DATE, '1 day')::date AS day
      )
      SELECT
        CASE TO_CHAR(d.day, 'Dy')
          WHEN 'Mon' THEN 'Lun'
          WHEN 'Tue' THEN 'Mar'
          WHEN 'Wed' THEN 'Mié'
          WHEN 'Thu' THEN 'Jue'
          WHEN 'Fri' THEN 'Vie'
          WHEN 'Sat' THEN 'Sáb'
          WHEN 'Sun' THEN 'Dom'
        END AS label,
        COALESCE(p.count, 0)::INTEGER AS prestamos,
        COALESCE(r.count, 0)::INTEGER AS devoluciones
      FROM last_7_days d
      LEFT JOIN (
        SELECT "loanDate", COUNT(*) as count FROM loans GROUP BY "loanDate"
      ) p ON d.day = p."loanDate"
      LEFT JOIN (
        SELECT "returnDate", COUNT(*) as count FROM loans WHERE "returnDate" IS NOT NULL GROUP BY "returnDate"
      ) r ON d.day = r."returnDate"
      ORDER BY d.day;
    `;

    const result = await sequelize.query(query, { type: QueryTypes.SELECT });
    
    const labels = (result as any[]).map(r => r.label);
    const prestamos = (result as any[]).map(r => r.prestamos);
    const devoluciones = (result as any[]).map(r => r.devoluciones);

    res.json({ labels, prestamos, devoluciones });
  } catch (error) {
    console.error('Error obteniendo actividad semanal:', error);
    next(error);
  }
});


// ==========================================================
// RUTA PRINCIPAL PARA OBTENER DATOS DE REPORTES (sin cambios)
// ==========================================================
router.get('/dynamic', async (req, res, next) => {
  try {
    const { 
      page = 1, 
      limit = 50, 
      fecha_inicio, 
      fecha_fin,
      estado,
      tipoReporte = 'prestamos'
    } = req.query;

    const offset = (parseInt(page as string) - 1) * parseInt(limit as string);

    let query = '';
    let countQuery = '';
    const replacements: any = { limit: parseInt(limit as string), offset };

    switch (tipoReporte) {
      case 'mantenimiento':
        query = `
          SELECT *, ROW_NUMBER() OVER (ORDER BY "createdAt" DESC NULLS LAST) as correlativo
          FROM vista_reportes_mantenimiento
          ORDER BY "createdAt" DESC NULLS LAST
          LIMIT :limit OFFSET :offset
        `;
        countQuery = `SELECT COUNT(*) as total FROM vista_reportes_mantenimiento`;
        break;

      case 'prestamos':
      default:
        let whereConditions: string[] = [];
        if (fecha_inicio) {
          whereConditions.push(`v."fechaPrestamo"::DATE >= :fecha_inicio`);
          replacements.fecha_inicio = fecha_inicio;
        }
        if (fecha_fin) {
          whereConditions.push(`v."fechaPrestamo"::DATE <= :fecha_fin`);
          replacements.fecha_fin = fecha_fin;
        }
        if (estado && typeof estado === 'string' && estado.trim() !== '') {
            whereConditions.push(`v.estado = :estado`);
            replacements.estado = estado;
        }
        const whereClause = whereConditions.length > 0 ? 'WHERE ' + whereConditions.join(' AND ') : '';
        query = `
          SELECT v.*, ROW_NUMBER() OVER (ORDER BY v."fechaPrestamo" DESC) as correlativo
          FROM vista_reportes_prestamos v
          ${whereClause}
          ORDER BY v."fechaPrestamo" DESC NULLS LAST
          LIMIT :limit OFFSET :offset
        `;
        countQuery = `SELECT COUNT(*) as total FROM vista_reportes_prestamos v ${whereClause}`;
        break;
    }

    const result = await sequelize.query(query, { replacements, type: QueryTypes.SELECT });
    const countResult = await sequelize.query(countQuery, { replacements, type: QueryTypes.SELECT });
    const total = parseInt((countResult[0] as any).total, 10);

    res.json({
      data: result,
      total: total,
      page: parseInt(page as string),
    });

  } catch (error) {
    console.error(`Error en reporte dinámico (${req.query.tipoReporte}):`, error);
    next(error);
  }
});


// ==========================================================
// RUTAS DE EXPORTACIÓN (PDF Y EXCEL)
// ==========================================================
async function getFilteredLoanData(filtros: any) {
  let whereConditions: string[] = [];
  const replacements: any = {};

  if (filtros.fechaInicio) {
    whereConditions.push(`v."fechaPrestamo"::DATE >= :fecha_inicio`);
    replacements.fecha_inicio = filtros.fechaInicio;
  }
  if (filtros.fechaFin) {
    whereConditions.push(`v."fechaPrestamo"::DATE <= :fecha_fin`);
    replacements.fecha_fin = filtros.fechaFin;
  }
  if (filtros.tipoReporte === 'prestamos' && filtros.estado) {
     whereConditions.push(`v.estado = :estado`);
     replacements.estado = filtros.estado;
  }

  const whereClause = whereConditions.length > 0 ? 'WHERE ' + whereConditions.join(' AND ') : '';
  const query = `SELECT * FROM vista_reportes_prestamos v ${whereClause} ORDER BY v."fechaPrestamo" DESC`;
  
  return await sequelize.query(query, {
    replacements,
    type: QueryTypes.SELECT
  });
}

router.post('/export/pdf', async (req, res, next) => {
  try {
    const data = await getFilteredLoanData(req.body.filtros);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=reporte.pdf');
    const doc = new PDFDocument({ margin: 30, size: 'A4' });
    doc.pipe(res);
    doc.fontSize(18).text('Reporte de Préstamos', { align: 'center' });
    doc.moveDown();
    const tableTop = 100;
    const itemX = 30;
    const columns = ['ID', 'Equipo', 'Usuario', 'F. Préstamo', 'Estado'];
    doc.fontSize(10).font('Helvetica-Bold');
    doc.text(columns[0], itemX, tableTop);
    doc.text(columns[1], itemX + 80, tableTop);
    doc.text(columns[2], itemX + 200, tableTop);
    doc.text(columns[3], itemX + 350, tableTop);
    doc.text(columns[4], itemX + 450, tableTop, {width: 100});
    doc.moveTo(itemX, tableTop + 15).lineTo(570, tableTop + 15).stroke();
    doc.font('Helvetica');
    let y = tableTop + 25;
    (data as any[]).forEach(item => {
      doc.text(String(item.id).substring(0, 8), itemX, y);
      doc.text(item.equipo, itemX + 80, y);
      doc.text(item.usuario, itemX + 200, y);
      doc.text(item.fechaPrestamo, itemX + 350, y);
      doc.text(item.estado, itemX + 450, y);
      y += 20;
    });
    doc.end();
  } catch (error) {
    console.error('Error exportando PDF:', error);
    next(error);
  }
});

router.post('/export/excel', async (req, res, next) => {
  try {
    const data = await getFilteredLoanData(req.body.filtros);
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Reporte de Préstamos');
    worksheet.columns = [
      { header: 'ID', key: 'id', width: 30 },
      { header: 'Equipo', key: 'equipo', width: 30 },
      { header: 'Usuario', key: 'usuario', width: 30 },
      { header: 'Fecha Préstamo', key: 'fechaPrestamo', width: 20 },
      { header: 'Fecha Devolución', key: 'fechaDevolucion', width: 20 },
      { header: 'Estado', key: 'estado', width: 15 },
      { header: 'Días de Uso', key: 'diasUso', width: 15 },
    ];
    worksheet.addRows(data);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=reporte.xlsx');
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('Error exportando Excel:', error);
    next(error);
  }
});


export default router;