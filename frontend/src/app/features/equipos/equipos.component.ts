// Archivo completo: src/app/features/equipos/equipos.component.ts

import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { EquiposService, Equipo } from './equipos.service';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';
import { DataRefreshService } from '../../services/data-refresh.service';
import { UserStore } from '../../core/stores/user.store';

interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error';
}

@Component({
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './equipos.component.html',
  styleUrls: ['./equipos.component.scss']
})
export class EquiposComponent implements OnInit, OnDestroy {
  equipos: Equipo[] = [];
  loading = false;
  error = '';

  // Filtros
  search = '';
  status = '';
  type = '';

  // Modales
  showAddEditModal = false;
  showViewModal = false;
  showDeleteModal = false;
  showQRModal = false;
  showPrintModal = false;

  // Estados del modal
  isEditMode = false;
  modalTitle = '';
  equipoSeleccionado: Equipo | null = null;
  qrUrl: string | null = null;

  // Formulario
  equipmentForm = {
    id: '',
    code: '',
    name: '',
    serial: '',
    type: '',
    status: 'disponible' as any,
    description: ''
  };

  availableTypes = [
    { value: 'Laptop', label: 'Laptop' },
    { value: 'PC / Gabinete', label: 'PC / Gabinete' },
    { value: 'Proyector', label: 'Proyector' },
    { value: 'Tablet', label: 'Tablet' },
    { value: 'Cámara', label: 'Cámara' },
    { value: 'Monitor', label: 'Monitor' },
    { value: 'Impresora', label: 'Impresora' },
    { value: 'Equipo de Red', label: 'Equipo de Red' },
    { value: 'UPS / Regulador', label: 'UPS / Regulador' },
    { value: 'Otro', label: 'Otro' }
  ];

  // ✅ Lista para los filtros de la tabla (incluye todos los estados)
  availableStatuses = [
    { value: 'disponible', label: 'Disponible' },
    { value: 'prestado', label: 'Prestado' },
    { value: 'asignado', label: 'Asignado' },
    { value: 'mantenimiento', label: 'Mantenimiento' },
    { value: 'dañado', label: 'Dañado' },
    { value: 'donado', label: 'Donado' }
  ];

  // ✅ Nueva lista, solo para el formulario (excluye estados automáticos)
  formStatuses = this.availableStatuses.filter(s =>
    ['disponible', 'mantenimiento', 'dañado'].includes(s.value)
  );

  private searchSubject = new Subject<string>();
  private destroy$ = new Subject<void>();
  toasts: Toast[] = [];

  equiposParaImprimir = new Set<string>();

  readonly CODE_PREFIX = 'EQ';
  readonly CODE_PAD = 3;

  constructor(
    private equiposSvc: EquiposService,
    private dataRefreshService: DataRefreshService,
    private router: Router,
    private userStore: UserStore
  ) {
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.aplicarFiltros();
    });
  }

  ngOnInit() {
    this.load();
    this.dataRefreshService.refreshNeeded$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.load();
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.qrUrl) {
      URL.revokeObjectURL(this.qrUrl);
    }
  }

  load() {
    this.loading = true;
    this.error = '';
    const params = { search: this.search.trim(), status: this.status, type: this.type };
    this.equiposSvc.list(params).subscribe({
      next: (data) => {
        this.equipos = data;
        this.loading = false;
      },
      error: (err) => {
        this.error = err?.error?.message || 'No se pudo cargar la lista de equipos';
        this.loading = false;
      }
    });
  }

  onSearchChange() {
    this.searchSubject.next(this.search);
  }

  onFilterChange() {
    this.aplicarFiltros();
  }

  aplicarFiltros() {
    this.load();
  }

  clearFilters() {
    this.search = '';
    this.status = '';
    this.type = '';
    this.load();
  }

  private parseCode(code?: string | null): number | null {
    if (!code) return null;
    const re = new RegExp(`^${this.CODE_PREFIX}(\\d+)$`, 'i');
    const m = code.trim().toUpperCase().match(re);
    return m ? Number(m[1]) : null;
  }

  private getNextCode(): string {
    let max = 0;
    for (const e of this.equipos) {
      const n = this.parseCode(e?.code);
      if (typeof n === 'number' && Number.isFinite(n) && n > max) {
        max = n;
      }
    }
    const next = String(max + 1).padStart(this.CODE_PAD, '0');
    return `${this.CODE_PREFIX}${next}`;
  }

  ensureUniqueCode(): void {
    const current = (this.equipmentForm.code || '').trim().toUpperCase();
    if (!current) {
      this.equipmentForm.code = this.getNextCode();
      return;
    }
    const exists = this.equipos.some(e => (e.code || '').toUpperCase() === current);
    if (exists) this.equipmentForm.code = this.getNextCode();
  }

  closeModal() {
    this.showAddEditModal = false;
    this.showViewModal = false;
    this.showDeleteModal = false;
    this.showQRModal = false;
    this.showPrintModal = false;
    this.equipoSeleccionado = null;
    this.resetForm();

    if (this.qrUrl) {
      URL.revokeObjectURL(this.qrUrl);
      this.qrUrl = null;
    }
  }

  resetForm() {
    this.equipmentForm = { id: '', code: '', name: '', serial: '', type: '', status: 'disponible', description: '' };
  }

  agregarEquipo() {
    this.isEditMode = false;
    this.modalTitle = 'Agregar Nuevo Equipo';
    this.resetForm();
    this.equipmentForm.code = this.getNextCode();
    this.showAddEditModal = true;
  }

  editarEquipo(equipo: Equipo) {
    this.isEditMode = true;
    this.modalTitle = 'Editar Equipo';
    this.equipoSeleccionado = equipo;
    this.equipmentForm = { ...equipo, description: equipo.description || '', serial: equipo.serial || '' };
    this.showAddEditModal = true;
  }

  verEquipo(equipo: Equipo) {
    this.equipoSeleccionado = equipo;
    this.showViewModal = true;
  }

  eliminar(equipo: Equipo) {
    this.equipoSeleccionado = equipo;
    this.showDeleteModal = true;
  }

  confirmarEliminacion() {
    if (!this.equipoSeleccionado) return;
    this.equiposSvc.remove(this.equipoSeleccionado.id).subscribe({
      next: () => {
        this.showSuccess('Equipo eliminado correctamente');
        this.closeModal();
        this.load();
      },
      error: (err) => this.showError(err?.error?.message || 'No se pudo eliminar el equipo')
    });
  }

  guardarEquipo() {
    if (!this.equipmentForm.name || !this.equipmentForm.type || !this.equipmentForm.status) {
      this.showError('Por favor complete todos los campos obligatorios');
      return;
    }

    const equipoData: Partial<Equipo> = { ...this.equipmentForm };

    if (!this.isEditMode) {
      this.equipmentForm.code = this.equipmentForm.code?.trim() ? this.equipmentForm.code : this.getNextCode();
      this.ensureUniqueCode();

      const currentUser = this.userStore.currentUser();

      if (!currentUser) {
        this.showError('No se pudo identificar al usuario. Por favor, inicie sesión de nuevo.');
        return;
      }

      equipoData.createdBy = currentUser.id;
    }

    const action = this.isEditMode && this.equipoSeleccionado
      ? this.equiposSvc.update(this.equipoSeleccionado.id, equipoData)
      : this.equiposSvc.create(equipoData);

    action.subscribe({
      next: () => {
        const message = this.isEditMode ? 'actualizado' : 'creado';
        this.showSuccess(`Equipo ${message} correctamente`);
        this.closeModal();
        this.load();
      },
      error: (err) => {
        const message = this.isEditMode ? 'actualizar' : 'crear';
        this.showError(err?.error?.message || `No se pudo ${message} el equipo`);
      }
    });
  }

  editarDesdeVista() {
    if (this.equipoSeleccionado) {
      const equipoParaEditar = this.equipoSeleccionado;
      this.closeModal();
      setTimeout(() => this.editarEquipo(equipoParaEditar), 50);
    }
  }

  verQR(equipo: Equipo) {
    this.equipoSeleccionado = equipo;
    this.qrUrl = null;
    this.showQRModal = true;
    this.equiposSvc.qr(equipo.id).subscribe({
      next: (blob) => this.qrUrl = URL.createObjectURL(blob),
      error: (err) => this.showError(err?.error?.message || 'No se pudo generar el código QR')
    });
  }

  descargarQR() {
    if (!this.qrUrl || !this.equipoSeleccionado) return;
    const link = document.createElement('a');
    link.href = this.qrUrl;
    link.download = `QR_${this.equipoSeleccionado.code}_${this.equipoSeleccionado.name}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  abrirModalImprimir() {
    this.equiposParaImprimir.clear();
    this.showPrintModal = true;
  }

  toggleEquipoParaImprimir(equipoId: string) {
    if (this.equiposParaImprimir.has(equipoId)) {
      this.equiposParaImprimir.delete(equipoId);
    } else {
      this.equiposParaImprimir.add(equipoId);
    }
  }

  generarHojaDeImpresion() {
    if (this.equiposParaImprimir.size === 0) return;
    const ids = Array.from(this.equiposParaImprimir).join(',');
    const url = this.router.serializeUrl(
      this.router.createUrlTree(['/equipos/print'], { queryParams: { ids } })
    );
    window.open(url, '_blank');
    this.closeModal();
  }

  showToast(message: string, type: 'success' | 'error' = 'success', duration: number = 4000) {
    const id = Date.now();
    this.toasts.push({ id, message, type });
    setTimeout(() => this.removeToast(id), duration);
  }

  removeToast(id: number) {
    this.toasts = this.toasts.filter(toast => toast.id !== id);
  }

  showSuccess(message: string) {
    this.showToast(message, 'success');
  }

  showError(message: string) {
    this.showToast(message, 'error', 5000);
  }

  trackByEquipo(index: number, equipo: Equipo): string {
    return equipo.id;
  }

  // ✅ FUNCIÓN ACTUALIZADA
  getStatusLabel(status: string): string {
    const statusMap: Record<string, string> = {
      'disponible': 'Disponible', 'prestado': 'Prestado', 'dañado': 'Dañado',
      'asignado': 'Asignado',
      'mantenimiento': 'Mantenimiento',
      'donado': 'Donado',
    };
    return statusMap[status] || status;
  }

  // ✅ FUNCIÓN ACTUALIZADA
  getStatusClass(status: string): string {
    const classMap: Record<string, string> = {
      'disponible': 'status-disponible', 'prestado': 'status-prestado', 'dañado': 'status-danado',
      'asignado': 'status-asignado',
      'mantenimiento': 'status-mantenimiento',
      'donado': 'status-donado',
    };
    return classMap[status] || 'status-disponible';
  }

  getTypeLabel(type: string): string {
    const typeMap: Record<string, string> = {
      'laptop': 'Laptop', 'projector': 'Proyector', 'tablet': 'Tablet',
      'camera': 'Cámara', 'monitor': 'Monitor', 'printer': 'Impresora',
      'network': 'Equipo de Red', 'pc': 'PC / Gabinete', 'other': 'Otro',
      'ups': 'UPS / Regulador'
    };
    return typeMap[type] || type.charAt(0).toUpperCase() + type.slice(1);
  }
}
