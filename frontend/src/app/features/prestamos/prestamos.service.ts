import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

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
  createdAt?: string;
  updatedAt?: string;
  equipment?: {
    id: string;
    code: string;
    name: string;
    type?: string;
    status?: string;
  };
}

export interface CrearPrestamoDTO {
  equipmentId: string;
  borrowerName: string;
  dueDate: string;
  purpose?: string;
}

export interface DevolverPrestamoDTO {
  returnDate: string;
  condition?: string;
  observations?: string;
  damageFee?: number;
}

export interface PrestamoFilters {
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  borrowerName?: string;
  equipmentId?: string;
  overdue?: boolean;
}

export interface PrestamoStats {
  total: number;
  active: number;
  returned: number;
  overdue: number;
  totalFines: number;
}

export interface LoansSummary {
  [key: string]: number;
  total: number;
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
        if (value !== undefined && value !== null && value !== '') {
          params = params.set(key, value.toString());
        }
      });
    }
    params = params.set('populate', 'equipment');
    return this.http.get<Prestamo[]>(this.base, { params }).pipe(
      map(prestamos => this.processPrestamosList(prestamos))
    );
  }

  getById(id: string): Observable<Prestamo> {
    let params = new HttpParams().set('populate', 'equipment');
    return this.http.get<Prestamo>(`${this.base}/${id}`, { params }).pipe(
      map(prestamo => this.processPrestamo(prestamo))
    );
  }

  create(payload: CrearPrestamoDTO): Observable<Prestamo> {
    return this.http.post<Prestamo>(this.base, payload).pipe(
      map(prestamo => this.processPrestamo(prestamo))
    );
  }

  returnLoan(id: string, payload: DevolverPrestamoDTO | string): Observable<Prestamo> {
    const body = typeof payload === 'string'
      ? { returnDate: payload }
      : payload;
    return this.http.post<Prestamo>(`${this.base}/${id}/return`, body).pipe(
      map(prestamo => this.processPrestamo(prestamo))
    );
  }

  /**
   * Extender la fecha de devolución de un préstamo
   */
  // --- CORRECCIÓN APLICADA ---
  // Se cambia de POST a PATCH y se ajusta la URL para apuntar al préstamo específico.
  // Esto ahora coincide con la nueva ruta que agregamos en el backend.
  extendLoan(id: string, newDueDate: string): Observable<Prestamo> {
    return this.http.patch<Prestamo>(`${this.base}/${id}`, { dueDate: newDueDate }).pipe(
      map(prestamo => this.processPrestamo(prestamo))
    );
  }

  getStats(filters?: PrestamoFilters): Observable<PrestamoStats> {
    let params = new HttpParams();
    if (filters) {
      Object.keys(filters).forEach(key => {
        const value = (filters as any)[key];
        if (value !== undefined && value !== null && value !== '') {
          params = params.set(key, value.toString());
        }
      });
    }
    return this.http.get<PrestamoStats>(`${this.base}/stats`, { params });
  }

  getOverdue(): Observable<Prestamo[]> {
    let params = new HttpParams().set('populate', 'equipment');
    return this.http.get<Prestamo[]>(`${this.base}/overdue`, { params }).pipe(
      map(prestamos => this.processPrestamosList(prestamos))
    );
  }

  private processPrestamosList(prestamos: Prestamo[]): Prestamo[] {
    return prestamos.map(prestamo => this.processPrestamo(prestamo));
  }

  private processPrestamo(prestamo: Prestamo): Prestamo {
    const today = new Date();
    const dueDate = new Date(prestamo.dueDate);
    const isOverdue = today > dueDate && prestamo.status !== 'devuelto';

    if (isOverdue) {
      prestamo.overdueDays = Math.ceil((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
      if (prestamo.status === 'prestado') {
        prestamo.status = 'atrasado';
      }
    }

    if (!prestamo.equipment && prestamo.equipmentId) {
      prestamo.equipment = {
        id: prestamo.equipmentId,
        code: `EQ-${prestamo.equipmentId.slice(-4)}`,
        name: 'Equipo (cargando...)',
        status: 'unknown'
      };
    }
    return prestamo;
  }
}
