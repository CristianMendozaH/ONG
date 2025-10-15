// Archivo completo: src/app/features/colaboradores/colaboradores.routes.ts

import { Routes } from '@angular/router';
import { ColaboradoresComponent } from './colaboradores.component';

export const COLABORADORES_ROUTES: Routes = [
  {
    path: '', // La ruta base /colaboradores cargará este componente principal.
    component: ColaboradoresComponent
  },
  // En el futuro, si necesitas más páginas dentro de este módulo
  // (como ver el detalle de un colaborador), las añadirías aquí. Por ejemplo:
  // { path: ':id/detalles', component: DetalleColaboradorComponent }
];
