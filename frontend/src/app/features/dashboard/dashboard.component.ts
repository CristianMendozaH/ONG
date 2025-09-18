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
export class DashboardComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('barChart', { static: true }) barChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('doughnutChart', { static: true }) doughnutChartRef!: ElementRef<HTMLCanvasElement>;

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
    this.loadInitialData();
  }

  ngAfterViewInit(): void {
    this.initializeCharts();
  }

  ngOnDestroy(): void {
    this.barChart?.destroy();
    this.doughnutChart?.destroy();
  }

  private async loadInitialData(): Promise<void> {
    this.loading = true;
    this.connectionError = false;

    try {
      const isConnected = await this.dashboardService.checkBackendConnection().toPromise();
      if (!isConnected) {
        console.warn('⚠️ Backend no disponible, se usarán datos de fallback.');
        this.connectionError = true;
      }
      await this.loadDashboardData();
    } catch (error) {
      console.error('❌ Error durante la inicialización:', error);
      this.connectionError = true;
      await this.loadDashboardData();
    } finally {
      this.loading = false;
      this.lastUpdated = new Date();
    }
  }

  private async loadDashboardData(): Promise<void> {
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
        this.updateDoughnutChart();
      }

      if (activities) {
        this.recentActivity = activities.slice(0, 5);
        console.log('✅ Actividades cargadas:', this.recentActivity);
      }

      if (weeklyData) {
        console.log('✅ Datos semanales cargados:', weeklyData);
        this.updateBarChart(weeklyData);
      }

    } catch (error) {
      console.error('❌ Error cargando datos del dashboard, usando fallback general:', error);
      this.loadFallbackData();
    }
  }

  private loadFallbackData(): void {
    console.warn('🔄 Cargando todos los datos de fallback...');
    this.kpis = { disponibles: 14, prestados: 4, atrasos: 0, totalEquipos: 18, enMantenimiento: 0 };
    this.recentActivity = [
      { id: '1', tipo: 'prestamo', descripcion: 'Préstamo de equipo a María González', fecha: new Date().toISOString(), equipo: 'Laptop Dell', usuario: 'María González' },
      { id: '2', tipo: 'devolucion', descripcion: 'Devolución de equipo por Carlos Mendoza', fecha: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), equipo: 'Proyector Epson', usuario: 'Carlos Mendoza' }
    ];
    this.updateDoughnutChart();
    this.updateBarChart({
      labels: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'],
      prestamos: [12, 8, 15, 10, 14, 6, 4],
      devoluciones: [8, 12, 10, 15, 9, 8, 7]
    });
    console.log('✅ Datos de fallback cargados');
  }

  refreshData(): void {
    console.log('🔄 Refrescando datos del dashboard...');
    this.loadInitialData();
  }

  private initializeCharts(): void {
    this.createDoughnutChart();
    this.createBarChart();
  }

  private createBarChart(): void {
    if (this.barChart) this.barChart.destroy();

    const canvas = this.barChartRef.nativeElement;
    if (!canvas) {
      console.warn('⚠️ Elemento barChart no encontrado');
      return;
    }

    const config: ChartConfiguration<'bar'> = {
      type: 'bar',
      data: {
        labels: [],
        datasets: [
          { label: 'Préstamos', data: [], backgroundColor: '#114495', borderRadius: 4 },
          { label: 'Devoluciones', data: [], backgroundColor: '#EE9D08', borderRadius: 4 }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'top', align: 'end', labels: { usePointStyle: true, padding: 20, font: { size: 12, family: 'Inter, sans-serif' } } }
        },
        scales: {
          y: { beginAtZero: true, grid: { color: '#f1f3f4' }, ticks: { font: { size: 11, family: 'Inter, sans-serif' }, color: '#666' } },
          x: { grid: { display: false }, ticks: { font: { size: 11, family: 'Inter, sans-serif' }, color: '#666' } }
        }
      }
    };
    this.barChart = new Chart(canvas, config);
    console.log('✅ Gráfico de barras inicializado');
  }

  private createDoughnutChart(): void {
    if (this.doughnutChart) this.doughnutChart.destroy();

    const canvas = this.doughnutChartRef.nativeElement;
    if (!canvas) {
      console.warn('⚠️ Elemento doughnutChart no encontrado');
      return;
    }

    const config: ChartConfiguration<'doughnut'> = {
      type: 'doughnut',
      data: {
        labels: ['Disponibles', 'Prestados', 'Atrasados'],
        datasets: [{ data: [0, 0, 0], backgroundColor: ['#2ECC71', '#114495', '#E6331B'], borderWidth: 0 }]
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
    this.doughnutChart = new Chart(canvas, config);
    console.log('✅ Gráfico doughnut inicializado');
  }

  private updateBarChart(data: DashboardWeeklyActivity): void {
    if (!this.barChart) return;
    this.barChart.data.labels = data.labels;
    this.barChart.data.datasets[0].data = data.prestamos;
    this.barChart.data.datasets[1].data = data.devoluciones;
    this.barChart.update();
    console.log('📊 Gráfico de barras actualizado');
  }

  private updateDoughnutChart(): void {
    if (!this.doughnutChart || !this.kpis) return;
    const data = [this.kpis.disponibles, this.kpis.prestados, this.kpis.atrasos];
    this.doughnutChart.data.datasets[0].data = data;
    this.doughnutChart.update();
    console.log('📊 Gráfico doughnut actualizado');
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
