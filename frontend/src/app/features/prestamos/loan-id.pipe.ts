import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'loanId',
  standalone: true
})
export class LoanIdPipe implements PipeTransform {
  private static idCounter = new Map<string, number>();
  private static globalCounter = 1;

  transform(loanId: string, allLoanIds?: string[]): string {
    // Si ya tenemos un número asignado para este ID, lo devolvemos
    if (LoanIdPipe.idCounter.has(loanId)) {
      const number = LoanIdPipe.idCounter.get(loanId)!;
      return `PR${number.toString().padStart(3, '0')}`;
    }

    // Si tenemos la lista completa de IDs, asignamos números secuenciales
    if (allLoanIds && allLoanIds.length > 0) {
      const sortedIds = [...allLoanIds].sort();
      sortedIds.forEach((id, index) => {
        if (!LoanIdPipe.idCounter.has(id)) {
          LoanIdPipe.idCounter.set(id, index + 1);
        }
      });

      const assignedNumber = LoanIdPipe.idCounter.get(loanId) || LoanIdPipe.globalCounter++;
      LoanIdPipe.idCounter.set(loanId, assignedNumber);
      return `PR${assignedNumber.toString().padStart(3, '0')}`;
    }

    // Fallback: asignar siguiente número disponible
    const assignedNumber = LoanIdPipe.globalCounter++;
    LoanIdPipe.idCounter.set(loanId, assignedNumber);
    return `PR${assignedNumber.toString().padStart(3, '0')}`;
  }

  // Método estático para resetear el contador (útil para testing)
  static resetCounter(): void {
    LoanIdPipe.idCounter.clear();
    LoanIdPipe.globalCounter = 1;
  }

  // Método estático para inicializar con una lista de préstamos
  static initializeWithLoans(loanIds: string[]): void {
    LoanIdPipe.idCounter.clear();
    const sortedIds = [...loanIds].sort();
    sortedIds.forEach((id, index) => {
      LoanIdPipe.idCounter.set(id, index + 1);
    });
    LoanIdPipe.globalCounter = sortedIds.length + 1;
  }
}
