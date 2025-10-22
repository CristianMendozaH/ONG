import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../../core/services/auth.service';
import { ResetPasswordDto } from '../../shared/interfaces/models';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './forgot-password.component.html',
  styleUrl: './login.component.scss' // Reutilizando estilos
})
export class ForgotPasswordComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  loading = false;
  submitted = false;
  apiError = '';
  passwordFieldType: 'password' | 'text' = 'password';

  // --- Propiedad para el mensaje de éxito ---
  successMessage = '';

  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    nuevaContraseña: ['', [Validators.required, Validators.minLength(6)]]
  });

  submit(): void {
    this.submitted = true;
    this.apiError = '';

    if (this.form.invalid) {
      return;
    }

    this.loading = true;

    const credentials = {
      email: this.form.value.email!,
      nuevaContrasena: this.form.value.nuevaContraseña!
    } as ResetPasswordDto;

    this.authService.resetPassword(credentials).subscribe({
      next: () => {
        // --- Lógica de éxito con notificación ---
        this.loading = false;
        this.form.disable(); // Deshabilitar el formulario
        this.successMessage = '¡Contraseña actualizada! Serás redirigido al login en 3 segundos...';

        // Redirigir después de 3 segundos
        setTimeout(() => {
          this.router.navigateByUrl('/login');
        }, 3000);
      },
      error: (e: HttpErrorResponse) => {
        this.apiError = e.error?.message || 'Error al restablecer. Verifica el email.';
        this.loading = false;
      }
    });
  }

  // --- Funciones para el template HTML ---

  togglePasswordVisibility(): void {
    this.passwordFieldType = this.passwordFieldType === 'password' ? 'text' : 'password';
  }

  isInvalid(controlName: 'email' | 'nuevaContraseña'): boolean {
    const control = this.form.get(controlName);
    return !!control && control.invalid && (control.touched || this.submitted);
  }

  isValid(controlName: 'email' | 'nuevaContraseña'): boolean {
    const control = this.form.get(controlName);
    return !!control && control.valid && (control.touched || this.submitted);
  }
}
