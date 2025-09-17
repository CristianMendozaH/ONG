import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../../core/services/auth.service';
import { LoginDto } from '../../shared/interfaces/models';

@Component({
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  // --- LÓGICA AÑADIDA ---
  loading = false;
  submitted = false; // Para saber si el usuario ya intentó enviar el formulario
  apiError = ''; // Para guardar el error del servidor (ej: "credenciales inválidas")
  passwordFieldType: 'password' | 'text' = 'password'; // Controla si la contraseña se ve o no

  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]]
  });

  submit(): void {
    this.submitted = true;
    this.apiError = '';

    if (this.form.invalid) {
      return;
    }

    this.loading = true;
    const credentials = this.form.value as LoginDto;

    this.authService.login(credentials).subscribe({
      next: () => this.router.navigateByUrl('/dashboard'),
      error: (e: HttpErrorResponse) => {
        this.apiError = e.error?.message || 'Credenciales inválidas o error de conexión.';
        this.loading = false;
      }
    });
  }

  // --- FUNCIONES AÑADIDAS PARA EL TEMPLATE ---

  // Función para mostrar/ocultar la contraseña
  togglePasswordVisibility(): void {
    this.passwordFieldType = this.passwordFieldType === 'password' ? 'text' : 'password';
  }

  // Función para verificar si un campo es inválido y debe mostrar error
  isInvalid(controlName: 'email' | 'password'): boolean {
    const control = this.form.get(controlName);
    return !!control && control.invalid && (control.touched || this.submitted);
  }

  // Función para marcar un campo como válido (borde verde)
  isValid(controlName: 'email' | 'password'): boolean {
    const control = this.form.get(controlName);
    return !!control && control.valid && (control.touched || this.submitted);
  }
}
