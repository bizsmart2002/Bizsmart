import { CommonModule } from '@angular/common';
import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { ReportsService } from './reports.service';

type ReportType = 'sales' | 'products' | 'inventory' | 'topSelling';

// HU15: reportes de ventas/productos/inventario con filtros (punto 12 de la especificación).
@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatTableModule,
  ],
  template: `
    <div class="page-container">
      <h1>Reportes</h1>

      <mat-card class="filters">
        <mat-card-content class="row">
          <mat-form-field appearance="outline">
            <mat-label>Tipo de reporte</mat-label>
            <mat-select [(ngModel)]="reportType">
              <mat-option value="sales">Ventas</mat-option>
              <mat-option value="products">Productos</mat-option>
              <mat-option value="inventory">Inventario</mat-option>
              <mat-option value="topSelling">Productos más vendidos</mat-option>
            </mat-select>
          </mat-form-field>

          @if (reportType === 'sales') {
            <mat-form-field appearance="outline">
              <mat-label>Fecha inicial</mat-label>
              <input matInput type="date" [(ngModel)]="startDate" />
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Fecha final</mat-label>
              <input matInput type="date" [(ngModel)]="endDate" />
            </mat-form-field>
          }

          <button mat-flat-button color="primary" (click)="run()">Generar</button>
        </mat-card-content>
      </mat-card>

      @if (columns().length) {
        <table mat-table [dataSource]="rows()" class="full-width">
          @for (col of columns(); track col) {
            <ng-container [matColumnDef]="col">
              <th mat-header-cell *matHeaderCellDef>{{ col }}</th>
              <td mat-cell *matCellDef="let r">{{ r[col] }}</td>
            </ng-container>
          }
          <tr mat-header-row *matHeaderRowDef="columns()"></tr>
          <tr mat-row *matRowDef="let row; columns: columns()"></tr>
        </table>
      }
    </div>
  `,
  styles: [`
    .filters { margin-bottom: 16px; }
    .row { display: flex; gap: 12px; align-items: center; flex-wrap: wrap; }
    .full-width { width: 100%; }
  `],
})
export class ReportsComponent {
  reportType: ReportType = 'sales';
  startDate = '';
  endDate = '';

  rows = signal<any[]>([]);
  columns = signal<string[]>([]);

  constructor(private readonly service: ReportsService) {}

  run(): void {
    const handlers: Record<ReportType, () => any> = {
      sales: () => this.service.sales({ startDate: this.startDate || undefined, endDate: this.endDate || undefined }),
      products: () => this.service.products(),
      inventory: () => this.service.inventory(),
      topSelling: () => this.service.topSelling(),
    };

    handlers[this.reportType]().subscribe((data: any[]) => {
      this.rows.set(data);
      this.columns.set(data.length ? Object.keys(data[0]) : []);
    });
  }
}
