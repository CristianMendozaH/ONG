import { Component, OnInit, OnDestroy, inject, ViewChild, ElementRef } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { PrestamosService, Prestamo } from './prestamos.service';
import { EquiposService, Equipo } from '../equipos/equipos.service';

import { BrowserMultiFormatReader, NotFoundException } from '@zxing/library';

@Component({
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, ReactiveFormsModule, DatePipe],
  templateUrl: './prestamos.component.html',
  styleUrl: './prestamos.component.scss'
})
export class PrestamosComponent implements OnInit, OnDestroy {
  @ViewChild('videoElement') public videoElement!: ElementRef<HTMLVideoElement>;

  private fb = inject(FormBuilder);
  private prestamosSvc = inject(PrestamosService);
  private equiposSvc = inject(EquiposService);

  public prestamos: Prestamo[] = [];
  public filteredPrestamos: Prestamo[] = [];
  public overdueLoans: Prestamo[] = [];
  public equipos: Equipo[] = [];
  public loading = false;
  public error = '';
  public showSuccessMessage = false;
  public successMessageText = '';
  public qrUrl: string | null = null;
  public isScanning = false;
  public scanSuccess = false;
  public scannerText = 'Haz clic para escanear código QR';
  public scannedEquipment: Equipo | null = null;
  public showCameraPreview = false;
  private codeReader: BrowserMultiFormatReader;
  private isScanningActive = false;
  public showLoanModal = false;
  public showReturnModal = false;
  public showOverdueLoansModal = false;
  public showLoanDetailsModal = false;
  public showExtendModal = false;
  public statusFilter = '';
  public dateFilter = '';
  public selectedPrestamo: Prestamo | null = null;
  public selectedPrestamoId = '';
  public returnDate = '';
  public equipmentCondition = '';
  public returnObservations = '';
  public overdueDays = 0;
  public damageFee = 0;
  public totalFee = 0;
  public extendNewDate = '';
  public extendReason = '';
  public extendComments = '';
  public form = this.fb.group({
    equipmentId: ['', Validators.required],
    borrowerName: ['', Validators.required],
    dueDate: ['', Validators.required],
  });

  public get availableEquipos(): Equipo[] {
    return this.equipos.filter(equipo => equipo.status === 'disponible');
  }

  public constructor() {
    this.codeReader = new BrowserMultiFormatReader();
  }

  public get todayDate(): string {
    return new Date().toISOString().split('T')[0];
  }

  public ngOnInit() {
    this.loadPrestamos();
    this.loadAllEquipos();
    this.setDefaultReturnDate();
  }

  public ngOnDestroy() {
    this.stopScan();
  }

  public loadPrestamos() {
    this.loading = true;
    this.error = '';
    this.prestamosSvc.list().subscribe({
      next: (res) => {
        this.prestamos = res;
        this.filteredPrestamos = [...this.prestamos];
        this.updateOverdueLoans();
        this.loading = false;
      },
      error: (e) => {
        this.error = e?.error?.message || 'No se pudo cargar los préstamos';
        this.loading = false;
      }
    });
  }

  public loadAllEquipos() {
    this.equiposSvc.list().subscribe({
      next: (data) => { this.equipos = data; },
      error: () => { this.showErrorMessage('No se pudieron cargar los equipos.'); }
    });
  }

  public async startScan() {
    if (this.isScanningActive) return;

    this.isScanningActive = true;
    this.isScanning = true;
    this.scannerText = 'Iniciando cámara...';
    this.scannedEquipment = null;
    this.showCameraPreview = true;

    setTimeout(async () => {
      try {
        const result = await this.codeReader.decodeFromInputVideoDevice(undefined, this.videoElement.nativeElement);
        if (result) {
          this.processQrCode(result.getText());
        }
      } catch (error: any) {
        console.error('Error detallado al iniciar la cámara:', error);
        this.scannerText = 'Error al escanear';
        if (error instanceof NotFoundException) {
          this.showErrorMessage('Error: No se encontró ninguna cámara de video en este dispositivo.');
        } else if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
          this.showErrorMessage('Permiso para acceder a la cámara denegado.');
        } else if (error.name === 'NotReadableError') {
          this.showErrorMessage('La cámara ya está siendo utilizada por otra aplicación.');
        } else {
          this.showErrorMessage('No se pudo acceder a la cámara. Revisa la consola del navegador para ver el error detallado.');
        }
        this.stopScan();
      }
    }, 100);
  }

  // --- FUNCIÓN CORREGIDA PARA MANEJAR JSON ---
  private processQrCode(qrText: string) {
    this.scanSuccess = true;
    this.scannerText = '¡Código detectado!';

    let equipmentIdentifier: string | undefined;
    let identifierForErrorMessage: string = qrText;

    try {
      // 1. Intentamos decodificar el texto como un objeto JSON
      const qrData = JSON.parse(qrText);

      // 2. Si tiene una propiedad 'id' o 'code', la usamos para la búsqueda
      if (qrData && (qrData.id || qrData.code)) {
        equipmentIdentifier = qrData.id || qrData.code;
        identifierForErrorMessage = qrData.code || qrData.id; // Para un mensaje de error más limpio
      }
    } catch (e) {
      // 3. Si no es un JSON, asumimos que el texto completo es el identificador
      equipmentIdentifier = qrText;
    }

    // 4. Buscamos el equipo usando el identificador que encontramos
    const foundEquipment = this.equipos.find(
      (e) => e.id === equipmentIdentifier || e.code === equipmentIdentifier
    );

    if (foundEquipment) {
      this.scannedEquipment = foundEquipment;
    } else {
      this.showErrorMessage(`Equipo con código "${identifierForErrorMessage}" no encontrado o no está disponible.`);
      this.scannerText = 'Equipo no encontrado';
    }

    this.stopScan();

    setTimeout(() => {
      this.scanSuccess = false;
      this.scannerText = 'Haz clic para escanear otro código';
    }, 3000);
  }

  public stopScan() {
    this.codeReader.reset();
    this.isScanning = false;
    this.isScanningActive = false;
    this.showCameraPreview = false;
  }

  public createLoanFromScan() {
    if (this.scannedEquipment) {
      this.form.patchValue({ equipmentId: this.scannedEquipment.id });
      this.openLoanModal();
    }
  }

  public createReturnFromScan() {
    if (this.scannedEquipment) {
      const prestamo = this.prestamos.find(p => p.equipmentId === this.scannedEquipment!.id && p.status !== 'devuelto');
      if (prestamo) {
        this.returnLoan(prestamo);
      } else {
        this.showErrorMessage('No se encontró un préstamo activo para este equipo');
      }
    }
  }

  public openLoanModal() {
    const today = new Date();
    const returnDate = new Date();
    returnDate.setDate(today.getDate() + 7);
    this.form.patchValue({ dueDate: returnDate.toISOString().split('T')[0] });
    this.showLoanModal = true;
  }

  public openReturnModal() {
    this.resetReturnForm();
    this.setDefaultReturnDate();
    const activos = this.getActiveLoans();
    if (activos.length === 1) {
      this.selectedPrestamo = activos[0];
      this.selectedPrestamoId = activos[0].id;
      this.calculateFees();
    }
    this.showReturnModal = true;
  }

  public showOverdueModal() {
    this.updateOverdueLoans();
    this.showOverdueLoansModal = true;
  }

  public closeModal(type: 'loan' | 'return' | 'overdue' | 'details' | 'extend') {
    switch (type) {
      case 'loan': this.showLoanModal = false; this.form.reset(); break;
      case 'return': this.showReturnModal = false; this.resetReturnForm(); break;
      case 'overdue': this.showOverdueLoansModal = false; break;
      case 'details': this.showLoanDetailsModal = false; this.selectedPrestamo = null; this.qrUrl = null; break;
      case 'extend': this.showExtendModal = false; this.resetExtendForm(); break;
    }
  }

  public getActiveLoans(): Prestamo[] {
    return this.prestamos.filter(p => p.status !== 'devuelto');
  }

  public onSelectPrestamoForReturn() {
    if (this.selectedPrestamoId) {
      this.selectedPrestamo = this.prestamos.find(p => p.id === this.selectedPrestamoId) || null;
      if (this.selectedPrestamo) this.calculateFees();
    } else {
      this.selectedPrestamo = null;
    }
  }

  public crearPrestamo() {
    if (this.form.invalid) return;
    this.prestamosSvc.create(this.form.value as any).subscribe({
      next: () => {
        this.form.reset();
        this.loadPrestamos();
        this.loadAllEquipos();
        this.closeModal('loan');
        this.displaySuccessMessage('Préstamo creado exitosamente');
      },
      error: (e) => this.showErrorMessage(e?.error?.message || 'No se pudo crear el préstamo')
    });
  }

  public returnLoan(prestamo: Prestamo) {
    this.selectedPrestamo = prestamo;
    this.selectedPrestamoId = prestamo.id;
    this.setDefaultReturnDate();
    this.calculateFees();
    this.showReturnModal = true;
  }

  public confirmReturn() {
    if (!this.selectedPrestamo || !this.equipmentCondition || !this.returnDate) {
      return this.showErrorMessage('Por favor complete todos los campos requeridos');
    }
    const returnData = {
      returnDate: this.returnDate,
      condition: this.equipmentCondition,
      observations: this.returnObservations,
      damageFee: this.damageFee
    };
    this.prestamosSvc.returnLoan(this.selectedPrestamo.id, returnData).subscribe({
      next: () => {
        this.loadPrestamos();
        this.closeModal('return');
        this.displaySuccessMessage(`Devolución procesada. Total a pagar: Q ${this.totalFee.toFixed(2)}`);
      },
      error: (e) => this.showErrorMessage(e?.error?.message || 'No se pudo procesar la devolución')
    });
  }

  public viewLoan(prestamo: Prestamo) {
    this.selectedPrestamo = prestamo;
    this.generateQRForSelectedLoan();
    this.showLoanDetailsModal = true;
  }

  public generateQRForSelectedLoan() {
    if (this.selectedPrestamo) {
      const eqId = this.selectedPrestamo.equipment?.id ?? this.selectedPrestamo.equipmentId;
      this.equiposSvc.qr(eqId).subscribe({
        next: (blob) => { this.qrUrl = URL.createObjectURL(blob); },
        error: () => { console.warn('No se pudo generar el código QR'); }
      });
    }
  }

  public extendLoan(prestamo: Prestamo) {
    this.selectedPrestamo = prestamo;
    const defaultExtension = new Date(prestamo.dueDate);
    defaultExtension.setDate(defaultExtension.getDate() + 8);
    this.extendNewDate = defaultExtension.toISOString().split('T')[0];
    this.showExtendModal = true;
  }

  public confirmExtension() {
    if (!this.selectedPrestamo || !this.extendNewDate || !this.extendReason) {
      return this.showErrorMessage('Por favor complete todos los campos requeridos');
    }
    this.prestamosSvc.extendLoan(this.selectedPrestamo.id, this.extendNewDate).subscribe({
      next: () => {
        this.loadPrestamos();
        this.closeModal('extend');
        const newDate = new Date(this.extendNewDate).toLocaleDateString('es-GT');
        this.displaySuccessMessage(`Préstamo extendido hasta ${newDate}`);
      },
      error: (e) => this.showErrorMessage(e?.error?.message || 'No se pudo extender el préstamo')
    });
  }

  public getMinExtendDate(): string {
    if (!this.selectedPrestamo) return this.todayDate;
    const currentReturnDate = new Date(this.selectedPrestamo.dueDate);
    currentReturnDate.setDate(currentReturnDate.getDate() + 2);
    return currentReturnDate.toISOString().split('T')[0];
  }

  public getAdditionalDays(): string {
    if (!this.selectedPrestamo || !this.extendNewDate) return '0 días';
    const currentDate = new Date(this.selectedPrestamo.dueDate);
    const newDate = new Date(this.extendNewDate);
    const additionalDays = Math.ceil((newDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24));
    return `${additionalDays} días`;
  }

  public updateExtensionSummary() {}

  public getDaysLeftText(prestamo: Prestamo): string {
    if (prestamo.status === 'devuelto') return 'Devuelto';
    const daysLeft = this.calculateDaysLeft(prestamo.dueDate);
    if (daysLeft >= 0) return `${daysLeft} días restantes`;
    return `${Math.abs(daysLeft)} días de retraso`;
  }

  public printLoan() {}

  public verQR(prestamo: Prestamo) {
    this.selectedPrestamo = prestamo;
    const eqId = prestamo.equipment?.id ?? prestamo.equipmentId;
    this.qrUrl = null;
    this.equiposSvc.qr(eqId).subscribe({
      next: (blob) => { this.qrUrl = URL.createObjectURL(blob); },
      error: () => { this.showErrorMessage('No se pudo generar el código QR'); }
    });
  }

  public downloadQR() {
    if (this.qrUrl && this.selectedPrestamo) {
      const link = document.createElement('a');
      link.href = this.qrUrl;
      link.download = `QR_${this.selectedPrestamo.equipment?.code || 'equipo'}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }

  public filterPrestamos() {
    this.filteredPrestamos = this.prestamos.filter(prestamo => {
      if (this.statusFilter && prestamo.status !== this.statusFilter) return false;
      if (this.dateFilter) {
        const loanDate = new Date(prestamo.loanDate);
        const today = new Date();
        switch (this.dateFilter) {
          case 'today': if (loanDate.toDateString() !== today.toDateString()) return false; break;
          case 'week': const weekAgo = new Date(); weekAgo.setDate(today.getDate() - 7); if (loanDate < weekAgo) return false; break;
          case 'month': const monthAgo = new Date(); monthAgo.setMonth(today.getMonth() - 1); if (loanDate < monthAgo) return false; break;
        }
      }
      return true;
    });
  }

  public getStatusClass(prestamo: Prestamo): any {
    return {
      'status-prestado': prestamo.status === 'prestado',
      'status-devuelto': prestamo.status === 'devuelto',
      'status-atrasado': prestamo.status === 'atrasado',
    };
  }

  public getStatusText(status: string): string {
    const statusMap: { [key: string]: string } = { 'prestado': 'Prestado', 'devuelto': 'Devuelto', 'atrasado': 'Atrasado' };
    return statusMap[status] || status;
  }

  public getSelectedEquipmentName(): string {
    const equipmentId = this.form.get('equipmentId')?.value;
    if (!equipmentId) return '-';
    const equipment = this.equipos.find(e => e.id === equipmentId);
    return equipment ? `${equipment.code} - ${equipment.name}` : '-';
  }

  public getLoanDays(): string {
    const dueDateValue = this.form.get('dueDate')?.value;
    if (!dueDateValue) return '-';
    const today = new Date();
    const dueDate = new Date(dueDateValue);
    const days = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return `${days} días`;
  }

  public getOverdueCount(): number {
    return this.overdueLoans.length;
  }

  public getDaysOverdue(prestamo: Prestamo): number {
    const today = new Date();
    const dueDate = new Date(prestamo.dueDate);
    return Math.max(0, Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)));
  }

  public notifyOverdueUsers() {
    this.displaySuccessMessage(`Se enviarán notificaciones a ${this.overdueLoans.length} usuario(s).`);
  }

  public trackByPrestamoId(index: number, prestamo: Prestamo): string {
    return prestamo.id;
  }

  public formatLoanId(id: string): string {
    if (id.length > 10) {
      const index = this.prestamos.findIndex(p => p.id === id);
      if (index !== -1) return `PR${(index + 1).toString().padStart(3, '0')}`;
    }
    if (id.match(/^\d+$/)) return `PR${id.padStart(3, '0')}`;
    return `PR${id.slice(-3).toUpperCase()}`;
  }

  public getEquipmentName(prestamo: Prestamo): string {
    const equipo = this.equipos.find(e => e.id === prestamo.equipmentId);
    return equipo?.name || prestamo.equipment?.name || 'Equipo no encontrado';
  }

  public getEquipmentCode(prestamo: Prestamo): string {
    const equipo = this.equipos.find(e => e.id === prestamo.equipmentId);
    return equipo?.code || prestamo.equipment?.code || prestamo.equipmentId;
  }

  private updateOverdueLoans() {
    this.overdueLoans = this.prestamos.filter(p => p.status !== 'devuelto' && new Date() > new Date(p.dueDate));
  }

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

  public calculateFees() {
    if (!this.selectedPrestamo || !this.returnDate) return;
    const dueDate = new Date(this.selectedPrestamo.dueDate);
    const returnDate = new Date(this.returnDate);
    this.overdueDays = Math.max(0, Math.ceil((returnDate.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)));
    this.damageFee = 0;
    if(this.equipmentCondition === 'regular') this.damageFee = 50;
    if(this.equipmentCondition === 'dañado') this.damageFee = 200;
    this.totalFee = (this.overdueDays * 5) + this.damageFee;
  }

  private calculateDaysLeft(dueDate: string): number {
    const due = new Date(dueDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    due.setHours(0,0,0,0);
    return Math.round((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  }

  private displaySuccessMessage(message: string) {
    this.successMessageText = message;
    this.showSuccessMessage = true;
    setTimeout(() => { this.showSuccessMessage = false; }, 3000);
  }

  private showErrorMessage(message: string) {
    alert(message);
  }
}
