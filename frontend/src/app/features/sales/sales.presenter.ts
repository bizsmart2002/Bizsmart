import { Injectable, computed, signal } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Customer } from '../../models/customer.model';
import { Product } from '../../models/product.model';
import { Sale } from '../../models/sale.model';
import { CustomersService } from '../customers/customers.service';
import { ProductsService } from '../products/products.service';
import { SalesService } from './sales.service';

export interface CartLine {
  product: Product;
  quantity: number;
}

// Presenter: arma el "carrito" (líneas de venta), valida cantidades
// positivas y calcula subtotal/total en el frontend para dar feedback
// inmediato -- el backend SIEMPRE recalcula y es la fuente de verdad.
@Injectable()
export class SalesPresenter {
  readonly products = signal<Product[]>([]);
  readonly customers = signal<Customer[]>([]);
  readonly cart = signal<CartLine[]>([]);
  readonly selectedCustomerId = signal<number | null>(null);
  readonly sales = signal<Sale[]>([]);
  readonly submitting = signal(false);

  readonly total = computed(() =>
    this.cart().reduce((acc, line) => acc + line.product.price * line.quantity, 0),
  );

  constructor(
    private readonly productsService: ProductsService,
    private readonly customersService: CustomersService,
    private readonly salesService: SalesService,
    private readonly snackBar: MatSnackBar,
  ) {}

  loadCatalog(): void {
    this.productsService.findAll().subscribe((data) => this.products.set(data.filter((p) => p.active)));
    this.customersService.findAll().subscribe((data) => this.customers.set(data));
  }

  loadSales(): void {
    this.salesService.findAll().subscribe((data) => this.sales.set(data));
  }

  addLine(productId: number, quantity: number): void {
    if (!productId || quantity <= 0) return;
    const product = this.products().find((p) => p.id === productId);
    if (!product) return;

    this.cart.update((lines) => {
      const existing = lines.find((l) => l.product.id === productId);
      if (existing) {
        return lines.map((l) => (l.product.id === productId ? { ...l, quantity: l.quantity + quantity } : l));
      }
      return [...lines, { product, quantity }];
    });
  }

  removeLine(productId: number): void {
    this.cart.update((lines) => lines.filter((l) => l.product.id !== productId));
  }

  submit(onDone: () => void): void {
    if (this.cart().length === 0) return;

    this.submitting.set(true);
    this.salesService
      .create({
        customerId: this.selectedCustomerId() ?? undefined,
        items: this.cart().map((l) => ({ productId: l.product.id, quantity: l.quantity })),
      })
      .subscribe({
        next: () => {
          this.submitting.set(false);
          this.snackBar.open('Venta registrada correctamente', 'Cerrar', { duration: 2500 });
          this.cart.set([]);
          this.selectedCustomerId.set(null);
          this.loadSales();
          onDone();
        },
        error: () => this.submitting.set(false),
      });
  }
}
