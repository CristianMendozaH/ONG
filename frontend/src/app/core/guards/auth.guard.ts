import { inject } from '@angular/core';
import { CanActivateFn, Router, ActivatedRouteSnapshot } from '@angular/router';
import { UserStore } from '../stores/user.store';

export const authGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const userStore = inject(UserStore);
  const router = inject(Router);

  if (!userStore.isAuthenticated()) {
    return router.parseUrl('/login');
  }

  const allowedRoles = route.data['roles'] as Array<string>;
  if (!allowedRoles || allowedRoles.length === 0) {
    return true;
  }

  const userRole = userStore.currentUser()?.role;
  const hasPermission = userRole ? allowedRoles.includes(userRole) : false;

  if (hasPermission) {
    return true;
  } else {
    return router.parseUrl('/dashboard');
  }
};
