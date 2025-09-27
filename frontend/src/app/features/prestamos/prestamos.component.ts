import { Component, OnInit, OnDestroy, inject, ViewChild, ElementRef, LOCALE_ID } from '@angular/core';
import { CommonModule, DatePipe, registerLocaleData } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import localeEsGT from '@angular/common/locales/es-GT';
import { PrestamosService, Prestamo, DevolverPrestamoDTO } from './prestamos.service';
import { EquiposService, Equipo } from '../equipos/equipos.service';
import { BrowserMultiFormatReader, NotFoundException } from '@zxing/library';

registerLocaleData(localeEsGT);

type EquipmentCondition = 'excelente' | 'bueno' | 'regular' | 'dañado';

interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error';
}

@Component({
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, ReactiveFormsModule, DatePipe],
  templateUrl: './prestamos.component.html',
  styleUrl: './prestamos.component.scss',
  providers: [{ provide: LOCALE_ID, useValue: 'es-GT' }]
})
export class PrestamosComponent implements OnInit, OnDestroy {
  @ViewChild('videoElement') public videoElement!: ElementRef<HTMLVideoElement>;

  private fb = inject(FormBuilder);
  private prestamosSvc = inject(PrestamosService);
  private equiposSvc = inject(EquiposService);

  public toasts: Toast[] = [];
  public prestamos: Prestamo[] = [];
  public filteredPrestamos: Prestamo[] = [];
  public overdueLoans: Prestamo[] = [];
  public equipos: Equipo[] = [];
  public loading = true;
  public error = '';
  public qrUrl: string | null = null;
  public isScanning = false;
  public scanSuccess = false;
  public scannerText = 'Haz clic para escanear código QR';
  public scannedEquipment: Equipo | null = null;
  public scannedLoanInfo: Prestamo | null = null;
  public showCameraPreview = false;
  private codeReader: BrowserMultiFormatReader;

  public showLoanModal = false;
  public showReturnModal = false;
  public showOverdueLoansModal = false;
  public showLoanDetailsModal = false;
  public showExtendModal = false;
  public statusFilter = '';
  public dateFilter = '';
  public selectedPrestamo: Prestamo | null = null;
  public selectedPrestamoId = '';
  public selectedEquipmentDescription: string | null = null;
  public returnDate = '';
  public equipmentCondition: EquipmentCondition | '' = '';
  public returnObservations = '';
  public overdueDays = 0;
  public damageFee = 0;
  public totalFee = 0;
  public extendNewDate = '';
  public extendReason = '';
  public extendComments = '';

  public loanForm = this.fb.group({
    equipmentId: ['', Validators.required],
    borrowerName: ['', Validators.required],
    dueDate: ['', Validators.required],
    borrowerType: ['Estudiante' as const, Validators.required],
    borrowerContact: [''],
    responsiblePartyName: [''],
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
    this.loadAllData();
  }

  public ngOnDestroy() {
    this.stopScan();
  }

  private async loadAllData() {
    this.loading = true;
    this.error = '';
    try {
      this.equipos = await this.equiposSvc.list().toPromise() || [];
      const prestamosData = await this.prestamosSvc.list().toPromise();
      this.prestamos = prestamosData || [];
      this.filterPrestamos();
      this.updateOverdueLoans();
    } catch (e: any) {
      this.error = e?.error?.message || 'No se pudieron cargar los datos';
      this.showToast(this.error, 'error');
    } finally {
      this.loading = false;
    }
  }

  public loadPrestamos() {
    this.loadAllData();
  }

  public showToast(message: string, type: 'success' | 'error' = 'success') {
    const id = Date.now();
    this.toasts.push({ id, message, type });
    setTimeout(() => this.removeToast(id), 5000);
  }

  public removeToast(id: number) {
    this.toasts = this.toasts.filter(toast => toast.id !== id);
  }

  public async startScan() {
    if (this.loading || this.isScanning) {
      if(this.loading) this.showToast('Espera a que los datos terminen de cargar.', 'error');
      return;
    };

    this.isScanning = true;
    this.scannerText = 'Iniciando cámara...';
    this.clearScannedData();
    this.showCameraPreview = true;
    try {
      await new Promise(resolve => setTimeout(resolve, 100));
      const result = await this.codeReader.decodeFromInputVideoDevice(undefined, this.videoElement.nativeElement);
      if (result) {
        this.processQrCode(result.getText());
      }
    } catch (error) {
      this.scannerText = 'Error al escanear';
      this.showToast('No se pudo iniciar la cámara. Revisa los permisos.', 'error');
    } finally {
      this.stopScan();
    }
  }

  private processQrCode(qrText: string) {
    this.scanSuccess = true;
    this.scannerText = '¡Código detectado!';
    let equipmentIdentifier: string | undefined;

    try {
      const qrData = JSON.parse(qrText);
      if (qrData && (qrData.id || qrData.code)) {
        equipmentIdentifier = qrData.id || qrData.code;
      }
    } catch (e) {
      equipmentIdentifier = qrText.trim();
    }

    if (!equipmentIdentifier) {
      this.showToast('El código QR no tiene un formato válido.', 'error');
      this.scannerText = 'QR no válido';
      return;
    }

    const foundEquipment = this.equipos.find(e => e.id === equipmentIdentifier || e.code === equipmentIdentifier);

    if (foundEquipment) {
      this.scannedEquipment = foundEquipment;
      this.showToast(`Equipo encontrado: ${foundEquipment.name}`, 'success');

      if (foundEquipment.status === 'prestado') {
        const activeLoan = this.prestamos.find(p => p.equipmentId === foundEquipment!.id && p.status !== 'devuelto');
        if (activeLoan) {
          this.scannedLoanInfo = activeLoan;
        }
      }
    } else {
      this.showToast(`Equipo con ID/código "${equipmentIdentifier}" no encontrado en la lista.`, 'error');
      this.scannerText = 'Equipo no encontrado';
    }

    setTimeout(() => { this.scanSuccess = false; }, 3000);
  }

  public stopScan() {
    this.codeReader.reset();
    this.isScanning = false;
    this.showCameraPreview = false;
  }

  public clearScannedData() {
    this.scannedEquipment = null;
    this.scannedLoanInfo = null;
  }

  public createLoanFromScan() {
    if (this.scannedEquipment) {
      this.openLoanModal();
      this.loanForm.patchValue({ equipmentId: this.scannedEquipment.id });
      this.onEquipmentSelected();
    }
  }

  public createReturnFromScan() {
    if (this.scannedEquipment) {
      const prestamo = this.prestamos.find(p => p.equipmentId === this.scannedEquipment!.id && p.status !== 'devuelto');
      if (prestamo) {
        this.returnLoan(prestamo);
      } else {
        this.showToast('No se encontró un préstamo activo para este equipo', 'error');
      }
    }
  }

  public openLoanModal() {
    const returnDate = new Date();
    returnDate.setDate(returnDate.getDate() + 7);
    this.loanForm.reset({
      borrowerType: 'Estudiante',
      dueDate: returnDate.toISOString().split('T')[0]
    });
    this.selectedEquipmentDescription = null;
    this.showLoanModal = true;
  }

  public onEquipmentSelected() {
    const id = this.loanForm.get('equipmentId')?.value;
    this.selectedEquipmentDescription = this.equipos.find(e => e.id === id)?.description || null;
  }

  public crearPrestamo() {
    if (this.loanForm.invalid) return this.showToast('Completa los campos requeridos', 'error');
    this.prestamosSvc.create(this.loanForm.value as any).subscribe({
      next: () => { this.closeModal('loan'); this.loadAllData(); this.showToast('Préstamo creado', 'success'); },
      error: (e) => this.showToast(e?.error?.message || 'Error al crear préstamo', 'error')
    });
  }

  public openReturnModal() {
    this.resetReturnForm();
    if (this.getActiveLoans().length === 1) {
      this.selectedPrestamoId = this.getActiveLoans()[0].id;
      this.onSelectPrestamoForReturn();
    }
    this.showReturnModal = true;
  }

  public confirmReturn() {
    if (!this.selectedPrestamo || !this.equipmentCondition) return this.showToast('Completa los campos', 'error');
    const returnData: DevolverPrestamoDTO = { returnDate: this.returnDate, condition: this.equipmentCondition, observations: this.returnObservations };
    this.prestamosSvc.returnLoan(this.selectedPrestamo.id, returnData).subscribe({
      next: () => { this.closeModal('return'); this.loadAllData(); this.showToast('Devolución procesada', 'success'); },
      error: (e) => this.showToast(e?.error?.message || 'Error al devolver', 'error')
    });
  }

  public viewLoan(prestamo: Prestamo) {
    this.selectedPrestamo = prestamo;
    this.showLoanDetailsModal = true;
  }

  public printLoan() {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      const receiptContent = document.getElementById('loanReceipt')?.innerHTML;
      const styles = `<style> body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; } .receipt-header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #333; padding-bottom: 15px; } .details-section { margin-top: 25px; } .details-title { font-size: 1.1rem; border-bottom: 1px solid #ccc; padding-bottom: 8px; } .details-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-top: 15px; } .detail-label { color: #555; font-weight: 600; } .return-details { background-color: #f8f9fa; padding: 15px; border-radius: 8px; } .receipt-footer { display: flex; justify-content: space-around; margin-top: 80px; } .signature-box { border-top: 1px solid #000; padding-top: 8px; width: 40%; text-align: center; } .no-print { display: none; } </style>`;
      printWindow.document.open();
      printWindow.document.write(`<html><head><title>Comprobante de Préstamo</title>${styles}</head><body onload="window.print();window.close()">${receiptContent}</body></html>`);
      printWindow.document.close();
    }
  }

  public verQR(prestamo: Prestamo) {
    this.selectedPrestamo = prestamo;
    this.qrUrl = null;
    const eqId = prestamo.equipment?.id ?? prestamo.equipmentId;
    this.equiposSvc.qr(eqId).subscribe({
      next: (blob) => { this.qrUrl = URL.createObjectURL(blob); },
      error: () => { this.showToast('No se pudo generar el QR', 'error'); }
    });
  }

  public downloadQR() {
    if (this.qrUrl && this.selectedPrestamo) {
      const link = document.createElement('a');
      link.href = this.qrUrl;
      link.download = `QR_${this.getEquipmentCode(this.selectedPrestamo)}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }

  public getActiveLoans = () => this.prestamos.filter(p => p.status !== 'devuelto');

  public onSelectPrestamoForReturn() {
    this.selectedPrestamo = this.prestamos.find(p => p.id === this.selectedPrestamoId) || null;
    this.calculateFees();
  }

  public returnLoan(prestamo: Prestamo) {
    this.selectedPrestamoId = prestamo.id;
    this.onSelectPrestamoForReturn();
    this.showReturnModal = true;
  }

  public extendLoan(prestamo: Prestamo) { this.selectedPrestamo = prestamo; this.showExtendModal = true; }
  public confirmExtension() { /* Lógica para confirmar extensión */ }
  public showOverdueModal() { this.updateOverdueLoans(); this.showOverdueLoansModal = true; }
  public updateOverdueLoans() { this.overdueLoans = this.prestamos.filter(p => p.status !== 'devuelto' && new Date() > new Date(p.dueDate)); }
  public getOverdueCount = () => this.overdueLoans.length;

  public closeModal(type: 'loan' | 'return' | 'overdue' | 'details' | 'extend' | 'qr') {
    const modals: { [key: string]: keyof PrestamosComponent } = {
      loan: 'showLoanModal', return: 'showReturnModal', overdue: 'showOverdueLoansModal',
      details: 'showLoanDetailsModal', extend: 'showExtendModal', qr: 'qrUrl'
    };
    if (type === 'qr') {
      this.qrUrl = null;
    } else {
      (this[modals[type]] as boolean) = false;
    }
    if (type === 'loan') this.loanForm.reset();
    if (type === 'return') this.resetReturnForm();
    if (type === 'details') this.selectedPrestamo = null;
  }

  public filterPrestamos() {
    this.filteredPrestamos = this.prestamos.filter(p => (!this.statusFilter || p.status === this.statusFilter));
  }

  public getStatusClass = (p: Prestamo) => ({ 'status-prestado': p.status === 'prestado', 'status-devuelto': p.status === 'devuelto', 'status-atrasado': p.status === 'atrasado' });
  public getStatusText = (s: string) => ({ prestado: 'Prestado', devuelto: 'Devuelto', atrasado: 'Atrasado', disponible: 'Disponible', mantenimiento: 'Mantenimiento' }[s] || s);

  public getEquipmentName = (p: Prestamo) => p.equipment?.name || this.equipos.find(e => e.id === p.equipmentId)?.name || 'N/A';
  public getEquipmentCode = (p: Prestamo) => p.equipment?.code || this.equipos.find(e => e.id === p.equipmentId)?.code || 'N/A';

  public getSelectedEquipmentName = () => this.equipos.find(e => e.id === this.loanForm.get('equipmentId')?.value)?.name || '-';
  public getLoanDays = () => '...';

  public calculateDaysLeft(dueDate: string): number {
    const due = new Date(dueDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    due.setHours(0,0,0,0);
    return Math.round((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  }

  public getDaysLeftText(prestamo: Prestamo): string {
    if (prestamo.status === 'devuelto') return 'Finalizado';
    const days = this.calculateDaysLeft(prestamo.dueDate);
    return days >= 0 ? `${days} día(s) restante(s)` : `${Math.abs(days)} día(s) de retraso`;
  }

  public formatLoanId = (id: string) => `PR-${id.substring(0, 4).toUpperCase()}`;
  public trackByPrestamoId = (index: number, prestamo: Prestamo) => prestamo.id;

  private setDefaultReturnDate = () => this.returnDate = new Date().toISOString().split('T')[0];

  private resetReturnForm() {
    this.selectedPrestamo = null; this.selectedPrestamoId = ''; this.returnDate = this.todayDate;
    this.equipmentCondition = ''; this.returnObservations = ''; this.overdueDays = 0;
    this.damageFee = 0; this.totalFee = 0;
  }

  private resetExtendForm() {
    this.selectedPrestamo = null;
    this.extendNewDate = '';
    this.extendReason = '';
    this.extendComments = '';
  }

  public calculateFees() {
    if (!this.selectedPrestamo) return;
    const due = new Date(this.selectedPrestamo.dueDate);
    const returned = new Date(this.returnDate);
    this.overdueDays = Math.max(0, Math.ceil((returned.getTime() - due.getTime()) / 86400000));
    const damageFeeMap: { [key in EquipmentCondition]: number } = { excelente: 0, bueno: 0, regular: 50, dañado: 200 };
    this.damageFee = this.equipmentCondition ? damageFeeMap[this.equipmentCondition] : 0;
    this.totalFee = (this.overdueDays * 5) + this.damageFee;
  }
}
