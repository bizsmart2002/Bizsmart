import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../auth/services/auth.service';
import { ProductDialogComponent } from './product-dialog.component';
import { ProductsPresenter } from './products.presenter';

// View (MVP): solo pinta la tabla de productos y delega en el Presenter.
@Component({
  selector: 'app-products',
  standalone: true,
  providers: [ProductsPresenter],
  imports: [
    CommonModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatDialogModule,
    MatProgressSpinnerModule,
  ],
  template: `
    <div class="page-container">
      <div class="header">
        <h1>Productos</h1>
        @if (auth.hasRole('ADMIN', 'OWNER')) {
          <button mat-flat-button color="primary" (click)="openDialog(null)">
            <mat-icon>add</mat-icon> Nuevo producto
          </button>
        }
      </div>

      @if (presenter.loading()) {
        <mat-spinner diameter="32"></mat-spinner>
      } @else {
        <table mat-table [dataSource]="presenter.products()" class="full-width">
          <ng-container matColumnDef="name">
            <th mat-header-cell *matHeaderCellDef>Nombre</th>
            <td mat-cell *matCellDef="let p">{{ p.name }}</td>
          </ng-container>
          <ng-container matColumnDef="category">
            <th mat-header-cell *matHeaderCellDef>Categoría</th>
            <td mat-cell *matCellDef="let p">{{ p.category?.name ?? '—' }}</td>
          </ng-container>
          <ng-container matColumnDef="price">
            <th mat-header-cell *matHeaderCellDef>Precio</th>
            <td mat-cell *matCellDef="let p">{{ p.price | number: '1.0-0' }}</td>
          </ng-container>
          <ng-container matColumnDef="minimumStock">
            <th mat-header-cell *matHeaderCellDef>Stock mín.</th>
            <td mat-cell *matCellDef="let p">{{ p.minimumStock }}</td>
          </ng-container>
          <ng-container matColumnDef="active">
            <th mat-header-cell *matHeaderCellDef>Estado</th>
            <td mat-cell *matCellDef="let p">
              <mat-chip [color]="p.active ? 'primary' : 'warn'" selected>
                {{ p.active ? 'Activo' : 'Inactivo' }}
              </mat-chip>
            </td>
          </ng-container>
          <ng-container matColumnDef="actions">
            <th mat-header-cell *matHeaderCellDef></th>
            <td mat-cell *matCellDef="let p">
              @if (auth.hasRole('ADMIN', 'OWNER')) {
                <button mat-icon-button (click)="openDialog(p)"><mat-icon>edit</mat-icon></button>
                @if (p.active) {
                  <button mat-icon-button (click)="presenter.deactivate(p.id)">
                    <mat-icon>block</mat-icon>
                  </button>
                }
              }
            </td>
          </ng-container>

          <tr mat-header-row *matHeaderRowDef="columns"></tr>
          <tr mat-row *matRowDef="let row; columns: columns"></tr>
        </table>
      }
    </div>
  `,
  styles: [`
    .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
    .full-width { width: 100%; }
  `],
})
export class ProductsComponent implements OnInit {
  columns = ['name', 'category', 'price', 'minimumStock', 'active', 'actions'];

  constructor(
    readonly presenter: ProductsPresenter,
    readonly auth: AuthService,
    private readonly dialog: MatDialog,
  ) {}

  ngOnInit(): void {
    this.presenter.load();
  }

  openDialog(product: any): void {
    const ref = this.dialog.open(ProductDialogComponent, {
      data: { product, categories: this.presenter.categories() },
    });
    ref.afterClosed().subscribe((result) => {
      if (result) this.presenter.save(result, product?.id ?? null, () => {});
    });
  }
}
