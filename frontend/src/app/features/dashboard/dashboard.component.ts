// dashboard.component.ts

import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { DashboardService, DashboardKPIs, DashboardActivity, DashboardWeeklyActivity } from './dashboard.service';
import { UserStore } from '../../core/stores/user.store';
import { Chart, ChartConfiguration, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit, OnDestroy {
  @ViewChild('barChart') barChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('doughnutChart') doughnutChartRef!: ElementRef<HTMLCanvasElement>;

  kpis: DashboardKPIs | null = null;
  recentActivity: DashboardActivity[] = [];
  loading = true;
  connectionError = false;
  lastUpdated: Date | null = null;

  private barChart: Chart | null = null;
  private doughnutChart: Chart | null = null;

  constructor(
    private dashboardService: DashboardService,
    public userStore: UserStore
  ) {}

  ngOnInit(): void {
    console.log('🚀 Inicializando Dashboard...');
    this.loadDashboardData(); // Llamamos al método principal directamente
  }

  ngOnDestroy(): void {
    this.barChart?.destroy();
    this.doughnutChart?.destroy();
  }

  private async loadDashboardData(): Promise<void> {
    this.loading = true;
    this.connectionError = false;
    console.log('📊 Cargando todos los datos del dashboard...');

    try {
      const [kpis, activities, weeklyData] = await Promise.all([
        this.dashboardService.getKpis().toPromise(),
        this.dashboardService.getActivity().toPromise(),
        this.dashboardService.getWeeklyActivity().toPromise()
      ]);

      if (kpis) {
        this.kpis = kpis;
        console.log('✅ KPIs cargados:', this.kpis);
      }
      if (activities) {
        this.recentActivity = activities.slice(0, 5);
        console.log('✅ Actividades cargadas:', this.recentActivity);
      }

      // --- CORRECCIÓN DEL CICLO DE VIDA DE GRÁFICAS ---
      // Ahora que tenemos los datos, terminamos la carga para que se muestre el HTML
      this.loading = false;
      this.lastUpdated = new Date();

      // Forzamos a Angular a que renderice los cambios (el *ngIf ahora será true)
      // y LUEGO creamos las gráficas, asegurando que los <canvas> existen.
      setTimeout(() => {
        if (weeklyData) {
          console.log('✅ Datos semanales cargados, creando gráfica de barras:', weeklyData);
          this.createBarChart(weeklyData);
        }
        if (kpis) {
          console.log('✅ KPIs disponibles, creando gráfica doughnut.');
          this.createDoughnutChart();
        }
      }, 0);

    } catch (error) {
      console.error('❌ Error cargando datos del dashboard, usando fallback general:', error);
      this.loadFallbackData();
      this.loading = false; // Aseguramos que el loading termine también en caso de error
    }
  }

  private loadFallbackData(): void {
    console.warn('🔄 Cargando todos los datos de fallback...');
    this.kpis = { disponibles: 14, prestados: 4, atrasos: 0, totalEquipos: 18, enMantenimiento: 0 };
    this.recentActivity = [
      { id: '1', tipo: 'prestamo', descripcion: 'Préstamo de equipo a María González', fecha: new Date().toISOString(), equipo: 'Laptop Dell', usuario: 'María González' },
      { id: '2', tipo: 'devolucion', descripcion: 'Devolución de equipo por Carlos Mendoza', fecha: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), equipo: 'Proyector Epson', usuario: 'Carlos Mendoza' }
    ];

    // También creamos las gráficas con los datos de fallback
    setTimeout(() => {
      this.createDoughnutChart();
      this.createBarChart({
        labels: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'],
        prestamos: [12, 8, 15, 10, 14, 6, 4],
        devoluciones: [8, 12, 10, 15, 9, 8, 7]
      });
    }, 0);
  }

  refreshData(): void {
    console.log('🔄 Refrescando datos del dashboard...');
    this.loadDashboardData();
  }

  private createBarChart(data: DashboardWeeklyActivity): void {
    if (this.barChart) this.barChart.destroy();
    if (!this.barChartRef?.nativeElement) return;

    const config: ChartConfiguration<'bar'> = {
      type: 'bar',
      data: {
        labels: data.labels,
        datasets: [
          { label: 'Préstamos', data: data.prestamos, backgroundColor: '#114495', borderRadius: 4 },
          { label: 'Devoluciones', data: data.devoluciones, backgroundColor: '#EE9D08', borderRadius: 4 }
        ]
      },
      options: { /* ... tus opciones ... */ }
    };
    this.barChart = new Chart(this.barChartRef.nativeElement, config);
    console.log('✅ Gráfico de barras CREADO con datos.');
  }

// En dashboard.component.ts

private createDoughnutChart(): void {
  if (this.doughnutChart) this.doughnutChart.destroy();
  if (!this.doughnutChartRef?.nativeElement || !this.kpis) return;

  // ANTES, la data solo tenía 3 valores:
  // const data = [this.kpis.disponibles, this.kpis.prestados, this.kpis.atrasos];

  // AHORA (CORREGIDO), añadimos el cuarto valor:
  const data = [this.kpis.disponibles, this.kpis.prestados, this.kpis.atrasos, this.kpis.enMantenimiento];

  const config: ChartConfiguration<'doughnut'> = {
    type: 'doughnut',
    data: {
      // ANTES, las etiquetas solo tenían 3 nombres:
      // labels: ['Disponibles', 'Prestados', 'Atrasados'],

      // AHORA (CORREGIDO), añadimos la cuarta etiqueta:
      labels: ['Disponibles', 'Prestados', 'Atrasados', 'En Mantenimiento'],
      datasets: [{
        data: data,
        // ANTES, los colores solo eran 3:
        // backgroundColor: ['#2ECC71', '#114495', '#E6331B'],

        // AHORA (CORREGIDO), añadimos el cuarto color (amarillo, como en tu tarjeta de KPI):
        backgroundColor: ['#2ECC71', '#114495', '#E6331B', '#FFED00'],
        borderWidth: 0
      }]
    },
    options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '70%',
        plugins: {
          legend: { position: 'bottom', labels: { usePointStyle: true, padding: 15, font: { size: 12, family: 'Inter, sans-serif' } } },
          tooltip: {
            callbacks: {
              label: (context) => {
                const total = (context.dataset.data as number[]).reduce((a, b) => a + b, 0);
                const percentage = total > 0 ? (((context.parsed as number) / total) * 100).toFixed(1) : '0';
                return `${context.label}: ${context.parsed} (${percentage}%)`;
              }
            }
          }
        }
      }
  };
  this.doughnutChart = new Chart(this.doughnutChartRef.nativeElement, config);
  console.log('✅ Gráfico doughnut CREADO con datos (incluye mantenimiento).');
}

  getRelativeTime(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / 60000);
    if (diffInMinutes < 1) return 'Ahora mismo';
    if (diffInMinutes < 60) return `Hace ${diffInMinutes} min`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `Hace ${diffInHours}h`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `Hace ${diffInDays}d`;
  }

  getActivityIcon(tipo: string): string {
    const icons: { [key: string]: string } = {
      prestamo: 'fa-arrow-up',
      devolucion: 'fa-arrow-down',
      mantenimiento: 'fa-wrench'
    };
    return icons[tipo] || 'fa-circle';
  }

  getActivityClass(tipo: string): string {
    return `activity-${tipo}`;
  }

  get enMantenimiento(): number {
    return this.kpis?.enMantenimiento || 0;
  }
}
