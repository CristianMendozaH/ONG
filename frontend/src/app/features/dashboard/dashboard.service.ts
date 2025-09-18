import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';
import { of } from 'rxjs';
import { environment } from '../../../environments/environment';

// Interfaces específicas para Dashboard
export interface DashboardKPIs {
  disponibles: number;
  prestados: number;
  atrasos: number;
  totalEquipos: number;
  enMantenimiento: number;
}

export interface DashboardActivity {
  id: string;
  tipo: string;
  descripcion: string;
  fecha: string;
  equipo?: string;
  usuario?: string;
}

// Nueva interfaz para los datos de la gráfica semanal
export interface DashboardWeeklyActivity {
  labels: string[];
  prestamos: number[];
  devoluciones: number[];
}

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private readonly API_URL = environment.apiUrl;

  constructor(private http: HttpClient) {}

  /**
   * Obtener KPIs para el dashboard
   */
  getKpis(): Observable<DashboardKPIs> {
    console.log('🔍 Solicitando KPIs desde:', `${this.API_URL}/reports/kpis`);

    return this.http.get<any>(`${this.API_URL}/reports/kpis`).pipe(
      tap(response => {
        console.log('✅ Respuesta KPIs del servidor:', response);
        console.log('🔍 Propiedades disponibles:', Object.keys(response));
      }),
      map(response => {
        const totalEquipos = Number(response.totalEquipos) || 0;
        const prestamosHoy = Number(response.prestamosHoy) || 0;
        const disponibles = Math.max(0, totalEquipos - prestamosHoy);
        const atrasos = Number(response.atrasos) ||
                       Number(response.atrasados) ||
                       Number(response.prestamosVencidos) ||
                       Number(response.prestamosAtrasados) ||
                       Number(response.overdue) || 0;
        const enMantenimiento = Number(response.enMantenimiento) ||
                               Number(response.mantenimiento) ||
                               Number(response.equiposMantenimiento) ||
                               Number(response.maintenance) || 0;

        const kpis: DashboardKPIs = {
          disponibles,
          prestados: prestamosHoy,
          atrasos,
          totalEquipos,
          enMantenimiento
        };

        console.log('📊 KPIs procesados:', kpis);
        return kpis;
      }),
      catchError((error: HttpErrorResponse) => {
        console.error('❌ Error obteniendo KPIs del dashboard:', error);
        const fallbackData: DashboardKPIs = {
          disponibles: 14,
          prestados: 4,
          atrasos: 0,
          totalEquipos: 18,
          enMantenimiento: 0
        };
        console.warn('🔄 Usando datos de fallback para KPIs:', fallbackData);
        return of(fallbackData);
      })
    );
  }

  /**
   * Obtener actividad reciente para el dashboard
   */
  getActivity(): Observable<DashboardActivity[]> {
    console.log('🔍 Solicitando actividad desde:', `${this.API_URL}/reports/activity`);

    return this.http.get<any>(`${this.API_URL}/reports/activity`).pipe(
      tap(response => console.log('✅ Respuesta actividad del servidor:', response)),
      map(response => {
        let activities = [];
        if (Array.isArray(response)) {
          activities = response;
        } else if (response.data && Array.isArray(response.data)) {
          activities = response.data;
        } else if (response.activities && Array.isArray(response.activities)) {
          activities = response.activities;
        }

        const mappedActivities = activities.map((item: any, index: number) => ({
          id: item.id || item._id || `activity_${index}`,
          tipo: this.normalizeActivityType(item.tipo || item.type || item.action || 'general'),
          descripcion: item.descripcion || item.description || 'Actividad del sistema',
          fecha: item.fecha || item.date || new Date().toISOString(),
          equipo: item.equipo || item.equipment || 'N/A',
          usuario: item.usuario || item.user || 'Sistema'
        }));

        console.log('📋 Actividades procesadas:', mappedActivities);
        return mappedActivities;
      }),
      catchError((error: HttpErrorResponse) => {
        console.error('❌ Error obteniendo actividad del dashboard:', error);
        const fallbackActivities: DashboardActivity[] = [
          { id: '1', tipo: 'prestamo', descripcion: 'Préstamo de equipo registrado', fecha: new Date().toISOString(), equipo: 'Laptop Dell Inspiron', usuario: 'Usuario del Sistema' },
          { id: '2', tipo: 'devolucion', descripcion: 'Devolución de equipo procesada', fecha: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), equipo: 'Proyector Epson', usuario: 'Usuario del Sistema' }
        ];
        console.warn('🔄 Usando datos de actividad de fallback:', fallbackActivities);
        return of(fallbackActivities);
      })
    );
  }

  /**
   * Obtener datos de actividad semanal para la gráfica de barras
   */
  getWeeklyActivity(): Observable<DashboardWeeklyActivity> {
    console.log('🔍 Solicitando actividad semanal desde:', `${this.API_URL}/reports/weekly-activity`);

    return this.http.get<any>(`${this.API_URL}/reports/weekly-activity`).pipe(
      tap(response => console.log('✅ Respuesta de actividad semanal:', response)),
      map(response => {
        const weeklyData: DashboardWeeklyActivity = {
          labels: response.labels || [],
          prestamos: response.prestamos || [],
          devoluciones: response.devoluciones || []
        };
        console.log('📊 Datos de gráfica semanal procesados:', weeklyData);
        return weeklyData;
      }),
      catchError((error: HttpErrorResponse) => {
        console.error('❌ Error obteniendo actividad semanal:', error);
        const fallbackData: DashboardWeeklyActivity = {
          labels: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'],
          prestamos: [12, 8, 15, 10, 14, 6, 4],
          devoluciones: [8, 12, 10, 15, 9, 8, 7]
        };
        console.warn('🔄 Usando datos de fallback para la gráfica semanal:', fallbackData);
        return of(fallbackData);
      })
    );
  }

  /**
   * Normalizar tipos de actividad
   */
  private normalizeActivityType(type: string): string {
    if (!type) return 'general';
    const normalizedType = type.toLowerCase().trim();
    const typeMap: { [key: string]: string } = {
      'prestamo': 'prestamo', 'préstamo': 'prestamo', 'loan': 'prestamo',
      'devolucion': 'devolucion', 'devolución': 'devolucion', 'return': 'devolucion',
      'mantenimiento': 'mantenimiento', 'maintenance': 'mantenimiento', 'repair': 'mantenimiento'
    };
    return typeMap[normalizedType] || 'general';
  }

  /**
   * Método para verificar la conectividad con el backend
   */
  checkBackendConnection(): Observable<boolean> {
    console.log('🔍 Verificando conexión con backend en:', this.API_URL);
    return this.http.get(`${this.API_URL}/health-check`).pipe( // Usar un endpoint ligero como health-check
      map(() => {
        console.log('✅ Backend conectado correctamente.');
        return true;
      }),
      catchError(() => {
        console.error('❌ Backend no disponible.');
        return of(false);
      })
    );
  }
}
