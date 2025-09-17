// src/app/core/layout/layout.component.ts
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

// CORREGIDO: Ruta correcta a la carpeta 'services'
import { AuthService } from '../services/auth.service';
// CORREGIDO: Ruta correcta a la carpeta 'shared'
import { UserStore } from '../stores/user.store';
import { User } from '../../shared/interfaces/models'; // <-- Faltaba esta importación

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    RouterLinkActive,
    RouterOutlet
  ],
  // CORREGIDO: Debe apuntar a sus propios archivos HTML y SCSS
  templateUrl: './layout.component.html',
  styleUrl: './layout.component.scss'
})
export class LayoutComponent { // <-- Asegúrate que se llame así y que tenga 'export'
  private authService = inject(AuthService);
  public userStore = inject(UserStore);

  sidebarOpen = false;

  toggleSidebar(): void {
    this.sidebarOpen = !this.sidebarOpen;
  }

  logout(): void {
    this.authService.logout();
  }
}
