import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';

export const authGuard: CanActivateFn = (): boolean | UrlTree => {
  const router = inject(Router);
  const hasToken = !!localStorage.getItem('jwt');
  return hasToken ? true : router.parseUrl('/login');
};
