import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';

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
  description?: string; // <-- CAMBIO: de 'notes' a 'description'
  createdAt?: string;
  updatedAt?: string;
  equipment?: { id: string; code: string; name: string };
}

export interface CrearMantDTO {
  equipmentId: string;
  type: string;
  priority: string;
  scheduledDate: string;
  description?: string; // <-- CAMBIO: de 'notes' a 'description'
}

export type UpdateMantDTO = Partial<Mantenimiento>;

@Injectable({ providedIn: 'root' })
export class MantenimientoService {
  private base = `${environment.apiUrl}/maintenances`;

  constructor(private http: HttpClient) {}

  list(): Observable<Mantenimiento[]> {
    return this.http.get<Mantenimiento[]>(this.base);
  }

  create(payload: CrearMantDTO): Observable<Mantenimiento> {
    return this.http.post<Mantenimiento>(this.base, payload);
  }

  update(id: string, payload: UpdateMantDTO): Observable<Mantenimiento> {
    return this.http.put<Mantenimiento>(`${this.base}/${id}`, payload);
  }

  start(id: string): Observable<Mantenimiento> {
    return this.http.post<Mantenimiento>(`${this.base}/${id}/start`, {});
  }

  complete(id: string, performedDate: string, notes?: string): Observable<Mantenimiento> {
    return this.http.post<Mantenimiento>(`${this.base}/${id}/complete`, { performedDate, notes });
  }
}
