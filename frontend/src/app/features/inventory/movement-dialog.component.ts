import { Component, Inject } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { Product } from '../../models/product.model';

export interface MovementDialogData {
  products: Product[];
}

// HU06: entradas, salidas y ajustes manuales de inventario.
@Component({
  selector: 'app-movement-dialog',
  standalone: true,
  imports: [ReactiveFormsModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatButtonModule],
  template: `
    <h2 mat-dialog-title>Registrar movimiento de inventario</h2>
    <mat-dialog-content>
      <form [formGroup]="form" class="form-grid">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Producto</mat-label>
          <mat-select formControlName="productId" required>
            @for (p of data.products; track p.id) {
              <mat-option [value]="p.id">{{ p.name }}</mat-option>
            }
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Tipo</mat-label>
          <mat-select formControlName="movementType" required>
            <mat-option value="IN">Entrada (IN)</mat-option>
            <mat-option value="OUT">Salida (OUT)</mat-option>
            <mat-option value="ADJUSTMENT">Ajuste (ADJUSTMENT)</mat-option>
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Cantidad</mat-label>
          <input matInput type="number" formControlName="quantity" min="1" required />
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Referencia (opcional)</mat-label>
          <input matInput formControlName="reference" />
        </mat-form-field>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancelar</button>
      <button mat-flat-button color="primary" [disabled]="form.invalid" (click)="save()">Registrar</button>
    </mat-dialog-actions>
  `,
  styles: [`
    .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 12px; padding-top: 8px; min-width: 360px; }
    .full-width { grid-column: 1 / -1; }
  `],
})
export class MovementDialogComponent {
  form = this.fb.group({
    productId: [null, Validators.required],
    movementType: ['IN', Validators.required],
    quantity: [1, [Validators.required, Validators.min(1)]],
    reference: [''],
  });

  constructor(
    private readonly fb: FormBuilder,
    private readonly dialogRef: MatDialogRef<MovementDialogComponent>,
    @Inject(MAT_DIALOG_DATA) readonly data: MovementDialogData,
  ) {}

  save(): void {
    if (this.form.invalid) return;
    this.dialogRef.close(this.form.getRawValue());
  }
}
