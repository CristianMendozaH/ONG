import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { EquiposService, Equipo } from './equipos.service';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';

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
    status: 'disponible' as Equipo['status'],
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

  // Estados disponibles
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
  readonly CODE_PREFIX = 'EQ';  // cambia si usas otro prefijo
  readonly CODE_PAD = 3;        // EQ + 3 dígitos => EQ001

  constructor(private equiposSvc: EquiposService) {
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

  /** Extrae el número del código (EQ004 -> 4). Si no matchea, retorna null */
  private parseCode(code?: string | null): number | null {
    if (!code) return null;
    const re = new RegExp(`^${this.CODE_PREFIX}(\\d+)$`, 'i');
    const m = code.trim().toUpperCase().match(re);
    return m ? Number(m[1]) : null;
  }

  /** Calcula el siguiente código disponible a partir de los ya cargados */
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

  /** Garantiza que el code del form no duplique uno existente */
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

    // Limpiar datos
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

    // Genera el correlativo automáticamente
    this.equipmentForm.code = this.getNextCode();

    this.showAddEditModal = true;
  }

  editarEquipo(equipo: Equipo) {
    this.isEditMode = true;
    this.modalTitle = 'Editar Equipo';
    this.equipoSeleccionado = equipo;

    // Llenar formulario
    this.equipmentForm = {
      id: equipo.id,
      code: equipo.code,
      name: equipo.name,
      type: equipo.type,
      status: equipo.status,
      description: equipo.description || ''
    };

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

    // Asegura un código válido y no duplicado cuando se crea
    if (!this.isEditMode) {
      if (!this.equipmentForm.code?.trim()) {
        this.equipmentForm.code = this.getNextCode();
      } else {
        this.ensureUniqueCode();
      }
    }

    const equipoData: Partial<Equipo> = {
      name: this.equipmentForm.name,
      type: this.equipmentForm.type,
      status: this.equipmentForm.status,
      description: this.equipmentForm.description,
      code: this.equipmentForm.code
    };

    if (this.isEditMode && this.equipoSeleccionado) {
      // Actualizar equipo existente
      this.equiposSvc.update(this.equipoSeleccionado.id, equipoData).subscribe({
        next: () => {
          this.showSuccess('Equipo actualizado correctamente');
          this.closeModal();
          this.load();
        },
        error: (err) => {
          const errorMessage = err?.error?.message || 'No se pudo actualizar el equipo';
          this.showError(errorMessage);
          console.error('Error actualizando equipo:', err);
        }
      });
    } else {
      // Crear nuevo equipo
      this.equiposSvc.create(equipoData).subscribe({
        next: () => {
          this.showSuccess('Equipo creado correctamente');
          this.closeModal();
          this.load();
        },
        error: (err) => {
          const errorMessage = err?.error?.message || 'No se pudo crear el equipo';
          this.showError(errorMessage);
          console.error('Error creando equipo:', err);
        }
      });
    }
  }

  editarDesdeVista() {
    if (this.equipoSeleccionado) {
      this.closeModal();
      setTimeout(() => {
        this.editarEquipo(this.equipoSeleccionado!);
      }, 0);
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
        const errorMessage = err?.error?.message || 'No se pudo generar el código QR';
        this.showError(errorMessage);
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
  /** Muestra un mensaje de éxito (y lo oculta en n segundos) */
  showSuccess(message: string, seconds = 3) {
    this.successText = message;
    this.showSuccessMessage = true;
    clearTimeout(this.hideTimer);
    this.hideTimer = setTimeout(() => (this.showSuccessMessage = false), seconds * 1000);
  }

  /** Muestra un mensaje de error (y lo oculta en n segundos) */
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
      'mantenimiento': 'Mantenimiento',
      'dañado': 'Dañado',
      'available': 'Disponible',
      'loaned': 'Prestado',
      'maintenance': 'Mantenimiento',
      'damaged': 'Dañado'
    };
    return statusMap[status] || status;
  }

  getStatusClass(status: string): string {
    const classMap: Record<string, string> = {
      'disponible': 'status-disponible',
      'prestado': 'status-prestado',
      'mantenimiento': 'status-mantenimiento',
      'dañado': 'status-danado',
      'available': 'status-disponible',
      'loaned': 'status-prestado',
      'maintenance': 'status-mantenimiento',
      'damaged': 'status-danado'
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
      'phone': 'Teléfono',
      'headphones': 'Audífonos',
      'mouse': 'Mouse',
      'keyboard': 'Teclado'
    };
    return typeMap[type] || type.charAt(0).toUpperCase() + type.slice(1);
  }

  formatDate(dateString: string): string {
    if (!dateString) return 'N/A';

    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  copyToClipboard(text: string) {
    navigator.clipboard.writeText(text).then(() => {
      this.showSuccess('Texto copiado al portapapeles');
    }).catch(err => {
      this.showError('No se pudo copiar al portapapeles');
      console.error('Error al copiar al portapapeles:', err);
    });
  }
}
