// Archivo completo: src/app/features/prestamos/prestamos.component.ts

import { Component, OnInit, OnDestroy, inject, ViewChild, ElementRef, LOCALE_ID } from '@angular/core';
import { CommonModule, DatePipe, registerLocaleData } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import localeEsGT from '@angular/common/locales/es-GT';
import { PrestamosService, Prestamo, DevolverPrestamoDTO, CrearPrestamoDTO, ExtendLoanDTO } from './prestamos.service';
import { EquiposService, Equipo } from '../equipos/equipos.service';
import { BrowserMultiFormatReader, NotFoundException } from '@zxing/library';
import { UserStore } from '../../core/stores/user.store';

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
  private userStore = inject(UserStore);

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

  public minExtensionDate = '';
  public extendNewDate = '';
  public extendReason = '';
  public extendComments = '';
  public extensionDays = 0;

  public availableAccessories = [
    { key: 'cargador', label: 'Cargador' },
    { key: 'mouse', label: 'Mouse' },
    { key: 'teclado', label: 'Teclado' },
    { key: 'adaptador', label: 'Adaptador de Video (VGA/HDMI)' },
    { key: 'estuche', label: 'Estuche o Maletín' },
    { key: 'cable_poder', label: 'Cable de Poder' },
    { key: 'otro', label: 'Otro (especificar)' }
  ];

  public loanForm = this.fb.group({
    equipmentId: ['', Validators.required],
    borrowerName: ['', Validators.required],
    dueDate: ['', Validators.required],
    borrowerType: ['Estudiante' as const, Validators.required],
    borrowerContact: [''],
    responsiblePartyName: [''],
    accessories: this.fb.group({
      cargador: [false],
      mouse: [false],
      teclado: [false],
      adaptador: [false],
      estuche: [false],
      cable_poder: [false],
      otro: [false]
    }),
    otroAccesorioTexto: ['']
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

      if (prestamosData) {
        this.prestamos = prestamosData.map(p => ({
          ...p,
          loanDate: new Date(p.loanDate),
          dueDate: new Date(p.dueDate),
          returnDate: p.returnDate ? new Date(p.returnDate) : null
        }));
      } else {
        this.prestamos = [];
      }

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
    if (this.loanForm.invalid) {
      return this.showToast('Completa los campos requeridos', 'error');
    }

    const currentUser = this.userStore.currentUser();
    if (!currentUser) {
      return this.showToast('No se pudo identificar al usuario. Por favor, inicie sesión de nuevo.', 'error');
    }

    const formValue = this.loanForm.value;
    const selectedAccessories: string[] = [];
    const accessoriesValue = formValue.accessories as { [key: string]: boolean };

    for (const accesorio of this.availableAccessories) {
      if (accessoriesValue[accesorio.key]) {
        if (accesorio.key === 'otro') {
          if (formValue.otroAccesorioTexto?.trim()) {
            selectedAccessories.push(formValue.otroAccesorioTexto.trim());
          }
        } else {
          selectedAccessories.push(accesorio.label);
        }
      }
    }

    const payload: CrearPrestamoDTO = {
      equipmentId: formValue.equipmentId!,
      borrowerName: formValue.borrowerName!,
      dueDate: formValue.dueDate!,
      borrowerType: formValue.borrowerType!,
      borrowerContact: formValue.borrowerContact || undefined,
      responsiblePartyName: formValue.responsiblePartyName || undefined,
      registeredById: currentUser.id,
      accessories: selectedAccessories.length > 0 ? selectedAccessories : undefined
    };

    this.prestamosSvc.create(payload).subscribe({
      next: () => {
        this.closeModal('loan');
        this.loadAllData();
        this.showToast('Préstamo creado exitosamente', 'success');
      },
      error: (e) => this.showToast(e?.error?.message || 'Error al crear el préstamo', 'error')
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

      const styles = `
        <style>
          body { font-family: 'Poppins', sans-serif; margin: 20px; color: #33475b; }
          .no-print { display: none !important; }
          .receipt-header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #114495; padding-bottom: 15px; margin-bottom: 30px; }
          .logo-container { display: flex; align-items: center; gap: 15px; }
          .receipt-logo { max-width: 150px; height: auto; }
          .receipt-header h4 { font-size: 1.2rem; margin: 0; color: #114495; font-weight: 600; }
          .receipt-info p { margin: 0 0 5px 0; text-align: right; font-size: 0.9rem; }
          .details-section { margin-bottom: 30px; }
          .details-title { font-size: 1.1rem; font-weight: 600; color: #114495; margin-bottom: 15px; border-bottom: 1px solid #e0e0e0; padding-bottom: 8px; }
          .details-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px 20px; }
          .detail-item { font-size: 1rem; }
          .detail-label { font-weight: 500; color: #666; font-size: 0.9rem; margin-bottom: 4px; display: block; }
          .receipt-footer { display: flex; justify-content: space-around; margin-top: 80px; padding-top: 20px; }
          .signature-box { width: 45%; text-align: center; }
          .signature-line { border-top: 1px solid #333; height: 40px; }
          .signature-name { font-weight: 600; margin: 5px 0 0 0; }
          .signature-title { font-size: 0.9rem; color: #666; margin: 2px 0 0 0; }
        </style>
      `;

      printWindow.document.open();
      printWindow.document.write(
        '<html><head><title>Comprobante de Préstamo</title>' +
        '<link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600&display=swap" rel="stylesheet">' +
        styles +
        `</head><body onload="window.print();window.close()">${receiptContent}</body></html>`
      );
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

  public extendLoan(prestamo: Prestamo) {
    this.selectedPrestamo = prestamo;

    const currentDueDate = new Date(prestamo.dueDate);
    const minDate = new Date(currentDueDate.setDate(currentDueDate.getDate() + 1));
    this.minExtensionDate = minDate.toISOString().split('T')[0];

    const defaultNewDate = new Date(minDate.setDate(minDate.getDate() + 7));
    this.extendNewDate = defaultNewDate.toISOString().split('T')[0];

    this.showExtendModal = true;
    this.calculateExtensionSummary();
  }

  public calculateExtensionSummary() {
    if (!this.selectedPrestamo || !this.extendNewDate) {
      this.extensionDays = 0;
      return;
    }
    const currentDueDate = new Date(this.selectedPrestamo.dueDate.toISOString().split('T')[0]);
    const newDueDate = new Date(this.extendNewDate);
    const timeDiff = newDueDate.getTime() - currentDueDate.getTime();

    this.extensionDays = timeDiff > 0 ? Math.ceil(timeDiff / (1000 * 60 * 60 * 24)) : 0;
  }

  public confirmExtension() {
    if (!this.selectedPrestamo || !this.extendNewDate || !this.extendReason) {
      return this.showToast('Debes seleccionar una nueva fecha y un motivo.', 'error');
    }

    const payload: ExtendLoanDTO = {
      newDueDate: this.extendNewDate,
      reason: this.extendReason,
      comments: this.extendComments
    };

    this.prestamosSvc.extendLoan(this.selectedPrestamo.id, payload).subscribe({
      next: () => {
        this.closeModal('extend');
        this.loadAllData();
        this.showToast('Préstamo extendido exitosamente', 'success');
      },
      error: (e) => this.showToast(e?.error?.message || 'Error al extender el préstamo', 'error')
    });
  }

  public showOverdueModal() {
    this.updateOverdueLoans();
    this.showOverdueLoansModal = true;
  }

  public updateOverdueLoans() {
    this.overdueLoans = this.prestamos.filter(p => p.status !== 'devuelto' && new Date() > new Date(p.dueDate));
  }

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
    if (type === 'extend') this.resetExtendForm();
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

  public calculateDaysLeft(dueDate: Date): number {
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
    this.minExtensionDate = '';
    this.extensionDays = 0;
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
