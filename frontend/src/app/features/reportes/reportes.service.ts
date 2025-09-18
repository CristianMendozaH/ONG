import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface FiltrosReporte {
  fechaInicio?: string;
  fechaFin?: string;
  tipoReporte?: string;
  estado?: string;
}

export interface ReporteItem {
  id: string;
  correlativo: number;
  estado?: string;
  equipo?: string;
  usuario?: string;
  fechaPrestamo?: string;
  fechaDevolucion?: string;
  codigoEquipo?: string;
  tipo?: string;
  tecnico?: string;
  fechaRealizacion?: string;
}

export interface ReporteResponse {
  data: ReporteItem[];
  total: number;
  page: number;
  limit: number;
}

export interface EstadisticasReporte {
  // Stats de Préstamos
  totalPrestamos?: number;
  prestamosActivos?: number;
  prestamosDevueltos?: number;
  prestamosVencidos?: number;
  // Stats de Mantenimiento
  totalMantenimientos?: number;
  mantenimientosProgramados?: number;
  mantenimientosEnProceso?: number;
  mantenimientosCompletados?: number;
}

export interface ExportOptions {
  formato: 'pdf' | 'excel';
  filtros: FiltrosReporte;
}

@Injectable({
  providedIn: 'root'
})
export class ReportesService {
  private readonly API_URL = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getReportes(filtros: FiltrosReporte = {}, page: number = 1, limit: number = 50): Observable<ReporteResponse> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    if (filtros.fechaInicio) params = params.set('fecha_inicio', filtros.fechaInicio);
    if (filtros.fechaFin) params = params.set('fecha_fin', filtros.fechaFin);
    if (filtros.tipoReporte) params = params.set('tipoReporte', filtros.tipoReporte);
    if (filtros.estado) params = params.set('estado', filtros.estado);

    return this.http.get<any>(`${this.API_URL}/reports/dynamic`, { params }).pipe(
      map(response => {
        // ✅ CORRECCIÓN FINAL: No se necesita transformar los datos porque los nombres
        // de la vista SQL ya coinciden con los que espera el HTML.
        // Simplemente nos aseguramos de que la data sea un array.
        const data = Array.isArray(response.data) ? response.data : [];

        return {
          data: data,
          total: response.total || 0,
          page: response.page || page,
          limit: limit,
        };
      }),
      catchError(error => {
        console.error('Error obteniendo reportes:', error);
        return of({ data: [], total: 0, page: 1, limit });
      })
    );
  }

  getEstadisticasReporte(filtros: FiltrosReporte = {}): Observable<EstadisticasReporte> {
    let params = new HttpParams();
    if (filtros.fechaInicio) params = params.set('fecha_inicio', filtros.fechaInicio);
    if (filtros.fechaFin) params = params.set('fecha_fin', filtros.fechaFin);
    if (filtros.tipoReporte) params = params.set('tipoReporte', filtros.tipoReporte);

    return this.http.get<EstadisticasReporte>(`${this.API_URL}/reports/estadisticas`, { params }).pipe(
      catchError(error => {
        console.error('Error obteniendo estadísticas:', error);
        return of({}); // Devuelve objeto vacío en caso de error
      })
    );
  }

  exportarPDF(options: ExportOptions): Observable<Blob> {
    return this.http.post(`${this.API_URL}/reports/export/pdf`, { filtros: options.filtros }, { responseType: 'blob' });
  }

  exportarExcel(options: ExportOptions): Observable<Blob> {
    return this.http.post(`${this.API_URL}/reports/export/excel`, { filtros: options.filtros }, { responseType: 'blob' });
  }

  getTiposReporte(): Observable<Array<{ value: string; label: string }>> {
    return this.http.get<any[]>(`${this.API_URL}/reports/tipos`).pipe(
      catchError(error => {
        console.error('Error obteniendo tipos de reporte:', error);
        return of([]);
      })
    );
  }
}
