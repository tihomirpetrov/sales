// MOVE FILE to ../pipes/currency-bgn.pipe.ts
import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'currencyBgn',
  standalone: true
})
export class CurrencyBgnPipe implements PipeTransform {
  transform(value: number | string): string {
    if (value === null || value === undefined || value === '') return '';
    const num = typeof value === 'string' ? parseFloat(value) : value;
    return num.toFixed(2) + ' лв';
  }
} 