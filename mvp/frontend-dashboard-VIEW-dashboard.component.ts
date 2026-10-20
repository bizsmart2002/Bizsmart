import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, signal } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { DashboardSummary } from '../../models/dashboard.model';
import { DashboardService } from './dashboard.service';

const EMPTY_SUMMARY: DashboardSummary = {
  topProducts: [],
  activeAlertsCount: 0,
};

// HU10: visualizar indicadores y gráficos del negocio.
@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatTableModule, MatIconModule, MatProgressSpinnerModule],
  template: `
    <div class="page-container">
      <h1>Dashboard</h1>

      @if (loading()) {
        <mat-spinner diameter="32"></mat-spinner>
      } @else if (error()) {
        <p class="error">No se pudo cargar el dashboard. Intenta recargar la página.</p>
      } @else {
        <div class="kpi-grid">
          @if (view().totalSales !== undefined) {
            <mat-card class="kpi-card">
              <mat-icon>payments</mat-icon>
              <div class="kpi-value">{{ view().totalSales | number: '1.0-0' }}</div>
              <div class="kpi-label">Ventas totales ($)</div>
            </mat-card>
            <mat-card class="kpi-card">
              <mat-icon>receipt_long</mat-icon>
              <div class="kpi-value">{{ view().salesCount }}</div>
              <div class="kpi-label"># de ventas</div>
            </mat-card>
          }
          <mat-card class="kpi-card alert">
            <mat-icon>warning</mat-icon>
            <div class="kpi-value">{{ view().activeAlertsCount }}</div>
            <div class="kpi-label">Alertas activas</div>
          </mat-card>
        </div>

        <div class="grid-2">
          <mat-card>
            <mat-card-header><mat-card-title>Productos más vendidos</mat-card-title></mat-card-header>
            <mat-card-content>
              <table mat-table [dataSource]="view().topProducts" class="full-width">
                <ng-container matColumnDef="name">
                  <th mat-header-cell *matHeaderCellDef>Producto</th>
                  <td mat-cell *matCellDef="let p">{{ p.name }}</td>
                </ng-container>
                <ng-container matColumnDef="unitsSold">
                  <th mat-header-cell *matHeaderCellDef>Unidades vendidas</th>
                  <td mat-cell *matCellDef="let p">{{ p.unitsSold }}</td>
                </ng-container>
                <tr mat-header-row *matHeaderRowDef="['name', 'unitsSold']"></tr>
                <tr mat-row *matRowDef="let row; columns: ['name', 'unitsSold']"></tr>
              </table>
            </mat-card-content>
          </mat-card>

          @if (lowStockProducts().length) {
            <mat-card>
              <mat-card-header><mat-card-title>Productos con stock bajo</mat-card-title></mat-card-header>
              <mat-card-content>
                <table mat-table [dataSource]="lowStockProducts()" class="full-width">
                  <ng-container matColumnDef="name">
                    <th mat-header-cell *matHeaderCellDef>Producto</th>
                    <td mat-cell *matCellDef="let p">{{ p.name }}</td>
                  </ng-container>
                  <ng-container matColumnDef="currentStock">
                    <th mat-header-cell *matHeaderCellDef>Stock actual</th>
                    <td mat-cell *matCellDef="let p">{{ p.currentStock }} / mín. {{ p.minimumStock }}</td>
                  </ng-container>
                  <tr mat-header-row *matHeaderRowDef="['name', 'currentStock']"></tr>
                  <tr mat-row *matRowDef="let row; columns: ['name', 'currentStock']"></tr>
                </table>
              </mat-card-content>
            </mat-card>
          }
        </div>

        @if (salesTrend().length) {
          <mat-card class="trend-card">
            <mat-card-header><mat-card-title>Ventas de los últimos 7 días</mat-card-title></mat-card-header>
            <mat-card-content>
              <div class="bars">
                @for (d of salesTrend(); track d.day) {
                  <div class="bar-wrapper">
                    <div class="bar" [style.height.px]="barHeight(d.total)"></div>
                    <span class="bar-label">{{ d.day.slice(5) }}</span>
                  </div>
                }
              </div>
            </mat-card-content>
          </mat-card>
        }
      }
    </div>
  `,
  styles: [`
    .kpi-grid { display: flex; gap: 16px; margin-bottom: 24px; flex-wrap: wrap; }
    .kpi-card { flex: 1 1 200px; padding: 16px; text-align: center; }
    .kpi-card.alert { background: #fff3e0; }
    .kpi-value { font-size: 2rem; font-weight: 600; margin: 8px 0 4px; }
    .kpi-label { color: rgba(0,0,0,0.6); font-size: 0.85rem; }
    .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px; }
    .full-width { width: 100%; }
    .trend-card .bars { display: flex; align-items: flex-end; gap: 12px; height: 160px; }
    .bar-wrapper { display: flex; flex-direction: column; align-items: center; }
    .bar { width: 28px; background: #3f51b5; border-radius: 4px 4px 0 0; min-height: 2px; }
    .bar-label { font-size: 0.7rem; margin-top: 4px; color: rgba(0,0,0,0.6); }
    .error { color: #b00020; }
    @media (max-width: 800px) { .grid-2 { grid-template-columns: 1fr; } }
  `],
})
export class DashboardComponent implements OnInit {
  private readonly summary = signal<DashboardSummary | null>(null);
  loading = signal(true);
  error = signal(false);

  // Siempre tiene una forma válida: el template nunca necesita comprobar null.
  readonly view = computed(() => this.summary() ?? EMPTY_SUMMARY);
  readonly lowStockProducts = computed(() => this.view().lowStockProducts ?? []);
  readonly salesTrend = computed(() => this.view().salesTrend7Days ?? []);

  constructor(private readonly service: DashboardService) {}

  ngOnInit(): void {
    this.service.summary().subscribe({
      next: (data) => {
        this.summary.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.error.set(true);
        this.loading.set(false);
      },
    });
  }

  barHeight(total: number): number {
    const trend = this.salesTrend();
    const max = Math.max(...(trend.length ? trend.map((d) => d.total) : [1]));
    return max > 0 ? Math.max((total / max) * 140, 2) : 2;
  }
}
