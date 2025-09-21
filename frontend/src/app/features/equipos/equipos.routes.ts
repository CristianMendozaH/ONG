// Contenido para: src/app/features/equipos/equipos.routes.ts

import { Routes } from '@angular/router';
import { EquiposComponent } from './equipos.component';
import { QrPrintSheetComponent } from './qr-print-sheet/qr-print-sheet.component';

export const EQUIPOS_ROUTES: Routes = [
  {
    path: '', // Muestra la lista de equipos en /equipos
    component: EquiposComponent
  },
  {
    path: 'print', // Muestra la hoja de QR en /equipos/print
    component: QrPrintSheetComponent
  },
];
