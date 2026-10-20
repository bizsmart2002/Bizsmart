import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

// "IA" de esta primera versión = reglas determinísticas sobre datos reales
// del negocio (sin costo de API externa, sin inventar cifras - punto 14 de
// la especificación original: "no debe inventar cifras que no estén
// registradas"). Deja el contrato listo para, en el futuro, sustituir el
// cuerpo de estos métodos por una llamada a un LLM sin tocar los controllers.
@Injectable()
export class RecommendationsService {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  // HU12: productos que requieren reabastecimiento.
  async restockRecommendations() {
    const rows = await this.dataSource.query(`
      SELECT p.id, p.name, i.current_stock AS "currentStock", p.minimum_stock AS "minimumStock",
             GREATEST(p.minimum_stock * 3 - i.current_stock, p.minimum_stock) AS "suggestedReorderQty"
      FROM inventory.inventory i
      JOIN catalog.products p ON p.id = i.product_id
      WHERE p.active = true AND i.current_stock <= p.minimum_stock
      ORDER BY (i.current_stock - p.minimum_stock) ASC
    `);

    return rows.map((r: any) => ({
      ...r,
      reason:
        r.currentStock === 0
          ? 'Sin existencias disponibles'
          : `Stock actual (${r.currentStock}) está en o por debajo del mínimo configurado (${r.minimumStock})`,
    }));
  }

  // HU14: tendencias de ventas (variación mes contra mes anterior por producto).
  async salesTrends() {
    const rows = await this.dataSource.query(`
      WITH monthly AS (
        SELECT sd.product_id, date_trunc('month', s.sale_date) AS month, SUM(sd.quantity) AS qty
        FROM sales.sale_details sd
        JOIN sales.sales s ON s.id = sd.sale_id AND s.status = 'COMPLETED'
        GROUP BY sd.product_id, month
      ),
      ranked AS (
        SELECT product_id, month, qty,
               LAG(qty) OVER (PARTITION BY product_id ORDER BY month) AS prev_qty,
               ROW_NUMBER() OVER (PARTITION BY product_id ORDER BY month DESC) AS rn
        FROM monthly
      )
      SELECT p.id, p.name, r.qty::int AS "currentMonthUnits",
             COALESCE(r.prev_qty, 0)::int AS "previousMonthUnits"
      FROM ranked r
      JOIN catalog.products p ON p.id = r.product_id
      WHERE r.rn = 1
    `);

    return rows.map((r: any) => {
      const diff = r.currentMonthUnits - r.previousMonthUnits;
      const pct = r.previousMonthUnits > 0 ? (diff / r.previousMonthUnits) * 100 : null;
      let trend: 'UP' | 'DOWN' | 'STABLE' = 'STABLE';
      if (pct !== null) {
        if (pct >= 15) trend = 'UP';
        else if (pct <= -15) trend = 'DOWN';
      }
      return { ...r, changePct: pct !== null ? Number(pct.toFixed(1)) : null, trend };
    });
  }
}
