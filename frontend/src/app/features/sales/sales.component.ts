import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { SalesPresenter } from './sales.presenter';

// HU07: registrar venta. View: formulario + carrito + tabla de ventas.
@Component({
  selector: 'app-sales',
  standalone: true,
  providers: [SalesPresenter],
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
  ],
  template: `
    <div class="page-container">
      <h1>Ventas</h1>

      <mat-card class="form-card">
        <mat-card-header><mat-card-title>Nueva venta</mat-card-title></mat-card-header>
        <mat-card-content>
          <div class="row">
            <mat-form-field appearance="outline" class="grow">
              <mat-label>Cliente (opcional)</mat-label>
              <mat-select [(ngModel)]="customerId" (ngModelChange)="presenter.selectedCustomerId.set($event)">
                <mat-option [value]="null">Sin cliente</mat-option>
                @for (c of presenter.customers(); track c.id) {
                  <mat-option [value]="c.id">{{ c.name }}</mat-option>
                }
              </mat-select>
            </mat-form-field>
          </div>

          <div class="row">
            <mat-form-field appearance="outline" class="grow">
              <mat-label>Producto</mat-label>
              <mat-select [(ngModel)]="selectedProductId">
                @for (p of presenter.products(); track p.id) {
                  <mat-option [value]="p.id">{{ p.name }} — {{ p.price | number: '1.0-0' }}</mat-option>
                }
              </mat-select>
            </mat-form-field>
            <mat-form-field appearance="outline" class="qty">
              <mat-label>Cantidad</mat-label>
              <input matInput type="number" [(ngModel)]="quantity" min="1" />
            </mat-form-field>
            <button mat-stroked-button color="primary" (click)="addLine()">
              <mat-icon>add_shopping_cart</mat-icon> Agregar
            </button>
          </div>

          <table mat-table [dataSource]="presenter.cart()" class="full-width">
            <ng-container matColumnDef="name">
              <th mat-header-cell *matHeaderCellDef>Producto</th>
              <td mat-cell *matCellDef="let l">{{ l.product.name }}</td>
            </ng-container>
            <ng-container matColumnDef="quantity">
              <th mat-header-cell *matHeaderCellDef>Cant.</th>
              <td mat-cell *matCellDef="let l">{{ l.quantity }}</td>
            </ng-container>
            <ng-container matColumnDef="subtotal">
              <th mat-header-cell *matHeaderCellDef>Subtotal</th>
              <td mat-cell *matCellDef="let l">{{ l.product.price * l.quantity | number: '1.0-0' }}</td>
            </ng-container>
            <ng-container matColumnDef="remove">
              <th mat-header-cell *matHeaderCellDef></th>
              <td mat-cell *matCellDef="let l">
                <button mat-icon-button (click)="presenter.removeLine(l.product.id)"><mat-icon>close</mat-icon></button>
              </td>
            </ng-container>
            <tr mat-header-row *matHeaderRowDef="cartColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: cartColumns"></tr>
          </table>

          <div class="total-row">
            <strong>Total: {{ presenter.total() | number: '1.0-0' }}</strong>
            <button
              mat-flat-button
              color="primary"
              [disabled]="presenter.cart().length === 0 || presenter.submitting()"
              (click)="submit()"
            >
              Registrar venta
            </button>
          </div>
        </mat-card-content>
      </mat-card>

      <h2 class="section-title">Historial de ventas</h2>
      <table mat-table [dataSource]="presenter.sales()" class="full-width">
        <ng-container matColumnDef="id">
          <th mat-header-cell *matHeaderCellDef>#</th>
          <td mat-cell *matCellDef="let s">{{ s.id }}</td>
        </ng-container>
        <ng-container matColumnDef="saleDate">
          <th mat-header-cell *matHeaderCellDef>Fecha</th>
          <td mat-cell *matCellDef="let s">{{ s.saleDate | date: 'short' }}</td>
        </ng-container>
        <ng-container matColumnDef="total">
          <th mat-header-cell *matHeaderCellDef>Total</th>
          <td mat-cell *matCellDef="let s">{{ s.total | number: '1.0-0' }}</td>
        </ng-container>
        <ng-container matColumnDef="status">
          <th mat-header-cell *matHeaderCellDef>Estado</th>
          <td mat-cell *matCellDef="let s">{{ s.status }}</td>
        </ng-container>
        <tr mat-header-row *matHeaderRowDef="salesColumns"></tr>
        <tr mat-row *matRowDef="let row; columns: salesColumns"></tr>
      </table>
    </div>
  `,
  styles: [`
    .form-card { margin-bottom: 24px; }
    .row { display: flex; gap: 12px; align-items: center; margin-bottom: 8px; }
    .grow { flex: 1 1 auto; }
    .qty { width: 120px; }
    .full-width { width: 100%; margin: 12px 0; }
    .total-row { display: flex; justify-content: space-between; align-items: center; margin-top: 8px; }
    .section-title { margin-top: 8px; }
  `],
})
export class SalesComponent implements OnInit {
  cartColumns = ['name', 'quantity', 'subtotal', 'remove'];
  salesColumns = ['id', 'saleDate', 'total', 'status'];

  customerId: number | null = null;
  selectedProductId: number | null = null;
  quantity = 1;

  constructor(readonly presenter: SalesPresenter) {}

  ngOnInit(): void {
    this.presenter.loadCatalog();
    this.presenter.loadSales();
  }

  addLine(): void {
    if (!this.selectedProductId) return;
    this.presenter.addLine(this.selectedProductId, this.quantity);
    this.selectedProductId = null;
    this.quantity = 1;
  }

  submit(): void {
    this.presenter.submit(() => {});
  }
}
