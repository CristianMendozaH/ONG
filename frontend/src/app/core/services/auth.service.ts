// src/app/core/services/auth.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { TokenService } from './token.service';
import { User, LoginDto, AuthResponse } from '../../shared/interfaces/models';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly API_URL = environment.apiUrl;
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);

  // Observables públicos
  currentUser$ = this.currentUserSubject.asObservable();
  isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

  constructor(
    private http: HttpClient,
    private tokenService: TokenService,
    private router: Router
  ) {
    // Verificar si hay token válido al inicializar
    this.checkAuthStatus();
  }

  /**
   * Iniciar sesión
   */
  login(credentials: LoginDto): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.API_URL}/auth/login`, credentials)
      .pipe(
        tap(response => {
          if (response.token && response.user) {
            this.tokenService.setToken(response.token);
            this.currentUserSubject.next(response.user);
            this.isAuthenticatedSubject.next(true);
          }
        }),
        catchError(this.handleError)
      );
  }

  /**
   * Obtener información del usuario actual
   */
  me(): Observable<User> {
    return this.http.get<User>(`${this.API_URL}/auth/me`)
      .pipe(
        tap(user => {
          this.currentUserSubject.next(user);
          this.isAuthenticatedSubject.next(true);
        }),
        catchError(this.handleError)
      );
  }

  /**
   * Cerrar sesión
   */
  logout(): void {
    this.tokenService.removeToken();
    this.currentUserSubject.next(null);
    this.isAuthenticatedSubject.next(false);
    this.router.navigate(['/login']);
  }

  /**
   * Verificar estado de autenticación
   */
  private checkAuthStatus(): void {
    if (this.tokenService.isTokenValid()) {
      // Si hay token válido, obtener información del usuario
      this.me().subscribe({
        next: () => {
          // Usuario cargado correctamente
        },
        error: () => {
          // Token inválido o expirado
          this.logout();
        }
      });
    } else {
      this.isAuthenticatedSubject.next(false);
    }
  }

  /**
   * Obtener usuario actual (valor sincrónico)
   */
  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  /**
   * Verificar si el usuario está autenticado (valor sincrónico)
   */
  isAuthenticated(): boolean {
    return this.isAuthenticatedSubject.value && this.tokenService.isTokenValid();
  }

  /**
   * Verificar si el usuario tiene un rol específico
   */
  hasRole(role: string): boolean {
    const user = this.getCurrentUser();
    return user?.role === role;
  }

  /**
   * Verificar si el usuario es admin
   */
  isAdmin(): boolean {
    return this.hasRole('admin');
  }

  /**
   * Verificar si el usuario es técnico
   */
  isTech(): boolean {
    return this.hasRole('tech');
  }

  /**
   * Manejo de errores HTTP
   */
  private handleError(error: any): Observable<never> {
    let errorMessage = 'Ha ocurrido un error';

    if (error.error?.message) {
      errorMessage = error.error.message;
    } else if (error.message) {
      errorMessage = error.message;
    }

    // Si es error 401, limpiar sesión
    if (error.status === 401) {
      this.logout();
    }

    return throwError(() => new Error(errorMessage));
  }
}
