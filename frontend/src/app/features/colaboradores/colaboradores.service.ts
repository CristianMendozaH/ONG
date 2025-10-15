import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';

// Interfaz para el objeto Creator que viene anidado desde el backend
export interface Creator {
  name: string;
}

// Interfaz que define la estructura completa de un Colaborador, incluyendo el creador
export interface Colaborador {
  id: string;
  fullName: string;
  position?: string;
  program?: string;
  type: 'Colaborador' | 'Becado';
  isActive: boolean;
  contact?: string;
  createdAt?: string;
  updatedAt?: string;
  creator?: Creator; // Objeto anidado para mostrar "Registrado Por"
}

// Interfaz para los parámetros de búsqueda que se pueden enviar a la API
export interface CollaboratorsQuery {
  search?: string;
  type?: string;
  includeInactive?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ColaboradoresService {
  private base = `${environment.apiUrl}/collaborators`;

  constructor(private http: HttpClient) {}

  /**
   * Obtiene la lista de colaboradores, opcionalmente filtrada.
   * @param query Objeto con los filtros de búsqueda.
   * @returns Un Observable con un arreglo de Colaboradores.
   */
  listAll(query: CollaboratorsQuery = {}): Observable<Colaborador[]> {
    // Construye los parámetros de la petición HTTP dinámicamente
    const params: any = {};
    if (query.search?.trim()) {
      params.search = query.search.trim();
    }
    if (query.type) {
      params.type = query.type;
    }
    if (query.includeInactive) {
      params.includeInactive = 'true';
    }

    // Realiza la petición GET con los parámetros construidos
    return this.http.get<Colaborador[]>(this.base, { params });
  }

  /**
   * Crea un nuevo colaborador en la base de datos.
   * @param payload Un objeto con los datos del nuevo colaborador.
   * @returns Un Observable con el colaborador recién creado.
   */
  create(payload: Partial<Colaborador>): Observable<Colaborador> {
    return this.http.post<Colaborador>(this.base, payload);
  }

  /**
   * Actualiza un colaborador existente.
   * Se usa tanto para cambiar datos como para activar/desactivar.
   * @param id El UUID del colaborador a actualizar.
   * @param payload Un objeto con los campos a modificar.
   * @returns Un Observable con el colaborador actualizado.
   */
  update(id: string, payload: Partial<Colaborador>): Observable<Colaborador> {
    return this.http.patch<Colaborador>(`${this.base}/${id}`, payload);
  }
}

