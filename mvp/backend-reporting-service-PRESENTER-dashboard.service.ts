import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

// reporting-service es de SOLO LECTURA sobre los esquemas de los demás
// dominios (misma instancia PostgreSQL, ver Fase 1 sección 1). No declara
// entidades propias porque no es dueño de ninguna tabla; usa SQL crudo
// optimizado para consultas agregadas (ver punto 11 de la especificación:
// "no deben cargar información innecesaria").
@Injectable()
export class DashboardService {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  async summary() {
    const [totals] = await this.dataSource.query(`
      SELECT
        COALESCE(SUM(total), 0)::float AS "totalSales",
        COUNT(*)::int AS "salesCount"
      FROM sales.sales
      WHERE status = 'COMPLETED'
    `);

    const topProducts = await this.dataSource.query(`
      SELECT p.id, p.name, SUM(sd.quantity)::int AS "unitsSold"
      FROM sales.sale_details sd
      JOIN catalog.products p ON p.id = sd.product_id
      JOIN sales.sales s ON s.id = sd.sale_id AND s.status = 'COMPLETED'
      GROUP BY p.id, p.name
      ORDER BY "unitsSold" DESC
      LIMIT 5
    `);

    const lowStock = await this.dataSource.query(`
      SELECT p.id, p.name, i.current_stock AS "currentStock", p.minimum_stock AS "minimumStock"
      FROM inventory.inventory i
      JOIN catalog.products p ON p.id = i.product_id
      WHERE i.current_stock <= p.minimum_stock AND p.active = true
      ORDER BY i.current_stock ASC
      LIMIT 10
    `);

    const salesLast7Days = await this.dataSource.query(`
      SELECT to_char(date_trunc('day', sale_date), 'YYYY-MM-DD') AS day,
             COALESCE(SUM(total), 0)::float AS total
      FROM sales.sales
      WHERE status = 'COMPLETED' AND sale_date >= now() - interval '7 days'
      GROUP BY day
      ORDER BY day ASC
    `);

    const activeAlerts = await this.dataSource.query(`
      SELECT COUNT(*)::int AS count FROM inventory.alerts WHERE resolved = false
    `);

    return {
      totalSales: totals.totalSales,
      salesCount: totals.salesCount,
      topProducts,
      lowStockProducts: lowStock,
      salesTrend7Days: salesLast7Days,
      activeAlertsCount: activeAlerts[0]?.count ?? 0,
    };
  }
}
