import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { UsersService, User, CreateUserRequest, UpdateUserRequest, ChangePasswordRequest } from './users.service';

interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error';
}

@Component({
  standalone: true,
  imports: [CommonModule, RouterLink, DatePipe, FormsModule, ReactiveFormsModule],
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.scss']
})
export class UsersComponent implements OnInit {
  users: User[] = [];
  filteredUsers: User[] = [];
  loading = false;
  error = '';
  searchTerm = '';

  showUserModal = false;
  showPasswordModal = false;
  showDeleteModal = false;
  userToDelete: User | null = null;
  editingUserId: string | null = null;
  passwordUserId: string | null = null;

  toasts: Toast[] = [];

  userForm!: FormGroup;
  passwordForm!: FormGroup;

  generatedPassword = '';
  showGeneratedPassword = false;

  roleLabels: { [key: string]: string } = {
    admin: 'Administrador',
    tecnico: 'Técnico',
    administrativo: 'Administrativo',
    becado: 'Becado'
  };

  statusLabels: { [key: string]: string } = {
    activo: 'Activo',
    inactivo: 'Inactivo'
  };

  constructor(
    private usersSvc: UsersService,
    private fb: FormBuilder
  ) {
    this.initializeForms();
  }

  ngOnInit() {
    this.loadUsers();
  }

  private initializeForms() {
    this.userForm = this.fb.group({
      name: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      role: ['', [Validators.required]],
      active: [true, [Validators.required]] // <-- CAMBIADO de status a active
    });

    this.passwordForm = this.fb.group({
      newPassword: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required]],
      forcePasswordChange: [true],
      sendNotification: [true],
      sendEmail: [true],
      showPassword: [false]
    });
  }

  loadUsers() {
    this.loading = true;
    this.error = '';
    this.usersSvc.list().subscribe({
      next: (data) => {
        // La normalización de 'status' ya no es necesaria.
        this.users = data;
        this.recalculateDisplayIds();
        this.loading = false;
      },
      error: (err) => {
        this.error = err?.error?.message || 'No se pudo cargar usuarios';
        this.loading = false;
      }
    });
  }

  onSearch() {
    if (!this.searchTerm) {
      this.filteredUsers = [...this.users];
      return;
    }
    const term = this.searchTerm.toLowerCase();
    this.filteredUsers = this.users.filter(user =>
      user.name.toLowerCase().includes(term) ||
      user.email.toLowerCase().includes(term) ||
      user.role.toLowerCase().includes(term)
    );
  }

  openUserModal(userId?: string) {
    this.editingUserId = userId || null;
    this.showUserModal = true;
    if (userId) {
      const user = this.users.find(u => u.id === userId);
      if (user) {
        // Usamos patchValue con 'active'
        this.userForm.patchValue({ name: user.name, email: user.email, role: user.role, active: user.active });
        this.userForm.get('password')?.clearValidators();
        this.userForm.get('password')?.updateValueAndValidity();
      }
    } else {
      this.userForm.reset({ active: true }); // Valor por defecto para 'active'
      this.userForm.get('password')?.setValidators([Validators.required, Validators.minLength(8)]);
      this.userForm.get('password')?.updateValueAndValidity();
    }
  }

  openPasswordModal(userId: string) {
    this.passwordUserId = userId;
    this.showPasswordModal = true;
    this.passwordForm.reset({ forcePasswordChange: true, sendNotification: true, sendEmail: true, showPassword: false });
    this.generatedPassword = '';
    this.showGeneratedPassword = false;
  }

  openDeleteModal(user: User) {
    this.userToDelete = user;
    this.showDeleteModal = true;
  }

  closeModal(modal: 'user' | 'password' | 'delete') {
    if (modal === 'user') {
      this.showUserModal = false;
      this.editingUserId = null;
    } else if (modal === 'password') {
      this.showPasswordModal = false;
      this.passwordUserId = null;
    } else {
      this.showDeleteModal = false;
      this.userToDelete = null;
    }
  }

  onSubmitUser() {
    if (this.userForm.invalid) {
      this.markFormGroupTouched(this.userForm);
      return;
    }
    const formValue = this.userForm.value;
    if (this.editingUserId) {
      // Enviamos el objeto con 'active'
      const updateData: UpdateUserRequest = { name: formValue.name, email: formValue.email, role: formValue.role, active: formValue.active };
      this.usersSvc.update(this.editingUserId, updateData).subscribe({
        next: (updatedUser) => {
          const index = this.users.findIndex(u => u.id === this.editingUserId);
          if (index !== -1) {
            this.users[index] = updatedUser;
            this.recalculateDisplayIds();
          }
          this.closeModal('user');
          this.showToast('Usuario actualizado correctamente');
        },
        error: (err) => this.showToast(err?.error?.message || 'Error al actualizar usuario', 'error')
      });
    } else {
      // Enviamos el objeto con 'active'
      const createData: CreateUserRequest = { name: formValue.name, email: formValue.email, password: formValue.password, role: formValue.role, active: formValue.active };
      this.usersSvc.create(createData).subscribe({
        next: (newUser) => {
          this.users.push(newUser);
          this.recalculateDisplayIds();
          this.closeModal('user');
          this.showToast('Usuario creado correctamente');
        },
        error: (err) => this.showToast(err?.error?.message || 'Error al crear usuario', 'error')
      });
    }
  }

  onSubmitPassword() {
    if (this.passwordForm.invalid) {
      this.markFormGroupTouched(this.passwordForm);
      return;
    }
    const formValue = this.passwordForm.value;
    if (formValue.newPassword !== formValue.confirmPassword) {
      this.showToast('Las contraseñas no coinciden', 'error');
      return;
    }
    if (!this.passwordUserId) return;
    const passwordData: ChangePasswordRequest = { newPassword: formValue.newPassword, forcePasswordChange: formValue.forcePasswordChange, sendNotification: formValue.sendNotification, sendEmail: formValue.sendEmail, showPassword: formValue.showPassword };
    this.usersSvc.changePassword(this.passwordUserId, passwordData).subscribe({
      next: () => {
        const userIndex = this.users.findIndex(u => u.id === this.passwordUserId);
        if (userIndex !== -1) {
          this.users[userIndex].passwordReset = formValue.forcePasswordChange;
          this.onSearch();
        }
        this.closeModal('password');
        this.showToast('Contraseña cambiada correctamente');
      },
      error: (err) => this.showToast(err?.error?.message || 'Error al cambiar contraseña', 'error')
    });
  }

  confirmDelete() {
    if (!this.userToDelete) return;
    this.usersSvc.delete(this.userToDelete.id).subscribe({
      next: () => {
        this.users = this.users.filter(u => u.id !== this.userToDelete!.id);
        this.recalculateDisplayIds();
        this.closeModal('delete');
        this.showToast('Usuario eliminado correctamente');
      },
      error: (err) => {
        this.closeModal('delete');
        this.showToast(err?.error?.message || 'Error al eliminar usuario', 'error');
      }
    });
  }

  private showToast(message: string, type: 'success' | 'error' = 'success') {
    const id = Date.now();
    this.toasts.push({ id, message, type });
    setTimeout(() => this.removeToast(id), 5000);
  }

  removeToast(id: number) {
    this.toasts = this.toasts.filter(toast => toast.id !== id);
  }

  generatePassword() {
    const lowercase = 'abcdefghijklmnopqrstuvwxyz', uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', numbers = '0123456789', symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';
    const allChars = lowercase + uppercase + numbers + symbols;
    let password = '';
    password += lowercase[Math.floor(Math.random() * lowercase.length)];
    password += uppercase[Math.floor(Math.random() * uppercase.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];
    password += symbols[Math.floor(Math.random() * symbols.length)];
    for (let i = 4; i < 12; i++) {
      password += allChars[Math.floor(Math.random() * allChars.length)];
    }
    password = password.split('').sort(() => Math.random() - 0.5).join('');
    this.generatedPassword = password;
    this.showGeneratedPassword = true;
    this.passwordForm.patchValue({ newPassword: password, confirmPassword: password });
  }

  copyToClipboard(text: string) {
    navigator.clipboard.writeText(text).then(() => this.showToast('Contraseña copiada al portapapeles'));
  }

  togglePasswordVisibility(inputId: string) {
    const input = document.getElementById(inputId) as HTMLInputElement;
    if (input) {
      input.type = input.type === 'password' ? 'text' : 'password';
    }
  }

  roleClass(role: string) {
    return { 'role-badge': true, 'role-admin': role === 'admin', 'role-tecnico': role === 'tecnico', 'role-administrativo': role === 'administrativo', 'role-becado': role === 'becado' };
  }

  // CAMBIADO: Acepta un booleano
  statusClass(isActive: boolean) {
    return {
      'status-badge': true,
      'status-activo': isActive,
      'status-inactivo': !isActive
    };
  }

  getModalTitle(): string {
    return this.editingUserId ? 'Editar Usuario' : 'Crear Usuario';
  }

  getSaveButtonText(): string {
    return this.editingUserId ? 'Actualizar Usuario' : 'Guardar Usuario';
  }

  getPasswordUserName(): string {
    if (!this.passwordUserId) return '';
    const user = this.users.find(u => u.id === this.passwordUserId);
    return user ? user.name : '';
  }

  private markFormGroupTouched(formGroup: FormGroup) {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
    });
  }

  private recalculateDisplayIds() {
    this.users.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    this.users.forEach((user, index) => {
      user.displayId = index + 1;
    });
    this.onSearch();
  }

  trackByUserId(index: number, user: User): string {
    return user.id;
  }
}
