import { Component, OnInit, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { PrestamosService, Prestamo } from './prestamos.service';
import { EquiposService, Equipo } from '../equipos/equipos.service';

@Component({
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, ReactiveFormsModule, DatePipe],
  templateUrl: './prestamos.component.html',
  styleUrl: './prestamos.component.css'
})
export class PrestamosComponent implements OnInit {
  private fb = inject(FormBuilder);
  private prestamosSvc = inject(PrestamosService);
  private equiposSvc = inject(EquiposService);

  prestamos: Prestamo[] = [];
  equipos: Equipo[] = [];
  loading = false;
  error = '';
  // vista previa de QR del equipo
  qrUrl: string | null = null;

  form = this.fb.group({
    equipmentId: ['', Validators.required],
    borrowerName: ['', Validators.required],
    dueDate: ['', Validators.required],
  });

  ngOnInit() {
    this.loadPrestamos();
    this.loadEquiposDisponibles();
  }

  loadPrestamos() {
    this.loading = true; this.error = '';
    this.prestamosSvc.list().subscribe({
      next: (res) => { this.prestamos = res; this.loading = false; },
      error: (e) => { this.error = e?.error?.message || 'No se pudo cargar préstamos'; this.loading = false; }
    });
  }

  loadEquiposDisponibles() {
    this.equiposSvc.list({ status: 'available' }).subscribe({
      next: (data) => this.equipos = data,
      error: () => {} // silencioso
    });
  }

  crearPrestamo() {
    if (this.form.invalid) return;
    this.prestamosSvc.create(this.form.value as any).subscribe({
      next: () => { this.form.reset(); this.loadPrestamos(); this.loadEquiposDisponibles(); },
      error: (e) => alert(e?.error?.message || 'No se pudo crear el préstamo')
    });
  }

  devolver(p: Prestamo) {
    const today = new Date().toISOString().slice(0, 10); // yyyy-mm-dd
    const fecha = prompt('Fecha de devolución (yyyy-mm-dd):', today);
    if (!fecha) return;
    this.prestamosSvc.returnLoan(p.id, fecha).subscribe({
      next: () => this.loadPrestamos(),
      error: (e) => alert(e?.error?.message || 'No se pudo marcar la devolución')
    });
  }

  verQR(p: Prestamo) {
    // Si viene el equipo embebido, lo usamos; sino pedimos el QR por id
    const eqId = p.equipment?.id ?? p.equipmentId;
    this.qrUrl = null;
    this.equiposSvc.qr(eqId).subscribe(blob => {
      this.qrUrl = URL.createObjectURL(blob);
    });
  }

  estadoClase(p: Prestamo) {
    return {
      'status-badge': true,
      'status-prestado': p.status === 'prestado',
      'status-disponible': p.status === 'devuelto',
      'status-atrasado': p.status === 'atrasado'
    };
  }
}
