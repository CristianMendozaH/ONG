import { Component, OnInit, inject, Pipe, PipeTransform } from '@angular/core';
import { CommonModule, DatePipe, TitleCasePipe } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

import { MantenimientoService, Mantenimiento, CrearMantDTO, AlertaPredictiva, UpdateMantDTO } from './mantenimiento.service';
import { EquiposService, Equipo } from '../equipos/equipos.service';

@Pipe({
  name: 'nl2br',
  standalone: true
})
export class Nl2brPipe implements PipeTransform {
  constructor(private sanitizer: DomSanitizer) {}
  transform(value: string | null | undefined): SafeHtml {
    if (!value) return '';
    const brValue = value.replace(/(\r\n|\n|\r)/g, '<br/>');
    return this.sanitizer.bypassSecurityTrustHtml(brValue);
  }
}

@Component({
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, ReactiveFormsModule, DatePipe, TitleCasePipe, Nl2brPipe],
  templateUrl: './mantenimiento.component.html',
  styleUrl: './mantenimiento.component.scss'
})
export class MantenimientoComponent implements OnInit {
  private fb = inject(FormBuilder);
  private mantSvc = inject(MantenimientoService);
  private equiposSvc = inject(EquiposService);

  notificationMessage = '';
  notificationType: 'success' | 'error' = 'success';
  showNotification = false;

  mantenimientos: Mantenimiento[] = [];
  filteredMantenimientos: Mantenimiento[] = [];
  equipos: Equipo[] = [];
  availableEquipos: Equipo[] = [];
  alertas: AlertaPredictiva[] = [];

  loading = false;
  error = '';
  saving = false;

  showModal = false;
  showDetailsModal = false;
  showCompleteModal = false;
  editingMaintenance: Mantenimiento | null = null;
  maintenanceToComplete: Mantenimiento | null = null;
  selectedMaintenanceDetails: Mantenimiento | null = null;
  selectedMaintenanceDisplayId: string | null = null;

  statusFilter = '';
  typeFilter = '';

  get alertsCount(): number {
    return this.alertas.length;
  }
  selectedEquipment: Equipo | null = null;

  form: FormGroup;
  completeForm: FormGroup;

  constructor() {
    this.form = this.fb.group({
      equipmentId: ['', Validators.required],
      type: ['preventivo', Validators.required],
      priority: ['media', Validators.required],
      scheduledDate: ['', Validators.required],
      description: [''], // <-- CAMBIO: de 'notes' a 'description'
    });

    this.completeForm = this.fb.group({
      performedDate: ['', Validators.required],
      completionNotes: ['']
    });
  }

  ngOnInit() {
    this.load();
    this.loadEquipos();
    this.setDefaultDate();

    this.form.get('equipmentId')?.valueChanges.subscribe(equipmentId => {
      this.selectedEquipment = this.equipos.find(e => e.id === equipmentId) || null;
    });
  }

  private setDefaultDate() {
    const today = new Date().toISOString().slice(0, 10);
    this.form.patchValue({ scheduledDate: today });
  }

  private loadEquipos() {
    this.equiposSvc.list().subscribe({
      next: (equipos) => {
        this.equipos = equipos;
        this.updateAvailableEquipmentList();
      },
      error: (error) => this.showErrorMessage('No se pudieron cargar los equipos.')
    });
  }

  load() {
    this.loading = true;
    this.error = '';
    this.mantSvc.list().subscribe({
      next: (res) => {
        const sortedByCreation = [...res].sort((a, b) =>
          new Date(a.createdAt || a.scheduledDate).getTime() - new Date(b.createdAt || b.scheduledDate).getTime()
        );

        const withDisplayId = sortedByCreation.map((item, index) => ({
          ...item,
          displayId: `MA${(index + 1).toString().padStart(3, '0')}`
        }));

        this.mantenimientos = withDisplayId.sort((a, b) =>
          new Date(b.createdAt || b.scheduledDate).getTime() - new Date(a.createdAt || a.scheduledDate).getTime()
        );

        this.applyFilters();
        this.generarAlertasDinamicas();
        this.updateAvailableEquipmentList();
        this.loading = false;
      },
      error: (e) => {
        this.error = e?.error?.message || 'No se pudo cargar mantenimientos';
        this.loading = false;
      }
    });
  }

  private updateAvailableEquipmentList() {
    if (!this.mantenimientos.length || !this.equipos.length) {
      this.availableEquipos = [...this.equipos];
      return;
    }

    const busyEquipmentIds = new Set(
      this.mantenimientos
        .filter(m => m.status === 'programado' || m.status === 'en-proceso')
        .map(m => m.equipmentId)
    );

    this.availableEquipos = this.equipos.filter(eq => !busyEquipmentIds.has(eq.id));

    if (this.editingMaintenance) {
      const isEditingEquipmentInList = this.availableEquipos.some(eq => eq.id === this.editingMaintenance!.equipmentId);
      if (!isEditingEquipmentInList) {
        const editingEquipment = this.equipos.find(eq => eq.id === this.editingMaintenance!.equipmentId);
        if (editingEquipment) {
          this.availableEquipos.unshift(editingEquipment);
        }
      }
    }
  }

  guardarMantenimiento() {
    if (this.form.invalid) return;
    this.saving = true;
    const formValue = this.form.value as CrearMantDTO;

    const operation = this.editingMaintenance
      ? this.mantSvc.update(this.editingMaintenance.id, formValue)
      : this.mantSvc.create(formValue);

    operation.subscribe({
      next: () => {
        const message = this.editingMaintenance ? 'Mantenimiento actualizado exitosamente' : 'Mantenimiento programado exitosamente';
        this.showSuccessMessage(message);
        this.closeModal();
        this.load();
      },
      error: (e) => {
        this.saving = false;
        const message = this.editingMaintenance ? 'No se pudo actualizar' : 'No se pudo crear';
        this.showErrorMessage(e?.error?.message || `${message} el mantenimiento`);
      }
    });
  }

  iniciarMantenimiento(m: Mantenimiento) {
    this.mantSvc.start(m.id).subscribe({
      next: (updatedMaintenance) => {
        const index = this.mantenimientos.findIndex(item => item.id === m.id);
        if (index !== -1) {
          this.mantenimientos[index] = { ...this.mantenimientos[index], ...updatedMaintenance, displayId: this.mantenimientos[index].displayId };
        }
        this.applyFilters();
        this.showSuccessMessage('El mantenimiento ha iniciado.');
      },
      error: (e) => this.showErrorMessage(e?.error?.message || 'No se pudo iniciar el mantenimiento')
    });
  }

  submitCompletion() {
    if (this.completeForm.invalid || !this.maintenanceToComplete) {
      return;
    }

    const { performedDate, completionNotes } = this.completeForm.value;
    const currentDescription = this.maintenanceToComplete.description || '';

    let updatedDescription = currentDescription;
    if (completionNotes) {
      const completionHeader = `\n\n--- COMPLETADO EL ${performedDate} ---`;
      updatedDescription = `${currentDescription}${completionHeader}\n${completionNotes}`;
    }

    const payload: UpdateMantDTO = {
      ...this.maintenanceToComplete,
      performedDate: performedDate,
      status: 'completado',
      description: updatedDescription.trim() // <-- CAMBIO: de 'notes' a 'description'
    };

    this.mantSvc.update(this.maintenanceToComplete.id, payload).subscribe({
      next: () => {
        this.showSuccessMessage('Mantenimiento marcado como completado');
        this.closeCompleteModal();
        this.load();
      },
      error: (e) => this.showErrorMessage(e?.error?.message || 'No se pudo marcar como completado')
    });
  }

  openMaintenanceModal() {
    this.editingMaintenance = null;
    this.updateAvailableEquipmentList();
    this.resetForm();
    this.showModal = true;
  }

  editMaintenance(maintenance: Mantenimiento) {
    this.editingMaintenance = maintenance;
    this.updateAvailableEquipmentList();
    this.form.patchValue({
      equipmentId: maintenance.equipmentId,
      type: maintenance.type,
      priority: maintenance.priority || 'media',
      scheduledDate: maintenance.scheduledDate.split('T')[0],
      description: maintenance.description || '' // <-- CAMBIO: de 'notes' a 'description'
    });
    this.showModal = true;
  }

  viewMaintenance(maintenance: Mantenimiento) {
    this.selectedMaintenanceDetails = maintenance;
    this.selectedMaintenanceDisplayId = maintenance.displayId || null;
    this.showDetailsModal = true;
  }

  openCompleteModal(m: Mantenimiento) {
    this.maintenanceToComplete = m;
    this.completeForm.patchValue({
      performedDate: new Date().toISOString().slice(0, 10),
      completionNotes: ''
    });
    this.showCompleteModal = true;
  }

  closeCompleteModal(event?: Event) {
    if (event && (event.target as HTMLElement).classList.contains('modal-overlay')) {
      this.showCompleteModal = false;
    } else if (!event) {
      this.showCompleteModal = false;
    }
    this.maintenanceToComplete = null;
  }

  closeModal(event?: Event) {
    if (event && (event.target as HTMLElement).classList.contains('modal-overlay')) {
      this.showModal = false;
    } else if (!event) {
      this.showModal = false;
    }
  }

  closeDetailsModal(event?: Event) {
    if (event && (event.target as HTMLElement).classList.contains('modal-overlay')) {
      this.showDetailsModal = false;
    } else if (!event) {
      this.showDetailsModal = false;
    }
    this.selectedMaintenanceDetails = null;
  }

  private resetForm() {
    this.form.reset({ type: 'preventivo', priority: 'media' });
    this.setDefaultDate();
    this.saving = false;
    this.selectedEquipment = null;
    this.editingMaintenance = null;
  }

  applyFilters() {
    this.filteredMantenimientos = this.mantenimientos.filter(m => {
      const statusMatch = !this.statusFilter || m.status === this.statusFilter;
      const typeMatch = !this.typeFilter || m.type === this.typeFilter;
      return statusMatch && typeMatch;
    });
  }

  getCountByStatus(status: string): number {
    return this.mantenimientos.filter(m => m.status === status).length;
  }

  getPreventiveMaintenanceDue(): number {
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return this.mantenimientos.filter(m => {
      if (m.status !== 'programado' || m.type !== 'preventivo') return false;
      const scheduledDate = new Date(m.scheduledDate);
      return scheduledDate >= today && scheduledDate <= sevenDaysFromNow;
    }).length;
  }

  trackByMaintenanceId(index: number, maintenance: Mantenimiento): string {
    return maintenance.id;
  }

  getStatusClass(status: string): string {
    const statusClassMap: { [key: string]: string } = {
      'programado': 'status-programado',
      'en-proceso': 'status-en-proceso',
      'completado': 'status-completado'
    };
    return `status-badge ${statusClassMap[status] || ''}`;
  }

  getStatusText(status: string): string {
    return status.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase());
  }

  getLastMaintenanceDate(equipmentId: string): string | null {
    const completedMaintenances = this.mantenimientos
      .filter(m => m.equipmentId === equipmentId && m.status === 'completado' && m.performedDate)
      .sort((a, b) => new Date(b.performedDate!).getTime() - new Date(a.performedDate!).getTime());

    return completedMaintenances.length > 0 ? completedMaintenances[0].performedDate! : null;
  }

  generarAlertasDinamicas() {
      this.alertas = [];

      const preventivosProximos = this.getPreventiveMaintenanceDue();
      if (preventivosProximos > 0) {
        this.alertas.push({
          tipo: 'warning',
          titulo: 'Mantenimiento Preventivo Próximo',
          descripcion: `${preventivosProximos} equipo${preventivosProximos > 1 ? 's' : ''} requieren mant. preventivo en los próximos 7 días.`,
          meta: 'Actualizado ahora'
        });
      }

      const urgentes = this.mantenimientos.filter(m => m.priority === 'alta' && m.status !== 'completado').length;
      if (urgentes > 0) {
        this.alertas.push({
          tipo: 'critical',
          titulo: 'Mantenimiento Urgente Requerido',
          descripcion: `Hay ${urgentes} órden${urgentes > 1 ? 'es' : ''} de mantenimiento con prioridad alta.`,
          meta: 'Requiere atención'
        });
      }

      const completadosEsteMes = this.mantenimientos.filter(m => {
          if (m.status !== 'completado' || !m.performedDate) return false;
          const fechaRealizado = new Date(m.performedDate);
          const hoy = new Date();
          return fechaRealizado.getMonth() === hoy.getMonth() && fechaRealizado.getFullYear() === hoy.getFullYear();
      }).length;

      if (completadosEsteMes > 0) {
         this.alertas.push({
            tipo: 'info',
            titulo: 'Mantenimientos Completados',
            descripcion: `${completadosEsteMes} mantenimientos completados este mes. ¡Buen trabajo!`,
            meta: 'Este mes'
        });
      }
  }

  private showNotificationMessage(message: string, type: 'success' | 'error') {
    this.notificationMessage = message;
    this.notificationType = type;
    this.showNotification = true;
    setTimeout(() => this.showNotification = false, 3000);
  }

  private showSuccessMessage(message: string) {
    this.showNotificationMessage(message, 'success');
  }

  private showErrorMessage(message: string) {
    this.showNotificationMessage(message, 'error');
  }
}
