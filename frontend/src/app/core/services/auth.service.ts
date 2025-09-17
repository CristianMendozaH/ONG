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

  private me(): Observable<User | null> {
    return this.http.get<User>(`${environment.apiUrl}/auth/me`).pipe(
      tap(user => this.userStore.setUser(user)),
      catchError(() => {
        this.logout();
        return of(null);
      })
    );
  }

  private checkAuthStatusOnLoad(): void {
    if (this.tokenService.isTokenValid()) {
      this.me().subscribe();
    } else {
      this.userStore.clearUser();
    }
  }
}
