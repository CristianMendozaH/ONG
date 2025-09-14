// src/app/features/reportes/chart-config.ts
// Configuración para inicializar Chart.js en el componente
// Agrega esto al ngAfterViewInit del componente

export class ChartInitializer {

  static initializeStatusChart(canvas: HTMLCanvasElement, data: number[], labels: string[]): any {
    const Chart = (window as any).Chart;

    if (!Chart) {
      console.error('Chart.js no está disponible');
      return null;
    }

    return new Chart(canvas.getContext('2d'), {
      type: 'doughnut',
      data: {
        labels: labels,
        datasets: [{
          data: data,
          backgroundColor: ['#114495', '#EE9D08', '#E6331B'],
          borderWidth: 0,
          hoverOffset: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              padding: 20,
              usePointStyle: true,
              font: {
                family: 'Poppins',
                size: 12
              }
            }
          },
          tooltip: {
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            titleColor: '#fff',
            bodyColor: '#fff',
            borderColor: '#114495',
            borderWidth: 1
          }
        },
        animation: {
          animateScale: true,
          animateRotate: true
        }
      }
    });
  }

  static initializeActivityChart(canvas: HTMLCanvasElement, labels: string[], prestamos: number[], devoluciones: number[]): any {
    const Chart = (window as any).Chart;

    if (!Chart) {
      console.error('Chart.js no está disponible');
      return null;
    }

    return new Chart(canvas.getContext('2d'), {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Préstamos',
          data: prestamos,
          backgroundColor: '#114495',
          borderColor: '#114495',
          borderWidth: 1,
          borderRadius: 4,
          borderSkipped: false
        }, {
          label: 'Devoluciones',
          data: devoluciones,
          backgroundColor: '#EE9D08',
          borderColor: '#EE9D08',
          borderWidth: 1,
          borderRadius: 4,
          borderSkipped: false
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              font: {
                family: 'Poppins',
                size: 12
              }
            }
          },
          tooltip: {
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            titleColor: '#fff',
            bodyColor: '#fff',
            borderColor: '#114495',
            borderWidth: 1
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: {
              color: 'rgba(0, 0, 0, 0.1)'
            },
            ticks: {
              font: {
                family: 'Poppins'
              }
            }
          },
          x: {
            grid: {
              display: false
            },
            ticks: {
              font: {
                family: 'Poppins'
              }
            }
          }
        },
        animation: {
          duration: 1000,
          easing: 'easeOutQuart'
        }
      }
    });
  }
}

// Función para agregar al componente en ngAfterViewInit
export function initializeCharts(component: any): void {
  // Esperar un tick para asegurar que el DOM esté renderizado
  setTimeout(() => {
    const statusCanvas = document.getElementById('statusChart') as HTMLCanvasElement;
    const activityCanvas = document.getElementById('activityChart') as HTMLCanvasElement;

    if (statusCanvas && component.chartData.status) {
      ChartInitializer.initializeStatusChart(
        statusCanvas,
        component.chartData.status.data,
        component.chartData.status.labels
      );
    }

    if (activityCanvas && component.chartData.activity) {
      ChartInitializer.initializeActivityChart(
        activityCanvas,
        component.chartData.activity.labels,
        component.chartData.activity.prestamos,
        component.chartData.activity.devoluciones
      );
    }
  }, 100);
}
