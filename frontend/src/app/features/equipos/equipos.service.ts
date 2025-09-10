import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';

export interface Equipo {
  id: string;
  code: string;
  name: string;
  type: string;
  status: 'available' | 'loaned' | 'maintenance';
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface EquiposQuery {
  search?: string;
  status?: string;
  type?: string;
}

@Injectable({ providedIn: 'root' })
export class EquiposService {
  private base = `${environment.apiUrl}/equipos`;

  constructor(private http: HttpClient) {}

  list(q: EquiposQuery = {}): Observable<Equipo[]> {
    const params: any = {};
    if (q.search) params.search = q.search;
    if (q.status) params.status = q.status;
    if (q.type) params.type = q.type;
    return this.http.get<Equipo[]>(this.base, { params });
  }

  qr(id: string): Observable<Blob> {
    return this.http.get(`${this.base}/${id}/qr`, { responseType: 'blob' });
  }

  remove(id: string) {
    return this.http.delete(`${this.base}/${id}`);
  }

  create(payload: Partial<Equipo>) {
    return this.http.post<Equipo>(this.base, payload);
  }

  update(id: string, payload: Partial<Equipo>) {
    return this.http.put<Equipo>(`${this.base}/${id}`, payload);
  }
}
