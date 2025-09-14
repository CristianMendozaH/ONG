import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { UsersService, User, CreateUserRequest, UpdateUserRequest, ChangePasswordRequest } from './users.service';

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

  // Modal states
  showUserModal = false;
  showPasswordModal = false;
  editingUserId: string | null = null;
  passwordUserId: string | null = null;

  // Forms
  userForm!: FormGroup;
  passwordForm!: FormGroup;

  // Password generation
  generatedPassword = '';
  showGeneratedPassword = false;

  // Role and status labels
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
      status: ['', [Validators.required]]
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
        // Ordenar usuarios por fecha de creación (más antiguos primero)
        this.users = data.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

        // Asignar displayId basado en el orden de creación
        this.users.forEach((user, index) => {
          user.displayId = index + 1;
        });

        this.filteredUsers = [...this.users];
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

  // Método para obtener el número de orden basado en fecha de creación
  getUserOrderNumber(userId: string): number {
    const userIndex = this.users.findIndex(u => u.id === userId);
    return userIndex + 1;
  }

  // Modal functions
  openUserModal(userId?: string) {
    this.editingUserId = userId || null;
    this.showUserModal = true;

    if (userId) {
      // Edit mode
      const user = this.users.find(u => u.id === userId);
      if (user) {
        this.userForm.patchValue({
          name: user.name,
          email: user.email,
          role: user.role,
          status: user.status
        });
        // Make password optional for editing
        this.userForm.get('password')?.clearValidators();
        this.userForm.get('password')?.updateValueAndValidity();
      }
    } else {
      // Create mode
      this.userForm.reset();
      this.userForm.get('password')?.setValidators([Validators.required, Validators.minLength(8)]);
      this.userForm.get('password')?.updateValueAndValidity();
    }
  }

  openPasswordModal(userId: string) {
    this.passwordUserId = userId;
    this.showPasswordModal = true;
    this.passwordForm.reset({
      forcePasswordChange: true,
      sendNotification: true,
      sendEmail: true,
      showPassword: false
    });
    this.generatedPassword = '';
    this.showGeneratedPassword = false;
  }

  closeModal(modal: 'user' | 'password') {
    if (modal === 'user') {
      this.showUserModal = false;
      this.editingUserId = null;
    } else {
      this.showPasswordModal = false;
      this.passwordUserId = null;
    }
  }

  // User CRUD operations
  onSubmitUser() {
    if (this.userForm.invalid) {
      this.markFormGroupTouched(this.userForm);
      return;
    }

    const formValue = this.userForm.value;

    if (this.editingUserId) {
      // Update user
      const updateData: UpdateUserRequest = {
        name: formValue.name,
        email: formValue.email,
        role: formValue.role,
        status: formValue.status
      };

      this.usersSvc.update(this.editingUserId, updateData).subscribe({
        next: (updatedUser) => {
          const index = this.users.findIndex(u => u.id === this.editingUserId);
          if (index !== -1) {
            this.users[index] = updatedUser;
            this.onSearch(); // Refresh filtered list
          }
          this.closeModal('user');
          alert('Usuario actualizado correctamente');
        },
        error: (err) => {
          alert('Error al actualizar usuario: ' + (err?.error?.message || 'Error desconocido'));
        }
      });
    } else {
      // Create user
      const createData: CreateUserRequest = {
        name: formValue.name,
        email: formValue.email,
        password: formValue.password,
        role: formValue.role,
        status: formValue.status
      };

      this.usersSvc.create(createData).subscribe({
        next: (newUser) => {
          this.users.push(newUser);
          this.onSearch(); // Refresh filtered list
          this.closeModal('user');
          alert('Usuario creado correctamente');
        },
        error: (err) => {
          alert('Error al crear usuario: ' + (err?.error?.message || 'Error desconocido'));
        }
      });
    }
  }

  onSubmitPassword() {
    if (this.passwordForm.invalid) {
      this.markFormGroupTouched(this.passwordForm);
      return;
    }

    const formValue = this.passwordForm.value;

    // Validate password confirmation
    if (formValue.newPassword !== formValue.confirmPassword) {
      alert('Las contraseñas no coinciden');
      return;
    }

    if (!this.passwordUserId) return;

    const passwordData: ChangePasswordRequest = {
      newPassword: formValue.newPassword,
      forcePasswordChange: formValue.forcePasswordChange,
      sendNotification: formValue.sendNotification,
      sendEmail: formValue.sendEmail,
      showPassword: formValue.showPassword
    };

    this.usersSvc.changePassword(this.passwordUserId, passwordData).subscribe({
      next: () => {
        // Update user password reset status locally
        const userIndex = this.users.findIndex(u => u.id === this.passwordUserId);
        if (userIndex !== -1) {
          this.users[userIndex].passwordReset = formValue.forcePasswordChange;
          this.onSearch(); // Refresh filtered list
        }

        let message = 'Contraseña cambiada correctamente';
        if (formValue.sendNotification && formValue.sendEmail) {
          message += '\n• Notificación enviada por correo electrónico';
          if (formValue.showPassword) {
            message += '\n• Contraseña temporal incluida en el correo';
          }
        }
        if (formValue.forcePasswordChange) {
          message += '\n• El usuario deberá cambiar la contraseña en su próximo login';
        }

        this.closeModal('password');
        alert(message);
      },
      error: (err) => {
        alert('Error al cambiar contraseña: ' + (err?.error?.message || 'Error desconocido'));
      }
    });
  }

  deleteUser(userId: string) {
    const user = this.users.find(u => u.id === userId);
    if (!user) {
      alert('Usuario no encontrado');
      return;
    }

    if (confirm(`¿Está seguro de que desea eliminar el usuario "${user.name}"?`)) {
      this.usersSvc.delete(userId).subscribe({
        next: () => {
          this.users = this.users.filter(u => u.id !== userId);
          this.onSearch(); // Refresh filtered list
          alert('Usuario eliminado correctamente');
        },
        error: (err) => {
          console.error('Error al eliminar usuario:', err);
          let errorMessage = 'Error al eliminar usuario';

          if (err.status === 404) {
            errorMessage = 'Usuario no encontrado en el servidor';
          } else if (err.status === 500) {
            errorMessage = 'Error interno del servidor';
          } else if (err?.error?.message) {
            errorMessage = err.error.message;
          }

          alert(errorMessage);
        }
      });
    }
  }

  // Password generation
  generatePassword() {
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numbers = '0123456789';
    const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';

    const allChars = lowercase + uppercase + numbers + symbols;

    let password = '';

    // Ensure at least one character from each category
    password += lowercase[Math.floor(Math.random() * lowercase.length)];
    password += uppercase[Math.floor(Math.random() * uppercase.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];
    password += symbols[Math.floor(Math.random() * symbols.length)];

    // Fill remaining characters
    for (let i = 4; i < 12; i++) {
      password += allChars[Math.floor(Math.random() * allChars.length)];
    }

    // Shuffle password
    password = password.split('').sort(() => Math.random() - 0.5).join('');

    this.generatedPassword = password;
    this.showGeneratedPassword = true;

    // Update form
    this.passwordForm.patchValue({
      newPassword: password,
      confirmPassword: password
    });
  }

  copyToClipboard(text: string) {
    navigator.clipboard.writeText(text).then(() => {
      alert('Contraseña copiada al portapapeles');
    });
  }

  togglePasswordVisibility(inputId: string) {
    const input = document.getElementById(inputId) as HTMLInputElement;
    if (input) {
      input.type = input.type === 'password' ? 'text' : 'password';
    }
  }

  // Utility functions
  roleClass(role: string) {
    return {
      'role-badge': true,
      'role-admin': role === 'admin',
      'role-tecnico': role === 'tecnico',
      'role-administrativo': role === 'administrativo',
      'role-becado': role === 'becado'
    };
  }

  statusClass(status: string) {
    return {
      'status-badge': true,
      'status-activo': status === 'activo',
      'status-inactivo': status === 'inactivo'
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

  // Track by function for ngFor performance
  trackByUserId(index: number, user: User): string {
    return user.id;
  }
}
