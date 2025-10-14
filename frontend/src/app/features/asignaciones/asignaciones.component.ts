// Archivo completo: src/app/features/asignaciones/asignaciones.component.ts

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
  public todosLosEquipos: Equipo[] = [];
  public equiposDisponiblesParaFormulario: Equipo[] = [];
  public colaboradores: Colaborador[] = [];
  public loading = true;
  public error = '';

  public showAsignacionModal = false;
  public showLiberacionModal = false;
  public showDetallesModal = false;
  public selectedAsignacion: Asignacion | null = null;
  public statusFilter = '';

  public availableAccessories = [
    { key: 'cargador', label: 'Cargador' },
    { key: 'mouse', label: 'Mouse' },
    { key: 'teclado', label: 'Teclado' },
    { key: 'maletin', label: 'Estuche o Maletín' },
    { key: 'base', label: 'Base para Laptop' },
    { key: 'adaptador_video', label: 'Adaptador de Video' },
    { key: 'otro', label: 'Otro (especificar)' }
  ];

  public asignacionForm = this.fb.group({
    equipmentId: ['', Validators.required],
    collaboratorId: ['', Validators.required],
    assignmentDate: [new Date().toISOString().split('T')[0], Validators.required],
    observations: [''],
    accessories: this.fb.group({
      cargador: [false],
      mouse: [false],
      teclado: [false],
      maletin: [false],
      base: [false],
      adaptador_video: [false],
      otro: [false]
    }),
    otroAccesorioTexto: ['']
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
        this.equiposSvc.list({}).toPromise(),
        this.asignacionesSvc.list().toPromise(),
        this.asignacionesSvc.getColaboradores().toPromise()
      ]);
      this.todosLosEquipos = equiposData || [];
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

    const formValue = this.asignacionForm.value;
    const selectedAccessories: string[] = [];
    const accessoriesValue = formValue.accessories as { [key: string]: boolean };

    for (const accesorio of this.availableAccessories) {
      if (accessoriesValue[accesorio.key]) {
        if (accesorio.key === 'otro') {
          if (formValue.otroAccesorioTexto?.trim()) {
            selectedAccessories.push(formValue.otroAccesorioTexto.trim());
          }
        } else {
          selectedAccessories.push(accesorio.label);
        }
      }
    }

    const payload: CrearAsignacionDTO = {
      equipmentId: formValue.equipmentId!,
      collaboratorId: formValue.collaboratorId!,
      assignmentDate: formValue.assignmentDate!,
      observations: formValue.observations || undefined,
      accessories: selectedAccessories.length > 0 ? selectedAccessories : undefined
    };

    const action = this.selectedAsignacion
      ? this.asignacionesSvc.update(this.selectedAsignacion.id, payload)
      : this.asignacionesSvc.create(payload);

    action.subscribe({
      next: () => {
        const message = this.selectedAsignacion ? 'actualizada' : 'creada';
        this.closeModal('asignacion');
        this.cargarTodosLosDatos();
        this.showToast(`Asignación ${message} con éxito`, 'success');
      },
      error: (e) => {
        const message = this.selectedAsignacion ? 'actualizar' : 'crear';
        this.showToast(e?.error?.message || `Error al ${message} la asignación`, 'error');
      }
    });
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

  // ✅ FUNCIÓN AÑADIDA
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
    this.equiposDisponiblesParaFormulario = this.todosLosEquipos.filter(e => e.status === 'disponible');
    this.showAsignacionModal = true;
  }

  public editarAsignacion(asignacion: Asignacion) {
    this.selectedAsignacion = asignacion;
    this.equiposDisponiblesParaFormulario = this.todosLosEquipos.filter(e => e.status === 'disponible' || e.id === asignacion.equipmentId);

    const accessoriesState: { [key: string]: boolean } = {};
    let otroTexto = '';
    const standardAccessoryLabels = this.availableAccessories.map(a => a.label);

    if (asignacion.accessories) {
      for (const accesorio of this.availableAccessories) {
        accessoriesState[accesorio.key] = asignacion.accessories.includes(accesorio.label);
      }
      const otroAccesorio = asignacion.accessories.find(acc => !standardAccessoryLabels.includes(acc));
      if (otroAccesorio) {
        accessoriesState['otro'] = true;
        otroTexto = otroAccesorio;
      }
    }

    this.asignacionForm.patchValue({
      equipmentId: asignacion.equipmentId,
      collaboratorId: asignacion.collaboratorId,
      assignmentDate: asignacion.assignmentDate,
      observations: asignacion.observations,
      accessories: accessoriesState,
      otroAccesorioTexto: otroTexto
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

  public getEquipoNombre = (a: Asignacion) => a.equipment?.name || this.todosLosEquipos.find(e => e.id === a.equipmentId)?.name || '...';
  public getEquipoCodigo = (a: Asignacion) => a.equipment?.code || this.todosLosEquipos.find(e => e.id === a.equipmentId)?.code || '...';
  public getColaboradorNombre = (a: Asignacion) => a.collaborator?.fullName || this.colaboradores.find(c => c.id === a.collaboratorId)?.fullName || '...';

  // ✅ FUNCIÓN ACTUALIZADA
  public getStatusClass = (status: string) => ({
    'status-prestado': status === 'assigned',
    'status-devuelto': status === 'released',
    'status-donado': status === 'donated'
  });

  // ✅ FUNCIÓN ACTUALIZADA
  public getStatusText = (status: string) => ({
    assigned: 'Asignado',
    released: 'Liberado',
    donated: 'Donado'
  }[status] || status);

  public formatId = (id: string) => `ASG-${id.substring(0, 4).toUpperCase()}`;

  public trackById = (index: number, item: Asignacion) => item.id;

  public imprimirComprobante() {
    window.print();
  }
}
