// src/app/core/services/auth.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, of } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { TokenService } from './token.service';
import { UserStore } from '../stores/user.store';
import { LoginDto, AuthResponse, User } from '../../shared/interfaces/models';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private tokenService = inject(TokenService);
  private userStore = inject(UserStore);
  private router = inject(Router);

  constructor() {
    // Tu método para verificar al cargar la app ya es correcto.
    // Llama a 'me()' si hay un token válido.
    this.checkAuthStatusOnLoad();
  }

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

  logout(): void {
    this.tokenService.removeToken();
    this.userStore.clearUser();
    this.router.navigate(['/login']);
  }

  /**
   * MÉTODO CLAVE (AHORA PÚBLICO)
   * Obtiene los datos del usuario actual desde el backend usando el token guardado.
   * Si tiene éxito, actualiza el store. Si falla (ej. token expirado), limpia la sesión.
   */
  fetchAndSetUser(): Observable<User | null> {
    return this.http.get<User>(`${environment.apiUrl}/auth/me`).pipe(
      tap(user => {
        // Si el backend devuelve un usuario, lo guardamos en el store.
        this.userStore.setUser(user);
      }),
      catchError(() => {
        // Si hay un error (ej. 401 Unauthorized), significa que el token no es válido.
        // Limpiamos la sesión y devolvemos null.
        this.logout();
        return of(null);
      })
    );
  }

  /**
   * Este método se ejecuta solo una vez cuando el servicio es instanciado.
   */
  private checkAuthStatusOnLoad(): void {
    if (this.tokenService.isTokenValid()) {
      // Intentamos obtener los datos del usuario al cargar la app.
      // No necesitamos hacer nada con la suscripción aquí, el guardián se encargará
      // del resto si el usuario intenta navegar a una ruta protegida.
      this.fetchAndSetUser().subscribe();
    } else {
      // Si el token no es válido o no existe, nos aseguramos de que el store esté limpio.
      this.userStore.clearUser();
    }
  }
}
