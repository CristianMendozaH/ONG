import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { EquiposService, Equipo } from './equipos.service';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';
import { DataRefreshService } from '../../services/data-refresh.service'; // Asegúrate que la ruta sea correcta

@Component({
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './equipos.component.html',
  styleUrl: './equipos.component.scss'
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
    type: '',
    status: 'disponible' as any, // Se usa 'any' para compatibilidad con estados de mantenimiento
    description: ''
  };

  // Tipos disponibles
  availableTypes = [
    { value: 'laptop', label: 'Laptop' },
    { value: 'projector', label: 'Proyector' },
    { value: 'tablet', label: 'Tablet' },
    { value: 'camera', label: 'Cámara' },
    { value: 'monitor', label: 'Monitor' },
    { value: 'printer', label: 'Impresora' }
  ];

  // Estados disponibles para el filtro
  availableStatuses = [
    { value: 'disponible', label: 'Disponible' },
    { value: 'prestado', label: 'Prestado' },
    { value: 'mantenimiento', label: 'Mantenimiento' },
    { value: 'dañado', label: 'Dañado' }
  ];

  // Search debouncing
  private searchSubject = new Subject<string>();
  private destroy$ = new Subject<void>();

  // Mensajería de éxito / error
  showSuccessMessage = false;
  successText = '';
  showErrorMessage = false;
  errorText = '';
  private hideTimer?: any;

  // ====== Config correlativo de código ======
  readonly CODE_PREFIX = 'EQ';
  readonly CODE_PAD = 3;

  constructor(
    private equiposSvc: EquiposService,
    private dataRefreshService: DataRefreshService // Inyectar el servicio de refresco
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
    this.load(); // Carga inicial de datos

    // Suscribirse a las notificaciones para recargar la lista cuando sea necesario
    this.dataRefreshService.refreshNeeded$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        console.log('Notificación recibida: Recargando lista de equipos...');
        this.load();
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.qrUrl) {
      URL.revokeObjectURL(this.qrUrl);
    }
    clearTimeout(this.hideTimer);
  }

  // ===== FUNCIONES DE CARGA =====
  load() {
    this.loading = true;
    this.error = '';

    const params = {
      search: this.search.trim(),
      status: this.status,
      type: this.type
    };

    this.equiposSvc.list(params).subscribe({
      next: (data) => {
        this.equipos = data;
        this.loading = false;
      },
      error: (err) => {
        this.error = err?.error?.message || 'No se pudo cargar la lista de equipos';
        this.loading = false;
        console.error('Error cargando equipos:', err);
      }
    });
  }

  // ===== FUNCIONES DE FILTRADO =====
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

  // ====== Correlativo de código (frontend) ======
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

  // ===== FUNCIONES DE MODAL =====
  closeModal() {
    this.showAddEditModal = false;
    this.showViewModal = false;
    this.showDeleteModal = false;
    this.showQRModal = false;
    this.equipoSeleccionado = null;
    this.resetForm();

    if (this.qrUrl) {
      URL.revokeObjectURL(this.qrUrl);
      this.qrUrl = null;
    }
  }

  resetForm() {
    this.equipmentForm = {
      id: '',
      code: '',
      name: '',
      type: '',
      status: 'disponible',
      description: ''
    };
  }

  // ===== FUNCIONES DE EQUIPOS =====
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
    this.equipmentForm = { ...equipo, description: equipo.description || '' };
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
      error: (err) => {
        const errorMessage = err?.error?.message || 'No se pudo eliminar el equipo';
        this.showError(errorMessage);
        console.error('Error eliminando equipo:', err);
      }
    });
  }

  guardarEquipo() {
    if (!this.equipmentForm.name || !this.equipmentForm.type || !this.equipmentForm.status) {
      this.showError('Por favor complete todos los campos obligatorios');
      return;
    }

    if (!this.isEditMode) {
      if (!this.equipmentForm.code?.trim()) {
        this.equipmentForm.code = this.getNextCode();
      } else {
        this.ensureUniqueCode();
      }
    }

    const equipoData: Partial<Equipo> = { ...this.equipmentForm };

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
        const errorMessage = err?.error?.message || `No se pudo ${message} el equipo`;
        this.showError(errorMessage);
        console.error(`Error al ${message} equipo:`, err);
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

  // ===== FUNCIONES DE QR =====
  verQR(equipo: Equipo) {
    this.equipoSeleccionado = equipo;
    this.qrUrl = null;

    this.equiposSvc.qr(equipo.id).subscribe({
      next: (blob) => {
        this.qrUrl = URL.createObjectURL(blob);
        this.showQRModal = true;
      },
      error: (err) => {
        this.showError(err?.error?.message || 'No se pudo generar el código QR');
        console.error('Error generando QR:', err);
      }
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

  // ===== FUNCIONES DE UTILIDAD =====
  showSuccess(message: string, seconds = 3) {
    this.successText = message;
    this.showSuccessMessage = true;
    clearTimeout(this.hideTimer);
    this.hideTimer = setTimeout(() => (this.showSuccessMessage = false), seconds * 1000);
  }

  showError(message: string, seconds = 4) {
    this.errorText = message;
    this.showErrorMessage = true;
    clearTimeout(this.hideTimer);
    this.hideTimer = setTimeout(() => (this.showErrorMessage = false), seconds * 1000);
  }

  trackByEquipo(index: number, equipo: Equipo): string {
    return equipo.id;
  }

  getStatusLabel(status: string): string {
    const statusMap: Record<string, string> = {
      'disponible': 'Disponible',
      'prestado': 'Prestado',
      'dañado': 'Dañado',
      'mantenimiento': 'Mantenimiento',
      'programado': 'Mantenimiento',
      'en-proceso': 'Mantenimiento',
    };
    return statusMap[status] || status;
  }

  getStatusClass(status: string): string {
    const classMap: Record<string, string> = {
      'disponible': 'status-disponible',
      'prestado': 'status-prestado',
      'dañado': 'status-danado',
      'mantenimiento': 'status-mantenimiento',
      'programado': 'status-mantenimiento',
      'en-proceso': 'status-mantenimiento',
    };
    return classMap[status] || 'status-disponible';
  }

  getTypeLabel(type: string): string {
    const typeMap: Record<string, string> = {
      'laptop': 'Laptop',
      'projector': 'Proyector',
      'tablet': 'Tablet',
      'camera': 'Cámara',
      'monitor': 'Monitor',
      'printer': 'Impresora',
    };
    return typeMap[type] || type.charAt(0).toUpperCase() + type.slice(1);
  }
}
