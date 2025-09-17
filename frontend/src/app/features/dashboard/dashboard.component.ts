import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { DashboardService, DashboardKPIs, DashboardActivity } from './dashboard.service';
import { UserStore } from '../../core/stores/user.store';
import { Chart, ChartConfiguration, registerables } from 'chart.js';

// Registrar Chart.js components
Chart.register(...registerables);

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('barChart', { static: false }) barChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('doughnutChart', { static: false }) doughnutChartRef!: ElementRef<HTMLCanvasElement>;

  kpis: DashboardKPIs | null = null;
  recentActivity: DashboardActivity[] = [];
  loading = true;
  connectionError = false;
  lastUpdated: Date | null = null;

  // Charts instances
  private barChart: Chart | null = null;
  private doughnutChart: Chart | null = null;

  // Data para los gráficos
  weeklyData = {
    labels: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'],
    prestamos: [12, 8, 15, 10, 14, 6, 4],
    devoluciones: [8, 12, 10, 15, 9, 8, 7]
  };

  constructor(
    private dashboardService: DashboardService,
    public userStore: UserStore
  ) {}

  ngOnInit(): void {
    console.log('🚀 Inicializando Dashboard...');
    this.checkConnectionAndLoadData();
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.initializeCharts();
    }, 100);
  }

  ngOnDestroy(): void {
    if (this.barChart) {
      this.barChart.destroy();
    }
    if (this.doughnutChart) {
      this.doughnutChart.destroy();
    }
  }

  /**
   * Verificar conexión y cargar datos
   */
  private async checkConnectionAndLoadData(): Promise<void> {
    this.loading = true;
    this.connectionError = false;

    try {
      console.log('🔍 Verificando conexión...');

      // Verificar conexión con backend
      const isConnected = await this.dashboardService.checkBackendConnection().toPromise();

      if (!isConnected) {
        console.warn('⚠️ Backend no disponible, usando datos de fallback');
        this.connectionError = true;
      }

      // Cargar datos independientemente
      await this.loadDashboardData();

    } catch (error) {
      console.error('❌ Error durante la inicialización:', error);
      this.connectionError = true;
      await this.loadDashboardData(); // Intentar cargar datos de fallback
    }
  }

  /**
   * Cargar datos del dashboard
   */
  private async loadDashboardData(): Promise<void> {
    console.log('📊 Cargando datos del dashboard...');

    try {
      // Cargar KPIs y actividad en paralelo
      const [kpis, activities] = await Promise.all([
        this.dashboardService.getKpis().toPromise(),
        this.dashboardService.getActivity().toPromise()
      ]);

      // Procesar KPIs
      if (kpis) {
        this.kpis = kpis;
        console.log('✅ KPIs cargados:', this.kpis);
        this.updateDoughnutChart();
      }

      // Procesar actividades
      if (activities) {
        this.recentActivity = activities.slice(0, 5);
        console.log('✅ Actividades cargadas:', this.recentActivity);
      }

      this.lastUpdated = new Date();
      this.loading = false;

    } catch (error) {
      console.error('❌ Error cargando datos del dashboard:', error);

      // Usar datos de fallback
      this.loadFallbackData();
      this.loading = false;
    }
  }

  /**
   * Cargar datos de fallback para pruebas
   */
  private loadFallbackData(): void {
    console.warn('🔄 Cargando datos de fallback...');

    this.kpis = {
      disponibles: 14,
      prestados: 4,
      atrasos: 0,
      totalEquipos: 18,
      enMantenimiento: 0
    };

    this.recentActivity = [
      {
        id: '1',
        tipo: 'prestamo',
        descripcion: 'Préstamo de equipo a María González',
        fecha: new Date().toISOString(),
        equipo: 'Laptop Dell Inspiron 15',
        usuario: 'María González'
      },
      {
        id: '2',
        tipo: 'devolucion',
        descripcion: 'Devolución de equipo por Carlos Mendoza',
        fecha: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        equipo: 'Proyector Epson',
        usuario: 'Carlos Mendoza'
      }
    ];

    this.updateDoughnutChart();
    console.log('✅ Datos de fallback cargados');
  }

  /**
   * Refrescar datos del dashboard
   */
  refreshData(): void {
    console.log('🔄 Refrescando datos del dashboard...');
    this.checkConnectionAndLoadData();
  }

  /**
   * Método temporal para debugging
   */
  checkManualEndpoint(): void {
    console.log('🧪 Probando endpoint manual...');
    this.dashboardService.checkBackendConnection().subscribe({
      next: (connected) => {
        console.log('Conexión:', connected);
        if (connected) {
          // Hacer petición manual
          this.dashboardService.getKpis().subscribe({
            next: (data) => {
              console.log('✅ Datos recibidos manualmente:', data);
              alert('Datos recibidos: ' + JSON.stringify(data, null, 2));
            },
            error: (error) => {
              console.error('❌ Error manual:', error);
              alert('Error: ' + error.message);
            }
          });
        } else {
          alert('No hay conexión con el backend');
        }
      }
    });
  }

  private initializeCharts(): void {
    this.createBarChart();
    this.createDoughnutChart();
  }

  private createBarChart(): void {
    if (!this.barChartRef?.nativeElement) {
      console.warn('⚠️ Elemento barChart no encontrado');
      return;
    }

    const config: ChartConfiguration<'bar'> = {
      type: 'bar',
      data: {
        labels: this.weeklyData.labels,
        datasets: [
          {
            label: 'Préstamos',
            data: this.weeklyData.prestamos,
            backgroundColor: '#114495',
            borderColor: '#114495',
            borderWidth: 1,
            borderRadius: 4,
          },
          {
            label: 'Devoluciones',
            data: this.weeklyData.devoluciones,
            backgroundColor: '#EE9D08',
            borderColor: '#EE9D08',
            borderWidth: 1,
            borderRadius: 4,
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
            align: 'end',
            labels: {
              usePointStyle: true,
              padding: 20,
              font: {
                size: 12,
                family: 'Inter, sans-serif'
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: {
              color: '#f1f3f4'
            },
            ticks: {
              font: {
                size: 11,
                family: 'Inter, sans-serif'
              },
              color: '#666'
            }
          },
          x: {
            grid: {
              display: false
            },
            ticks: {
              font: {
                size: 11,
                family: 'Inter, sans-serif'
              },
              color: '#666'
            }
          }
        }
      }
    };

    try {
      this.barChart = new Chart(this.barChartRef.nativeElement, config);
      console.log('✅ Gráfico de barras creado');
    } catch (error) {
      console.error('❌ Error creando gráfico de barras:', error);
    }
  }

  private createDoughnutChart(): void {
    if (!this.doughnutChartRef?.nativeElement) {
      console.warn('⚠️ Elemento doughnutChart no encontrado');
      return;
    }

    const config: ChartConfiguration<'doughnut'> = {
      type: 'doughnut',
      data: {
        labels: ['Disponibles', 'Prestados', 'Atrasados'],
        datasets: [{
          data: [0, 0, 0],
          backgroundColor: [
            '#2ECC71',
            '#114495',
            '#E6331B'
          ],
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '70%',
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              usePointStyle: true,
              padding: 15,
              font: {
                size: 12,
                family: 'Inter, sans-serif'
              }
            }
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                const total = (context.dataset.data as number[]).reduce((a: number, b: number) => a + b, 0);
                const percentage = total > 0 ? (((context.parsed as number) / total) * 100).toFixed(1) : '0';
                return `${context.label}: ${context.parsed} (${percentage}%)`;
              }
            }
          }
        }
      }
    };

    try {
      this.doughnutChart = new Chart(this.doughnutChartRef.nativeElement, config);
      console.log('✅ Gráfico doughnut creado');
    } catch (error) {
      console.error('❌ Error creando gráfico doughnut:', error);
    }
  }

  private updateDoughnutChart(): void {
    if (!this.doughnutChart || !this.kpis) return;

    const data = [
      this.kpis.disponibles,
      this.kpis.prestados,
      this.kpis.atrasos
    ];

    this.doughnutChart.data.datasets[0].data = data;
    this.doughnutChart.update();
    console.log('📊 Gráfico doughnut actualizado con datos:', data);
  }

  getRelativeTime(dateString: string): string {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

      if (diffInMinutes < 1) return 'Ahora mismo';
      if (diffInMinutes < 60) return `Hace ${diffInMinutes} min`;

      const diffInHours = Math.floor(diffInMinutes / 60);
      if (diffInHours < 24) return `Hace ${diffInHours}h`;

      const diffInDays = Math.floor(diffInHours / 24);
      if (diffInDays < 7) return `Hace ${diffInDays}d`;

      return date.toLocaleDateString();
    } catch (error) {
      console.error('❌ Error procesando fecha:', dateString, error);
      return 'Fecha inválida';
    }
  }

  getActivityIcon(tipo: string): string {
    switch (tipo) {
      case 'prestamo': return 'fa-arrow-up';
      case 'devolucion': return 'fa-arrow-down';
      case 'mantenimiento': return 'fa-wrench';
      default: return 'fa-circle';
    }
  }

  getActivityClass(tipo: string): string {
    switch (tipo) {
      case 'prestamo': return 'activity-prestamo';
      case 'devolucion': return 'activity-devolucion';
      case 'mantenimiento': return 'activity-mantenimiento';
      default: return 'activity-general';
    }
  }

  get enMantenimiento(): number {
    return this.kpis?.enMantenimiento || 0;
  }

  /**
   * Getter para mostrar información de debug
   */
  get debugInfo(): any {
    return {
      kpis: this.kpis,
      activitiesCount: this.recentActivity.length,
      lastUpdated: this.lastUpdated,
      connectionError: this.connectionError,
      loading: this.loading
    };
  }
}
