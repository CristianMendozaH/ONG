// src/app/features/reportes/reportes.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { KPIs, Activity } from '../../shared/interfaces/models';

@Injectable({
  providedIn: 'root'
})
export class ReportesService {
  private readonly API_URL = environment.apiUrl;

  constructor(private http: HttpClient) {}

  /**
   * Obtener KPIs para el dashboard
   */
  getKpis(): Observable<KPIs> {
    return this.http.get<KPIs>(`${this.API_URL}/reports/kpis`);
  }

  /**
   * Obtener actividad reciente
   */
  getActivity(): Observable<Activity> {
    return this.http.get<Activity>(`${this.API_URL}/reports/activity`);
  }
}
