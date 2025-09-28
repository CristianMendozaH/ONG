import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AsignacionesService, Asignacion, Colaborador, LiberarAsignacionDTO, CrearAsignacionDTO } from './asignaciones.service';
import { EquiposService, Equipo } from '../equipos/equipos.service';

interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error';
}

@Component({
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, ReactiveFormsModule],
  templateUrl: './asignaciones.component.html',
  styleUrl: './asignaciones.component.scss'
})
export class AsignacionesComponent implements OnInit {
  private fb = inject(FormBuilder);
  private asignacionesSvc = inject(AsignacionesService);
  private equiposSvc = inject(EquiposService);

  public toasts: Toast[] = [];
  public asignaciones: Asignacion[] = [];
  public filteredAsignaciones: Asignacion[] = [];
  public equiposDisponibles: Equipo[] = [];
  public colaboradores: Colaborador[] = [];
  public loading = true;
  public error = '';

  public showAsignacionModal = false;
  public showLiberacionModal = false;
  public showDetallesModal = false;
  public selectedAsignacion: Asignacion | null = null;
  public statusFilter = '';

  public asignacionForm = this.fb.group({
    equipmentId: ['', Validators.required],
    collaboratorId: ['', Validators.required],
    assignmentDate: [new Date().toISOString().split('T')[0], Validators.required],
    observations: [''],
  });

  public fechaLiberacion = new Date().toISOString().split('T')[0];
  public equipoCondicion: 'excelente' | 'bueno' | 'regular' | 'dañado' | '' = '';
  public liberacionObservaciones = '';

  public ngOnInit() {
    this.cargarTodosLosDatos();
  }

  public async cargarTodosLosDatos() {
    this.loading = true;
    this.error = '';
    try {
      const [equiposData, asignacionesData, colaboradoresData] = await Promise.all([
        this.equiposSvc.list().toPromise(),
        this.asignacionesSvc.list().toPromise(),
        this.asignacionesSvc.getColaboradores().toPromise()
      ]);
      this.equiposDisponibles = (equiposData || []).filter(e => e.status === 'disponible');
      this.asignaciones = asignacionesData || [];
      this.colaboradores = colaboradoresData || [];
      this.filterAsignaciones();
    } catch (e: any) {
      this.error = e?.error?.message || 'No se pudieron cargar los datos';
      this.showToast(this.error, 'error');
    } finally {
      this.loading = false;
    }
  }

  public filterAsignaciones() {
    this.filteredAsignaciones = this.asignaciones.filter(a =>
      !this.statusFilter || a.status === this.statusFilter
    );
  }

  public guardarAsignacion() {
    if (this.asignacionForm.invalid) {
      return this.showToast('Completa los campos requeridos', 'error');
    }

    if (this.selectedAsignacion) {
      // --- Lógica para EDITAR ---
      this.asignacionesSvc.update(
        this.selectedAsignacion.id,
        this.asignacionForm.value as Partial<CrearAsignacionDTO>
      ).subscribe({
        next: () => {
          this.closeModal('asignacion');
          this.cargarTodosLosDatos();
          this.showToast('Asignación actualizada con éxito', 'success');
        },
        error: (e) => this.showToast(e?.error?.message || 'Error al actualizar la asignación', 'error')
      });
    } else {
      // --- Lógica para CREAR ---
      this.asignacionesSvc.create(this.asignacionForm.value as any).subscribe({
        next: () => {
          this.closeModal('asignacion');
          this.cargarTodosLosDatos();
          this.showToast('Asignación creada con éxito', 'success');
        },
        error: (e) => this.showToast(e?.error?.message || 'Error al crear la asignación', 'error')
      });
    }
  }

  public confirmarLiberacion() {
    if (!this.selectedAsignacion || !this.equipoCondicion) {
      return this.showToast('Completa todos los campos para liberar el equipo', 'error');
    }
    const payload: LiberarAsignacionDTO = {
      releaseDate: this.fechaLiberacion,
      condition: this.equipoCondicion,
      observations: this.liberacionObservaciones
    };
    this.asignacionesSvc.liberarAsignacion(this.selectedAsignacion.id, payload).subscribe({
      next: () => {
        this.closeModal('liberacion');
        this.cargarTodosLosDatos();
        this.showToast('Equipo liberado correctamente', 'success');
      },
      error: (e) => this.showToast(e?.error?.message || 'Error al liberar el equipo', 'error')
    });
  }

  public donarEquipo(asignacion: Asignacion) {
    const confirmacion = confirm(
      `¿Estás seguro de que deseas registrar el equipo "${this.getEquipoNombre(asignacion)}" como donado a ${this.getColaboradorNombre(asignacion)}? Esta acción es permanente y sacará al equipo del inventario.`
    );

    if (confirmacion) {
      this.asignacionesSvc.donarAsignacion(asignacion.id).subscribe({
        next: () => {
          this.showToast('Equipo registrado como donado.', 'success');
          this.cargarTodosLosDatos();
        },
        error: (e) => this.showToast(e?.error?.message || 'Error al procesar la donación', 'error')
      });
    }
  }

  public openAsignacionModal() {
    this.selectedAsignacion = null;
    this.asignacionForm.reset({
      assignmentDate: new Date().toISOString().split('T')[0]
    });
    this.showAsignacionModal = true;
  }

  public editarAsignacion(asignacion: Asignacion) {
    this.selectedAsignacion = asignacion;
    this.asignacionForm.patchValue({
      equipmentId: asignacion.equipmentId,
      collaboratorId: asignacion.collaboratorId,
      assignmentDate: asignacion.assignmentDate,
      observations: asignacion.observations
    });
    this.showAsignacionModal = true;
  }

  public verAsignacion(asignacion: Asignacion) {
    this.selectedAsignacion = asignacion;
    this.showDetallesModal = true;
  }

  public openLiberacionModal(asignacion: Asignacion) {
    this.selectedAsignacion = asignacion;
    this.fechaLiberacion = new Date().toISOString().split('T')[0];
    this.equipoCondicion = '';
    this.liberacionObservaciones = '';
    this.showLiberacionModal = true;
  }

  public closeModal(type: 'asignacion' | 'liberacion' | 'detalles') {
    if (type === 'asignacion') this.showAsignacionModal = false;
    if (type === 'liberacion') this.showLiberacionModal = false;
    if (type === 'detalles') this.showDetallesModal = false;
    this.selectedAsignacion = null;
  }

  public showToast(message: string, type: 'success' | 'error' = 'success') {
    const id = Date.now();
    this.toasts.push({ id, message, type });
    setTimeout(() => this.removeToast(id), 5000);
  }

  public removeToast(id: number) {
    this.toasts = this.toasts.filter(toast => toast.id !== id);
  }

  public getEquipoNombre = (a: Asignacion) => a.equipment?.name || '...';
  public getEquipoCodigo = (a: Asignacion) => a.equipment?.code || '...';
  public getColaboradorNombre = (a: Asignacion) => a.collaborator?.fullName || '...';

  public getStatusClass = (status: string) => ({
    'status-prestado': status === 'assigned',
    'status-devuelto': status === 'released',
    'status-atrasado': status === 'donated'
  });

  public getStatusText = (status: string) => ({
    assigned: 'Asignado',
    released: 'Liberado',
    donated: 'Donado'
  }[status] || status);

  public formatId = (id: string) => `ASG-${id.substring(0, 4).toUpperCase()}`;
  public trackById = (index: number, item: Asignacion) => item.id;
}
