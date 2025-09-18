// dashboard.service.ts

import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

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
   * Obtiene los KPIs desde el endpoint unificado del backend.
   */
  getKpis(): Observable<DashboardKPIs> {
    console.log('🔍 Solicitando KPIs desde:', `${this.API_URL}/reports/kpis`);

    return this.http.get<any>(`${this.API_URL}/reports/kpis`).pipe(
      tap(response => console.log('✅ Respuesta KPIs del servidor:', response)),
      map(response => {
        // --- LÓGICA SIMPLIFICADA ---
        // El backend ahora envía los datos con los nombres correctos.
        // El mapeo es directo y más limpio.
        const kpis: DashboardKPIs = {
          disponibles: Number(response.disponibles) || 0,
          prestados: Number(response.prestados) || 0,
          atrasos: Number(response.atrasos) || 0,
          enMantenimiento: Number(response.enMantenimiento) || 0,
          totalEquipos: Number(response.totalEquipos) || 0
        };

        console.log('📊 KPIs procesados (versión final):', kpis);
        return kpis;
      }),
      catchError((error: HttpErrorResponse) => {
        console.error('❌ Error obteniendo KPIs del dashboard:', error);
        // Los datos de fallback se mantienen en caso de que la API falle.
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
   * Obtiene la actividad reciente (sin cambios).
   */
  getActivity(): Observable<DashboardActivity[]> {
    console.log('🔍 Solicitando actividad desde:', `${this.API_URL}/reports/activity`);

    return this.http.get<any[]>(`${this.API_URL}/reports/activity`).pipe(
      tap(response => console.log('✅ Respuesta actividad del servidor:', response)),
      map(response => {
        const activities = Array.isArray(response) ? response : [];
        const mappedActivities = activities.map((item: any, index: number) => ({
          id: item.id || `activity_${index}`,
          tipo: this.normalizeActivityType(item.tipo),
          descripcion: item.descripcion || 'Actividad del sistema',
          fecha: item.fecha || new Date().toISOString()
        }));

        console.log('📋 Actividades procesadas:', mappedActivities);
        return mappedActivities;
      }),
      catchError((error: HttpErrorResponse) => {
        console.error('❌ Error obteniendo actividad del dashboard:', error);
        const fallbackActivities: DashboardActivity[] = [
          { id: '1', tipo: 'prestamo', descripcion: 'Préstamo de equipo registrado', fecha: new Date().toISOString() },
          { id: '2', tipo: 'devolucion', descripcion: 'Devolución de equipo procesada', fecha: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() }
        ];
        console.warn('🔄 Usando datos de actividad de fallback:', fallbackActivities);
        return of(fallbackActivities);
      })
    );
  }

  /**
   * Obtiene los datos para la gráfica semanal (sin cambios).
   */
  getWeeklyActivity(): Observable<DashboardWeeklyActivity> {
    console.log('🔍 Solicitando actividad semanal desde:', `${this.API_URL}/reports/weekly-activity`);

    return this.http.get<DashboardWeeklyActivity>(`${this.API_URL}/reports/weekly-activity`).pipe(
      tap(response => console.log('✅ Respuesta de actividad semanal:', response)),
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

  private normalizeActivityType(type: string): string {
    if (!type) return 'general';
    const normalizedType = type.toLowerCase().trim();
    const typeMap: { [key: string]: string } = {
      'prestamo': 'prestamo',
      'devolucion': 'devolucion',
      'mantenimiento': 'mantenimiento'
    };
    return typeMap[normalizedType] || 'general';
  }

  /**
   * Verifica si el backend está disponible.
   * Nota: Esta ruta /health-check podría no existir en tu archivo de rutas,
   * puedes eliminarla si no la necesitas.
   */
  checkBackendConnection(): Observable<boolean> {
    console.log('🔍 Verificando conexión con backend en:', this.API_URL);
    return this.http.get(`${this.API_URL}/health-check`).pipe(
      map(() => {
        console.log('✅ Backend conectado correctamente.');
        return true;
      }),
      catchError(() => {
        console.warn('⚠️ No se pudo conectar al endpoint /health-check del backend.');
        return of(false);
      })
    );
  }
}
