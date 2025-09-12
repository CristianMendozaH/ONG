// src/app/features/dashboard/dashboard.component.ts
import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ReportesService } from '../reportes/reportes.service';
import { UserStore } from '../../core/stores/user.store';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';
import { KPIs, Activity, Loan, Maintenance } from '../../shared/interfaces/models';
import { Chart, ChartConfiguration, registerables } from 'chart.js';

// Registrar Chart.js components
Chart.register(...registerables);

// Interfaz simplificada para evitar conflictos
interface SimpleActivityItem {
  id: string;
  itemType: 'loan' | 'maintenance'; // Cambiamos 'type' por 'itemType' para evitar conflictos
  updatedAt: string;
  status: string;
  title: string;
  icon: string;
  iconClass: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, StatusBadgeComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('barChart', { static: false }) barChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('doughnutChart', { static: false }) doughnutChartRef!: ElementRef<HTMLCanvasElement>;

  kpis: KPIs | null = null;
  recentActivity: SimpleActivityItem[] = [];
  loading = true;

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
    private reportesService: ReportesService,
    public userStore: UserStore
  ) {}

  ngOnInit(): void {
    this.loadDashboardData();
  }

  ngAfterViewInit(): void {
    // Delay para asegurar que los elementos estén en el DOM
    setTimeout(() => {
      this.initializeCharts();
    }, 100);
  }

  ngOnDestroy(): void {
    // Limpiar charts al destruir el componente
    if (this.barChart) {
      this.barChart.destroy();
    }
    if (this.doughnutChart) {
      this.doughnutChart.destroy();
    }
  }

  private loadDashboardData(): void {
    this.loading = true;

    // Cargar KPIs
    this.reportesService.getKpis().subscribe({
      next: (kpis) => {
        this.kpis = kpis;
        // Actualizar gráfico de dona después de obtener los datos
        this.updateDoughnutChart();
      },
      error: (error) => {
        console.error('Error cargando KPIs:', error);
        // Datos de fallback para demo
        this.kpis = {
          disponibles: 24,
          prestados: 18,
          atrasos: 3,
          totalEquipos: 50,
          enMantenimiento: 5
        };
        this.updateDoughnutChart();
      }
    });

    // Datos de actividad de prueba
    this.recentActivity = [
      {
        id: '1',
        itemType: 'loan',
        updatedAt: new Date().toISOString(),
        status: 'prestado',
        title: 'Préstamo de equipo a María González',
        icon: 'fa-arrow-up',
        iconClass: 'activity-prestamo'
      },
      {
        id: '2',
        itemType: 'maintenance',
        updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        status: 'completado',
        title: 'Mantenimiento preventivo - completado',
        icon: 'fa-wrench',
        iconClass: 'activity-mantenimiento'
      }
    ];

    // Cargar actividad reciente desde el backend
    this.reportesService.getActivity().subscribe({
      next: (activity) => {
        // Procesar actividad de préstamos
        const loanActivities: SimpleActivityItem[] = activity.loans.map(loan => ({
          id: loan.id,
          itemType: 'loan',
          updatedAt: loan.updatedAt,
          status: loan.status,
          title: this.generateLoanTitle(loan),
          icon: loan.status === 'prestado' ? 'fa-arrow-up' : 'fa-arrow-down',
          iconClass: loan.status === 'prestado' ? 'activity-prestamo' : 'activity-devolucion'
        }));

        // Procesar actividad de mantenimiento
        const maintenanceActivities: SimpleActivityItem[] = activity.maintenances.map(maintenance => ({
          id: maintenance.id,
          itemType: 'maintenance',
          updatedAt: maintenance.updatedAt,
          status: maintenance.status,
          title: this.generateMaintenanceTitle(maintenance),
          icon: 'fa-wrench',
          iconClass: 'activity-mantenimiento'
        }));

        // Combinar y ordenar
        const allActivities = [...loanActivities, ...maintenanceActivities];
        this.recentActivity = allActivities
          .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
          .slice(0, 5);

        this.loading = false;
      },
      error: (error) => {
        console.error('Error cargando actividad:', error);
        this.loading = false;
      }
    });
  }

  private generateLoanTitle(loan: Loan): string {
    if (loan.status === 'prestado') {
      return `Préstamo de equipo a ${loan.borrowerName}`;
    } else {
      return `Devolución de equipo por ${loan.borrowerName}`;
    }
  }

  private generateMaintenanceTitle(maintenance: Maintenance): string {
    const typeMap: Record<string, string> = {
      'preventivo': 'preventivo',
      'correctivo': 'correctivo',
      'predictivo': 'predictivo',
      'emergencia': 'de emergencia'
    };

    const maintenanceType = typeMap[maintenance.type] || 'programado';
    return `Mantenimiento ${maintenanceType} - ${maintenance.status}`;
  }

  private initializeCharts(): void {
    this.createBarChart();
    this.createDoughnutChart();
  }

  private createBarChart(): void {
    if (!this.barChartRef?.nativeElement) return;

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

    this.barChart = new Chart(this.barChartRef.nativeElement, config);
  }

  private createDoughnutChart(): void {
    if (!this.doughnutChartRef?.nativeElement) return;

    const config: ChartConfiguration<'doughnut'> = {
      type: 'doughnut',
      data: {
        labels: ['Disponibles', 'Prestados', 'Atrasados'],
        datasets: [{
          data: [0, 0, 0], // Se actualizará con datos reales
          backgroundColor: [
            '#2ECC71', // Verde para disponibles
            '#114495', // Azul para prestados
            '#E6331B'  // Rojo para atrasados
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
                const percentage = (((context.parsed as number) / total) * 100).toFixed(1);
                return `${context.label}: ${context.parsed} (${percentage}%)`;
              }
            }
          }
        }
      }
    };

    this.doughnutChart = new Chart(this.doughnutChartRef.nativeElement, config);
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
  }

  // Helper para formatear fecha relativa
  getRelativeTime(dateString: string): string {
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
  }

  // Getter para tarjeta de mantenimiento
  get enMantenimiento(): number {
    return this.kpis?.enMantenimiento || 5;
  }
}
