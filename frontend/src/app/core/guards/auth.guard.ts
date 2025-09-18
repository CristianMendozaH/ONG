// src/app/core/guards/auth.guard.ts

import { inject } from '@angular/core';
import { CanActivateFn, Router, ActivatedRouteSnapshot } from '@angular/router';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';

import { UserStore } from '../stores/user.store';
import { AuthService } from '../services/auth.service';
import { TokenService } from '../services/token.service';
import { User } from '../../shared/interfaces/models'; // <-- La importación clave que faltaba

export const authGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const userStore = inject(UserStore);
  const router = inject(Router);
  const authService = inject(AuthService);
  const tokenService = inject(TokenService);

  /**
   * Función interna para verificar si el rol del usuario es válido para la ruta.
   */
  const checkRoles = (user: User | null): boolean => {
    const allowedRoles = route.data['roles'] as Array<string> | undefined;
    // Si la ruta no especifica roles, se permite el acceso a cualquier usuario autenticado.
    if (!allowedRoles || allowedRoles.length === 0) {
      return true;
    }
    // Si el usuario existe y su rol está incluido en la lista de roles permitidos.
    return !!user && allowedRoles.includes(user.role);
  };

  // --- Lógica del Guardián ---

  // CASO 1: Navegación normal (el usuario ya está cargado en el store).
  if (userStore.isAuthenticated()) {
    if (checkRoles(userStore.currentUser())) {
      return true; // Usuario autenticado y con el rol correcto.
    } else {
      // Usuario autenticado pero sin el rol necesario para esta ruta específica.
      // Lo redirigimos a una página segura por defecto, como el dashboard.
      return router.createUrlTree(['/dashboard']);
    }
  }

  // CASO 2: Recarga de página (F5) o primer acceso (no hay usuario en el store, pero sí un token).
  if (tokenService.isTokenValid()) {
    // Usamos el método del AuthService para obtener los datos del usuario desde el backend.
    // El guardián esperará a que este Observable se complete.
    return authService.fetchAndSetUser().pipe(
      map(user => {
        // 'user' es el resultado del HTTP GET (o null si la llamada falló).
        if (checkRoles(user)) {
          return true; // El usuario se recuperó correctamente y tiene el rol necesario.
        }
        // Si la recuperación del usuario falló o no tiene el rol, lo mandamos al login.
        return router.createUrlTree(['/login']);
      })
    );
  }

  // CASO 3: Acceso no autorizado (no hay usuario en el store ni token válido).
  return router.createUrlTree(['/login']);
};
