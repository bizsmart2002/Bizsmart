import { Injectable, signal } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Category, Product } from '../../models/product.model';
import { ProductsService } from './products.service';

// Presenter: coordina la lista, el formulario del diálogo y las llamadas
// al Model (ProductsService). La View (ProductsComponent) solo dispara
// eventos y pinta lo que expone este Presenter.
@Injectable()
export class ProductsPresenter {
  readonly products = signal<Product[]>([]);
  readonly categories = signal<Category[]>([]);
  readonly loading = signal(false);

  constructor(
    private readonly service: ProductsService,
    private readonly snackBar: MatSnackBar,
  ) {}

  load(): void {
    this.loading.set(true);
    this.service.findAll().subscribe({
      next: (data) => {
        this.products.set(data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
    this.service.categories().subscribe((data) => this.categories.set(data));
  }

  save(payload: any, editingId: number | null, onDone: () => void): void {
    const request = editingId
      ? this.service.update(editingId, payload)
      : this.service.create(payload);

    request.subscribe({
      next: () => {
        this.snackBar.open(editingId ? 'Producto actualizado' : 'Producto creado', 'Cerrar', { duration: 2500 });
        this.load();
        onDone();
      },
    });
  }

  deactivate(id: number): void {
    this.service.deactivate(id).subscribe(() => {
      this.snackBar.open('Producto desactivado', 'Cerrar', { duration: 2500 });
      this.load();
    });
  }
}
