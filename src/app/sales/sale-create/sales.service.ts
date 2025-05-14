import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface SaleItemDto {
  productCode: string;
  productName: string;
  quantity: number;
  unit: string;
  priceWithoutVat: number;
  vatPercent: number;
  priceWithVat: number;
  total: number;
}

export interface SaleDto {
  date: Date;
  client: string;
  paymentType: string;
  currency: string;
  totalWithoutVat: number;
  vat: number;
  totalWithVat: number;
  items: SaleItemDto[];
}

@Injectable({ providedIn: 'root' })
export class SalesService {
  private apiUrl = 'http://localhost:8080/api/sales';
  private httpOptions = {
    headers: new HttpHeaders({
      'Content-Type': 'application/json'
    })
  };

  constructor(private http: HttpClient) {}

  createSale(sale: SaleDto): Observable<any> {
    return this.http.post(this.apiUrl, sale, this.httpOptions);
  }
} 