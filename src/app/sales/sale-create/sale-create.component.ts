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
import { MatTableModule } from '@angular/material/table';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { Observable, startWith, map } from 'rxjs';
import { SalesService, SaleDto, SaleItemDto } from './sales.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CurrencyBgnPipe } from '../../pipes/currency-bgn.pipe';

interface Client {
  id: number;
  name: string;
}

interface Product {
  code: string;
  name: string;
  unit: string;
  priceWithoutVat: number;
  vatPercent: number;
}

interface SaleItemForm {
  product: string;
  quantity: number;
  unit: string;
  priceWithoutVat: number;
  vatPercent: number;
  priceWithVat: number;
  total: number;
}

@Component({
  selector: 'app-sale-create',
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
    MatTableModule,
    MatDatepickerModule,
    MatNativeDateModule,
    CurrencyBgnPipe
  ],
  templateUrl: './sale-create.component.html',
  styleUrl: './sale-create.component.scss'
})
export class SaleCreateComponent {
  // Примерни клиенти
  clients: Client[] = [
    { id: 1, name: 'Клиент 1' },
    { id: 2, name: 'Клиент 2' },
    { id: 3, name: 'Клиент 3' }
  ];

  // Примерни продукти
  products: Product[] = [
    { code: 'P001', name: 'Авокадо', unit: 'бр.', priceWithoutVat: 5.00, vatPercent: 20 },
    { code: 'P002', name: 'Ябълка', unit: 'кг.', priceWithoutVat: 2.50, vatPercent: 20 },
    { code: 'P003', name: 'Круша', unit: 'кг.', priceWithoutVat: 3.00, vatPercent: 20 }
  ];

  paymentTypes = [
    { value: 'CASH', label: 'В брой' },
    { value: 'CARD', label: 'С карта' },
    { value: 'BANK', label: 'По сметка' }
  ];

  currencies = [ 'BGN', 'EUR', 'USD' ];

  form: FormGroup;
  filteredClients$: Observable<Client[]>;
  filteredProducts: Observable<Product[]>[] = [];

  displayedColumns = [
    'product',
    'quantity',
    'unit',
    'priceWithoutVat',
    'vatPercent',
    'priceWithVat',
    'total',
    'actions'
  ];

  barcodeInput: string = '';

  @ViewChildren('productInput') productInputs!: QueryList<ElementRef<HTMLInputElement>>;

  trackByIndex(index: number, obj: any): any {
    return index;
  }

  constructor(
    private fb: FormBuilder,
    private salesService: SalesService,
    private snackBar: MatSnackBar
  ) {
    this.form = this.fb.group({
      date: [new Date(), Validators.required],
      client: ['Клиент 1', Validators.required],
      paymentType: ['CASH', Validators.required],
      currency: ['BGN', Validators.required],
      items: this.fb.array([])
    });
    // Clear FormArray and add a single valid FormGroup
    while (this.items.length > 0) {
      this.items.removeAt(0);
    }
    this.addItem();
    this.filteredClients$ = this.form.get('client')!.valueChanges.pipe(
      startWith(''),
      map(value => this._filterClients(value || ''))
    );
    this.updateProductFilters();
  }

  get items(): FormArray {
    return this.form.get('items') as FormArray;
  }

  get dataSource() {
    return this.items.controls;
  }

  addItem() {
    const item = this.fb.group({
      product: ['', Validators.required],
      quantity: [1, [Validators.required, Validators.min(1)]],
      unit: [''],
      priceWithoutVat: [0, Validators.required],
      vatPercent: [20, Validators.required],
      priceWithVat: [{ value: 0, disabled: true }],
      total: [{ value: 0, disabled: true }]
    });
    if (item instanceof FormGroup) {
      this.items.push(item);
    } else {
      console.error('Attempted to add invalid item to FormArray:', item);
    }
    // Subscribe to product changes to auto-fill fields
    item.get('product')!.valueChanges.subscribe(() => this.updateItemValues(item, true));
    // Subscribe to quantity, vatPercent, priceWithoutVat to update only totals
    item.get('quantity')!.valueChanges.subscribe(() => this.updateItemValues(item, false));
    item.get('vatPercent')!.valueChanges.subscribe(() => this.updateItemValues(item, false));
    item.get('priceWithoutVat')!.valueChanges.subscribe(() => this.updateItemValues(item, false));
    this.updateItemValues(item, true);
    this.updateProductFilters();
    this.form.updateValueAndValidity();
  }

  removeItem(index: number) {
    this.items.removeAt(index);
    // Always update filteredProducts after removing
    this.updateProductFilters();
  }

  private _filterClients(value: string): Client[] {
    const filterValue = value.toLowerCase();
    return this.clients.filter(client => client.name.toLowerCase().includes(filterValue));
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
        priceWithoutVat: Number(product.priceWithoutVat.toFixed(2)),
        vatPercent: Number(product.vatPercent.toFixed(2))
      }, { emitEvent: false });
    }
    const quantity = item.get('quantity')!.value || 1;
    const priceWithoutVat = Number(item.get('priceWithoutVat')!.value || 0);
    const vatPercent = Number(item.get('vatPercent')!.value || 0);
    const priceWithVat = Number((priceWithoutVat * (1 + vatPercent / 100)).toFixed(2));
    const total = Number((priceWithVat * quantity).toFixed(2));
    item.patchValue({
      priceWithVat,
      total
    }, { emitEvent: false });
    this.form.updateValueAndValidity();
  }

  get totalWithoutVat(): number {
    return Number(this.items.controls.reduce((sum, item) => 
      sum + (Number(item.get('priceWithoutVat')!.value || 0) * (item.get('quantity')!.value || 1)), 0).toFixed(2));
  }

  get totalVat(): number {
    return Number(this.items.controls.reduce((sum, item) => {
      const priceWithoutVat = Number(item.get('priceWithoutVat')!.value || 0);
      const vatPercent = Number(item.get('vatPercent')!.value || 0);
      const quantity = item.get('quantity')!.value || 1;
      return sum + (priceWithoutVat * vatPercent / 100) * quantity;
    }, 0).toFixed(2));
  }

  get totalWithVat(): number {
    return Number(this.items.controls.reduce((sum, item) => 
      sum + (Number(item.get('total')!.value || 0)), 0).toFixed(2));
  }

  save() {
    if (this.form.invalid) {
      this.snackBar.open('Моля, попълнете всички задължителни полета!', 'Затвори', { duration: 3000 });
      return;
    }

    const formData = this.form.value;
    const saleDto: SaleDto = {
      date: formData.date,
      client: formData.client,
      paymentType: formData.paymentType,
      currency: formData.currency,
      totalWithoutVat: Number(this.totalWithoutVat),
      vat: Number(this.totalVat),
      totalWithVat: Number(this.totalWithVat),
      items: formData.items.map((item: any) => {
        const product = this.products.find(p => p.code === item.product);
        const priceWithoutVat = Number(item.priceWithoutVat);
        const vatPercent = Number(item.vatPercent);
        const quantity = Number(item.quantity);
        const priceWithVat = Number((priceWithoutVat * (1 + vatPercent / 100)).toFixed(2));
        const total = Number((priceWithVat * quantity).toFixed(2));

        const saleItem: SaleItemDto = {
          productCode: product?.code || '',
          productName: product ? `${product.name} (${product.code})` : '',
          quantity: quantity,
          unit: item.unit || '',
          priceWithoutVat: priceWithoutVat,
          vatPercent: vatPercent,
          priceWithVat: priceWithVat,
          total: total
        };
        return saleItem;
      })
    };

    this.salesService.createSale(saleDto).subscribe({
      next: (id) => {
        this.snackBar.open('Продажбата е записана успешно!', 'Затвори', { duration: 3000 });
      },
      error: (error) => {
        console.error('Грешка при запис:', error);
        this.snackBar.open('Възникна грешка при запис!', 'Затвори', { duration: 3000 });
      }
    });
  }

  pay() {
    // TODO: Имплементирайте логика за плащане
    alert('Плащането е извършено!');
  }

  print() {
    // TODO: Имплементирайте логика за печат
    alert('Печат на документ!');
  }

  onBarcodeEnter() {
    const code = this.barcodeInput.trim().toUpperCase();
    if (!code) return;

    const product = this.products.find(p => p.code === code);
    if (!product) {
      this.snackBar.open('Няма продукт с този баркод!', 'Затвори', { duration: 2000 });
      this.barcodeInput = '';
      return;
    }

    // Проверка дали вече има такъв продукт в списъка (по code)
    const existingIndex = this.items.controls.findIndex(item => item.get('product')!.value === product.code);
    if (existingIndex !== -1) {
      // Увеличи количеството
      const item = this.items.at(existingIndex);
      item.patchValue({ quantity: (item.get('quantity')!.value || 1) + 1 });
      this.updateItemValues(item);
    } else {
      // Потърси празен ред (без избран продукт)
      const emptyIndex = this.items.controls.findIndex(item => !item.get('product')!.value);
      let item;
      let itemIndex;
      if (emptyIndex !== -1) {
        item = this.items.at(emptyIndex);
        itemIndex = emptyIndex;
      } else {
        this.addItem();
        item = this.items.at(this.items.length - 1);
        itemIndex = this.items.length - 1;
      }
      item.patchValue({ 
        product: product.code,
        unit: product.unit,
        priceWithoutVat: Number(product.priceWithoutVat.toFixed(2)),
        vatPercent: Number(product.vatPercent.toFixed(2)),
        quantity: 1
      });
      this.updateItemValues(item);
      // BLUR input-а за продукта, за да затворим autocomplete
      setTimeout(() => {
        this.productInputs?.toArray()[itemIndex]?.nativeElement.blur();
      }, 100);
    }
    this.barcodeInput = '';
  }

  // Helper for displaying product name and code
  getProductDisplay(code: string): string {
    const product = this.products.find(p => p.code === code);
    return product ? `${product.name} (${product.code})` : code;
  }

  // Helper for displaying product name and code in autocomplete
  displayWithProduct = (code: string) => this.getProductDisplay(code);
}
