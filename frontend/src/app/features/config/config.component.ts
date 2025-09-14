import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

// Interfaces para tipar la configuración
interface GeneralConfig {
  systemName: string;
  version: string;
  description: string;
  orgName: string;
  email: string;
  phone: string;
  website: string;
  address: string;
  logo?: string;
}

interface NotificationConfig {
  smtpServer: string;
  smtpPort: number;
  smtpUser: string;
  smtpPassword: string;
  replyEmail: string;
  loanTemplate: string;
  reminderTemplate: string;
}

interface AlertConfig {
  maxLoanDays: number;
  reminderDays: number;
  graceDays: number;
  reminderInterval: number;
  fineEnabled: boolean;
  dailyFine: number;
  maxFine: number;
  maintenanceHours: number;
  maintenanceDays: number;
  maintenanceAlertsEnabled: boolean;
}

interface AppearanceConfig {
  primaryColor: string;
  secondaryColor: string;
  successColor: string;
  dangerColor: string;
  defaultTheme: 'light' | 'dark' | 'auto';
  allowUserThemeChange: boolean;
  language: string;
  timezone: string;
  dateFormat: string;
  currency: string;
}

interface SystemConfig {
  general: GeneralConfig;
  notifications: NotificationConfig;
  alerts: AlertConfig;
  appearance: AppearanceConfig;
}

@Component({
  selector: 'app-config',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './config.component.html',
  styleUrls: ['./config.component.scss']
})
export class ConfigComponent implements OnInit {
  activeTab: string = 'general';
  isSaving: boolean = false;
  logoPreview: string | null = null;

  // Configuración del sistema con valores por defecto
  config: SystemConfig = {
    general: {
      systemName: 'Sistema de Gestión de Equipos',
      version: '1.0.0',
      description: 'Sistema para la gestión y control de préstamos de equipos tecnológicos en Amigos de Santa Cruz',
      orgName: 'Amigos de Santa Cruz ONG',
      email: 'contacto@amigossc.org',
      phone: '+502 1234-5678',
      website: 'https://www.amigossc.org',
      address: 'Santa Cruz La Laguna, Sololá, Guatemala'
    },
    notifications: {
      smtpServer: 'smtp.gmail.com',
      smtpPort: 587,
      smtpUser: 'sistema@amigossc.org',
      smtpPassword: '',
      replyEmail: 'noreply@amigossc.org',
      loanTemplate: `Estimado/a {nombre_usuario},

Se ha registrado exitosamente el préstamo del equipo: {nombre_equipo}
Fecha de préstamo: {fecha_prestamo}
Fecha de devolución: {fecha_devolucion}

Por favor, cuida el equipo y devuélvelo en la fecha indicada.

Saludos,
{nombre_organizacion}`,
      reminderTemplate: `Estimado/a {nombre_usuario},

Te recordamos que tienes pendiente la devolución del equipo: {nombre_equipo}
Fecha de devolución: {fecha_devolucion}

Por favor, acércate a nuestras oficinas para realizar la devolución.

Saludos,
{nombre_organizacion}`
    },
    alerts: {
      maxLoanDays: 14,
      reminderDays: 3,
      graceDays: 2,
      reminderInterval: 1,
      fineEnabled: true,
      dailyFine: 5.00,
      maxFine: 100.00,
      maintenanceHours: 1000,
      maintenanceDays: 90,
      maintenanceAlertsEnabled: true
    },
    appearance: {
      primaryColor: '#114495',
      secondaryColor: '#EE9D08',
      successColor: '#2ECC71',
      dangerColor: '#E6331B',
      defaultTheme: 'light',
      allowUserThemeChange: true,
      language: 'es',
      timezone: 'America/Guatemala',
      dateFormat: 'dd/mm/yyyy',
      currency: 'GTQ'
    }
  };

  constructor() { }

  ngOnInit(): void {
    this.loadConfiguration();
    this.setDefaultLogoPreview();
  }

  /**
   * Cambia la pestaña activa
   */
  switchTab(tabName: string): void {
    this.activeTab = tabName;
  }

  /**
   * Maneja el cambio de logo
   */
  onLogoChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (file) {
      // Validar tamaño del archivo (máximo 2MB)
      if (file.size > 2 * 1024 * 1024) {
        alert('El archivo es demasiado grande. El tamaño máximo permitido es 2MB.');
        return;
      }

      // Validar tipo de archivo
      if (!file.type.startsWith('image/')) {
        alert('Por favor selecciona un archivo de imagen válido.');
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        this.logoPreview = e.target?.result as string;
        this.config.general.logo = this.logoPreview;
      };
      reader.readAsDataURL(file);
    }
  }

  /**
   * Establece la vista previa por defecto del logo
   */
  private setDefaultLogoPreview(): void {
    this.logoPreview = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='40' viewBox='0 0 100 40'%3E%3Crect width='100' height='40' fill='%23114495'/%3E%3Ctext x='50' y='25' text-anchor='middle' fill='white' font-family='Arial' font-size='12'%3ELogo%3C/text%3E%3C/svg%3E";
  }

  /**
   * Actualiza la vista previa de colores
   */
  updateColorPreview(): void {
    // Actualizar las variables CSS para la vista previa en tiempo real
    document.documentElement.style.setProperty('--primary-color', this.config.appearance.primaryColor);
  }

  /**
   * Carga la configuración desde el backend (simulado)
   */
  private loadConfiguration(): void {
    // Aquí harías la llamada real al backend
    // this.configService.getConfiguration().subscribe(config => {
    //   this.config = config;
    // });

    // Por ahora, cargamos los valores por defecto
    console.log('Configuración cargada:', this.config);
  }

  /**
   * Guarda la configuración
   */
  saveSettings(): void {
    this.isSaving = true;

    // Simular llamada al backend
    setTimeout(() => {
      // Aquí harías la llamada real al backend
      // this.configService.saveConfiguration(this.config).subscribe({
      //   next: (response) => {
      //     console.log('Configuración guardada:', response);
      //     this.showSuccessMessage();
      //   },
      //   error: (error) => {
      //     console.error('Error al guardar configuración:', error);
      //     this.showErrorMessage();
      //   },
      //   complete: () => {
      //     this.isSaving = false;
      //   }
      // });

      console.log('Configuración guardada:', this.config);
      this.showSuccessMessage();
      this.isSaving = false;
    }, 2000);
  }

  /**
   * Restablece la configuración a valores por defecto
   */
  resetSettings(): void {
    const confirmReset = confirm('¿Está seguro de que desea restablecer toda la configuración a los valores predeterminados?');

    if (confirmReset) {
      // Restablecer a valores por defecto
      this.config = {
        general: {
          systemName: 'Sistema de Gestión de Equipos',
          version: '1.0.0',
          description: 'Sistema para la gestión y control de préstamos de equipos tecnológicos en Amigos de Santa Cruz',
          orgName: 'Amigos de Santa Cruz ONG',
          email: 'contacto@amigossc.org',
          phone: '+502 1234-5678',
          website: 'https://www.amigossc.org',
          address: 'Santa Cruz La Laguna, Sololá, Guatemala'
        },
        notifications: {
          smtpServer: 'smtp.gmail.com',
          smtpPort: 587,
          smtpUser: 'sistema@amigossc.org',
          smtpPassword: '',
          replyEmail: 'noreply@amigossc.org',
          loanTemplate: `Estimado/a {nombre_usuario},

Se ha registrado exitosamente el préstamo del equipo: {nombre_equipo}
Fecha de préstamo: {fecha_prestamo}
Fecha de devolución: {fecha_devolucion}

Por favor, cuida el equipo y devuélvelo en la fecha indicada.

Saludos,
{nombre_organizacion}`,
          reminderTemplate: `Estimado/a {nombre_usuario},

Te recordamos que tienes pendiente la devolución del equipo: {nombre_equipo}
Fecha de devolución: {fecha_devolucion}

Por favor, acércate a nuestras oficinas para realizar la devolución.

Saludos,
{nombre_organizacion}`
        },
        alerts: {
          maxLoanDays: 14,
          reminderDays: 3,
          graceDays: 2,
          reminderInterval: 1,
          fineEnabled: true,
          dailyFine: 5.00,
          maxFine: 100.00,
          maintenanceHours: 1000,
          maintenanceDays: 90,
          maintenanceAlertsEnabled: true
        },
        appearance: {
          primaryColor: '#114495',
          secondaryColor: '#EE9D08',
          successColor: '#2ECC71',
          dangerColor: '#E6331B',
          defaultTheme: 'light',
          allowUserThemeChange: true,
          language: 'es',
          timezone: 'America/Guatemala',
          dateFormat: 'dd/mm/yyyy',
          currency: 'GTQ'
        }
      };

      this.setDefaultLogoPreview();
      this.updateColorPreview();

      alert('Configuración restablecida a valores predeterminados.');
    }
  }

  /**
   * Muestra mensaje de éxito
   */
  private showSuccessMessage(): void {
    alert('Configuración guardada exitosamente.\n\nLos cambios se aplicarán en el próximo inicio de sesión.');
  }

  /**
   * Muestra mensaje de error
   */
  private showErrorMessage(): void {
    alert('Error al guardar la configuración. Por favor, inténtalo de nuevo.');
  }

  /**
   * Valida la configuración antes de guardar
   */
  private validateConfiguration(): boolean {
    // Validar campos obligatorios
    if (!this.config.general.systemName.trim()) {
      alert('El nombre del sistema es obligatorio.');
      return false;
    }

    if (!this.config.general.orgName.trim()) {
      alert('El nombre de la organización es obligatorio.');
      return false;
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.config.general.email)) {
      alert('Por favor, introduce un email válido.');
      return false;
    }

    if (!emailRegex.test(this.config.notifications.smtpUser)) {
      alert('Por favor, introduce un usuario SMTP válido.');
      return false;
    }

    if (!emailRegex.test(this.config.notifications.replyEmail)) {
      alert('Por favor, introduce un email de respuesta válido.');
      return false;
    }

    // Validar puertos
    if (this.config.notifications.smtpPort < 1 || this.config.notifications.smtpPort > 65535) {
      alert('El puerto SMTP debe estar entre 1 y 65535.');
      return false;
    }

    // Validar valores numéricos positivos
    if (this.config.alerts.maxLoanDays <= 0) {
      alert('El tiempo máximo de préstamo debe ser mayor a 0.');
      return false;
    }

    if (this.config.alerts.reminderDays <= 0) {
      alert('Los días para recordatorio deben ser mayores a 0.');
      return false;
    }

    if (this.config.alerts.fineEnabled) {
      if (this.config.alerts.dailyFine < 0) {
        alert('La multa diaria no puede ser negativa.');
        return false;
      }

      if (this.config.alerts.maxFine < 0) {
        alert('La multa máxima no puede ser negativa.');
        return false;
      }

      if (this.config.alerts.maxFine < this.config.alerts.dailyFine) {
        alert('La multa máxima debe ser mayor o igual a la multa diaria.');
        return false;
      }
    }

    return true;
  }

  /**
   * Método mejorado para guardar que incluye validación
   */
  saveSettingsWithValidation(): void {
    if (!this.validateConfiguration()) {
      return;
    }

    this.saveSettings();
  }
}
