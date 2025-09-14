import { Component, OnInit, inject } from '@angular/core';
import { CommonModule, DatePipe, TitleCasePipe } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { MantenimientoService, Mantenimiento } from './mantenimiento.service';
import { EquiposService, Equipo } from '../equipos/equipos.service';

@Component({
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, ReactiveFormsModule, DatePipe, TitleCasePipe],
  templateUrl: './mantenimiento.component.html',
  styleUrl: './mantenimiento.component.scss'
})
export class MantenimientoComponent implements OnInit {
  private fb = inject(FormBuilder);
  private mantSvc = inject(MantenimientoService);
  private equiposSvc = inject(EquiposService);

  // Data properties
  mantenimientos: Mantenimiento[] = [];
  filteredMantenimientos: Mantenimiento[] = [];
  equipos: Equipo[] = [];

  // State properties
  loading = false;
  error = '';
  saving = false;

  // Modal properties
  showModal = false;
  showDetailsModal = false;
  editingMaintenance: Mantenimiento | null = null;
  selectedMaintenanceDetails: Mantenimiento | null = null;

  // Filter properties
  statusFilter = '';
  typeFilter = '';

  // Computed properties
  alertsCount = 5; // This could be calculated from your data
  selectedEquipment: Equipo | null = null;

  form = this.fb.group({
    equipmentId: ['', Validators.required],
    type: ['preventivo', Validators.required],
    scheduledDate: ['', Validators.required],
    notes: [''],
  });

  ngOnInit() {
    this.load();
    this.loadEquipos();
    this.setDefaultDate();

    // Watch equipment selection changes
    this.form.get('equipmentId')?.valueChanges.subscribe(equipmentId => {
      this.selectedEquipment = this.equipos.find(e => e.id === equipmentId) || null;
    });
  }

  private setDefaultDate() {
    // Set tomorrow as default date
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateString = tomorrow.toISOString().split('T')[0];
    this.form.patchValue({ scheduledDate: dateString });
  }

  private loadEquipos() {
    this.equiposSvc.list().subscribe({
      next: (equipos) => this.equipos = equipos,
      error: (error) => console.error('Error loading equipos:', error)
    });
  }

  load() {
    this.loading = true;
    this.error = '';

    this.mantSvc.list().subscribe({
      next: (res) => {
        this.mantenimientos = res;
        this.filteredMantenimientos = [...res];
        this.loading = false;
      },
      error: (e) => {
        this.error = e?.error?.message || 'No se pudo cargar mantenimientos';
        this.loading = false;
      }
    });
  }

  crear() {
    if (this.form.invalid) return;

    this.saving = true;
    const formValue = this.form.value as any;

    this.mantSvc.create(formValue).subscribe({
      next: () => {
        this.resetForm();
        this.closeModal();
        this.load();
        this.showSuccessMessage('Mantenimiento programado exitosamente');
      },
      error: (e) => {
        this.saving = false;
        this.showErrorMessage(e?.error?.message || 'No se pudo crear el mantenimiento');
      }
    });
  }

  completar(m: Mantenimiento) {
    const today = new Date().toISOString().slice(0, 10);
    const fecha = prompt('Fecha realizada (yyyy-mm-dd):', today);

    if (!fecha) return;

    this.mantSvc.complete(m.id, fecha).subscribe({
      next: () => {
        this.load();
        this.showSuccessMessage('Mantenimiento marcado como completado');
        if (this.showDetailsModal) {
          this.closeDetailsModal();
        }
      },
      error: (e) => this.showErrorMessage(e?.error?.message || 'No se pudo marcar como completado')
    });
  }

  // Modal methods
  openMaintenanceModal() {
    this.editingMaintenance = null;
    this.resetForm();
    this.showModal = true;
  }

  editMaintenance(maintenance: Mantenimiento) {
    this.editingMaintenance = maintenance;
    this.form.patchValue({
      equipmentId: maintenance.equipmentId,
      type: maintenance.type,
      scheduledDate: maintenance.scheduledDate,
      notes: maintenance.notes || ''
    });
    this.showModal = true;
  }

  viewMaintenance(maintenance: Mantenimiento) {
    this.selectedMaintenanceDetails = maintenance;
    this.showDetailsModal = true;
  }

  closeModal(event?: Event) {
    if (event && (event.target as HTMLElement).classList.contains('modal')) {
      this.showModal = false;
    } else if (!event) {
      this.showModal = false;
    }
    this.resetForm();
    this.editingMaintenance = null;
  }

  closeDetailsModal(event?: Event) {
    if (event && (event.target as HTMLElement).classList.contains('modal')) {
      this.showDetailsModal = false;
    } else if (!event) {
      this.showDetailsModal = false;
    }
    this.selectedMaintenanceDetails = null;
  }

  private resetForm() {
    this.form.reset({
      type: 'preventivo'
    });
    this.setDefaultDate();
    this.saving = false;
    this.selectedEquipment = null;
  }

  // Filter methods
  applyFilters() {
    this.filteredMantenimientos = this.mantenimientos.filter(m => {
      const statusMatch = !this.statusFilter || m.status === this.statusFilter;
      const typeMatch = !this.typeFilter || m.type === this.typeFilter;
      return statusMatch && typeMatch;
    });
  }

  // Statistics methods
  getCountByStatus(status: string): number {
    return this.mantenimientos.filter(m => m.status === status).length;
  }

  getPreventiveMaintenanceDue(): number {
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

    return this.mantenimientos.filter(m => {
      if (m.status !== 'programado' || m.type !== 'preventivo') return false;
      const scheduledDate = new Date(m.scheduledDate);
      return scheduledDate <= sevenDaysFromNow;
    }).length;
  }

  // Utility methods
  trackByMaintenanceId(index: number, maintenance: Mantenimiento): string {
    return maintenance.id;
  }

  getStatusClass(status: string): string {
    const baseClass = 'status-badge';
    switch (status) {
      case 'programado':
        return `${baseClass} status-programado`;
      case 'en-proceso':
        return `${baseClass} status-en-proceso`;
      case 'completado':
        return `${baseClass} status-completado`;
      default:
        return baseClass;
    }
  }

  getStatusText(status: string): string {
    switch (status) {
      case 'programado':
        return 'Programado';
      case 'en-proceso':
        return 'En Proceso';
      case 'completado':
        return 'Completado';
      default:
        return status;
    }
  }

  getLastMaintenanceDate(equipmentId: string): string | null {
    const completedMaintenances = this.mantenimientos
      .filter(m => m.equipmentId === equipmentId && m.status === 'completado' && m.performedDate)
      .sort((a, b) => new Date(b.performedDate!).getTime() - new Date(a.performedDate!).getTime());

    return completedMaintenances.length > 0 ? completedMaintenances[0].performedDate! : null;
  }

  // Alert methods
  showAlertDetails(alertType: string) {
    let message = '';
    switch (alertType) {
      case 'critical':
        message = 'Alerta Crítica:\n\nSe han detectado equipos que requieren mantenimiento urgente.\n\n• Más de 1500 horas de uso\n• Signos de desgaste excesivo\n• Recomendación: Programar mantenimiento inmediatamente';
        break;
      case 'preventive':
        message = `Mantenimiento Preventivo:\n\n${this.getPreventiveMaintenanceDue()} equipos requieren mantenimiento preventivo en los próximos 7 días.\n\nRecomendación: Programar mantenimientos preventivos para evitar fallos.`;
        break;
      case 'completed':
        message = `Mantenimientos Completados:\n\n${this.getCountByStatus('completado')} mantenimientos completados este mes.\n\nRendimiento del equipo de mantenimiento: Excelente`;
        break;
      default:
        message = 'Información de mantenimiento disponible.';
    }
    alert(message);
  }

  generateReport() {
    alert('Función de generación de reportes - En desarrollo\n\nEsta funcionalidad permitirá:\n• Exportar datos a Excel/PDF\n• Gráficos de rendimiento\n• Análisis de tendencias');
  }

  // Message methods
  private showSuccessMessage(message: string) {
    // You might want to implement a proper toast/snackbar service
    alert(message);
  }

  private showErrorMessage(message: string) {
    alert(`Error: ${message}`);
  }

  // Legacy method for compatibility
  estadoClase(m: Mantenimiento) {
    return {
      'status-badge': true,
      'status-prestado': m.status === 'en-proceso',
      'status-disponible': m.status === 'completado',
      'status-mantto': m.status === 'programado'
    };
  }
}
