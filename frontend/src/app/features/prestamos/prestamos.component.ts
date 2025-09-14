import { Component, OnInit, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { PrestamosService, Prestamo } from './prestamos.service';
import { EquiposService, Equipo } from '../equipos/equipos.service';

@Component({
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, ReactiveFormsModule, DatePipe],
  templateUrl: './prestamos.component.html',
  styleUrl: './prestamos.component.scss'
})
export class PrestamosComponent implements OnInit {
  private fb = inject(FormBuilder);
  private prestamosSvc = inject(PrestamosService);
  private equiposSvc = inject(EquiposService);

  // Data properties
  prestamos: Prestamo[] = [];
  filteredPrestamos: Prestamo[] = [];
  overdueLoans: Prestamo[] = [];
  equipos: Equipo[] = [];

  // Loading states
  loading = false;
  error = '';

  // Success message
  showSuccessMessage = false;
  successMessageText = '';

  // QR Scanner properties
  qrUrl: string | null = null;
  isScanning = false;
  scanSuccess = false;
  scannerText = 'Haz clic para escanear código QR';
  scannedEquipment: Equipo | null = null;

  // Modal states
  showLoanModal = false;
  showReturnModal = false;
  showReturnActionsModal = false;
  showOverdueLoansModal = false;
  showLoanDetailsModal = false;
  showExtendModal = false;

  // Filter properties
  statusFilter = '';
  dateFilter = '';

  // Return modal properties
  selectedPrestamo: Prestamo | null = null;
  selectedPrestamoId = '';
  returnDate = '';
  equipmentCondition = '';
  returnObservations = '';
  overdueDays = 0;
  damageFee = 0;
  totalFee = 0;

  // Extend modal properties
  extendNewDate = '';
  extendReason = '';
  extendComments = '';

  // Form
  form = this.fb.group({
    equipmentId: ['', Validators.required],
    borrowerName: ['', Validators.required],
    dueDate: ['', Validators.required],
  });

  // Computed properties
  get todayDate(): string {
    return new Date().toISOString().split('T')[0];
  }

  ngOnInit() {
    this.loadPrestamos();
    this.loadEquiposDisponibles();
    this.setDefaultReturnDate();
    this.updateOverdueLoans();
  }

  // Data loading methods
  loadPrestamos() {
    this.loading = true;
    this.error = '';
    this.prestamosSvc.list().subscribe({
      next: (res) => {
        this.prestamos = res;
        this.filteredPrestamos = [...res];
        this.updateOverdueLoans();
        this.loading = false;
      },
      error: (e) => {
        this.error = e?.error?.message || 'No se pudo cargar préstamos';
        this.loading = false;
      }
    });
  }

  loadEquiposDisponibles() {
    this.equiposSvc.list({ status: 'available' }).subscribe({
      next: (data) => this.equipos = data,
      error: () => {} // silent error
    });
  }

  // QR Scanner methods
  simulateQRScan() {
    this.isScanning = true;
    this.scannerText = 'Escaneando...';
    this.scannedEquipment = null;

    setTimeout(() => {
      this.isScanning = false;
      this.scanSuccess = true;
      this.scannerText = '¡Código detectado!';

      // Simulate finding equipment
      if (this.equipos.length > 0) {
        this.scannedEquipment = this.equipos[0];
      }

      setTimeout(() => {
        this.scanSuccess = false;
        this.scannerText = 'Haz clic para escanear otro código';
      }, 2000);
    }, 2000);
  }

  createLoanFromScan() {
    if (this.scannedEquipment) {
      this.form.patchValue({
        equipmentId: this.scannedEquipment.id
      });
      this.openLoanModal();
    }
  }

  createReturnFromScan() {
    if (this.scannedEquipment) {
      const prestamo = this.prestamos.find(p =>
        p.equipmentId === this.scannedEquipment!.id &&
        p.status !== 'devuelto'
      );

      if (prestamo) {
        this.returnLoan(prestamo);
      } else {
        this.showErrorMessage('No se encontró un préstamo activo para este equipo');
      }
    }
  }

  // Modal methods
  openLoanModal() {
    // Set default dates
    const today = new Date();
    const returnDate = new Date();
    returnDate.setDate(today.getDate() + 7); // 7 days from today

    this.form.patchValue({
      dueDate: returnDate.toISOString().split('T')[0]
    });

    this.showLoanModal = true;
  }

  openReturnModal() {
    // This now opens the actions modal first
    this.showReturnActionsModal = true;
  }

  openDirectReturnModal() {
    // This opens the return modal directly (for when called from specific loan)
    this.setDefaultReturnDate();
    this.showReturnModal = true;
  }

  showOverdueModal() {
    this.updateOverdueLoans();
    this.showOverdueLoansModal = true;
  }

  openLoanDetailsModal() {
    this.showLoanDetailsModal = true;
  }

  openExtendModal() {
    this.showExtendModal = true;
  }

  closeModal(type: 'loan' | 'return' | 'returnActions' | 'overdue' | 'details' | 'extend') {
    if (type === 'loan') {
      this.showLoanModal = false;
      this.form.reset();
    } else if (type === 'return') {
      this.showReturnModal = false;
      this.resetReturnForm();
    } else if (type === 'returnActions') {
      this.showReturnActionsModal = false;
    } else if (type === 'overdue') {
      this.showOverdueLoansModal = false;
    } else if (type === 'details') {
      this.showLoanDetailsModal = false;
      this.selectedPrestamo = null;
    } else if (type === 'extend') {
      this.showExtendModal = false;
      this.resetExtendForm();
    }
  }

  // Return action methods
  startQRReturnProcess() {
    this.closeModal('returnActions');
    // Focus on QR scanner
    const scannerArea = document.getElementById('scannerArea');
    if (scannerArea) {
      scannerArea.scrollIntoView({ behavior: 'smooth' });
      // Highlight the scanner briefly
      scannerArea.style.borderColor = '#EE9D08';
      scannerArea.style.backgroundColor = '#fff9e6';
      setTimeout(() => {
        scannerArea.style.borderColor = '';
        scannerArea.style.backgroundColor = '';
      }, 2000);
    }
    this.displaySuccessMessage('Usa el escáner QR para identificar el equipo a devolver');
  }

  startManualReturnProcess() {
    this.closeModal('returnActions');
    this.setDefaultReturnDate();
    this.showReturnModal = true;
  }

  startOverdueReturnProcess() {
    this.closeModal('returnActions');
    this.showOverdueModal();
  }

  // Helper method to get active loans for return modal
  getActiveLoans(): Prestamo[] {
    return this.prestamos.filter(p => p.status !== 'devuelto');
  }

  // Method called when selecting a loan for return
  onSelectPrestamoForReturn() {
    if (this.selectedPrestamoId) {
      this.selectedPrestamo = this.prestamos.find(p => p.id === this.selectedPrestamoId) || null;
      if (this.selectedPrestamo) {
        this.calculateFees();
      }
    } else {
      this.selectedPrestamo = null;
    }
  }

  // Loan operations
  crearPrestamo() {
    if (this.form.invalid) return;

    this.prestamosSvc.create(this.form.value as any).subscribe({
      next: () => {
        this.form.reset();
        this.loadPrestamos();
        this.loadEquiposDisponibles();
        this.closeModal('loan');
        this.displaySuccessMessage('Préstamo creado exitosamente');
      },
      error: (e) => {
        this.showErrorMessage(e?.error?.message || 'No se pudo crear el préstamo');
      }
    });
  }

  returnLoan(prestamo: Prestamo) {
    this.selectedPrestamo = prestamo;
    this.selectedPrestamoId = prestamo.id;
    this.setDefaultReturnDate();
    this.calculateFees();
    this.openDirectReturnModal(); // Use direct modal when called from specific loan
  }

  confirmReturn() {
    if (!this.selectedPrestamo || !this.equipmentCondition || !this.returnDate) {
      this.showErrorMessage('Por favor complete todos los campos requeridos');
      return;
    }

    this.prestamosSvc.returnLoan(this.selectedPrestamo.id, this.returnDate).subscribe({
      next: () => {
        this.loadPrestamos();
        this.closeModal('return');
        this.displaySuccessMessage(
          `Devolución procesada exitosamente. Total a pagar: Q ${this.totalFee.toFixed(2)}`
        );
      },
      error: (e) => {
        this.showErrorMessage(e?.error?.message || 'No se pudo procesar la devolución');
      }
    });
  }

  viewLoan(prestamo: Prestamo) {
    this.selectedPrestamo = prestamo;
    this.showLoanDetailsModal = true;
  }

  extendLoan(prestamo: Prestamo) {
    this.selectedPrestamo = prestamo;

    // Set minimum date to current return date + 1 day
    const currentReturnDate = new Date(prestamo.dueDate);
    currentReturnDate.setDate(currentReturnDate.getDate() + 1);

    // Set default to 7 days extension
    const defaultExtension = new Date(prestamo.dueDate);
    defaultExtension.setDate(defaultExtension.getDate() + 7);
    this.extendNewDate = defaultExtension.toISOString().split('T')[0];

    this.showExtendModal = true;
  }

  confirmExtension() {
    if (!this.selectedPrestamo || !this.extendNewDate || !this.extendReason) {
      this.showErrorMessage('Por favor complete todos los campos requeridos');
      return;
    }

    // Here you would call the service to extend the loan
    // For now, we'll update locally and show success message
    this.selectedPrestamo.dueDate = this.extendNewDate;

    // Update status if it was overdue
    if (this.selectedPrestamo.status === 'atrasado') {
      this.selectedPrestamo.status = 'prestado';
    }

    this.loadPrestamos(); // Reload to get fresh data
    this.closeModal('extend');

    const newDate = new Date(this.extendNewDate).toLocaleDateString('es-GT');
    this.displaySuccessMessage(`Préstamo ${this.selectedPrestamo.id} extendido hasta ${newDate}`);
  }

  getMinExtendDate(): string {
    if (!this.selectedPrestamo) return this.todayDate;

    const currentReturnDate = new Date(this.selectedPrestamo.dueDate);
    currentReturnDate.setDate(currentReturnDate.getDate() + 1);
    return currentReturnDate.toISOString().split('T')[0];
  }

  getAdditionalDays(): string {
    if (!this.selectedPrestamo || !this.extendNewDate) return '0 días';

    const currentDate = new Date(this.selectedPrestamo.dueDate);
    const newDate = new Date(this.extendNewDate);
    const additionalDays = Math.ceil((newDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24));

    return `${additionalDays} días`;
  }

  updateExtensionSummary() {
    // This method is called when the date changes
    // The template will automatically update based on the computed properties
  }

  getDaysLeftText(prestamo: Prestamo): string {
    const daysLeft = this.calculateDaysLeft(prestamo.dueDate);

    if (prestamo.status === 'devuelto') {
      return 'Devuelto';
    } else if (daysLeft > 0) {
      return `${daysLeft} días restantes`;
    } else {
      return `${Math.abs(daysLeft)} días de retraso`;
    }
  }

  printLoan() {
    this.displaySuccessMessage('Función de impresión - En desarrollo');
  }

  // QR methods
  verQR(prestamo: Prestamo) {
    const eqId = prestamo.equipment?.id ?? prestamo.equipmentId;
    this.qrUrl = null;
    this.equiposSvc.qr(eqId).subscribe({
      next: (blob) => {
        this.qrUrl = URL.createObjectURL(blob);
      },
      error: () => {
        this.showErrorMessage('No se pudo generar el código QR');
      }
    });
  }

  // Filter methods
  filterPrestamos() {
    this.filteredPrestamos = this.prestamos.filter(prestamo => {
      // Status filter
      if (this.statusFilter && prestamo.status !== this.statusFilter) {
        return false;
      }

      // Date filter
      if (this.dateFilter) {
        const loanDate = new Date(prestamo.loanDate);
        const today = new Date();

        switch (this.dateFilter) {
          case 'today':
            if (loanDate.toDateString() !== today.toDateString()) {
              return false;
            }
            break;
          case 'week':
            const weekAgo = new Date();
            weekAgo.setDate(today.getDate() - 7);
            if (loanDate < weekAgo) {
              return false;
            }
            break;
          case 'month':
            const monthAgo = new Date();
            monthAgo.setMonth(today.getMonth() - 1);
            if (loanDate < monthAgo) {
              return false;
            }
            break;
        }
      }

      return true;
    });
  }

  // Helper methods
  getStatusClass(prestamo: Prestamo): any {
    return {
      'status-prestado': prestamo.status === 'prestado',
      'status-devuelto': prestamo.status === 'devuelto',
      'status-atrasado': prestamo.status === 'atrasado',
      'status-multa': prestamo.totalFine && prestamo.totalFine > 0
    };
  }

  getStatusText(status: string): string {
    const statusMap: { [key: string]: string } = {
      'prestado': 'Prestado',
      'devuelto': 'Devuelto',
      'atrasado': 'Atrasado'
    };
    return statusMap[status] || status.charAt(0).toUpperCase() + status.slice(1);
  }

  getSelectedEquipmentName(): string {
    const equipmentId = this.form.get('equipmentId')?.value;
    if (!equipmentId) return '-';

    const equipment = this.equipos.find(e => e.id === equipmentId);
    return equipment ? `${equipment.code} - ${equipment.name}` : '-';
  }

  getLoanDays(): string {
    const dueDateValue = this.form.get('dueDate')?.value;
    if (!dueDateValue) return '-';

    const today = new Date();
    const dueDate = new Date(dueDateValue);
    const days = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    return `${days} días`;
  }

  getOverdueCount(): number {
    return this.overdueLoans.length;
  }

  showOverdueLoans() {
    this.showOverdueModal();
  }

  getDaysOverdue(prestamo: Prestamo): number {
    const today = new Date();
    const dueDate = new Date(prestamo.dueDate);
    return Math.max(0, Math.ceil((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)));
  }

  notifyOverdueUsers() {
    const userCount = this.overdueLoans.length;
    this.displaySuccessMessage(`Se enviarán notificaciones a ${userCount} usuario(s) con préstamos atrasados`);
    // Aquí implementarías la lógica real de notificación
  }

  private updateOverdueLoans() {
    this.overdueLoans = this.prestamos.filter(prestamo => {
      const today = new Date();
      const dueDate = new Date(prestamo.dueDate);
      return prestamo.status !== 'devuelto' && today > dueDate;
    }).map(prestamo => {
      // Actualizar estado si está atrasado
      if (prestamo.status !== 'atrasado') {
        prestamo.status = 'atrasado';
      }
      return prestamo;
    });
  }

  // Return form methods
  private setDefaultReturnDate() {
    this.returnDate = new Date().toISOString().split('T')[0];
  }

  private resetReturnForm() {
    this.selectedPrestamo = null;
    this.selectedPrestamoId = '';
    this.returnDate = '';
    this.equipmentCondition = '';
    this.returnObservations = '';
    this.overdueDays = 0;
    this.damageFee = 0;
    this.totalFee = 0;
  }

  private resetExtendForm() {
    this.selectedPrestamo = null;
    this.extendNewDate = '';
    this.extendReason = '';
    this.extendComments = '';
  }

  calculateFees() {
    if (!this.selectedPrestamo || !this.returnDate) return;

    // Calculate overdue days
    const dueDate = new Date(this.selectedPrestamo.dueDate);
    const returnDate = new Date(this.returnDate);
    this.overdueDays = Math.max(0, Math.ceil((returnDate.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)));

    // Calculate damage fee
    switch (this.equipmentCondition) {
      case 'regular':
        this.damageFee = 50;
        break;
      case 'dañado':
        this.damageFee = 200;
        break;
      default:
        this.damageFee = 0;
    }

    // Calculate total fee
    const overdueFee = this.overdueDays * 5; // Q5 per day
    this.totalFee = overdueFee + this.damageFee;
  }

  private calculateOverdueDays(dueDate: string): number {
    const due = new Date(dueDate);
    const today = new Date();
    return Math.max(0, Math.ceil((today.getTime() - due.getTime()) / (1000 * 60 * 60 * 24)));
  }

  private calculateDaysLeft(dueDate: string): number {
    const due = new Date(dueDate);
    const today = new Date();
    return Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  }

  // Utility methods
  trackByPrestamoId(index: number, prestamo: Prestamo): string {
    return prestamo.id;
  }

  // Method to format ID numbers nicely (converts UUID to readable format)
  padNumber(id: string): string {
    // If it's already a nice format like PR001, return as is
    if (id.match(/^[A-Z]{2}\d{3}$/)) {
      return id.replace(/^[A-Z]{2}/, '');
    }

    // If it's a UUID or long string, create a short readable format
    if (id.length > 10) {
      // Take last 6 characters and convert to a number-like format
      const hashCode = this.hashCode(id);
      const shortId = Math.abs(hashCode % 9999) + 1;
      return shortId.toString().padStart(3, '0');
    }

    // If it's already short, just pad it
    return id.toString().padStart(3, '0');
  }

  // Helper method to generate consistent hash from string
  private hashCode(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash;
  }

  private displaySuccessMessage(message: string) {
    this.successMessageText = message;
    this.showSuccessMessage = true;

    setTimeout(() => {
      this.showSuccessMessage = false;
    }, 3000);
  }

  private showErrorMessage(message: string) {
    alert(message); // You can replace this with a proper toast notification
  }
}
