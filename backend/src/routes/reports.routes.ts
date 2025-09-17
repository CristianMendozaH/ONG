import { Router } from 'express';
import { sequelize } from '../db/sequelize';
import { QueryTypes } from 'sequelize';
import { authMiddleware } from '../middleware/auth';

// Dependencias para exportación
import PDFDocument from 'pdfkit';
import ExcelJS from 'exceljs';

const router = Router();
router.use(authMiddleware);

// ==========================================================
// RUTA PRINCIPAL PARA OBTENER DATOS DE REPORTES
// Esta ruta reemplaza a la antigua '/prestamos'
// ==========================================================
router.get('/dynamic', async (req, res, next) => {
  try {
    const { 
      page = 1, 
      limit = 50, 
      fecha_inicio, 
      fecha_fin,
      estado,
      tipoReporte = 'prestamos' // Por defecto, el reporte es de préstamos
    } = req.query;

    const offset = (parseInt(page as string) - 1) * parseInt(limit as string);

    let query = '';
    let countQuery = '';
    const replacements: any = { limit: parseInt(limit as string), offset };

    // Este 'switch' construye la consulta correcta según el tipo de reporte solicitado
    switch (tipoReporte) {
      case 'mantenimiento':
        // Lógica para el reporte de Mantenimientos
        // NOTA: Requiere la vista 'vista_reportes_mantenimiento' en la base de datos.
        query = `
          SELECT 
            *,
            ROW_NUMBER() OVER (ORDER BY "fechaRealizacion" DESC NULLS LAST) as correlativo
          FROM vista_reportes_mantenimiento
          ORDER BY "fechaRealizacion" DESC NULLS LAST
          LIMIT :limit OFFSET :offset
        `;
        countQuery = `SELECT COUNT(*) as total FROM vista_reportes_mantenimiento`;
        break;

      case 'prestamos':
      default:
        // Lógica para el reporte de Préstamos
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

        // Se añade ROW_NUMBER() para generar el ID secuencial 'correlativo'
        query = `
          SELECT 
            v.*,
            ROW_NUMBER() OVER (ORDER BY v."fechaPrestamo" DESC) as correlativo
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
    next(error); // Envía el error al manejador de errores de Express
  }
});


// ==========================================================
// RUTAS ADICIONALES (Estadísticas, KPIs, etc.)
// ==========================================================

router.get('/estadisticas', async (req, res, next) => {
  try {
    const { fechaInicio, fechaFin } = req.query;
    let whereConditions: string[] = [];
    const replacements: any = {};

    if (fechaInicio) {
      whereConditions.push(`"loanDate" >= :fechaInicio`);
      replacements.fechaInicio = fechaInicio;
    }
    if (fechaFin) {
      whereConditions.push(`"loanDate" <= :fechaFin`);
      replacements.fechaFin = fechaFin;
    }
    const whereClause = whereConditions.length > 0 ? 'WHERE ' + whereConditions.join(' AND ') : '';

    const queries = {
      totalPrestamos: `SELECT COUNT(*) as count FROM loans ${whereClause}`,
      prestamosDevueltos: `SELECT COUNT(*) as count FROM loans ${whereClause ? whereClause + ' AND' : 'WHERE'} status = 'devuelto'`,
      prestamosActivos: `SELECT COUNT(*) as count FROM loans ${whereClause ? whereClause + ' AND' : 'WHERE'} status IN ('activo', 'prestado')`,
      prestamosVencidos: `SELECT COUNT(*) as count FROM loans ${whereClause ? whereClause + ' AND' : 'WHERE'} status = 'atrasado'`,
    };

    const [totalResult, devueltosResult, activosResult, vencidosResult] = await Promise.all([
      sequelize.query(queries.totalPrestamos, { replacements, type: QueryTypes.SELECT }),
      sequelize.query(queries.prestamosDevueltos, { replacements, type: QueryTypes.SELECT }),
      sequelize.query(queries.prestamosActivos, { replacements, type: QueryTypes.SELECT }),
      sequelize.query(queries.prestamosVencidos, { replacements, type: QueryTypes.SELECT }),
    ]);

    res.json({
      totalPrestamos: parseInt((totalResult[0] as any).count, 10),
      prestamosDevueltos: parseInt((devueltosResult[0] as any).count, 10),
      prestamosActivos: parseInt((activosResult[0] as any).count, 10),
      prestamosVencidos: parseInt((vencidosResult[0] as any).count, 10),
    });
  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    next(error);
  }
});

// Rutas "placeholder" para evitar errores 404 en el frontend
router.get('/tipos', (req, res) => res.json([
  { value: 'prestamos', label: 'Préstamos de Equipos' },
  { value: 'mantenimiento', label: 'Mantenimientos' },
]));
router.get('/kpis', (req, res) => res.json({}));
router.get('/activity', (req, res) => res.json([]));


// ==========================================================
// RUTAS DE EXPORTACIÓN (PDF Y EXCEL)
// ==========================================================
// (El código de exportación se mantiene igual y se coloca aquí)

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