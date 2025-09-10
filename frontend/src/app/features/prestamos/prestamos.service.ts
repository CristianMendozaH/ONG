import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';

export interface Prestamo {
  id: string;
  equipmentId: string;
  borrowerName: string;
  loanDate: string;
  dueDate: string;
  returnDate?: string | null;
  status: 'prestado' | 'devuelto' | 'atrasado' | string;
  overdueDays?: number;
  totalFine?: number;
  createdAt?: string;
  updatedAt?: string;
  // si tu backend devuelve el equipo embebido, úsalo:
  equipment?: { id: string; code: string; name: string; type?: string };
}

export interface CrearPrestamoDTO {
  equipmentId: string;
  borrowerName: string;
  dueDate: string;   // ISO yyyy-mm-dd
}

@Injectable({ providedIn: 'root' })
export class PrestamosService {
  private base = `${environment.apiUrl}/prestamos`; // <- tus endpoints en español

  constructor(private http: HttpClient) {}

  list(params?: any): Observable<Prestamo[]> {
    return this.http.get<Prestamo[]>(this.base, { params });
  }

  create(payload: CrearPrestamoDTO): Observable<Prestamo> {
    return this.http.post<Prestamo>(this.base, payload);
  }

  returnLoan(id: string, returnDate: string): Observable<Prestamo> {
    return this.http.post<Prestamo>(`${this.base}/${id}/return`, { returnDate });
  }
}
