import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { StockAlert } from '../../models/inventory.model';
import { InventoryService } from '../inventory/inventory.service';

// HU11: recibir alertas de stock mínimo, vista dedicada para ADMIN/OWNER.
@Component({
  selector: 'app-alerts',
  standalone: true,
  imports: [CommonModule, MatTableModule, MatButtonModule, MatIconModule],
  template: `
    <div class="page-container">
      <h1>Alertas</h1>
      @if (alerts().length === 0) {
        <p>No hay alertas activas en este momento. 🎉</p>
      } @else {
        <table mat-table [dataSource]="alerts()" class="full-width">
          <ng-container matColumnDef="message">
            <th mat-header-cell *matHeaderCellDef>Mensaje</th>
            <td mat-cell *matCellDef="let a">
              <mat-icon color="warn">warning</mat-icon> {{ a.message }}
            </td>
          </ng-container>
          <ng-container matColumnDef="createdAt">
            <th mat-header-cell *matHeaderCellDef>Fecha</th>
            <td mat-cell *matCellDef="let a">{{ a.createdAt | date: 'short' }}</td>
          </ng-container>
          <ng-container matColumnDef="actions">
            <th mat-header-cell *matHeaderCellDef></th>
            <td mat-cell *matCellDef="let a">
              <button mat-button color="primary" (click)="resolve(a.id)">Marcar resuelta</button>
            </td>
          </ng-container>
          <tr mat-header-row *matHeaderRowDef="columns"></tr>
          <tr mat-row *matRowDef="let row; columns: columns"></tr>
        </table>
      }
    </div>
  `,
  styles: [`.full-width { width: 100%; }`],
})
export class AlertsComponent implements OnInit {
  columns = ['message', 'createdAt', 'actions'];
  alerts = signal<StockAlert[]>([]);

  constructor(private readonly service: InventoryService) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.service.alerts().subscribe((data) => this.alerts.set(data));
  }

  resolve(id: number): void {
    this.service.resolveAlert(id).subscribe(() => this.load());
  }
}
