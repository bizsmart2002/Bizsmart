import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CreateUserDialogComponent } from './create-user-dialog.component';
import { AppUser, UsersService } from './users.service';

// HU03: crear/consultar/desactivar usuarios y asignar roles -> exclusivo ADMIN.
@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, MatTableModule, MatButtonModule, MatIconModule, MatChipsModule, MatDialogModule],
  template: `
    <div class="page-container">
      <div class="header">
        <h1>Usuarios</h1>
        <button mat-flat-button color="primary" (click)="openDialog()">
          <mat-icon>person_add</mat-icon> Nuevo usuario
        </button>
      </div>

      <table mat-table [dataSource]="users()" class="full-width">
        <ng-container matColumnDef="name">
          <th mat-header-cell *matHeaderCellDef>Nombre</th>
          <td mat-cell *matCellDef="let u">{{ u.name }}</td>
        </ng-container>
        <ng-container matColumnDef="email">
          <th mat-header-cell *matHeaderCellDef>Correo</th>
          <td mat-cell *matCellDef="let u">{{ u.email }}</td>
        </ng-container>
        <ng-container matColumnDef="role">
          <th mat-header-cell *matHeaderCellDef>Rol</th>
          <td mat-cell *matCellDef="let u">{{ u.role.name }}</td>
        </ng-container>
        <ng-container matColumnDef="active">
          <th mat-header-cell *matHeaderCellDef>Estado</th>
          <td mat-cell *matCellDef="let u">
            <mat-chip [color]="u.active ? 'primary' : 'warn'" selected>{{ u.active ? 'Activo' : 'Inactivo' }}</mat-chip>
          </td>
        </ng-container>
        <ng-container matColumnDef="actions">
          <th mat-header-cell *matHeaderCellDef></th>
          <td mat-cell *matCellDef="let u">
            @if (u.active) {
              <button mat-icon-button (click)="deactivate(u.id)"><mat-icon>block</mat-icon></button>
            }
          </td>
        </ng-container>
        <tr mat-header-row *matHeaderRowDef="columns"></tr>
        <tr mat-row *matRowDef="let row; columns: columns"></tr>
      </table>
    </div>
  `,
  styles: [`
    .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
    .full-width { width: 100%; }
  `],
})
export class UsersComponent implements OnInit {
  columns = ['name', 'email', 'role', 'active', 'actions'];
  users = signal<AppUser[]>([]);

  constructor(
    private readonly service: UsersService,
    private readonly dialog: MatDialog,
    private readonly snackBar: MatSnackBar,
  ) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.service.findAll().subscribe((data) => this.users.set(data));
  }

  openDialog(): void {
    const ref = this.dialog.open(CreateUserDialogComponent);
    ref.afterClosed().subscribe((result) => {
      if (!result) return;
      this.service.create(result).subscribe({
        next: () => {
          this.snackBar.open('Usuario creado', 'Cerrar', { duration: 2500 });
          this.load();
        },
      });
    });
  }

  deactivate(id: number): void {
    this.service.deactivate(id).subscribe(() => this.load());
  }
}
