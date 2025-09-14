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
  overdueDays?: number;
  totalFine?: number;
  createdAt?: string;
  updatedAt?: string;
  // Equipment data if populated by backend
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
  dueDate: string;   // ISO yyyy-mm-dd
  purpose?: string;   // Optional purpose field
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

@Injectable({ providedIn: 'root' })
export class PrestamosService {
  private base = `${environment.apiUrl}/prestamos`;

  constructor(private http: HttpClient) {}

  /**
   * Get list of loans with optional filters
   */
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

    return this.http.get<Prestamo[]>(this.base, { params }).pipe(
      map(prestamos => this.processPrestamosList(prestamos))
    );
  }

  /**
   * Get a specific loan by ID
   */
  getById(id: string): Observable<Prestamo> {
    return this.http.get<Prestamo>(`${this.base}/${id}`).pipe(
      map(prestamo => this.processPrestamo(prestamo))
    );
  }

  /**
   * Create a new loan
   */
  create(payload: CrearPrestamoDTO): Observable<Prestamo> {
    return this.http.post<Prestamo>(this.base, payload).pipe(
      map(prestamo => this.processPrestamo(prestamo))
    );
  }

  /**
   * Return a loan
   */
  returnLoan(id: string, payload: DevolverPrestamoDTO | string): Observable<Prestamo> {
    // Support both old string format and new object format
    const body = typeof payload === 'string'
      ? { returnDate: payload }
      : payload;

    return this.http.post<Prestamo>(`${this.base}/${id}/return`, body).pipe(
      map(prestamo => this.processPrestamo(prestamo))
    );
  }

  /**
   * Extend a loan due date
   */
  extendLoan(id: string, newDueDate: string): Observable<Prestamo> {
    return this.http.post<Prestamo>(`${this.base}/${id}/extend`, { dueDate: newDueDate }).pipe(
      map(prestamo => this.processPrestamo(prestamo))
    );
  }

  /**
   * Get loan statistics
   */
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

  /**
   * Get overdue loans
   */
  getOverdue(): Observable<Prestamo[]> {
    return this.http.get<Prestamo[]>(`${this.base}/overdue`).pipe(
      map(prestamos => this.processPrestamosList(prestamos))
    );
  }

  /**
   * Process multiple loans to calculate overdue days and status
   */
  private processPrestamosList(prestamos: Prestamo[]): Prestamo[] {
    return prestamos.map(prestamo => this.processPrestamo(prestamo));
  }

  /**
   * Process a single loan to calculate overdue days and update status
   */
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

    return prestamo;
  }

  /**
   * Calculate potential fine for a loan
   */
  calculateFine(prestamo: Prestamo, returnDate?: string): number {
    const actualReturnDate = returnDate ? new Date(returnDate) : new Date();
    const dueDate = new Date(prestamo.dueDate);

    if (actualReturnDate <= dueDate) {
      return 0;
    }

    const overdueDays = Math.ceil((actualReturnDate.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
    const dailyFine = 5.00; // Q5 per day

    return overdueDays * dailyFine;
  }

  /**
   * Generate loan receipt data
   */
  generateReceipt(prestamo: Prestamo): any {
    return {
      id: prestamo.id,
      date: new Date().toISOString().split('T')[0],
      equipment: prestamo.equipment?.name || 'N/A',
      equipmentCode: prestamo.equipment?.code || prestamo.equipmentId,
      borrower: prestamo.borrowerName,
      loanDate: prestamo.loanDate,
      dueDate: prestamo.dueDate,
      returnDate: prestamo.returnDate,
      status: prestamo.status,
      fine: prestamo.totalFine || 0
    };
  }

  /**
   * Validate loan creation data
   */
  validateLoanData(data: CrearPrestamoDTO): string[] {
    const errors: string[] = [];

    if (!data.equipmentId) {
      errors.push('Debe seleccionar un equipo');
    }

    if (!data.borrowerName || data.borrowerName.trim().length < 2) {
      errors.push('El nombre del solicitante debe tener al menos 2 caracteres');
    }

    if (!data.dueDate) {
      errors.push('Debe especificar una fecha de devolución');
    } else {
      const dueDate = new Date(data.dueDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (dueDate <= today) {
        errors.push('La fecha de devolución debe ser posterior a hoy');
      }

      // Check if due date is too far in the future (e.g., more than 30 days)
      const maxDate = new Date();
      maxDate.setDate(maxDate.getDate() + 30);

      if (dueDate > maxDate) {
        errors.push('La fecha de devolución no puede ser superior a 30 días');
      }
    }

    return errors;
  }

  /**
   * Format date for display
   */
  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-GT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  /**
   * Get loan duration in days
   */
  getLoanDuration(loanDate: string, dueDate: string): number {
    const start = new Date(loanDate);
    const end = new Date(dueDate);
    return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  }

  /**
   * Check if loan can be extended
   */
  canExtendLoan(prestamo: Prestamo): boolean {
    return prestamo.status === 'prestado' && !prestamo.overdueDays;
  }

  /**
   * Get default due date (7 days from today)
   */
  getDefaultDueDate(): string {
    const date = new Date();
    date.setDate(date.getDate() + 7);
    return date.toISOString().split('T')[0];
  }
}
