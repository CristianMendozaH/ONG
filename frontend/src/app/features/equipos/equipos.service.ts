import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';

// Usar la interfaz Equipment de models.ts
export interface Equipo {
  id: string;
  code: string;
  name: string;
  serial?: string; // ++ AÑADIDO: Campo opcional para el número de serie.
  type: string;
  status: 'disponible' | 'prestado' | 'mantenimiento' | 'dañado' | 'asignado';
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface EquiposQuery {
  search?: string;
  status?: string;
  type?: string;
  page?: number;
  limit?: number;
}

export interface EquiposResponse {
  data: Equipo[];
  total: number;
  page: number;
  limit: number;
}

@Injectable({ providedIn: 'root' })
export class EquiposService {
  private base = `${environment.apiUrl}/equipos`;

  constructor(private http: HttpClient) {}

  // Listar equipos con filtros
  list(query: EquiposQuery = {}): Observable<Equipo[]> {
    const params: any = {};

    if (query.search?.trim()) {
      params.search = query.search.trim();
    }
    if (query.status) {
      params.status = query.status;
    }
    if (query.type) {
      params.type = query.type;
    }
    if (query.page) {
      params.page = query.page.toString();
    }
    if (query.limit) {
      params.limit = query.limit.toString();
    }

    return this.http.get<Equipo[]>(this.base, { params });
  }

  // Listar con paginación
  listPaginated(query: EquiposQuery = {}): Observable<EquiposResponse> {
    const params: any = {};

    if (query.search?.trim()) {
      params.search = query.search.trim();
    }
    if (query.status) {
      params.status = query.status;
    }
    if (query.type) {
      params.type = query.type;
    }
    if (query.page) {
      params.page = query.page.toString();
    }
    if (query.limit) {
      params.limit = query.limit.toString();
    }

    return this.http.get<EquiposResponse>(`${this.base}/paginated`, { params });
  }

  // Obtener equipo por ID
  getById(id: string): Observable<Equipo> {
    return this.http.get<Equipo>(`${this.base}/${id}`);
  }

  // Generar código QR
  qr(id: string): Observable<Blob> {
    return this.http.get(`${this.base}/${id}/qr`, {
      responseType: 'blob',
      headers: {
        'Accept': 'image/png'
      }
    });
  }

  // Crear equipo
  create(payload: Partial<Equipo>): Observable<Equipo> {
    return this.http.post<Equipo>(this.base, payload);
  }

  // Actualizar equipo
  update(id: string, payload: Partial<Equipo>): Observable<Equipo> {
    return this.http.put<Equipo>(`${this.base}/${id}`, payload);
  }

  // Eliminar equipo
  remove(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }

  // Cambiar estado del equipo
  changeStatus(id: string, status: Equipo['status']): Observable<Equipo> {
    return this.http.patch<Equipo>(`${this.base}/${id}/status`, { status });
  }

  // Obtener tipos de equipos disponibles
  getTypes(): Observable<string[]> {
    return this.http.get<string[]>(`${this.base}/types`);
  }

  // Obtener estadísticas de equipos
  getStats(): Observable<{
    total: number;
    disponible: number;
    prestado: number;
    mantenimiento: number;
    dañado: number;
  }> {
    return this.http.get<any>(`${this.base}/stats`);
  }
}
