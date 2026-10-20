import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { forkJoin } from 'rxjs';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Product } from '../../models/product.model';
import { InventoryItem, StockAlert } from '../../models/inventory.model';
import { AuthService } from '../auth/services/auth.service';
import { ProductsService } from '../products/products.service';
import { InventoryService } from './inventory.service';
import { MovementDialogComponent } from './movement-dialog.component';

interface InventoryRow extends InventoryItem {
  productName: string;
  minimumStock: number;
}

@Component({
  selector: 'app-inventory',
  standalone: true,
  imports: [CommonModule, MatTableModule, MatButtonModule, MatIconModule, MatChipsModule, MatDialogModule],
  template: `
    <div class="page-container">
      <div class="header">
        <h1>Inventario</h1>
        @if (auth.hasRole('ADMIN', 'OWNER')) {
          <button mat-flat-button color="primary" (click)="openMovementDialog()">
            <mat-icon>swap_vert</mat-icon> Registrar movimiento
          </button>
        }
      </div>

      <table mat-table [dataSource]="rows()" class="full-width">
        <ng-container matColumnDef="productName">
          <th mat-header-cell *matHeaderCellDef>Producto</th>
          <td mat-cell *matCellDef="let r">{{ r.productName }}</td>
        </ng-container>
        <ng-container matColumnDef="currentStock">
          <th mat-header-cell *matHeaderCellDef>Stock actual</th>
          <td mat-cell *matCellDef="let r">{{ r.currentStock }}</td>
        </ng-container>
        <ng-container matColumnDef="minimumStock">
          <th mat-header-cell *matHeaderCellDef>Stock mínimo</th>
          <td mat-cell *matCellDef="let r">{{ r.minimumStock }}</td>
        </ng-container>
        <ng-container matColumnDef="status">
          <th mat-header-cell *matHeaderCellDef>Estado</th>
          <td mat-cell *matCellDef="let r">
            <mat-chip [color]="r.currentStock <= r.minimumStock ? 'warn' : 'primary'" selected>
              {{ r.currentStock <= r.minimumStock ? 'Stock bajo' : 'OK' }}
            </mat-chip>
          </td>
        </ng-container>
        <tr mat-header-row *matHeaderRowDef="columns"></tr>
        <tr mat-row *matRowDef="let row; columns: columns"></tr>
      </table>

      @if (auth.hasRole('ADMIN', 'OWNER') && alerts().length) {
        <h2 class="section-title">Alertas activas</h2>
        <table mat-table [dataSource]="alerts()" class="full-width">
          <ng-container matColumnDef="message">
            <th mat-header-cell *matHeaderCellDef>Mensaje</th>
            <td mat-cell *matCellDef="let a">{{ a.message }}</td>
          </ng-container>
          <ng-container matColumnDef="actions">
            <th mat-header-cell *matHeaderCellDef></th>
            <td mat-cell *matCellDef="let a">
              <button mat-button color="primary" (click)="resolve(a.id)">Marcar resuelta</button>
            </td>
          </ng-container>
          <tr mat-header-row *matHeaderRowDef="['message', 'actions']"></tr>
          <tr mat-row *matRowDef="let row; columns: ['message', 'actions']"></tr>
        </table>
      }
    </div>
  `,
  styles: [`
    .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
    .full-width { width: 100%; }
    .section-title { margin-top: 32px; }
  `],
})
export class InventoryComponent implements OnInit {
  columns = ['productName', 'currentStock', 'minimumStock', 'status'];
  rows = signal<InventoryRow[]>([]);
  alerts = signal<StockAlert[]>([]);
  private products: Product[] = [];

  constructor(
    private readonly inventoryService: InventoryService,
    private readonly productsService: ProductsService,
    readonly auth: AuthService,
    private readonly dialog: MatDialog,
    private readonly snackBar: MatSnackBar,
  ) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    forkJoin([this.inventoryService.findAll(), this.productsService.findAll()]).subscribe(([inventory, products]) => {
      this.products = products;
      this.rows.set(
        inventory.map((item) => {
          const product = products.find((p) => p.id === item.productId);
          return { ...item, productName: product?.name ?? `Producto #${item.productId}`, minimumStock: product?.minimumStock ?? 0 };
        }),
      );
    });

    if (this.auth.hasRole('ADMIN', 'OWNER')) {
      this.inventoryService.alerts().subscribe((data) => this.alerts.set(data));
    }
  }

  openMovementDialog(): void {
    const ref = this.dialog.open(MovementDialogComponent, { data: { products: this.products } });
    ref.afterClosed().subscribe((result) => {
      if (!result) return;
      this.inventoryService.registerMovement(result).subscribe({
        next: () => {
          this.snackBar.open('Movimiento registrado', 'Cerrar', { duration: 2500 });
          this.load();
        },
      });
    });
  }

  resolve(id: number): void {
    this.inventoryService.resolveAlert(id).subscribe(() => this.load());
  }
}
