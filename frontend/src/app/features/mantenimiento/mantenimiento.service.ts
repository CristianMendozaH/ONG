import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';

export interface Mantenimiento {
  id: string;
  equipmentId: string;
  type: 'preventivo' | 'correctivo' | 'predictivo' | string;
  scheduledDate: string;
  performedDate?: string | null;
  status: 'programado' | 'en-proceso' | 'completado' | string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
  equipment?: { id: string; code: string; name: string };
}

export interface CrearMantDTO {
  equipmentId: string;
  type: string;
  scheduledDate: string; // yyyy-mm-dd
  notes?: string;
}

@Injectable({ providedIn: 'root' })
export class MantenimientoService {
  private base = `${environment.apiUrl}/maintenances`; // ajusta a tu backend si usara /maintenances

  constructor(private http: HttpClient) {}

  list(): Observable<Mantenimiento[]> {
    return this.http.get<Mantenimiento[]>(this.base);
  }

  create(payload: CrearMantDTO): Observable<Mantenimiento> {
    return this.http.post<Mantenimiento>(this.base, payload);
  }

  complete(id: string, performedDate: string) {
    return this.http.post<Mantenimiento>(`${this.base}/${id}/complete`, { performedDate });
  }
}
