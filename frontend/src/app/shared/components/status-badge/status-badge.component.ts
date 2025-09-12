// src/app/shared/components/status-badge/status-badge.component.ts
import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export type StatusType =
  | 'disponible'
  | 'prestado'
  | 'atrasado'
  | 'mantenimiento'
  | 'danado'
  | 'devuelto'
  | 'programado'
  | 'en-proceso'
  | 'completado'
  | 'cancelado';

export type PriorityType = 'alta' | 'media' | 'baja';
export type RoleType = 'admin' | 'tech' | 'user';

@Component({
  selector: 'app-status-badge',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span
      class="badge"
      [ngClass]="{
        'status-badge': type === 'status',
        'priority-badge': type === 'priority',
        'role-badge': type === 'role'
      }"
      [class]="getStatusClass()">
      {{ getDisplayText() }}
    </span>
  `,
  styleUrl: './status-badge.component.scss'
})
export class StatusBadgeComponent {
  @Input() type: 'status' | 'priority' | 'role' = 'status';
  @Input() value!: StatusType | PriorityType | RoleType;

  getStatusClass(): string {
    return `${this.type}-${this.value}`;
  }

  getDisplayText(): string {
    const textMap: Record<string, string> = {
      // Status
      'disponible': 'Disponible',
      'prestado': 'Prestado',
      'atrasado': 'Atrasado',
      'mantenimiento': 'Mantenimiento',
      'danado': 'Dañado',
      'devuelto': 'Devuelto',
      'programado': 'Programado',
      'en-proceso': 'En Proceso',
      'completado': 'Completado',
      'cancelado': 'Cancelado',

      // Priority
      'alta': 'Alta',
      'media': 'Media',
      'baja': 'Baja',

      // Roles
      'admin': 'Administrador',
      'tech': 'Técnico',
      'user': 'Usuario'
    };

    return textMap[this.value] || this.value;
  }
}
