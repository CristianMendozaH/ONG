import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login.component').then(m => m.LoginComponent)
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./core/layout/layout.component').then(m => m.LayoutComponent),
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },

      // Rutas para Admin y Tecnico
      {
        path: 'dashboard',
        data: { roles: ['admin', 'tecnico'] },
        loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent)
      },
      {
        path: 'equipos',
        data: { roles: ['admin', 'tecnico'] },
        // AHORA USAMOS loadChildren para cargar el conjunto de rutas
        loadChildren: () => import('./features/equipos/equipos.routes').then(m => m.EQUIPOS_ROUTES)
      },
      {
        path: 'prestamos',
        data: { roles: ['admin', 'tecnico'] },
        loadComponent: () => import('./features/prestamos/prestamos.component').then(m => m.PrestamosComponent)
      },
      {
        path: 'mantenimiento',
        data: { roles: ['admin', 'tecnico'] },
        loadComponent: () => import('./features/mantenimiento/mantenimiento.component').then(m => m.MantenimientoComponent)
      },
      {
        path: 'reportes',
        data: { roles: ['admin', 'tecnico'] },
        loadComponent: () => import('./features/reportes/reportes.component').then(m => m.ReportesComponent)
      },

      // Rutas solo para Admin
      {
        path: 'usuarios',
        data: { roles: ['admin'] },
        loadComponent: () => import('./features/users/users.component').then(m => m.UsersComponent)
      },
      {
        path: 'config',
        data: { roles: ['admin'] },
        loadComponent: () => import('./features/config/config.component').then(m => m.ConfigComponent)
      }
    ],
  },
  { path: '**', redirectTo: '' }
];
