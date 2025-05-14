import { Component, ViewChildren, QueryList, ElementRef } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { RouterModule } from '@angular/router';
import { Observable, startWith, map } from 'rxjs';

interface Supplier {
  id: number;
  name: string;
}

interface Product {
  code: string;
  name: string;
  unit: string;
  priceWithVat: number;
  vatPercent: number;
}

@Component({
  selector: 'app-delivery-create',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatAutocompleteModule,
    MatButtonModule,
    MatIconModule,
    MatDatepickerModule,
    MatNativeDateModule,
    RouterModule
  ],
  template: `
    <div class="container-fluid">
      <div class="row mb-4">
        <div class="col-12">
          <h2>Нова доставка</h2>
        </div>
      </div>

      <form [formGroup]="form" class="delivery-form">
        <!-- Top Section -->
        <div class="row mb-4">
          <div class="col-md-3">
            <mat-form-field class="w-100">
              <mat-label>Дата</mat-label>
              <input matInput [matDatepicker]="picker" formControlName="date">
              <mat-datepicker-toggle matSuffix [for]="picker"></mat-datepicker-toggle>
              <mat-datepicker #picker></mat-datepicker>
            </mat-form-field>
          </div>
          <div class="col-md-3">
            <mat-form-field class="w-100">
              <mat-label>Доставчик</mat-label>
              <input type="text" matInput formControlName="supplier" [matAutocomplete]="supplierAuto">
              <mat-autocomplete #supplierAuto="matAutocomplete">
                @for (supplier of filteredSuppliers$ | async; track supplier.id) {
                  <mat-option [value]="supplier.name">{{supplier.name}}</mat-option>
                }
              </mat-autocomplete>
            </mat-form-field>
          </div>
          <div class="col-md-2">
            <mat-form-field class="w-100">
              <mat-label>Валута</mat-label>
              <mat-select formControlName="currency">
                @for (currency of currencies; track currency) {
                  <mat-option [value]="currency">{{currency}}</mat-option>
                }
              </mat-select>
            </mat-form-field>
          </div>
          <div class="col-md-2">
            <mat-form-field class="w-100">
              <mat-label>Склад</mat-label>
              <mat-select formControlName="warehouse">
                @for (warehouse of warehouses; track warehouse) {
                  <mat-option [value]="warehouse">{{warehouse}}</mat-option>
                }
              </mat-select>
            </mat-form-field>
          </div>
        </div>

        <!-- Invoice Details -->
        <div class="row mb-4">
          <div class="col-md-3">
            <mat-form-field class="w-100">
              <mat-label>Фактура №</mat-label>
              <input matInput formControlName="invoiceNumber">
            </mat-form-field>
          </div>
          <div class="col-md-3">
            <mat-form-field class="w-100">
              <mat-label>Дата на фактура</mat-label>
              <input matInput [matDatepicker]="invoicePicker" formControlName="invoiceDate">
              <mat-datepicker-toggle matSuffix [for]="invoicePicker"></mat-datepicker-toggle>
              <mat-datepicker #invoicePicker></mat-datepicker>
            </mat-form-field>
          </div>
        </div>

        <!-- Barcode Input -->
        <div class="row mb-3">
          <div class="col-md-4">
            <mat-form-field class="w-100">
              <mat-label>Баркод</mat-label>
              <input matInput [value]="barcodeInput" (input)="onBarcodeInput($event)" (keyup.enter)="onBarcodeEnter()">
              <button mat-icon-button matSuffix (click)="barcodeInput = ''" *ngIf="barcodeInput">
                <mat-icon>close</mat-icon>
              </button>
            </mat-form-field>
          </div>
        </div>

        <!-- Items Table -->
        <div class="row mb-4">
          <div class="col-12">
            <div class="table-responsive">
              <table class="table">
                <thead>
                  <tr>
                    <th class="col-product">Продукт</th>
                    <th class="col-unit">Мярка</th>
                    <th class="col-qty">Количество</th>
                    <th class="col-price">Цена с ДДС</th>
                    <th class="col-vat">ДДС %</th>
                    <th class="col-price-no-vat">Цена без ДДС</th>
                    <th class="col-total">Общо</th>
                    <th class="col-actions"></th>
                  </tr>
                </thead>
                <tbody formArrayName="items">
                  @for (item of items.controls; track $index) {
                    <tr [formGroupName]="$index">
                      <td class="col-product">
                        <mat-form-field class="w-100">
                          <input type="text" matInput formControlName="product" [matAutocomplete]="auto"
                            [value]="getProductDisplayName(item.get('product')?.value)">
                          <mat-autocomplete #auto="matAutocomplete">
                            @for (product of filteredProducts[$index] | async; track product.code) {
                              <mat-option [value]="product.code">{{product.name}} ({{product.code}})</mat-option>
                            }
                          </mat-autocomplete>
                        </mat-form-field>
                      </td>
                      <td class="col-unit">
                        <mat-form-field class="w-100">
                          <input matInput formControlName="unit" readonly>
                        </mat-form-field>
                      </td>
                      <td class="col-qty">
                        <mat-form-field class="w-100">
                          <input type="number" matInput formControlName="quantity" min="1">
                        </mat-form-field>
                      </td>
                      <td class="col-price">
                        <mat-form-field class="w-100">
                          <input type="number" matInput formControlName="priceWithVat" min="0" step="0.01">
                        </mat-form-field>
                      </td>
                      <td class="col-vat">
                        <mat-form-field class="w-100">
                          <input type="number" matInput formControlName="vatPercent" min="0" max="100">
                        </mat-form-field>
                      </td>
                      <td class="col-price-no-vat">
                        <mat-form-field class="w-100">
                          <input matInput formControlName="priceWithoutVat" readonly>
                        </mat-form-field>
                      </td>
                      <td class="col-total">
                        <mat-form-field class="w-100">
                          <input matInput formControlName="total" readonly>
                        </mat-form-field>
                      </td>
                      <td class="col-actions text-center">
                        <button mat-icon-button color="warn" (click)="removeItem($index)">
                          <mat-icon>delete</mat-icon>
                        </button>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
            <button mat-raised-button color="primary" (click)="addItem()">
              <mat-icon>add</mat-icon>
              Добави ред
            </button>
          </div>
        </div>

        <!-- Totals -->
        <div class="row mb-4">
          <div class="col-md-4 offset-md-8">
            <table class="table">
              <tr>
                <td>Общо без ДДС:</td>
                <td class="text-end">{{totalWithoutVat | number:'1.2-2'}} {{form.get('currency')?.value}}</td>
              </tr>
              <tr>
                <td>ДДС:</td>
                <td class="text-end">{{totalVat | number:'1.2-2'}} {{form.get('currency')?.value}}</td>
              </tr>
              <tr>
                <td><strong>Общо с ДДС:</strong></td>
                <td class="text-end"><strong>{{totalWithVat | number:'1.2-2'}} {{form.get('currency')?.value}}</strong></td>
              </tr>
            </table>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="row">
          <div class="col-12 text-end">
            <button mat-button routerLink="/dashboard" class="me-2">Отказ</button>
            <button mat-raised-button color="primary" [disabled]="!form.valid" (click)="onSubmit()">
              Запази
            </button>
          </div>
        </div>
      </form>
    </div>
  `,
  styles: [`
    .delivery-form {
      padding: 20px;
    }

    .table {
      margin-bottom: 1rem;
      font-size: 0.95rem;
    }

    .table th, .table td {
      padding: 0.25rem 0.5rem;
      vertical-align: middle;
      text-align: center;
    }

    .col-product { width: 160px; min-width: 120px; max-width: 200px; }
    .col-unit { width: 60px; min-width: 50px; max-width: 80px; }
    .col-qty { width: 70px; min-width: 60px; max-width: 90px; }
    .col-price { width: 100px; min-width: 80px; max-width: 120px; }
    .col-vat { width: 70px; min-width: 60px; max-width: 90px; }
    .col-price-no-vat { width: 110px; min-width: 90px; max-width: 130px; }
    .col-total { width: 110px; min-width: 90px; max-width: 130px; }
    .col-actions { width: 40px; min-width: 30px; max-width: 50px; }

    mat-form-field {
      margin-bottom: -1.25em;
    }

    .text-end {
      text-align: end;
    }

    .me-2 {
      margin-right: 0.5rem;
    }

    .container-fluid {
      padding: 20px;
    }

    .table tr {
      height: auto;
    }
    .table tbody tr {
      border-bottom: 1.5px solid #f3f3f3;
    }
    .table td {
      padding-top: 0.9rem;
      padding-bottom: 0.9rem;
    }
    .mat-form-field {
      margin-bottom: -1.25em;
      --mdc-form-field-label-text-size: 13px;
      --mat-mdc-form-field-container-height: 36px;
      --mat-mdc-form-field-padding: 0 4px;
    }
    .mat-form-field-appearance-outline .mat-mdc-text-field-wrapper {
      padding: 0;
      min-height: 32px;
    }
    .mat-mdc-input-element {
      font-size: 0.95rem;
      padding: 0.2rem 0.4rem;
      height: 28px;
      min-height: 28px;
    }
    .mat-mdc-form-field-infix {
      padding: 0.1rem 0;
      min-height: 28px;
    }
    .mat-mdc-form-field-flex {
      align-items: center;
    }
    .table th, .table td {
      vertical-align: middle;
    }
  `]
})
export class DeliveryCreateComponent {
  @ViewChildren('auto') autocompleteRefs!: QueryList<ElementRef>;

  suppliers: Supplier[] = [
    { id: 1, name: 'Доставчик 1' },
    { id: 2, name: 'Доставчик 2' },
    { id: 3, name: 'Доставчик 3' }
  ];

  products: Product[] = [
    { code: 'P001', name: 'Авокадо', unit: 'бр.', priceWithVat: 6.00, vatPercent: 20 },
    { code: 'P002', name: 'Ябълка', unit: 'кг.', priceWithVat: 3.00, vatPercent: 20 },
    { code: 'P003', name: 'Круша', unit: 'кг.', priceWithVat: 3.60, vatPercent: 20 },
    { code: 'P004', name: 'Skip течен 1.7 l', unit: 'бр.', priceWithVat: 17.00, vatPercent: 20 },
    { code: 'P005', name: 'Ariel течен 2.5 l', unit: 'бр.', priceWithVat: 25.50, vatPercent: 20 },
    { code: 'P006', name: 'Nivea гел за бръснене', unit: 'бр.', priceWithVat: 6.90, vatPercent: 20 }
  ];

  currencies = ['BGN', 'EUR', 'USD'];
  warehouses = ['Основен склад'];

  form: FormGroup;
  filteredSuppliers$: Observable<Supplier[]>;
  filteredProducts: Observable<Product[]>[] = [];

  barcodeInput: string = '';

  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({
      date: [new Date(), Validators.required],
      supplier: ['', Validators.required],
      currency: ['BGN', Validators.required],
      warehouse: ['Основен склад', Validators.required],
      invoiceNumber: [''],
      invoiceDate: [new Date()],
      items: this.fb.array([])
    });
    this.addItem();
    this.filteredSuppliers$ = this.form.get('supplier')!.valueChanges.pipe(
      startWith(''),
      map(value => this._filterSuppliers(value || ''))
    );
    this.updateProductFilters();
  }

  get items(): FormArray {
    return this.form.get('items') as FormArray;
  }

  addItem() {
    const item = this.fb.group({
      product: ['', Validators.required],
      quantity: [1, [Validators.required, Validators.min(1)]],
      unit: [''],
      priceWithVat: [0, Validators.required],
      vatPercent: [20, Validators.required],
      priceWithoutVat: [{ value: 0, disabled: true }],
      total: [{ value: 0, disabled: true }]
    });
    item.get('product')!.valueChanges.subscribe(() => this.updateItemValues(item, true));
    item.get('priceWithVat')!.valueChanges.subscribe(() => this.updateItemValues(item, false));
    item.get('vatPercent')!.valueChanges.subscribe(() => this.updateItemValues(item, false));
    item.get('quantity')!.valueChanges.subscribe(() => this.updateItemValues(item, false));
    this.items.push(item);
    this.updateItemValues(item, true);
    this.updateProductFilters();
    this.form.updateValueAndValidity();
  }

  removeItem(index: number) {
    this.items.removeAt(index);
    this.updateProductFilters();
  }

  private _filterSuppliers(value: string): Supplier[] {
    const filterValue = value.toLowerCase();
    return this.suppliers.filter(s => s.name.toLowerCase().includes(filterValue));
  }

  private _filterProducts(value: string): Product[] {
    const filterValue = value.toLowerCase();
    return this.products.filter(product =>
      product.name.toLowerCase().includes(filterValue) ||
      product.code.toLowerCase().includes(filterValue)
    );
  }

  private updateProductFilters() {
    this.filteredProducts = this.items.controls.map(item =>
      item.get('product')!.valueChanges.pipe(
        startWith(''),
        map(value => this._filterProducts(value || ''))
      )
    );
  }

  private updateItemValues(item: any, updateAll: boolean = false) {
    const productCode = item.get('product')!.value;
    const product = this.products.find(p => p.code === productCode);
    if (updateAll && product) {
      item.patchValue({
        unit: product.unit,
        vatPercent: product.vatPercent,
        priceWithVat: Number(product.priceWithVat.toFixed(2)),
      }, { emitEvent: false });
    }
    const priceWithVat = Number(item.get('priceWithVat')!.value || 0);
    const vatPercent = Number(item.get('vatPercent')!.value || 0);
    const priceWithoutVat = vatPercent ? Number((priceWithVat / (1 + vatPercent / 100)).toFixed(2)) : priceWithVat;
    const quantity = item.get('quantity')!.value || 1;
    const total = Number((priceWithVat * quantity).toFixed(2));
    item.patchValue({
      priceWithoutVat,
      total
    }, { emitEvent: false });
    this.form.updateValueAndValidity();
  }

  get totalWithoutVat(): number {
    return this.items.controls.reduce((sum, item) => sum + (item.get('priceWithoutVat')!.value || 0) * (item.get('quantity')!.value || 1), 0);
  }

  get totalVat(): number {
    return this.items.controls.reduce((sum, item) => {
      const priceWithoutVat = item.get('priceWithoutVat')!.value || 0;
      const vatPercent = item.get('vatPercent')!.value || 0;
      const quantity = item.get('quantity')!.value || 1;
      return sum + (priceWithoutVat * vatPercent / 100) * quantity;
    }, 0);
  }

  get totalWithVat(): number {
    return this.items.controls.reduce((sum, item) => sum + (item.get('total')!.value || 0), 0);
  }

  onBarcodeInput(event: Event) {
    const target = event.target as HTMLInputElement | null;
    this.barcodeInput = target?.value || '';
  }

  onBarcodeEnter() {
    if (!this.barcodeInput) return;

    const product = this.products.find(p => p.code.toUpperCase() === this.barcodeInput.toUpperCase());
    if (!product) {
      // TODO: Show error message
      this.barcodeInput = '';
      return;
    }

    const existingItem = this.items.controls.find(item => 
      item.get('product')!.value === product.code
    );

    if (existingItem) {
      const currentQuantity = existingItem.get('quantity')!.value;
      existingItem.patchValue({ quantity: currentQuantity + 1 });
    } else {
      const newItem = this.fb.group({
        product: [product.code, Validators.required],
        quantity: [1, [Validators.required, Validators.min(1)]],
        unit: [product.unit],
        priceWithVat: [product.priceWithVat, Validators.required],
        vatPercent: [product.vatPercent, Validators.required],
        priceWithoutVat: [{ value: 0, disabled: true }],
        total: [{ value: 0, disabled: true }]
      });
      newItem.get('product')!.valueChanges.subscribe(() => this.updateItemValues(newItem, true));
      newItem.get('priceWithVat')!.valueChanges.subscribe(() => this.updateItemValues(newItem, false));
      newItem.get('vatPercent')!.valueChanges.subscribe(() => this.updateItemValues(newItem, false));
      newItem.get('quantity')!.valueChanges.subscribe(() => this.updateItemValues(newItem, false));
      this.items.push(newItem);
      this.updateItemValues(newItem, true);
      this.updateProductFilters();
    }

    this.barcodeInput = '';
    this.form.updateValueAndValidity();
  }

  onSubmit() {
    if (this.form.valid) {
      console.log('Form submitted:', this.form.value);
      // TODO: Implement API call to save the delivery
    }
  }

  getProductDisplayName(code: string): string {
    const product = this.products.find(p => p.code === code);
    if (!product) return code || '';
    if (product.name && product.name.trim()) {
      return `${product.name} (${product.code})`;
    }
    return product.code;
  }
} 