// src/app/features/auth/login.component.ts
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
  styleUrl: './login.component.scss' // Asegúrate de que esta línea apunte a tu archivo de estilos
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  // --- Lógica completa para el formulario ---
  loading = false;
  submitted = false;
  apiError = '';
  passwordFieldType: 'password' | 'text' = 'password';

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

  // --- Funciones para el template HTML ---

  togglePasswordVisibility(): void {
    this.passwordFieldType = this.passwordFieldType === 'password' ? 'text' : 'password';
  }

  isInvalid(controlName: 'email' | 'password'): boolean {
    const control = this.form.get(controlName);
    return !!control && control.invalid && (control.touched || this.submitted);
  }

  isValid(controlName: 'email' | 'password'): boolean {
    const control = this.form.get(controlName);
    return !!control && control.valid && (control.touched || this.submitted);
  }
}
