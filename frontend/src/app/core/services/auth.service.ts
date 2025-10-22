// src/app/core/services/auth.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, of } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { TokenService } from './token.service';
import { UserStore } from '../stores/user.store';

// --- IMPORTANTE: Se añaden las interfaces/DTOs para los nuevos métodos ---
import { LoginDto, AuthResponse, User, RegisterDto, ResetPasswordDto } from '../../shared/interfaces/models';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private tokenService = inject(TokenService);
  private userStore = inject(UserStore);
  private router = inject(Router);

  constructor() {
    this.checkAuthStatusOnLoad();
  }

  // --- Tu método de login (sin cambios) ---
  login(credentials: LoginDto): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${environment.apiUrl}/auth/login`, credentials).pipe(
      tap(response => {
        if (response.token && response.user) {
          this.tokenService.setToken(response.token);
          this.userStore.setUser(response.user);
        }
      })
    );
  }

  // --- MÉTODO NUEVO AÑADIDO ---
  /**
   * Envía los datos de un nuevo usuario al backend para su registro.
   * No inicia sesión, solo crea el usuario.
   * @param data - Los datos del usuario a registrar (nombre, email, contraseña).
   */
  register(data: RegisterDto): Observable<any> {
    // Apunta al endpoint que DEBERÁS crear en tu backend
    return this.http.post<any>(`${environment.apiUrl}/auth/register`, data);
  }

  // --- MÉTODO NUEVO AÑADIDO ---
  /**
   * Envía un correo y una nueva contraseña al backend para restablecerla.
   * @param data - El correo del usuario y la nueva contraseña.
   */
  resetPassword(data: ResetPasswordDto): Observable<any> {
    // Apunta al endpoint que DEBERÁS crear en tu backend
    return this.http.post<any>(`${environment.apiUrl}/auth/reset-password`, data);
  }


  logout(): void {
    this.tokenService.removeToken();
    this.userStore.clearUser();
    this.router.navigate(['/login']);
  }

  /**
   * Obtiene los datos del usuario actual desde el backend usando el token guardado.
   */
  fetchAndSetUser(): Observable<User | null> {
    return this.http.get<User>(`${environment.apiUrl}/auth/me`).pipe(
      tap(user => {
        this.userStore.setUser(user);
      }),
      catchError(() => {
        this.logout();
        return of(null);
      })
    );
  }

  /**
   * Se ejecuta solo una vez cuando el servicio es instanciado.
   */
  private checkAuthStatusOnLoad(): void {
    if (this.tokenService.isTokenValid()) {
      this.fetchAndSetUser().subscribe();
    } else {
      this.userStore.clearUser();
    }
  }
}
