import { HttpEvent, HttpHandlerFn, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable } from 'rxjs';
import { TokenService } from '../services/token.service';
import { environment } from '../../../environments/environment'; // <-- 1. IMPORTA environment

export const authInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
): Observable<HttpEvent<unknown>> => {

  const tokenService = inject(TokenService);
  const token = tokenService.getToken();

  // 2. VERIFICA si la petición es para tu propia API
  const isApiUrl = req.url.startsWith(environment.apiUrl);

  // 3. APLICA la cabecera solo si hay token Y la petición es a tu API
  if (token && isApiUrl) {
    const clonedReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
    // Pasa la petición clonada con la cabecera
    return next(clonedReq);
  }

  // Si no se cumple la condición, la petición continúa sin modificarse
  return next(req);
};
