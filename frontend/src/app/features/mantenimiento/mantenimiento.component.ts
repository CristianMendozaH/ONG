import { Component, OnInit, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { MantenimientoService, Mantenimiento } from './mantenimiento.service';
import { EquiposService, Equipo } from '../equipos/equipos.service';

@Component({
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, ReactiveFormsModule, DatePipe],
  templateUrl: './mantenimiento.component.html',
  styleUrl: './mantenimiento.component.css'
})
export class MantenimientoComponent implements OnInit {
  private fb = inject(FormBuilder);
  private mantSvc = inject(MantenimientoService);
  private equiposSvc = inject(EquiposService);

  mantenimientos: Mantenimiento[] = [];
  equipos: Equipo[] = [];
  loading = false;
  error = '';

  form = this.fb.group({
    equipmentId: ['', Validators.required],
    type: ['preventivo', Validators.required],
    scheduledDate: ['', Validators.required],
    notes: [''],
  });

  ngOnInit() {
    this.load();
    this.equiposSvc.list().subscribe({ next: (e) => this.equipos = e });
  }

  load() {
    this.loading = true; this.error = '';
    this.mantSvc.list().subscribe({
      next: (res) => { this.mantenimientos = res; this.loading = false; },
      error: (e) => { this.error = e?.error?.message || 'No se pudo cargar mantenimientos'; this.loading = false; }
    });
  }

  crear() {
    if (this.form.invalid) return;
    this.mantSvc.create(this.form.value as any).subscribe({
      next: () => { this.form.reset({ type:'preventivo' }); this.load(); },
      error: (e) => alert(e?.error?.message || 'No se pudo crear el mantenimiento')
    });
  }

  completar(m: Mantenimiento) {
    const today = new Date().toISOString().slice(0,10);
    const fecha = prompt('Fecha realizada (yyyy-mm-dd):', today);
    if (!fecha) return;
    this.mantSvc.complete(m.id, fecha).subscribe({
      next: () => this.load(),
      error: (e) => alert(e?.error?.message || 'No se pudo marcar como completado')
    });
  }

  estadoClase(m: Mantenimiento) {
    return {
      'status-badge': true,
      'status-prestado': m.status === 'en-proceso',
      'status-disponible': m.status === 'completado',
      'status-mantto': m.status === 'programado'
    };
  }
}
