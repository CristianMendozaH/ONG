// src/app/features/reportes/reportes.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { KPIs, Activity } from '../../shared/interfaces/models';

// Interfaces específicas para reportes
export interface FiltrosReporte {
  fechaInicio?: string;
  fechaFin?: string;
  tipoReporte?: string;
  estado?: string;
  usuario?: string;
  equipo?: string;
}

export interface ReporteItem {
  id: string;
  equipo: string;
  usuario: string;
  fechaPrestamo: string;
  fechaDevolucion: string | null;
  estado: 'Activo' | 'Devuelto' | 'Vencido';
  diasUso: number;
  equipoId?: string;
  usuarioId?: string;
}

export interface ReporteResponse {
  data: ReporteItem[];
  total: number;
  page: number;
  limit: number;
}

export interface ExportOptions {
  formato: 'pdf' | 'excel';
  filtros: FiltrosReporte;
  incluirGraficos?: boolean;
}

export interface EstadisticasReporte {
  totalPrestamos: number;
  prestamosActivos: number;
  prestamosDevueltos: number;
  prestamosVencidos: number;
  promedioUso: number;
  equipoMasUsado: string;
  usuarioMasActivo: string;
}

export interface DatosGraficos {
  estadoPrestamos: {
    labels: string[];
    data: number[];
    colors: string[];
  };
  actividadMensual: {
    labels: string[];
    prestamos: number[];
    devoluciones: number[];
  };
  equiposPopulares: {
    labels: string[];
    data: number[];
  };
}

@Injectable({
  providedIn: 'root'
})
export class ReportesService {
  private readonly API_URL = environment.apiUrl;

  constructor(private http: HttpClient) {}

  /**
   * Obtener KPIs para el dashboard
   */
  getKpis(): Observable<KPIs> {
    return this.http.get<KPIs>(`${this.API_URL}/reports/kpis`);
  }

  /**
   * Obtener actividad reciente
   */
  getActivity(): Observable<Activity> {
    return this.http.get<Activity>(`${this.API_URL}/reports/activity`);
  }

  /**
   * Obtener reportes con filtros
   */
  getReportes(filtros: FiltrosReporte = {}, page: number = 1, limit: number = 50): Observable<ReporteResponse> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    // Agregar filtros si existen
    if (filtros.fechaInicio) {
      params = params.set('fechaInicio', filtros.fechaInicio);
    }
    if (filtros.fechaFin) {
      params = params.set('fechaFin', filtros.fechaFin);
    }
    if (filtros.tipoReporte) {
      params = params.set('tipoReporte', filtros.tipoReporte);
    }
    if (filtros.estado) {
      params = params.set('estado', filtros.estado);
    }
    if (filtros.usuario) {
      params = params.set('usuario', filtros.usuario);
    }
    if (filtros.equipo) {
      params = params.set('equipo', filtros.equipo);
    }

    return this.http.get<ReporteResponse>(`${this.API_URL}/reports/prestamos`, { params });
  }

  /**
   * Obtener estadísticas específicas de reportes
   */
  getEstadisticasReporte(filtros: FiltrosReporte = {}): Observable<EstadisticasReporte> {
    let params = new HttpParams();

    Object.entries(filtros).forEach(([key, value]) => {
      if (value) {
        params = params.set(key, value.toString());
      }
    });

    return this.http.get<EstadisticasReporte>(`${this.API_URL}/reports/estadisticas`, { params });
  }

  /**
   * Obtener datos para gráficos
   */
  getDatosGraficos(filtros: FiltrosReporte = {}): Observable<DatosGraficos> {
    let params = new HttpParams();

    Object.entries(filtros).forEach(([key, value]) => {
      if (value) {
        params = params.set(key, value.toString());
      }
    });

    return this.http.get<DatosGraficos>(`${this.API_URL}/reports/graficos`, { params });
  }

  /**
   * Exportar reporte a PDF
   */
  exportarPDF(options: ExportOptions): Observable<Blob> {
    return this.http.post(`${this.API_URL}/reports/export/pdf`, options, {
      responseType: 'blob'
    });
  }

  /**
   * Exportar reporte a Excel
   */
  exportarExcel(options: ExportOptions): Observable<Blob> {
    return this.http.post(`${this.API_URL}/reports/export/excel`, options, {
      responseType: 'blob'
    });
  }

  /**
   * Obtener tipos de reporte disponibles
   */
  getTiposReporte(): Observable<{ value: string; label: string; }[]> {
    return this.http.get<{ value: string; label: string; }[]>(`${this.API_URL}/reports/tipos`);
  }

  /**
   * Obtener reporte de mantenimiento
   */
  getReporteMantenimiento(filtros: FiltrosReporte = {}): Observable<any[]> {
    let params = new HttpParams();

    Object.entries(filtros).forEach(([key, value]) => {
      if (value) {
        params = params.set(key, value.toString());
      }
    });

    return this.http.get<any[]>(`${this.API_URL}/reports/mantenimiento`, { params });
  }

  /**
   * Obtener reporte de usuarios activos
   */
  getReporteUsuarios(filtros: FiltrosReporte = {}): Observable<any[]> {
    let params = new HttpParams();

    Object.entries(filtros).forEach(([key, value]) => {
      if (value) {
        params = params.set(key, value.toString());
      }
    });

    return this.http.get<any[]>(`${this.API_URL}/reports/usuarios`, { params });
  }

  /**
   * Obtener reporte de estado de equipos
   */
  getReporteEstadoEquipos(filtros: FiltrosReporte = {}): Observable<any[]> {
    let params = new HttpParams();

    Object.entries(filtros).forEach(([key, value]) => {
      if (value) {
        params = params.set(key, value.toString());
      }
    });

    return this.http.get<any[]>(`${this.API_URL}/reports/equipos/estado`, { params });
  }

  /**
   * Obtener próximos vencimientos
   */
  getProximosVencimientos(dias: number = 7): Observable<any[]> {
    const params = new HttpParams().set('dias', dias.toString());
    return this.http.get<any[]>(`${this.API_URL}/reports/vencimientos`, { params });
  }

  /**
   * Obtener reporte personalizado
   */
  getReportePersonalizado(configuracion: any): Observable<any> {
    return this.http.post<any>(`${this.API_URL}/reports/personalizado`, configuracion);
  }
}
