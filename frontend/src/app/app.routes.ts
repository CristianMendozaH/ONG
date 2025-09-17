import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    // CORREGIDO: Usando la ruta que me confirmaste
    loadComponent: () => import('./features/auth/login.component').then(m => m.LoginComponent)
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./core/layout/layout.component').then(m => m.LayoutComponent),
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },

      {
        path: 'dashboard',
        data: { roles: ['admin', 'tech'] },
        loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent)
      },
      {
        path: 'equipos',
        data: { roles: ['admin', 'tech'] },
        loadComponent: () => import('./features/equipos/equipos.component').then(m => m.EquiposComponent)
      },
      // ... El resto de tus rutas
      {
        path: 'usuarios',
        data: { roles: ['admin'] },
        loadComponent: () => import('./features/users/users.component').then(m => m.UsersComponent)
      },
    ],
  },
  { path: '**', redirectTo: '' }
];
