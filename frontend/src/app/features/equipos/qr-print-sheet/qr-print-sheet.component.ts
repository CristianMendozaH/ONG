// En qr-print-sheet.component.ts

import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { EquiposService, Equipo } from '../equipos.service';
import { forkJoin, of } from 'rxjs';
import { map, switchMap, catchError } from 'rxjs/operators';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';

// Estructura para combinar datos del equipo y su QR
export interface EquipoConQR {
  details: Equipo;
  qrUrl: SafeUrl | null;
  error?: string;
}

@Component({
  selector: 'app-qr-print-sheet',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './qr-print-sheet.component.html',
  styleUrls: ['./qr-print-sheet.component.scss']
})
export class QrPrintSheetComponent implements OnInit, OnDestroy {
  equipos: EquipoConQR[] = [];
  loading = true;
  error = '';
  private objectUrls: string[] = [];

  constructor(
    private route: ActivatedRoute,
    private equiposSvc: EquiposService,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit() {
    const idsParam = this.route.snapshot.queryParamMap.get('ids');
    if (!idsParam) {
      this.error = 'No se proporcionaron IDs de equipos.';
      this.loading = false;
      return;
    }

    const ids = idsParam.split(',');
    this.cargarEquiposYQRs(ids);
  }

  ngOnDestroy() {
    // Limpieza para evitar fugas de memoria
    this.objectUrls.forEach(url => URL.revokeObjectURL(url));
  }

  cargarEquiposYQRs(ids: string[]) {
    this.loading = true;

    // Creamos un array de Observables
    const observables = ids.map(id => {
      // Usamos switchMap para encadenar la obtención de detalles y luego el QR
      return this.equiposSvc.getById(id).pipe(
        switchMap(equipo =>
          this.equiposSvc.qr(id).pipe(
            map(blob => {
              const url = URL.createObjectURL(blob);
              this.objectUrls.push(url); // Guardamos para limpieza
              return {
                details: equipo,
                qrUrl: this.sanitizer.bypassSecurityTrustUrl(url)
              } as EquipoConQR;
            })
          )
        ),
        catchError(err => {
          console.error(`Error cargando equipo ${id}:`, err);
          // Si falla, retornamos un objeto de error para mostrarlo en la UI
          return of({
            details: { id, name: `Error al cargar ID ${id}` } as any,
            qrUrl: null,
            error: 'No se pudo cargar'
          } as EquipoConQR);
        })
      );
    });

    // forkJoin ejecuta todos los observables en paralelo
    forkJoin(observables).subscribe({
      next: (resultados) => {
        this.equipos = resultados;
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Ocurrió un error al cargar los datos de los equipos.';
        console.error(err);
        this.loading = false;
      }
    });
  }

  imprimir() {
    window.print();
  }
}
