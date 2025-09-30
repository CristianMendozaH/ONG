// Archivo completo: src/app/features/asignaciones/asignaciones.service.ts

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';
import { Equipo } from '../equipos/equipos.service';

export interface Colaborador {
  id: string;
  fullName: string;
  position: string;
  program: string;
  type: 'Colaborador' | 'Becado';
}

export interface Asignacion {
  id: string;
  equipmentId: string;
  collaboratorId: string;
  assignmentDate: string;
  releaseDate?: string | null;
  status: 'assigned' | 'released' | 'donated';
  observations?: string;
  equipment?: Equipo;
  collaborator?: Colaborador;
  accessories?: string[]; // <-- AÑADIR ESTA LÍNEA
}

export interface CrearAsignacionDTO {
  equipmentId: string;
  collaboratorId: string;
  assignmentDate: string;
  observations?: string;
  accessories?: string[]; // <-- AÑADIR ESTA LÍNEA
}

export interface LiberarAsignacionDTO {
  releaseDate: string;
  condition: 'excelente' | 'bueno' | 'regular' | 'dañado';
  observations?: string;
}

@Injectable({ providedIn: 'root' })
export class AsignacionesService {
  private base = `${environment.apiUrl}/assignments`;
  private colaboradoresApi = `${environment.apiUrl}/collaborators`;

  constructor(private http: HttpClient) {}

  getColaboradores(): Observable<Colaborador[]> {
    return this.http.get<Colaborador[]>(this.colaboradoresApi);
  }

  list(): Observable<Asignacion[]> {
    return this.http.get<Asignacion[]>(this.base);
  }

  create(payload: CrearAsignacionDTO): Observable<Asignacion> {
    return this.http.post<Asignacion>(this.base, payload);
  }

  update(id: string, payload: Partial<CrearAsignacionDTO>): Observable<Asignacion> {
    return this.http.patch<Asignacion>(`${this.base}/${id}`, payload);
  }

  liberarAsignacion(id: string, payload: LiberarAsignacionDTO): Observable<Asignacion> {
    return this.http.post<Asignacion>(`${this.base}/${id}/release`, payload);
  }

  donarAsignacion(id: string): Observable<Asignacion> {
    return this.http.post<Asignacion>(`${this.base}/${id}/donate`, {});
  }
}
