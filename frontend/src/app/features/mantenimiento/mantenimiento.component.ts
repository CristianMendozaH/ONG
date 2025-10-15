import { Component, OnInit, inject, Pipe, PipeTransform } from '@angular/core';
import { CommonModule, DatePipe, TitleCasePipe } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { HttpErrorResponse } from '@angular/common/http';

import { MantenimientoService, Mantenimiento, CrearMantDTO, AlertaPredictiva } from './mantenimiento.service';
import { EquiposService, Equipo } from '../equipos/equipos.service';

// Interfaz para la estructura del objeto Toast
interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error';
}

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

  toasts: Toast[] = [];
  mantenimientos: Mantenimiento[] = [];
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
  selectedEquipment: Equipo | null = null;
  form: FormGroup;
  completeForm: FormGroup;

  constructor() {
    this.form = this.fb.group({
      equipmentId: ['', Validators.required],
      type: ['preventivo', Validators.required],
      priority: ['media', Validators.required],
      scheduledDate: ['', Validators.required],
      description: [''],
    });

    this.completeForm = this.fb.group({
      performedDate: ['', Validators.required],
      notes: ['']
    });
  }

  ngOnInit(): void {
    this.loadAllData();
    this.setDefaultDate();
    this.form.get('equipmentId')?.valueChanges.subscribe(equipmentId => {
      this.selectedEquipment = this.equipos.find(e => e.id === equipmentId) || null;
    });
  }

  get alertsCount(): number {
    return this.alertas.length;
  }

  private showToast(message: string, type: 'success' | 'error'): void {
    const id = Date.now();
    this.toasts.push({ id, message, type });
    setTimeout(() => this.removeToast(id), 5000);
  }

  removeToast(id: number): void {
    this.toasts = this.toasts.filter(toast => toast.id !== id);
  }

  private setDefaultDate(): void {
    const today = new Date().toISOString().slice(0, 10);
    this.form.patchValue({ scheduledDate: today });
  }

  loadAllData(): void {
    this.loading = true;
    this.error = '';
    // Cargar equipos primero para que la lista esté disponible
    this.equiposSvc.list().subscribe({
      next: (equipos) => {
        this.equipos = equipos;
        this.loadMaintenances(); // Cargar mantenimientos después
      },
      error: (e: HttpErrorResponse) => {
        this.error = 'No se pudieron cargar los equipos.';
        this.showToast(this.error, 'error');
        this.loading = false;
      }
    });
  }

  loadMaintenances(): void {
    const currentFilters = { status: this.statusFilter, type: this.typeFilter };
    this.mantSvc.list(currentFilters).subscribe({
      next: (res) => {
        // 1. Creamos un mapa para buscar equipos de forma eficiente por su ID.
        const equiposMap = new Map(this.equipos.map(e => [e.id, e]));

        // 2. Usamos .map() para crear un nuevo arreglo de mantenimientos.
        //    Para cada mantenimiento, buscamos su equipo en el mapa y lo adjuntamos.
        const maintenancesWithEquipment = res.map(mant => ({
          ...mant,
          equipment: equiposMap.get(mant.equipmentId) // Aquí adjuntamos el objeto equipo
        }));

        // Ahora trabajamos con el arreglo que ya tiene los datos combinados
        const sorted = maintenancesWithEquipment.sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime());

        this.mantenimientos = sorted.map((item, index) => ({
          ...item,
          displayId: `MA-${String(index + 1).padStart(4, '0')}`
        }));

        this.generarAlertasDinamicas();
        this.updateAvailableEquipmentList();
        this.loading = false;
      },
      error: (e: HttpErrorResponse) => {
        this.error = e?.error?.message || 'No se pudo cargar la lista de mantenimientos.';
        this.showToast(this.error, 'error');
        this.loading = false;
      }
    });
  }

  private updateAvailableEquipmentList(): void {
    const busyEquipmentIds = new Set(
      this.mantenimientos
        .filter(m => m.status === 'programado' || m.status === 'en-proceso')
        .map(m => m.equipmentId)
    );

    this.availableEquipos = this.equipos.filter(eq => {
      const isStateValid = eq.status === 'disponible' || eq.status === 'dañado';
      const isNotBusy = !busyEquipmentIds.has(eq.id);
      return isStateValid && isNotBusy;
    });

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

  guardarMantenimiento(): void {
    if (this.form.invalid) {
      this.showToast('Por favor, complete todos los campos requeridos.', 'error');
      return;
    }
    this.saving = true;
    const formValue = this.form.value as CrearMantDTO;

    const operation = this.editingMaintenance
      ? this.mantSvc.update(this.editingMaintenance.id, formValue)
      : this.mantSvc.create(formValue);

    operation.subscribe({
      next: () => {
        const message = this.editingMaintenance ? 'Mantenimiento actualizado' : 'Mantenimiento programado';
        this.showToast(`${message} exitosamente.`, 'success');
        this.closeModal();
        this.loadAllData();
      },
      error: (e: HttpErrorResponse) => {
        this.showToast(e?.error?.message || `No se pudo guardar el mantenimiento.`, 'error');
      },
      complete: () => {
        this.saving = false;
      }
    });
  }

  iniciarMantenimiento(m: Mantenimiento): void {
    this.mantSvc.start(m.id).subscribe({
      next: () => {
        this.showToast('El mantenimiento ha iniciado.', 'success');
        this.loadAllData();
      },
      error: (e: HttpErrorResponse) => this.showToast(e?.error?.message || 'No se pudo iniciar el mantenimiento.', 'error')
    });
  }

  submitCompletion(): void {
    if (this.completeForm.invalid || !this.maintenanceToComplete) {
      return;
    }
    const { performedDate, notes } = this.completeForm.value;
    this.mantSvc.complete(this.maintenanceToComplete.id, performedDate, notes).subscribe({
      next: () => {
        this.showToast('Mantenimiento marcado como completado.', 'success');
        this.closeCompleteModal();
        this.loadAllData();
      },
      error: (e: HttpErrorResponse) => this.showToast(e?.error?.message || 'No se pudo marcar como completado.', 'error')
    });
  }

  openMaintenanceModal(): void {
    this.editingMaintenance = null;
    this.updateAvailableEquipmentList();
    this.resetForm();
    this.showModal = true;
  }

  editMaintenance(maintenance: Mantenimiento): void {
    this.editingMaintenance = maintenance;
    this.updateAvailableEquipmentList();
    this.form.patchValue({
      equipmentId: maintenance.equipmentId,
      type: maintenance.type,
      priority: maintenance.priority || 'media',
      scheduledDate: new Date(maintenance.scheduledDate).toISOString().split('T')[0],
      description: maintenance.description || ''
    });
    this.showModal = true;
  }

  viewMaintenance(maintenance: Mantenimiento): void {
    this.selectedMaintenanceDetails = maintenance;
    this.selectedMaintenanceDisplayId = maintenance.displayId || null;
    this.showDetailsModal = true;
  }

  openCompleteModal(m: Mantenimiento): void {
    this.maintenanceToComplete = m;
    this.completeForm.patchValue({
      performedDate: new Date().toISOString().slice(0, 10),
      notes: ''
    });
    this.showCompleteModal = true;
  }

  closeCompleteModal(event?: Event): void {
    if (event && (event.target as HTMLElement).classList.contains('modal-overlay')) {
      this.showCompleteModal = false;
    } else if (!event) {
      this.showCompleteModal = false;
    }
    this.maintenanceToComplete = null;
  }

  closeModal(event?: Event): void {
    if (event && (event.target as HTMLElement).classList.contains('modal-overlay')) {
      this.showModal = false;
    } else if (!event) {
      this.showModal = false;
    }
  }

  closeDetailsModal(event?: Event): void {
    if (event && (event.target as HTMLElement).classList.contains('modal-overlay')) {
      this.showDetailsModal = false;
    } else if (!event) {
      this.showDetailsModal = false;
    }
    this.selectedMaintenanceDetails = null;
  }

  private resetForm(): void {
    this.form.reset({ type: 'preventivo', priority: 'media' });
    this.setDefaultDate();
    this.saving = false;
    this.selectedEquipment = null;
    this.editingMaintenance = null;
  }

  getCountByStatus(status: string): number {
    return this.mantenimientos.filter(m => m.status === status).length;
  }

  trackByMaintenanceId(index: number, maintenance: Mantenimiento): string {
    return maintenance.id;
  }

  getStatusClass(status: string): string {
    const statusClassMap: { [key: string]: string } = {
      'programado': 'status-programado',
      'en-proceso': 'status-en-proceso',
      'completado': 'status-completado',
      'cancelado': 'status-cancelado'
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

  generarAlertasDinamicas(): void {
    this.alertas = [];
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

    const preventivosProximos = this.mantenimientos.filter(m => {
      if (m.status !== 'programado' || m.type !== 'preventivo') return false;
      const scheduledDate = new Date(m.scheduledDate);
      return scheduledDate <= sevenDaysFromNow;
    }).length;

    if (preventivosProximos > 0) {
      this.alertas.push({
        tipo: 'warning',
        titulo: 'Mantenimiento Preventivo Próximo',
        descripcion: `${preventivosProximos} equipo(s) requieren mant. preventivo en los próximos 7 días.`,
        meta: 'Actualizado ahora'
      });
    }

    const urgentes = this.mantenimientos.filter(m => m.priority === 'alta' && m.status !== 'completado').length;
    if (urgentes > 0) {
      this.alertas.push({
        tipo: 'critical',
        titulo: 'Mantenimiento Urgente Requerido',
        descripcion: `Hay ${urgentes} órden(es) de mantenimiento con prioridad alta.`,
        meta: 'Requiere atención'
      });
    }
  }
}
