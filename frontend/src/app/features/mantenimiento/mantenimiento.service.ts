import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { DataRefreshService } from '../../services/data-refresh.service'; // Asegúrate que la ruta sea correcta

export interface AlertaPredictiva {
  tipo: 'critical' | 'warning' | 'info';
  titulo: string;
  descripcion: string;
  meta: string;
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
    private dataRefreshService: DataRefreshService // Inyectar el servicio de notificaciones
  ) {}

  list(): Observable<Mantenimiento[]> {
    return this.http.get<Mantenimiento[]>(this.base);
  }

  create(payload: CrearMantDTO): Observable<Mantenimiento> {
    return this.http.post<Mantenimiento>(this.base, payload).pipe(
      tap(() => {
        // Notificar que se ha creado un mantenimiento para refrescar las listas
        this.dataRefreshService.notify();
      })
    );
  }

  update(id: string, payload: UpdateMantDTO): Observable<Mantenimiento> {
    return this.http.put<Mantenimiento>(`${this.base}/${id}`, payload).pipe(
      tap(() => {
        // Notificar después de actualizar por si cambia el estado
        this.dataRefreshService.notify();
      })
    );
  }

  start(id: string): Observable<Mantenimiento> {
    return this.http.post<Mantenimiento>(`${this.base}/${id}/start`, {}).pipe(
      tap(() => {
        // Notificar que un mantenimiento ha iniciado
        this.dataRefreshService.notify();
      })
    );
  }

  complete(id: string, performedDate: string, notes?: string): Observable<Mantenimiento> {
    return this.http.post<Mantenimiento>(`${this.base}/${id}/complete`, { performedDate, notes }).pipe(
      tap(() => {
        // Notificar que un mantenimiento se ha completado
        console.log('Mantenimiento completado, enviando notificación de refresco...');
        this.dataRefreshService.notify();
      })
    );
  }
}
