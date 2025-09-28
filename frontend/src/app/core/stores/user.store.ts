// src/app/core/stores/user.store.ts
import { Injectable, signal, computed } from '@angular/core';
import { User } from '../../shared/interfaces/models';

/**
 * @Injectable
 * @description
 * Store para gestionar el estado del usuario en toda la aplicación.
 * Utiliza Angular Signals para una gestión de estado reactiva y eficiente.
 */
@Injectable({
  providedIn: 'root'
})
export class UserStore {
  // --- Señales de Estado Privadas ---
  private _currentUser = signal<User | null>(null);
  private _isAuthenticated = signal<boolean>(false);

  // --- Selectores Públicos (Solo Lectura) ---
  /** La información del usuario actualmente autenticado, o null si no hay nadie. */
  currentUser = this._currentUser.asReadonly();
  /** Un booleano que indica si hay un usuario autenticado. */
  isAuthenticated = this._isAuthenticated.asReadonly();

  // --- Selectores Computados Derivados del Estado ---
  /** Devuelve `true` si el usuario actual tiene el rol de 'admin'. */
  isAdmin = computed(() => this._currentUser()?.role?.trim().toLowerCase() === 'admin');

  /** Devuelve `true` si el usuario actual tiene el rol de 'tecnico'. */
  isTech = computed(() => this._currentUser()?.role?.trim().toLowerCase() === 'tecnico');

  /** Devuelve `true` si el usuario actual tiene el rol de 'user'. */
  isUser = computed(() => this._currentUser()?.role?.trim().toLowerCase() === 'user');

  /** El nombre del usuario actual, con 'Usuario' como valor por defecto. */
  userName = computed(() => this._currentUser()?.name || 'Usuario');
  /** El email del usuario actual, con una cadena vacía como valor por defecto. */
  userEmail = computed(() => this._currentUser()?.email || '');

  // --- Métodos de Acción para Modificar el Estado ---

  /**
   * Establece el usuario actual y actualiza el estado de autenticación.
   * @param {User | null} user - El objeto de usuario para establecer, o null para limpiar.
   */
  setUser(user: User | null): void {
    this._currentUser.set(user);
    this._isAuthenticated.set(!!user);
  }

  /**
   * Limpia la información del usuario y establece el estado de autenticación a `false`.
   * Ideal para usar en la función de logout.
   */
  clearUser(): void {
    this._currentUser.set(null);
    this._isAuthenticated.set(false);
  }

  /**
   * Actualiza parcialmente la información del usuario actual sin reemplazar el objeto completo.
   * @param {Partial<User>} userData - Un objeto con las propiedades del usuario a actualizar.
   */
  updateUser(userData: Partial<User>): void {
    const currentUser = this._currentUser();
    if (currentUser) {
      // Crea un nuevo objeto para mantener la inmutabilidad
      this._currentUser.set({ ...currentUser, ...userData });
    }
  }

  // --- Métodos de Utilidad ---

  /**
   * Verifica si el usuario actual tiene un rol específico.
   * @param {string} role - El rol a verificar (insensible a mayúsculas/minúsculas).
   * @returns {boolean} - `true` si el usuario tiene el rol.
   */
  hasRole(role: string): boolean {
    const userRole = this._currentUser()?.role;
    return typeof userRole === 'string' && userRole.trim().toLowerCase() === role.trim().toLowerCase();
  }

  /**
   * Verifica los permisos del usuario basados en una jerarquía de roles.
   * @param {'admin' | 'tecnico' | 'user'} requiredRole - El nivel de acceso mínimo requerido.
   * @returns {boolean} - `true` si el usuario cumple con el permiso.
   */
  canAccess(requiredRole: 'admin' | 'tecnico' | 'user'): boolean {
    const userRole = this._currentUser()?.role?.trim().toLowerCase();

    switch (requiredRole) {
      // Solo el admin puede acceder.
      case 'admin':
        return userRole === 'admin';
      // Admin y técnico pueden acceder.
      case 'tecnico':
        return userRole === 'admin' || userRole === 'tecnico';
      // Cualquier usuario autenticado puede acceder.
      case 'user':
        return this.isAuthenticated();
      default:
        return false;
    }
  }
}
