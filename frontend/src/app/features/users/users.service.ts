import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable, BehaviorSubject } from 'rxjs';

export interface User {
  id: string; // UUID real del backend
  displayId?: number; // ID visual para el usuario
  name: string;
  email: string;
  role: 'admin' | 'tecnico' | 'administrativo' | 'becado' | string;
  status: 'activo' | 'inactivo' | string;
  createdAt: string;
  passwordReset?: boolean;
}

export interface CreateUserRequest {
  name: string;
  email: string;
  password: string;
  role: User['role'];
  status: User['status'];
}

export interface UpdateUserRequest {
  name: string;
  email: string;
  role: User['role'];
  status: User['status'];
}

export interface ChangePasswordRequest {
  newPassword: string;
  forcePasswordChange: boolean;
  sendNotification: boolean;
  sendEmail: boolean;
  showPassword: boolean;
}

@Injectable({ providedIn: 'root' })
export class UsersService {
  private base = `${environment.apiUrl}/users`;
  private usersSubject = new BehaviorSubject<User[]>([]);
  public users$ = this.usersSubject.asObservable();

  constructor(private http: HttpClient) {}

  list(): Observable<User[]> {
    return this.http.get<User[]>(this.base);
  }

  create(user: CreateUserRequest): Observable<User> {
    return this.http.post<User>(this.base, user);
  }

  update(id: string, user: UpdateUserRequest): Observable<User> {
    return this.http.put<User>(`${this.base}/${id}`, user);
  }

  changePassword(id: string, passwordData: ChangePasswordRequest): Observable<void> {
    return this.http.post<void>(`${this.base}/${id}/change-password`, passwordData);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }

  // Método para actualizar la lista local después de operaciones
  updateUsersList(users: User[]) {
    this.usersSubject.next(users);
  }

  // Método para obtener la lista actual
  getCurrentUsers(): User[] {
    return this.usersSubject.value;
  }
}
