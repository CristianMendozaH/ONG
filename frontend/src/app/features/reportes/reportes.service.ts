import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

// Interfaces
export interface FiltrosReporte {
  fechaInicio?: string;
  fechaFin?: string;
  tipoReporte?: string;
  estado?: string;
}

// ✅ INTERFAZ MEJORADA: Se declaran todas las propiedades posibles como opcionales
export interface ReporteItem {
  id: string;
  correlativo: number;
  estado?: string;

  // Propiedades comunes y de Préstamos
  equipo?: string;
  usuario?: string;
  fechaPrestamo?: string;
  fechaDevolucion?: string;

  // Propiedades de Mantenimiento
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
  totalPrestamos: number;
  prestamosActivos: number;
  prestamosDevueltos: number;
  prestamosVencidos: number;
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
      map(response => ({
        data: response.data || [],
        total: response.total || 0,
        page: response.page || page,
        limit: limit,
      })),
      catchError(error => {
        console.error('Error obteniendo reportes:', error);
        return of({ data: [], total: 0, page: 1, limit });
      })
    );
  }

  getEstadisticasReporte(filtros: FiltrosReporte = {}): Observable<EstadisticasReporte> {
    let params = new HttpParams();
    if (filtros.fechaInicio) params = params.set('fechaInicio', filtros.fechaInicio);
    if (filtros.fechaFin) params = params.set('fechaFin', filtros.fechaFin);

    return this.http.get<EstadisticasReporte>(`${this.API_URL}/reports/estadisticas`, { params }).pipe(
      catchError(error => {
        console.error('Error obteniendo estadísticas:', error);
        return of({ totalPrestamos: 0, prestamosActivos: 0, prestamosDevueltos: 0, prestamosVencidos: 0 });
      })
    );
  }

  exportarPDF(options: ExportOptions): Observable<Blob> {
    return this.http.post(`${this.API_URL}/reports/export/pdf`, options, { responseType: 'blob' });
  }

  exportarExcel(options: ExportOptions): Observable<Blob> {
    return this.http.post(`${this.API_URL}/reports/export/excel`, options, { responseType: 'blob' });
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
