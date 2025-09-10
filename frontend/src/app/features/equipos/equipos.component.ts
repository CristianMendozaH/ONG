import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { EquiposService, Equipo } from './equipos.service';
import { FormsModule } from '@angular/forms';

@Component({
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './equipos.component.html',
  styleUrl: './equipos.component.css'
})
export class EquiposComponent implements OnInit {
  equipos: Equipo[] = [];
  loading = false;
  error = '';

  // filtros simples
  search = '';
  status = '';
  type = '';

  // preview QR
  qrUrl: string | null = null;

  constructor(private equiposSvc: EquiposService) {}

  ngOnInit() { this.load(); }

  load() {
    this.loading = true;
    this.error = '';
    this.equiposSvc.list({ search: this.search, status: this.status, type: this.type })
      .subscribe({
        next: data => { this.equipos = data; this.loading = false; },
        error: err => { this.error = err?.error?.message || 'No se pudo cargar equipos'; this.loading = false; }
      });
  }

  clearFilters() {
    this.search = ''; this.status = ''; this.type = '';
    this.load();
  }

  verQR(eq: Equipo) {
    this.qrUrl = null;
    this.equiposSvc.qr(eq.id).subscribe(blob => {
      this.qrUrl = URL.createObjectURL(blob);
    });
  }

  eliminar(eq: Equipo) {
    if (!confirm(`¿Eliminar el equipo "${eq.name}"?`)) return;
    this.equiposSvc.remove(eq.id).subscribe({
      next: () => this.load(),
      error: e => alert(e?.error?.message || 'No se pudo eliminar')
    });
  }
}
