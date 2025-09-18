// src/app/core/layout/layout.component.ts
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { UserStore } from '../stores/user.store';
import { User } from '../../shared/interfaces/models';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    RouterLinkActive,
    RouterOutlet
  ],
  templateUrl: './layout.component.html',
  styleUrl: './layout.component.scss'
})
export class LayoutComponent {
  private authService = inject(AuthService);
  public userStore = inject(UserStore);

  sidebarOpen = false;

  // --- AÑADE ESTE CONSTRUCTOR PARA DEPURAR ---
  constructor() {
    console.log('--- DEBUG ROL DE USUARIO (v2) ---');
    const currentUser = this.userStore.currentUser();
    console.log('Usuario en UserStore:', currentUser);

    // Imprime el rol exacto para ver si tiene espacios
    if (currentUser && currentUser.role) {
      console.log(`Rol exacto: "${currentUser.role}"`);
    }

    // Muestra el resultado de las comprobaciones de rol
    console.log('Resultado de isAdmin():', this.userStore.isAdmin());
    console.log('Resultado de isTech():', this.userStore.isTech());
    console.log('--- FIN DEL DEBUG ---');
  }

  toggleSidebar(): void {
    this.sidebarOpen = !this.sidebarOpen;
  }

  logout(): void {
    this.authService.logout();
  }
}
