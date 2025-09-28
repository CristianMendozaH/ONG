import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';
import { Equipo } from '../equipos/equipos.service';
import { User } from '../../shared/interfaces/models'; // ++ AÑADIDO: Importamos la interfaz User

export interface Prestamo {
  id: string;
  equipmentId: string;
  borrowerName: string;
  loanDate: string;
  dueDate: string;
  returnDate?: string | null;
  status: 'prestado' | 'devuelto' | 'atrasado' | string;
  observations?: string;
  overdueDays?: number;
  totalFine?: number;

  borrowerType?: 'Colaborador' | 'Estudiante' | 'Tercero';
  borrowerContact?: string;
  responsiblePartyName?: string;
  conditionOnReturn?: 'excelente' | 'bueno' | 'regular' | 'dañado';

  equipment?: Equipo;
  createdAt?: string;
  updatedAt?: string;

  // ++ AÑADIDO: Campo para recibir la información del usuario que registró el préstamo
  registrar?: User;
}

export interface CrearPrestamoDTO {
  equipmentId: string;
  borrowerName: string;
  dueDate: string;
  borrowerType: 'Colaborador' | 'Estudiante' | 'Tercero';
  borrowerContact?: string;
  responsiblePartyName?: string;

  // ++ AÑADIDO: Campo para enviar el ID del usuario que registra
  registeredById?: string;
}

export interface DevolverPrestamoDTO {
  returnDate: string;
  condition: 'excelente' | 'bueno' | 'regular' | 'dañado';
  observations?: string;
}

export interface PrestamoFilters {
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  overdue?: boolean;
}

@Injectable({ providedIn: 'root' })
export class PrestamosService {
  private base = `${environment.apiUrl}/prestamos`;

  constructor(private http: HttpClient) {}

  list(filters?: PrestamoFilters): Observable<Prestamo[]> {
    let params = new HttpParams();
    if (filters) {
      Object.keys(filters).forEach(key => {
        const value = (filters as any)[key];
        if (value) params = params.set(key, value.toString());
      });
    }
    return this.http.get<Prestamo[]>(this.base, { params });
  }

  getById(id: string): Observable<Prestamo> {
    return this.http.get<Prestamo>(`${this.base}/${id}`);
  }

  create(payload: CrearPrestamoDTO): Observable<Prestamo> {
    return this.http.post<Prestamo>(this.base, payload);
  }

  returnLoan(id: string, payload: DevolverPrestamoDTO): Observable<Prestamo> {
    return this.http.post<Prestamo>(`${this.base}/${id}/return`, payload);
  }

  extendLoan(id: string, newDueDate: string): Observable<Prestamo> {
    return this.http.patch<Prestamo>(`${this.base}/${id}`, { dueDate: newDueDate });
  }
}
