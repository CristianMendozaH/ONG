import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';

// Interfaz de Usuario Creador (lo que recibimos del backend)
export interface Creator {
  id: string;
  name: string;
}

// Interfaz de Equipo actualizada
export interface Equipo {
  id: string;
  code: string;
  name: string;
  serial?: string;
  type: string;
  status: 'disponible' | 'prestado' | 'mantenimiento' | 'dañado' | 'asignado';
  description?: string;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string; // El UUID que enviamos al crear
  creator?: Creator;  // El objeto que recibimos al leer
}

export interface EquiposQuery {
  search?: string;
  status?: string;
  type?: string;
  page?: number;
  limit?: number;
}

@Injectable({ providedIn: 'root' })
export class EquiposService {
  private base = `${environment.apiUrl}/equipments`; // Corregido a 'equipments'

  constructor(private http: HttpClient) {}

  list(query: EquiposQuery = {}): Observable<Equipo[]> {
    const params: any = {};
    if (query.search?.trim()) { params.search = query.search.trim(); }
    if (query.status) { params.status = query.status; }
    if (query.type) { params.type = query.type; }
    if (query.page) { params.page = query.page.toString(); }
    if (query.limit) { params.limit = query.limit.toString(); }
    return this.http.get<Equipo[]>(this.base, { params });
  }

  getById(id: string): Observable<Equipo> {
    return this.http.get<Equipo>(`${this.base}/${id}`);
  }

  qr(id: string): Observable<Blob> {
    return this.http.get(`${this.base}/${id}/qr`, { responseType: 'blob' });
  }

  create(payload: Partial<Equipo>): Observable<Equipo> {
    return this.http.post<Equipo>(this.base, payload);
  }

  update(id: string, payload: Partial<Equipo>): Observable<Equipo> {
    return this.http.put<Equipo>(`${this.base}/${id}`, payload);
  }

  remove(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
