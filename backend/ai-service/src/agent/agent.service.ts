import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { RecommendationsService } from '../recommendations/recommendations.service';

// Agente basado en reglas: clasifica la intención por palabras clave y
// responde consultando datos reales (nunca inventa cifras). El contrato
// (AskAgentDto -> { answer, data }) es el mismo que tendría una versión
// futura respaldada por un LLM real.
@Injectable()
export class AgentService {
  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    private readonly recommendations: RecommendationsService,
  ) {}

  async ask(question: string, scope: 'FULL' | 'BASIC' = 'FULL') {
    const q = question.toLowerCase();

    if (this.matches(q, ['reabastec', 'reponer', 'reponer stock', 'agotar'])) {
      const items = await this.recommendations.restockRecommendations();
      if (items.length === 0) {
        return { answer: 'Ningún producto está por debajo de su stock mínimo en este momento.', data: [] };
      }
      const list = items.map((i: any) => `${i.name} (stock actual: ${i.currentStock})`).join(', ');
      return { answer: `Deberías reabastecer: ${list}.`, data: items };
    }

    if (this.matches(q, ['tendencia', 'comportamiento', 'sube', 'baja'])) {
      const trends = await this.recommendations.salesTrends();
      const up = trends.filter((t: any) => t.trend === 'UP');
      const down = trends.filter((t: any) => t.trend === 'DOWN');
      const parts: string[] = [];
      if (up.length) parts.push(`en alza: ${up.map((t: any) => t.name).join(', ')}`);
      if (down.length) parts.push(`en baja: ${down.map((t: any) => t.name).join(', ')}`);
      return {
        answer: parts.length ? `Tendencias del mes: ${parts.join('; ')}.` : 'No hay suficiente historial para identificar tendencias todavía.',
        data: trends,
      };
    }

    if (scope === 'FULL' && this.matches(q, ['venta', 'vendido', 'total vendido', 'ingreso'])) {
      const [row] = await this.dataSource.query(`
        SELECT COALESCE(SUM(total), 0)::float AS total, COUNT(*)::int AS count
        FROM sales.sales WHERE status = 'COMPLETED'
      `);
      return {
        answer: `El negocio registra ${row.count} ventas por un total de $${row.total.toLocaleString('es-CO')}.`,
        data: row,
      };
    }

    if (this.matches(q, ['stock', 'inventario', 'existencia'])) {
      const [row] = await this.dataSource.query(`
        SELECT COUNT(*)::int AS "lowStockCount"
        FROM inventory.inventory i
        JOIN catalog.products p ON p.id = i.product_id
        WHERE i.current_stock <= p.minimum_stock AND p.active = true
      `);
      return {
        answer: `Actualmente hay ${row.lowStockCount} producto(s) en o por debajo del stock mínimo.`,
        data: row,
      };
    }

    return {
      answer:
        'Puedo responder preguntas sobre reabastecimiento, tendencias de ventas, inventario y (con permisos completos) ventas totales del negocio. Intenta reformular tu pregunta.',
      data: null,
    };
  }

  private matches(question: string, keywords: string[]): boolean {
    return keywords.some((k) => question.includes(k));
  }
}
