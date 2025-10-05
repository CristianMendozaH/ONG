import path from 'path';
import { fileURLToPath } from 'url';

// Se calcula la ruta del directorio actual de una forma compatible con ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import { Router } from 'express';
import { sequelize } from '../db/sequelize';
import { QueryTypes } from 'sequelize';
import { authMiddleware } from '../middleware/auth';
import PDFDocument from 'pdfkit';
import ExcelJS from 'exceljs';

const router = Router();
router.use(authMiddleware);

const infoONG = {
  nombre: "Amigos de Santa Cruz", // Puedes cambiarlo por el nombre de tu ONG
  logoPath: path.join(__dirname, '..', '..', 'assets', 'logo-ong.png'),
  fechaReporte: new Date().toLocaleDateString('es-GT', {
    year: 'numeric', month: 'long', day: 'numeric'
  })
};

// ==========================================================
// RUTAS PARA EL DASHBOARD
// ==========================================================

router.get('/kpis', async (req, res, next) => {
  try {
    await sequelize.query(`
      UPDATE loans
      SET status = 'atrasado'
      WHERE "dueDate" < CURRENT_DATE AND status = 'prestado' AND "returnDate" IS NULL;
    `);

    const queries = {
      disponibles: `SELECT COUNT(*) as count FROM equipments WHERE LOWER(status) = 'disponible'`,
      prestados: `SELECT COUNT(*) as count FROM loans WHERE status = 'prestado'`,
      enMantenimiento: `SELECT COUNT(*) as count FROM equipments WHERE LOWER(status) IN ('en-proceso', 'programado')`,
      atrasados: `SELECT COUNT(*) as count FROM loans WHERE status = 'atrasado'`,
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
        SELECT "loanDate"::date AS loan_date, COUNT(*) as count FROM loans GROUP BY loan_date
      ) p ON d.day = p.loan_date
      LEFT JOIN (
        SELECT "returnDate"::date AS return_date, COUNT(*) as count FROM loans WHERE "returnDate" IS NOT NULL GROUP BY return_date
      ) r ON d.day = r.return_date
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

router.get('/notifications', async (req, res, next) => {
  try {
    let notifications: any[] = [];
    const loansQuery = `
      SELECT 
        l.id,
        'La devolución del equipo "' || e.name || '" por "' || l."borrowerName" || '" está atrasada.' as message,
        'error' as type,
        l."updatedAt" as "createdAt"
      FROM loans l
      JOIN equipments e ON l."equipmentId" = e.id
      WHERE l.status = 'atrasado'
    `;
    const atrasados = await sequelize.query(loansQuery, { type: QueryTypes.SELECT });
    const maintenanceQuery = `
      SELECT 
        m.id,
        'El equipo "' || e.name || '" tiene un mantenimiento en estado: "' || m.status || '".' as message,
        'warning' as type,
        m."createdAt"
      FROM maintenances m
      JOIN equipments e ON m."equipmentId" = e.id
      WHERE m.status IN ('en-proceso', 'programado')
    `;
    const mantenimientos = await sequelize.query(maintenanceQuery, { type: QueryTypes.SELECT });
    notifications = [...atrasados, ...mantenimientos];
    notifications.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    res.json(notifications);
  } catch (error) {
    console.error('Error al generar notificaciones:', error);
    next(error);
  }
});

// ==========================================================
// RUTAS PARA LA PÁGINA DE REPORTES
// ==========================================================
router.get('/estadisticas', async (req, res, next) => {
  try {
    const { fecha_inicio, fecha_fin, tipoReporte = 'prestamos', borrowerType } = req.query;
    let query;
    const replacements: any = {};
    if (tipoReporte === 'mantenimiento') {
      let whereClause = '';
      if (fecha_inicio) {
        whereClause += ' WHERE "scheduledDate"::date >= :fecha_inicio';
        replacements.fecha_inicio = fecha_inicio;
      }
      if (fecha_fin) {
        whereClause += whereClause ? ' AND "scheduledDate"::date <= :fecha_fin' : ' WHERE "scheduledDate"::date <= :fecha_fin';
        replacements.fecha_fin = fecha_fin;
      }
      query = `
        SELECT
          COUNT(*)::INTEGER AS "totalMantenimientos",
          COUNT(CASE WHEN status = 'programado' THEN 1 END)::INTEGER AS "mantenimientosProgramados",
          COUNT(CASE WHEN status = 'en-proceso' THEN 1 END)::INTEGER AS "mantenimientosEnProceso",
          COUNT(CASE WHEN status = 'completado' THEN 1 END)::INTEGER AS "mantenimientosCompletados"
        FROM maintenances
        ${whereClause}
      `;
    } else {
      let whereConditions: string[] = [];
      if (fecha_inicio) {
        whereConditions.push(`"loanDate"::date >= :fecha_inicio`);
        replacements.fecha_inicio = fecha_inicio;
      }
      if (fecha_fin) {
        whereConditions.push(`"loanDate"::date <= :fecha_fin`);
        replacements.fecha_fin = fecha_fin;
      }
      if (borrowerType && typeof borrowerType === 'string' && borrowerType.trim() !== '') {
          whereConditions.push(`"borrowerType" = :borrowerType`);
          replacements.borrowerType = borrowerType;
      }
      const whereClause = whereConditions.length > 0 ? 'WHERE ' + whereConditions.join(' AND ') : '';
      query = `
        SELECT
          COUNT(*)::INTEGER AS "totalPrestamos",
          COUNT(CASE WHEN status = 'prestado' THEN 1 END)::INTEGER AS "prestamosActivos",
          COUNT(CASE WHEN status = 'devuelto' THEN 1 END)::INTEGER AS "prestamosDevueltos",
          COUNT(CASE WHEN status = 'atrasado' THEN 1 END)::INTEGER AS "prestamosVencidos"
        FROM loans
        ${whereClause}
      `;
    }
    const result = await sequelize.query(query, {
      replacements,
      type: QueryTypes.SELECT,
      plain: true
    });
    res.json(result);
  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    next(error);
  }
});

router.get('/tipos', (req, res) => {
  res.json([
    { value: 'prestamos', label: 'Préstamos' },
    { value: 'mantenimiento', label: 'Mantenimiento' },
    { value: 'equipos_populares', label: 'Equipos Más Usados' },
    { value: 'user_activity', label: 'Usuarios Más Activos' }
  ]);
});

router.get('/dynamic', async (req, res, next) => {
  try {
    const { 
      page = 1, 
      limit = 50, 
      fecha_inicio, 
      fecha_fin,
      estado,
      borrowerType,
      tipoReporte = 'prestamos'
    } = req.query;
    const offset = (parseInt(page as string) - 1) * parseInt(limit as string);
    let query = '';
    let countQuery = '';
    const replacements: any = { limit: parseInt(limit as string), offset };
    let whereConditions: string[] = [];
    if (fecha_inicio) {
      whereConditions.push(`l."loanDate"::DATE >= :fecha_inicio`);
      replacements.fecha_inicio = fecha_inicio;
    }
    if (fecha_fin) {
      whereConditions.push(`l."loanDate"::DATE <= :fecha_fin`);
      replacements.fecha_fin = fecha_fin;
    }
    if (borrowerType && typeof borrowerType === 'string' && borrowerType.trim() !== '') {
        whereConditions.push(`l."borrowerType" = :borrowerType`);
        replacements.borrowerType = borrowerType;
    }
    const whereClause = whereConditions.length > 0 ? 'WHERE ' + whereConditions.join(' AND ') : '';
    switch (tipoReporte) {
      case 'mantenimiento':
        let maintWhere: string[] = [];
        if (fecha_inicio) {
          maintWhere.push(`v."fechaRealizacion"::DATE >= :fecha_inicio`);
          replacements.fecha_inicio = fecha_inicio;
        }
        if (fecha_fin) {
          maintWhere.push(`v."fechaRealizacion"::DATE <= :fecha_fin`);
          replacements.fecha_fin = fecha_fin;
        }
        const maintWhereClause = maintWhere.length > 0 ? 'WHERE ' + maintWhere.join(' AND ') : '';
        query = `
          SELECT *, ROW_NUMBER() OVER (ORDER BY "fechaRealizacion" DESC NULLS LAST) as correlativo
          FROM vista_reportes_mantenimiento v
          ${maintWhereClause}
          ORDER BY "fechaRealizacion" DESC NULLS LAST
          LIMIT :limit OFFSET :offset
        `;
        countQuery = `SELECT COUNT(*) as total FROM vista_reportes_mantenimiento v ${maintWhereClause}`;
        break;
      case 'equipos_populares':
        query = `
            SELECT
                e.name AS equipo,
                e.type AS categoria,
                COUNT(l.id) AS total_usos
            FROM equipments e
            JOIN loans l ON e.id = l."equipmentId"
            ${whereClause}
            GROUP BY e.id, e.name, e.type
            ORDER BY total_usos DESC
            LIMIT :limit OFFSET :offset
        `;
        countQuery = `
            SELECT COUNT(*) as total FROM (
                SELECT e.id
                FROM equipments e
                JOIN loans l ON e.id = l."equipmentId"
                ${whereClause}
                GROUP BY e.id
            ) as subquery
        `;
        break;
      case 'user_activity':
        query = `
            SELECT
                l."borrowerName" as usuario,
                l."borrowerType" as tipo_usuario,
                COUNT(l.id) as total_prestamos
            FROM loans l
            ${whereClause}
            GROUP BY l."borrowerName", l."borrowerType"
            ORDER BY total_prestamos DESC
            LIMIT :limit OFFSET :offset
        `;
        countQuery = `
            SELECT COUNT(*) as total FROM (
                SELECT l."borrowerName"
                FROM loans l
                ${whereClause}
                GROUP BY l."borrowerName"
            ) as subquery
        `;
        break;
      case 'prestamos':
      default:
        let prestamosWhere = [...whereConditions];
        if (estado && typeof estado === 'string' && estado.trim() !== '') {
            prestamosWhere.push(`LOWER(v.estado) = LOWER(:estado)`);
            replacements.estado = estado;
        }
        const prestamosWhereClause = prestamosWhere.length > 0 ? 'WHERE ' + prestamosWhere.join(' AND ') : '';
        query = `
          SELECT v.*, ROW_NUMBER() OVER (ORDER BY v."fechaPrestamo" DESC) as correlativo
          FROM vista_reportes_prestamos v
          INNER JOIN loans l ON v.id::uuid = l.id
          ${prestamosWhereClause}
          ORDER BY v."fechaPrestamo" DESC NULLS LAST
          LIMIT :limit OFFSET :offset
        `;
        countQuery = `
          SELECT COUNT(*) as total FROM vista_reportes_prestamos v 
          INNER JOIN loans l ON v.id::uuid = l.id
          ${prestamosWhereClause}`;
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

async function getReportData(filtros: any) {
  const { 
    fecha_inicio, 
    fecha_fin,
    estado,
    borrowerType,
    tipoReporte = 'prestamos'
  } = filtros;

  let query = '';
  const replacements: any = {};
  let whereConditions: string[] = [];

  if (fecha_inicio) {
    whereConditions.push(`l."loanDate"::DATE >= :fecha_inicio`);
    replacements.fecha_inicio = fecha_inicio;
  }
  if (fecha_fin) {
    whereConditions.push(`l."loanDate"::DATE <= :fecha_fin`);
    replacements.fecha_fin = fecha_fin;
  }
  if (borrowerType) {
      whereConditions.push(`l."borrowerType" = :borrowerType`);
      replacements.borrowerType = borrowerType;
  }
  const whereClause = whereConditions.length > 0 ? 'WHERE ' + whereConditions.join(' AND ') : '';

  switch (tipoReporte) {
    case 'mantenimiento':
      let maintWhere: string[] = [];
      if (fecha_inicio) {
        maintWhere.push(`v."fechaRealizacion"::DATE >= :fecha_inicio`);
        replacements.fecha_inicio = fecha_inicio;
      }
      if (fecha_fin) {
        maintWhere.push(`v."fechaRealizacion"::DATE <= :fecha_fin`);
        replacements.fecha_fin = fecha_fin;
      }
      const maintWhereClause = maintWhere.length > 0 ? 'WHERE ' + maintWhere.join(' AND ') : '';
      query = `SELECT * FROM vista_reportes_mantenimiento v ${maintWhereClause} ORDER BY "fechaRealizacion" DESC`;
      break;

    case 'equipos_populares':
      query = `
          SELECT e.name AS equipo, e.type AS categoria, COUNT(l.id) AS total_usos
          FROM equipments e JOIN loans l ON e.id = l."equipmentId"
          ${whereClause}
          GROUP BY e.id, e.name, e.type ORDER BY total_usos DESC
      `;
      break;
    
    case 'user_activity':
      query = `
          SELECT l."borrowerName" as usuario, l."borrowerType" as tipo_usuario, COUNT(l.id) as total_prestamos
          FROM loans l
          ${whereClause}
          GROUP BY l."borrowerName", l."borrowerType" ORDER BY total_prestamos DESC
      `;
      break;

    case 'prestamos':
    default:
      let prestamosWhere = [...whereConditions];
      if (estado) {
          prestamosWhere.push(`LOWER(v.estado) = LOWER(:estado)`);
          replacements.estado = estado;
      }
      const prestamosWhereClause = prestamosWhere.length > 0 ? 'WHERE ' + prestamosWhere.join(' AND ') : '';
      query = `
        SELECT v.* FROM vista_reportes_prestamos v
        INNER JOIN loans l ON v.id::uuid = l.id
        ${prestamosWhereClause} ORDER BY v."fechaPrestamo" DESC
      `;
      break;
  }
  return await sequelize.query(query, { replacements, type: QueryTypes.SELECT });
}

// ==========================================================
// --- RUTAS DE EXPORTACIÓN (PDF Y EXCEL) ---
// ==========================================================

function generatePdfHeader(doc: PDFKit.PDFDocument, title: string) {
    let logoBottomY = 0;

    if (infoONG.logoPath) {
        try {
            doc.image(infoONG.logoPath, 30, 45, {
                fit: [80, 80]
            });
            logoBottomY = 45 + 80;
        } catch (e) {
            console.error("No se pudo cargar el logo:", e);
        }
    }

    doc.fontSize(18).font('Helvetica-Bold').text(infoONG.nombre, 0, 55, { align: 'center' });
    doc.fontSize(14).font('Helvetica').text(title, { align: 'center' });
    doc.fontSize(10).text(`Fecha: ${infoONG.fechaReporte}`, { align: 'center' });
    
    const textBottomY = doc.y;

    doc.y = Math.max(logoBottomY, textBottomY) + 20;
}

function generatePdfTable(doc: PDFKit.PDFDocument, headers: any[], data: any[]) {
  const tableTop = doc.y;
  const startX = doc.page.margins.left;
  const rowSpacing = 5;

  doc.font('Helvetica-Bold');
  let currentX = startX;
  headers.forEach(header => {
    doc.text(header.label, currentX, doc.y, { width: header.width, align: 'left' });
    currentX += header.width;
  });
  const headerBottomY = doc.y;
  doc.moveTo(startX, headerBottomY + rowSpacing).lineTo(startX + headers.reduce((a, b) => a + b.width, 0), headerBottomY + rowSpacing).stroke();

  doc.font('Helvetica');
  doc.moveDown();

  data.forEach(item => {
    const rowY = doc.y;
    let rowHeight = 0;
    currentX = startX;

    headers.forEach(header => {
      const cellText = String(item[header.key] || '-');
      const height = doc.heightOfString(cellText, { width: header.width });
      if (height > rowHeight) {
        rowHeight = height;
      }
    });

    headers.forEach(header => {
      const cellText = String(item[header.key] || '-');
      doc.text(cellText, currentX, rowY, { width: header.width, align: 'left' });
      currentX += header.width;
    });
    
    doc.y = rowY + rowHeight + rowSpacing;
    
    if (doc.y > doc.page.height - doc.page.margins.bottom) {
        doc.addPage();
    }
  });
}

router.post('/export/pdf', async (req, res, next) => {
  try {
    const { filtros } = req.body;
    const data = await getReportData(filtros);
    const { tipoReporte = 'prestamos' } = filtros;
    
    let title = '';
    let headers: any[] = [];
    
    switch(tipoReporte) {
      case 'mantenimiento':
        title = 'Reporte de Mantenimiento';
        headers = [
            { label: 'Equipo', key: 'equipo', width: 150 },
            { label: 'Tipo', key: 'tipo', width: 100 },
            { label: 'Técnico', key: 'tecnico', width: 150 },
            { label: 'Fecha', key: 'fechaRealizacion', width: 80 },
            { label: 'Estado', key: 'estado', width: 70 }
        ];
        break;
      case 'equipos_populares':
        title = 'Reporte de Equipos Más Usados';
        headers = [
            { label: 'Equipo', key: 'equipo', width: 250 },
            { label: 'Categoría', key: 'categoria', width: 150 },
            { label: 'Total de Usos', key: 'total_usos', width: 150 }
        ];
        break;
      case 'user_activity':
        title = 'Reporte de Usuarios Más Activos';
        headers = [
            { label: 'Usuario', key: 'usuario', width: 250 },
            { label: 'Tipo de Usuario', key: 'tipo_usuario', width: 150 },
            { label: 'Total de Préstamos', key: 'total_prestamos', width: 150 }
        ];
        break;
      case 'prestamos':
      default:
        title = 'Reporte de Préstamos';
        headers = [
            { label: 'ID', key: 'correlativo', width: 50 },
            { label: 'Equipo', key: 'equipo', width: 180 },
            { label: 'Usuario', key: 'usuario', width: 180 },
            { label: 'F. Préstamo', key: 'fechaPrestamo', width: 80 },
            { label: 'Estado', key: 'estado', width: 60 }
        ];
        break;
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=${title.replace(/ /g, '_')}.pdf`);
    
    const doc = new PDFDocument({ margin: 30, size: 'A4' });
    doc.pipe(res);
    
    generatePdfHeader(doc, title);
    generatePdfTable(doc, headers, data as any[]);

    doc.end();
  } catch (error) {
    console.error('Error exportando PDF:', error);
    next(error);
  }
});

router.post('/export/excel', async (req, res, next) => {
  try {
    const { filtros } = req.body;
    const data = await getReportData(filtros);
    const { tipoReporte = 'prestamos' } = filtros;

    const workbook = new ExcelJS.Workbook();
    let title = '';
    
    switch(tipoReporte) {
      case 'mantenimiento':
        title = 'Reporte de Mantenimiento';
        const maintSheet = workbook.addWorksheet(title);
        maintSheet.columns = [
          { header: 'ID', key: 'id', width: 10 },
          { header: 'Equipo', key: 'equipo', width: 30 },
          { header: 'Código Equipo', key: 'codigoEquipo', width: 20 },
          { header: 'Tipo', key: 'tipo', width: 20 },
          { header: 'Técnico', key: 'tecnico', width: 30 },
          { header: 'Fecha Realización', key: 'fechaRealizacion', width: 20 },
          { header: 'Estado', key: 'estado', width: 15 },
        ];
        maintSheet.addRows(data);
        break;

      case 'equipos_populares':
        title = 'Reporte de Equipos Más Usados';
        const equiposSheet = workbook.addWorksheet(title);
        equiposSheet.columns = [
          { header: 'Equipo', key: 'equipo', width: 35 },
          { header: 'Categoría', key: 'categoria', width: 25 },
          { header: 'Total de Usos', key: 'total_usos', width: 20 },
        ];
        equiposSheet.addRows(data);
        break;

      case 'user_activity':
        title = 'Reporte de Usuarios Más Activos';
        const usersSheet = workbook.addWorksheet(title);
        usersSheet.columns = [
          { header: 'Usuario', key: 'usuario', width: 35 },
          { header: 'Tipo de Usuario', key: 'tipo_usuario', width: 25 },
          { header: 'Total de Préstamos', key: 'total_prestamos', width: 20 },
        ];
        usersSheet.addRows(data);
        break;
        
      case 'prestamos':
      default:
        title = 'Reporte de Préstamos';
        const prestamosSheet = workbook.addWorksheet(title);
        prestamosSheet.columns = [
          { header: 'ID', key: 'correlativo', width: 10 },
          { header: 'Equipo', key: 'equipo', width: 30 },
          { header: 'Usuario', key: 'usuario', width: 30 },
          { header: 'Fecha Préstamo', key: 'fechaPrestamo', width: 20 },
          { header: 'Fecha Devolución', key: 'fechaDevolucion', width: 20 },
          { header: 'Estado', key: 'estado', width: 15 },
        ];
        prestamosSheet.addRows(data);
        break;
    }

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=${title.replace(/ /g, '_')}.xlsx`);
    
    await workbook.xlsx.write(res);
    res.end();

  } catch (error) {
    console.error('Error exportando Excel:', error);
    next(error);
  }
});

export default router;