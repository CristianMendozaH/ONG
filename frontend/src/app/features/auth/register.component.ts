import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../../core/services/auth.service';
import { RegisterDto } from '../../shared/interfaces/models';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './register.component.html',
  styleUrl: './login.component.scss' // Reutilizando estilos
})
export class RegisterComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  loading = false;
  submitted = false;
  apiError = '';
  passwordFieldType: 'password' | 'text' = 'password';

  // --- NUEVA PROPIEDAD PARA EL MENSAJE DE ÉXITO ---
  successMessage = '';

  form = this.fb.group({
    nombre: ['', [Validators.required]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

  submit(): void {
    this.submitted = true;
    this.apiError = '';

    if (this.form.invalid) {
      return;
    }

    this.loading = true;
    const credentials = this.form.value as RegisterDto;

    this.authService.register(credentials).subscribe({
      next: () => {
        // --- LÓGICA ACTUALIZADA: YA NO USAMOS alert() ---
        this.loading = false;
        this.form.disable(); // Deshabilitar el formulario para evitar re-envíos
        this.successMessage = '¡Registro exitoso! Serás redirigido al login en 3 segundos...';

        // Redirigir después de 3 segundos
        setTimeout(() => {
          this.router.navigateByUrl('/login');
        }, 3000);
      },
      error: (e: HttpErrorResponse) => {
        this.apiError = e.error?.message || 'Error en el registro. Intenta con otro email.';
        this.loading = false;
      }
    });
  }

  // --- Funciones para el template HTML ---

  togglePasswordVisibility(): void {
    this.passwordFieldType = this.passwordFieldType === 'password' ? 'text' : 'password';
  }

  isInvalid(controlName: 'nombre' | 'email' | 'password'): boolean {
    const control = this.form.get(controlName);
    return !!control && control.invalid && (control.touched || this.submitted);
  }

  isValid(controlName: 'nombre' | 'email' | 'password'): boolean {
    const control = this.form.get(controlName);
    return !!control && control.valid && (control.touched || this.submitted);
  }
}
