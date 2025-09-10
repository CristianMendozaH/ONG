import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { tap } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly key = 'jwt';
  constructor(private http: HttpClient) {}

  login(email: string, password: string) {
    return this.http.post<{ token: string; user: any }>(
      `${environment.apiUrl}/auth/login`,
      { email, password }
    ).pipe(tap(res => localStorage.setItem(this.key, res.token)));
  }

  token() { return localStorage.getItem(this.key); }
  logout() { localStorage.removeItem(this.key); }
  isLogged() { return !!this.token(); }
}
