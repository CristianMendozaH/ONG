// src/app/shared/pipes/pad-number.pipe.ts
import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'padNumber',
  standalone: true,
})
export class PadNumberPipe implements PipeTransform {
  transform(value: string | number, padLength: number = 3): string {
    if (value === null || value === undefined) {
      return '';
    }
    return String(value).padStart(padLength, '0');
  }
}
