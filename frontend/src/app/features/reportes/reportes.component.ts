import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, of } from 'rxjs';
import { takeUntil, finalize, catchError } from 'rxjs/operators';
import { ReportesService, FiltrosReporte, ReporteItem, ReporteResponse, EstadisticasReporte, ExportOptions } from './reportes.service';
import { PadNumberPipe } from '../../shared/pipes/pad-number.pipe';

@Component({
  selector: 'app-reportes',
  standalone: true,
  imports: [CommonModule, FormsModule, PadNumberPipe],
  templateUrl: './reportes.component.html',
  styleUrl: './reportes.component.scss'
})
export class ReportesComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  reportes: ReporteItem[] = [];
  estadisticas: EstadisticasReporte | null = null;
  isLoading = false;
  errorMessage = '';
  hasError = false;
  currentPage = 1;
  totalItems = 0;
  itemsPerPage = 50;

  filtros: FiltrosReporte = {
    fechaInicio: this.getDefaultStartDate(),
    fechaFin: this.getDefaultEndDate(),
    tipoReporte: 'prestamos',
    estado: ''
  };

  tiposReporte: Array<{ value: string; label: string }> = [];

  estadosPrestamo = [
    { value: '', label: 'Todos los estados' },
    { value: 'prestado', label: 'Activo' },
    { value: 'devuelto', label: 'Devuelto' },
    { value: 'atrasado', label: 'Atrasado' }
  ];

  constructor(private reportesService: ReportesService) {}

  ngOnInit(): void {
    this.inicializarDatos();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private inicializarDatos(): void {
    this.isLoading = true;
    this.hasError = false;

    Promise.all([
      this.cargarReportes(),
      this.cargarEstadisticas(),
      this.cargarTiposReporte()
    ]).finally(() => {
      this.isLoading = false;
    });
  }

  private cargarReportes(): Promise<void> {
    return new Promise((resolve) => {
      this.reportesService.getReportes(this.filtros, this.currentPage, this.itemsPerPage)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response: ReporteResponse) => {
            this.reportes = response.data;
            this.totalItems = response.total;
            this.currentPage = response.page;
            resolve();
          },
          error: () => resolve()
        });
    });
  }

  private cargarEstadisticas(): Promise<void> {
    return new Promise((resolve) => {
      this.reportesService.getEstadisticasReporte(this.filtros)
        .pipe(takeUntil(this.destroy$))
        .subscribe(data => {
          this.estadisticas = data;
          resolve();
        });
    });
  }

  private cargarTiposReporte(): Promise<void> {
      return new Promise((resolve) => {
          this.reportesService.getTiposReporte()
              .pipe(takeUntil(this.destroy$))
              .subscribe(tipos => {
                  this.tiposReporte = [{ value: 'prestamos', label: 'Préstamos' }, ...tipos.filter(t => t.value !== 'prestamos')];
                  resolve();
              });
      });
  }

  /**
   * Se ejecuta cuando el usuario cambia el tipo de reporte en el menú desplegable.
   */
  onTipoReporteChange(): void {
    this.limpiarFiltroEstado();
    this.aplicarFiltros();
  }

  aplicarFiltros(): void {
    this.isLoading = true;
    this.hasError = false;
    this.currentPage = 1;
    Promise.all([this.cargarReportes(), this.cargarEstadisticas()]).finally(() => {
      this.isLoading = false;
    });
  }

  limpiarFiltros(): void {
    this.filtros = {
      fechaInicio: this.getDefaultStartDate(),
      fechaFin: this.getDefaultEndDate(),
      tipoReporte: 'prestamos',
      estado: ''
    };
    this.aplicarFiltros();
  }

  limpiarFiltroEstado(): void {
    this.filtros.estado = '';
  }

  exportarPDF(): void {
    this.exportarArchivo('pdf');
  }

  exportarExcel(): void {
    this.exportarArchivo('excel');
  }

  private exportarArchivo(formato: 'pdf' | 'excel'): void {
    if (this.reportes.length === 0) {
      this.mostrarError('No hay datos para exportar');
      return;
    }
    const options: ExportOptions = { formato, filtros: this.filtros };
    this.isLoading = true;

    const exportObservable = formato === 'pdf'
      ? this.reportesService.exportarPDF(options)
      : this.reportesService.exportarExcel(options);

    exportObservable.pipe(
      takeUntil(this.destroy$),
      finalize(() => this.isLoading = false),
      catchError(error => {
        this.mostrarError(`Error al exportar el reporte en ${formato.toUpperCase()}`);
        return of(null);
      })
    ).subscribe(blob => {
      if (blob) {
        this.descargarArchivo(blob, `reporte.${formato === 'pdf' ? 'pdf' : 'xlsx'}`);
      }
    });
  }

  private descargarArchivo(blob: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }

  getEstadoClass(estado: string | undefined): string {
    if (!estado) return '';
    const lowerCaseStatus = estado.toLowerCase();

    const statusMap: { [key: string]: string } = {
        'prestado': 'status-active',
        'activo': 'status-active',
        'devuelto': 'status-returned',
        'atrasado': 'status-overdue',
        'vencido': 'status-overdue',
        'programado': 'status-returned',
        'en-proceso': 'status-active',
        'completado': 'status-returned',
        'cancelado': 'status-overdue'
    };
    return statusMap[lowerCaseStatus] || '';
  }

  trackByReporte(index: number, item: ReporteItem): string {
    return item.id;
  }

  // Getters para Préstamos
  get totalPrestamos(): number { return this.estadisticas?.totalPrestamos ?? 0; }
  get totalDevueltos(): number { return this.estadisticas?.prestamosDevueltos ?? 0; }
  get totalActivos(): number { return this.estadisticas?.prestamosActivos ?? 0; }
  get totalVencidos(): number { return this.estadisticas?.prestamosVencidos ?? 0; }

  // Getters para Mantenimientos
  get totalMantenimientos(): number { return this.estadisticas?.totalMantenimientos ?? 0; }
  get mantenimientosProgramados(): number { return this.estadisticas?.mantenimientosProgramados ?? 0; }
  get mantenimientosEnProceso(): number { return this.estadisticas?.mantenimientosEnProceso ?? 0; }
  get mantenimientosCompletados(): number { return this.estadisticas?.mantenimientosCompletados ?? 0; }

  refrescarDatos(): void {
    this.inicializarDatos();
  }

  private getDefaultStartDate(): string {
    const date = new Date();
    date.setMonth(date.getMonth() - 1);
    return date.toISOString().split('T')[0];
  }

  private getDefaultEndDate(): string {
    return new Date().toISOString().split('T')[0];
  }

  private mostrarError(mensaje: string): void {
    this.errorMessage = mensaje;
    this.hasError = true;
    setTimeout(() => this.hasError = false, 5000);
  }

  cambiarPagina(nuevaPagina: number): void {
    if (nuevaPagina < 1 || nuevaPagina > this.totalPages) return;
    this.currentPage = nuevaPagina;
    this.cargarReportes();
  }

  get totalPages(): number {
    return Math.ceil(this.totalItems / this.itemsPerPage);
  }
}
