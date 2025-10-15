import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ColaboradoresService, Colaborador } from './colaboradores.service';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';

// Interfaz para las notificaciones (toasts)
interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error';
}

@Component({
  selector: 'app-colaboradores',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './colaboradores.component.html',
  styleUrls: ['./colaboradores.component.scss']
})
export class ColaboradoresComponent implements OnInit, OnDestroy {

  // Propiedades de la vista
  colaboradores: Colaborador[] = [];
  loading = true;
  error = '';
  toasts: Toast[] = [];

  // Propiedades para los Filtros
  search = '';
  typeFilter = '';
  private searchSubject = new Subject<string>();
  private destroy$ = new Subject<void>();

  // Propiedades del Modal
  showModal = false;
  isEditMode = false;
  modalTitle = '';

  // Modelo de datos para el formulario del modal
  formModel: Partial<Colaborador> = {};

  // Lista de programas para el dropdown
  programasDisponibles: string[] = [
    'Café',
    'Talento Humano/Mantenimiento',
    'Educación Formal',
    'CECAP',
    'Tienda',
    'Finanzas',
    'Dirección',
    'Colegio Siqajan'
  ];

  constructor(private colaboradoresSvc: ColaboradoresService) {
    // Usamos debounceTime para evitar llamadas excesivas a la API al escribir
    this.searchSubject.pipe(
      debounceTime(400),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.aplicarFiltros();
    });
  }

  ngOnInit() {
    this.loadColaboradores();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Carga la lista de colaboradores aplicando los filtros actuales.
   */
  loadColaboradores() {
    this.loading = true;
    this.error = '';

    const query = {
      search: this.search,
      type: this.typeFilter,
      includeInactive: true // Siempre incluimos inactivos en la tabla de gestión
    };

    this.colaboradoresSvc.listAll(query).subscribe({
      next: (data) => {
        this.colaboradores = data;
        this.loading = false;
      },
      error: (err) => {
        this.error = err?.error?.message || 'No se pudo cargar la lista de colaboradores';
        this.loading = false;
        this.showToast(this.error, 'error');
      }
    });
  }

  // --- Métodos para manejar los filtros ---

  onSearchChange() {
    this.searchSubject.next(this.search);
  }

  onFilterChange() {
    this.aplicarFiltros();
  }

  aplicarFiltros() {
    this.loadColaboradores();
  }

  clearFilters() {
    this.search = '';
    this.typeFilter = '';
    this.loadColaboradores();
  }

  // --- Métodos para controlar el Modal ---

  abrirModalNuevo() {
    this.isEditMode = false;
    this.modalTitle = 'Agregar Nuevo Colaborador';
    this.formModel = {
      fullName: '',
      type: 'Colaborador',
      position: '',
      program: undefined,
      contact: '',
      isActive: true
    };
    this.showModal = true;
  }

  abrirModalEditar(colaborador: Colaborador) {
    this.isEditMode = true;
    this.modalTitle = 'Editar Colaborador';
    this.formModel = { ...colaborador };
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
  }

  guardarCambios() {
    if (!this.formModel.fullName || !this.formModel.type) {
      this.showToast('El nombre completo y el tipo son obligatorios.', 'error');
      return;
    }

    const action = this.isEditMode
      ? this.colaboradoresSvc.update(this.formModel.id!, this.formModel)
      : this.colaboradoresSvc.create(this.formModel);

    action.subscribe({
      next: () => {
        const message = this.isEditMode ? 'actualizado' : 'creado';
        this.showToast(`Colaborador ${message} correctamente.`, 'success');
        this.closeModal();
        this.loadColaboradores();
      },
      error: (err) => {
        const message = this.isEditMode ? 'actualizar' : 'crear';
        this.showToast(err?.error?.message || `Error al ${message} el colaborador.`, 'error');
      }
    });
  }

  // --- Métodos de Notificaciones ---
  showToast(message: string, type: 'success' | 'error' = 'success', duration: number = 4000) {
    const id = Date.now();
    this.toasts.push({ id, message, type });
    setTimeout(() => this.removeToast(id), duration);
  }

  removeToast(id: number) {
    this.toasts = this.toasts.filter(toast => toast.id !== id);
  }
}

