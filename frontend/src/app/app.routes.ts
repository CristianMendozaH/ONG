import { Routes } from '@angular/router';
import { authGuard } from './core/auth.guard';

export const routes: Routes = [
  { path: 'login', loadComponent: () => import('./features/auth/login.component').then(m => m.LoginComponent) },
  {
    path: '',
    canActivate: [authGuard],                                // 👈 protegido
    loadComponent: () => import('./core/layout/layout.component').then(m => m.LayoutComponent),
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent) },
      { path: 'equipos', loadComponent: () => import('./features/equipos/equipos.component').then(m => m.EquiposComponent) },
      { path: 'usuarios', loadComponent: () => import('./features/users/users.component').then(m => m.UsersComponent) },
      { path: 'prestamos', loadComponent: () => import('./features/prestamos/prestamos.component').then(m => m.PrestamosComponent) },
      { path: 'mantenimiento', loadComponent: () => import('./features/mantenimiento/mantenimiento.component').then(m => m.MantenimientoComponent) },
    ],
  },
  { path: '**', redirectTo: 'dashboard' }
];
