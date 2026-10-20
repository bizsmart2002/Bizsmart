import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Customer } from '../../models/customer.model';
import { Sale } from '../../models/sale.model';
import { CustomerDialogComponent } from './customer-dialog.component';
import { CustomersService } from './customers.service';

// HU09: registrar/consultar clientes + historial de compras.
@Component({
  selector: 'app-customers',
  standalone: true,
  imports: [CommonModule, MatTableModule, MatButtonModule, MatIconModule, MatDialogModule],
  template: `
    <div class="page-container">
      <div class="header">
        <h1>Clientes</h1>
        <button mat-flat-button color="primary" (click)="openDialog(null)">
          <mat-icon>person_add</mat-icon> Nuevo cliente
        </button>
      </div>

      <table mat-table [dataSource]="customers()" class="full-width" multiTemplateDataRows>
        <ng-container matColumnDef="name">
          <th mat-header-cell *matHeaderCellDef>Nombre</th>
          <td mat-cell *matCellDef="let c">{{ c.name }}</td>
        </ng-container>
        <ng-container matColumnDef="document">
          <th mat-header-cell *matHeaderCellDef>Documento</th>
          <td mat-cell *matCellDef="let c">{{ c.document }}</td>
        </ng-container>
        <ng-container matColumnDef="phone">
          <th mat-header-cell *matHeaderCellDef>Teléfono</th>
          <td mat-cell *matCellDef="let c">{{ c.phone || '—' }}</td>
        </ng-container>
        <ng-container matColumnDef="actions">
          <th mat-header-cell *matHeaderCellDef></th>
          <td mat-cell *matCellDef="let c">
            <button mat-icon-button (click)="openDialog(c)"><mat-icon>edit</mat-icon></button>
            <button mat-icon-button (click)="toggleHistory(c)"><mat-icon>history</mat-icon></button>
          </td>
        </ng-container>
        <ng-container matColumnDef="history">
          <td mat-cell *matCellDef="let c" [attr.colspan]="columns.length">
            @if (expandedId() === c.id) {
              <div class="history">
                @if ((history()[c.id] ?? []).length === 0) {
                  <p>Sin compras registradas.</p>
                } @else {
                  <ul>
                    @for (s of history()[c.id]; track s.id) {
                      <li>{{ s.saleDate | date: 'short' }} — total: {{ s.total | number: '1.0-0' }}</li>
                    }
                  </ul>
                }
              </div>
            }
          </td>
        </ng-container>

        <tr mat-header-row *matHeaderRowDef="columns"></tr>
        <tr mat-row *matRowDef="let row; columns: columns"></tr>
        <tr mat-row *matRowDef="let row; columns: ['history']" class="history-row"></tr>
      </table>
    </div>
  `,
  styles: [`
    .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
    .full-width { width: 100%; }
    .history { padding: 8px 16px; }
    .history-row { height: 0; }
  `],
})
export class CustomersComponent implements OnInit {
  columns = ['name', 'document', 'phone', 'actions'];
  customers = signal<Customer[]>([]);
  history = signal<Record<number, Sale[]>>({});
  expandedId = signal<number | null>(null);

  constructor(
    private readonly service: CustomersService,
    private readonly dialog: MatDialog,
    private readonly snackBar: MatSnackBar,
  ) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.service.findAll().subscribe((data) => this.customers.set(data));
  }

  openDialog(customer: Customer | null): void {
    const ref = this.dialog.open(CustomerDialogComponent, { data: customer });
    ref.afterClosed().subscribe((result) => {
      if (!result) return;
      const request = customer ? this.service.update(customer.id, result) : this.service.create(result);
      request.subscribe({
        next: () => {
          this.snackBar.open(customer ? 'Cliente actualizado' : 'Cliente creado', 'Cerrar', { duration: 2500 });
          this.load();
        },
      });
    });
  }

  toggleHistory(customer: Customer): void {
    if (this.expandedId() === customer.id) {
      this.expandedId.set(null);
      return;
    }
    this.expandedId.set(customer.id);
    if (!this.history()[customer.id]) {
      this.service.purchaseHistory(customer.id).subscribe((sales) => {
        this.history.update((h) => ({ ...h, [customer.id]: sales }));
      });
    }
  }
}
