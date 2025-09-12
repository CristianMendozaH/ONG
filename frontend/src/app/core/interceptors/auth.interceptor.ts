// src/app/core/interceptors/auth.interceptor.ts
import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { TokenService } from '../services/token.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const tokenService = inject(TokenService);
  const router = inject(Router);

  // Obtener el token
  const token = tokenService.getToken();

  // Clonar la request y agregar el header de autorización si existe token
  let authReq = req;
  if (token && tokenService.isTokenValid()) {
    authReq = req.clone({
      headers: req.headers.set('Authorization', `Bearer ${token}`)
    });
  }

  // Procesar la request y manejar errores
  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      // Si es error 401 (Unauthorized), limpiar token y redirigir a login
      if (error.status === 401) {
        tokenService.removeToken();
        router.navigate(['/login']);
      }

      return throwError(() => error);
    })
  );
};
