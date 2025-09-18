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

  // Computed properties para roles usando 'role'
  // --- CAMBIO: Se añadió .trim() para eliminar espacios en blanco ---
  isAdmin = computed(() => this._currentUser()?.role.trim().toLowerCase() === 'admin');
  isTech = computed(() => this._currentUser()?.role.trim().toLowerCase() === 'tecnico');
  isUser = computed(() => this._currentUser()?.role.trim().toLowerCase() === 'user');

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
    // Se añade .trim() aquí también por consistencia
    return this._currentUser()?.role.trim().toLowerCase() === role.trim().toLowerCase();
  }

  /**
   * Verificar si puede acceder a funciones de admin
   */
  canAccess(requiredRole: 'admin' | 'tecnico' | 'user'): boolean {
    const userRole = this._currentUser()?.role.trim().toLowerCase();

    switch (requiredRole) {
      case 'admin':
        return userRole === 'admin';
      case 'tecnico':
        return userRole === 'admin' || userRole === 'tecnico';
      case 'user':
        return true; // Cualquier usuario autenticado
      default:
        return false;
    }
  }
}
