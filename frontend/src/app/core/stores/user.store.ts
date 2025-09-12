// src/app/core/stores/user.store.ts
import { Injectable, signal, computed } from '@angular/core';
import { User } from '../../shared/interfaces/models';

@Injectable({
  providedIn: 'root'
})
export class UserStore {
  // Señal reactiva para el usuario actual
  private _currentUser = signal<User | null>(null);

  // Señal reactiva para el estado de autenticación
  private _isAuthenticated = signal<boolean>(false);

  // Getters computados (solo lectura)
  currentUser = this._currentUser.asReadonly();
  isAuthenticated = this._isAuthenticated.asReadonly();

  // Computed properties para roles
  isAdmin = computed(() => this._currentUser()?.role === 'admin');
  isTech = computed(() => this._currentUser()?.role === 'tech');
  isUser = computed(() => this._currentUser()?.role === 'user');

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
    return this._currentUser()?.role === role;
  }

  /**
   * Verificar si puede acceder a funciones de admin
   */
  canAccess(requiredRole: 'admin' | 'tech' | 'user'): boolean {
    const userRole = this._currentUser()?.role;

    switch (requiredRole) {
      case 'admin':
        return userRole === 'admin';
      case 'tech':
        return userRole === 'admin' || userRole === 'tech';
      case 'user':
        return true; // Cualquier usuario autenticado
      default:
        return false;
    }
  }
}
