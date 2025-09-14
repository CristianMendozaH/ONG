import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReportesService } from './reportes.service';
import { KPIs, Activity } from '../../shared/interfaces/models';

interface ReporteItem {
  id: string;
  equipo: string;
  usuario: string;
  fechaPrestamo: string;
  fechaDevolucion: string | null;
  estado: 'Activo' | 'Devuelto' | 'Vencido';
  diasUso: number;
}

interface FiltrosReporte {
  fechaInicio: string;
  fechaFin: string;
  tipoReporte: string;
}

@Component({
  selector: 'app-reportes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reportes.component.html',
  styleUrl: './reportes.component.scss'
})
export class ReportesComponent implements OnInit {
  // Datos principales
  reportes: ReporteItem[] = [];
  reportesFiltrados: ReporteItem[] = [];
  kpis: KPIs | null = null;
  activity: Activity | null = null;

  // Estado de la aplicación
  isLoading = false;
  sidebarActive = false;

  // Filtros
  filtros: FiltrosReporte = {
    fechaInicio: '2025-01-01',
    fechaFin: '2025-01-31',
    tipoReporte: ''
  };

  // Opciones para el select
  tiposReporte = [
    { value: '', label: 'Seleccione un tipo' },
    { value: 'prestamos', label: 'Préstamos de Equipos' },
    { value: 'mantenimiento', label: 'Mantenimientos' },
    { value: 'usuarios', label: 'Actividad de Usuarios' },
    { value: 'estado', label: 'Estado de Equipos' },
    { value: 'vencimientos', label: 'Próximos Vencimientos' }
  ];

  constructor(private reportesService: ReportesService) {}

  ngOnInit(): void {
    this.inicializarReportesDummy();
  }

  /**
   * Inicializar datos dummy para la tabla
   */
  inicializarReportesDummy(): void {
    this.reportes = [
      {
        id: 'PR001',
        equipo: 'Laptop Dell Inspiron 15',
        usuario: 'María González',
        fechaPrestamo: '15/01/2025',
        fechaDevolucion: '22/01/2025',
        estado: 'Devuelto',
        diasUso: 7
      },
      {
        id: 'PR002',
        equipo: 'Proyector Epson X400',
        usuario: 'Carlos Mendoza',
        fechaPrestamo: '20/01/2025',
        fechaDevolucion: null,
        estado: 'Activo',
        diasUso: 11
      },
      {
        id: 'PR003',
        equipo: 'Tablet Samsung Galaxy',
        usuario: 'Ana Rodríguez',
        fechaPrestamo: '10/01/2025',
        fechaDevolucion: '25/01/2025',
        estado: 'Vencido',
        diasUso: 21
      },
      {
        id: 'PR004',
        equipo: 'Cámara Canon EOS',
        usuario: 'Luis Morales',
        fechaPrestamo: '18/01/2025',
        fechaDevolucion: '20/01/2025',
        estado: 'Devuelto',
        diasUso: 2
      },
      {
        id: 'PR005',
        equipo: 'Laptop HP Pavilion',
        usuario: 'Pedro Martínez',
        fechaPrestamo: '25/01/2025',
        fechaDevolucion: null,
        estado: 'Activo',
        diasUso: 6
      },
      {
        id: 'PR006',
        equipo: 'Monitor LG 24"',
        usuario: 'Sofia Torres',
        fechaPrestamo: '12/01/2025',
        fechaDevolucion: '19/01/2025',
        estado: 'Devuelto',
        diasUso: 7
      }
    ];

    this.reportesFiltrados = [...this.reportes];
  }

  /**
   * Toggle sidebar para móvil
   */
  toggleSidebar(): void {
    this.sidebarActive = !this.sidebarActive;
  }

  /**
   * Aplicar filtros
   */
  aplicarFiltros(): void {
    console.log('Aplicando filtros:', this.filtros);

    this.reportesFiltrados = this.reportes.filter(reporte => {
      let cumpleFiltros = true;

      // Filtrar por tipo de reporte si está seleccionado
      if (this.filtros.tipoReporte && this.filtros.tipoReporte !== '') {
        // Implementar lógica específica según el tipo
      }

      // Filtrar por fechas si están seleccionadas
      if (this.filtros.fechaInicio || this.filtros.fechaFin) {
        // Implementar filtrado por fechas
      }

      return cumpleFiltros;
    });

    console.log('Filtros aplicados. Resultados:', this.reportesFiltrados.length);
  }

  /**
   * Limpiar filtros
   */
  limpiarFiltros(): void {
    this.filtros = {
      fechaInicio: '',
      fechaFin: '',
      tipoReporte: ''
    };
    this.reportesFiltrados = [...this.reportes];
    console.log('Filtros limpiados');
  }

  /**
   * Exportar a PDF
   */
  exportarPDF(): void {
    console.log('Exportando reporte a PDF...');
  }

  /**
   * Exportar a Excel
   */
  exportarExcel(): void {
    console.log('Exportando reporte a Excel...');
  }

  /**
   * Obtener clase CSS para el estado
   */
  getEstadoClass(estado: string): string {
    switch (estado) {
      case 'Activo': return 'status-active';
      case 'Devuelto': return 'status-returned';
      case 'Vencido': return 'status-overdue';
      default: return '';
    }
  }

  /**
   * TrackBy function para optimizar el rendimiento de la tabla
   */
  trackByReporte(index: number, item: ReporteItem): string {
    return item.id;
  }

  /**
   * Calcular totales para estadísticas
   */
  get totalPrestamos(): number {
    return this.reportesFiltrados.length;
  }

  get totalDevueltos(): number {
    return this.reportesFiltrados.filter(r => r.estado === 'Devuelto').length;
  }

  get totalActivos(): number {
    return this.reportesFiltrados.filter(r => r.estado === 'Activo').length;
  }

  get totalVencidos(): number {
    return this.reportesFiltrados.filter(r => r.estado === 'Vencido').length;
  }
}
