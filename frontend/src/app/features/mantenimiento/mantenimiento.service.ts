import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { DataRefreshService } from '../../services/data-refresh.service';

export interface AlertaPredictiva {
  tipo: 'critical' | 'warning' | 'info';
  titulo: string;
  descripcion: string;
  meta: string;
}

// Interfaz para el nuevo DTO de Mantenimiento Predictivo
export interface PredictiveMaintenance {
  id: string;
  name: string;
  lastMaintenance: string | null;
  daysSince: number;
  status: string;
}

export interface Mantenimiento {
  id: string;
  displayId?: string;
  equipmentId: string;
  type: 'preventivo' | 'correctivo' | 'predictivo' | string;
  priority: 'alta' | 'media' | 'baja' | string;
  scheduledDate: string;
  performedDate?: string | null;
  status: 'programado' | 'en-proceso' | 'completado' | string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
  equipment?: { id: string; code: string; name: string };
}

export interface CrearMantDTO {
  equipmentId: string;
  type: string;
  priority: string;
  scheduledDate: string;
  description?: string;
}

export type UpdateMantDTO = Partial<Mantenimiento>;

@Injectable({ providedIn: 'root' })
export class MantenimientoService {
  private base = `${environment.apiUrl}/maintenances`;

  constructor(
    private http: HttpClient,
    private dataRefreshService: DataRefreshService
  ) {}

  list(filters: { status?: string; type?: string } = {}): Observable<Mantenimiento[]> {
    let params = new HttpParams();
    if (filters.status) {
      params = params.set('status', filters.status);
    }
    if (filters.type) {
      params = params.set('type', filters.type);
    }

    return this.http.get<Mantenimiento[]>(this.base, { params });
  }

  // --- NUEVA FUNCIÓN AÑADIDA ---
  /**
   * Obtiene la lista de equipos con su estado de mantenimiento predictivo.
   * @returns Un Observable con un arreglo de objetos PredictiveMaintenance.
   */
  getPredictiveMaintenance(): Observable<PredictiveMaintenance[]> {
    return this.http.get<PredictiveMaintenance[]>(`${this.base}/predictive`);
  }

  create(payload: CrearMantDTO): Observable<Mantenimiento> {
    return this.http.post<Mantenimiento>(this.base, payload).pipe(
      tap(() => {
        this.dataRefreshService.notify();
      })
    );
  }

  update(id: string, payload: UpdateMantDTO): Observable<Mantenimiento> {
    return this.http.put<Mantenimiento>(`${this.base}/${id}`, payload).pipe(
      tap(() => {
        this.dataRefreshService.notify();
      })
    );
  }

  start(id: string): Observable<Mantenimiento> {
    return this.http.post<Mantenimiento>(`${this.base}/${id}/start`, {}).pipe(
      tap(() => {
        this.dataRefreshService.notify();
      })
    );
  }

  complete(id: string, performedDate: string, notes?: string): Observable<Mantenimiento> {
    return this.http.post<Mantenimiento>(`${this.base}/${id}/complete`, { performedDate, notes }).pipe(
      tap(() => {
        console.log('Mantenimiento completado, enviando notificación de refresco...');
        this.dataRefreshService.notify();
      })
    );
  }
}
