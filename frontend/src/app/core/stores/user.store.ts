// src/app/core/stores/user.store.ts
import { Injectable, signal, computed } from '@angular/core';
import { User } from '../../shared/interfaces/models';

@Injectable({
  providedIn: 'root'
})
export class UserStore {
  private _currentUser = signal<User | null>(null);
  private _isAuthenticated = signal<boolean>(false);

  // Getters computados (solo lectura)
  currentUser = this._currentUser.asReadonly();
  isAuthenticated = this._isAuthenticated.asReadonly();

  // Computed properties para roles (versión segura y corregida)
  isAdmin = computed(() => {
    const role = this._currentUser()?.role;
    // Comprobación segura y sin errores de tipeo
    return typeof role === 'string' && role.trim().toLowerCase() === 'admin';
  });

  isTech = computed(() => {
    const role = this._currentUser()?.role;
    return typeof role === 'string' && role.trim().toLowerCase() === 'tecnico';
  });

  isUser = computed(() => {
    const role = this._currentUser()?.role;
    return typeof role === 'string' && role.trim().toLowerCase() === 'user';
  });

  // Computed para mostrar nombre
  userName = computed(() => this._currentUser()?.name || 'Usuario');
  userEmail = computed(() => this._currentUser()?.email || '');

  /**
   * Establecer usuario actual
   */
  setUser(user: User | null): void {
    this._currentUser.set(user);
    this._isAuthenticated.set(!!user);
  }

  /**
   * Limpiar usuario (logout)
   */
  clearUser(): void {
    this._currentUser.set(null);
    this._isAuthenticated.set(false);
  }

  /**
   * Actualizar datos del usuario
   */
  updateUser(userData: Partial<User>): void {
    const currentUser = this._currentUser();
    if (currentUser) {
      this._currentUser.set({ ...currentUser, ...userData });
    }
  }

  /**
   * Verificar si tiene un rol específico
   */
  hasRole(role: string): boolean {
    const userRole = this._currentUser()?.role;
    return typeof userRole === 'string' && userRole.trim().toLowerCase() === role.trim().toLowerCase();
  }

  /**
   * Verificar si puede acceder a funciones
   */
  canAccess(requiredRole: 'admin' | 'tecnico' | 'user'): boolean {
    const userRole = this._currentUser()?.role;
    const cleanUserRole = typeof userRole === 'string' ? userRole.trim().toLowerCase() : null;

    switch (requiredRole) {
      case 'admin':
        return cleanUserRole === 'admin';
      case 'tecnico':
        return cleanUserRole === 'admin' || cleanUserRole === 'tecnico';
      case 'user':
        return this.isAuthenticated();
      default:
        return false;
    }
  }
}
