import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { ReportFilterDto } from './dto/report-filter.dto';

@Injectable()
export class ReportsService {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  async sales(filter: ReportFilterDto) {
    const { where, params } = this.buildSalesWhere(filter);
    return this.dataSource.query(
      `
      SELECT s.id, s.sale_date AS "saleDate", s.customer_id AS "customerId",
             s.seller_id AS "sellerId", s.subtotal, s.total, s.status
      FROM sales.sales s
      WHERE ${where}
      ORDER BY s.sale_date DESC
      `,
      params,
    );
  }

  async products() {
    return this.dataSource.query(`
      SELECT p.id, p.name, c.name AS category, p.price, p.minimum_stock AS "minimumStock", p.active
      FROM catalog.products p
      LEFT JOIN catalog.categories c ON c.id = p.category_id
      ORDER BY p.name ASC
    `);
  }

  async inventory() {
    return this.dataSource.query(`
      SELECT p.id AS "productId", p.name, i.current_stock AS "currentStock",
             p.minimum_stock AS "minimumStock",
             CASE WHEN i.current_stock <= p.minimum_stock THEN true ELSE false END AS "belowMinimum"
      FROM inventory.inventory i
      JOIN catalog.products p ON p.id = i.product_id
      ORDER BY "belowMinimum" DESC, p.name ASC
    `);
  }

  async customers() {
    return this.dataSource.query(`
      SELECT c.id, c.name, c.document, c.email, c.phone,
             COUNT(s.id)::int AS "totalPurchases",
             COALESCE(SUM(s.total), 0)::float AS "totalSpent"
      FROM crm.customers c
      LEFT JOIN sales.sales s ON s.customer_id = c.id AND s.status = 'COMPLETED'
      GROUP BY c.id
      ORDER BY "totalSpent" DESC
    `);
  }

  async topSellingProducts(filter: ReportFilterDto) {
    const { where, params } = this.buildSalesWhere(filter, 's');
    return this.dataSource.query(
      `
      SELECT p.id, p.name, SUM(sd.quantity)::int AS "unitsSold",
             SUM(sd.subtotal)::float AS "revenue"
      FROM sales.sale_details sd
      JOIN sales.sales s ON s.id = sd.sale_id
      JOIN catalog.products p ON p.id = sd.product_id
      WHERE ${where}
      GROUP BY p.id, p.name
      ORDER BY "unitsSold" DESC
      `,
      params,
    );
  }

  async trends() {
    return this.dataSource.query(`
      SELECT to_char(date_trunc('month', sale_date), 'YYYY-MM') AS month,
             COALESCE(SUM(total), 0)::float AS total,
             COUNT(*)::int AS "salesCount"
      FROM sales.sales
      WHERE status = 'COMPLETED'
      GROUP BY month
      ORDER BY month ASC
    `);
  }

  private buildSalesWhere(filter: ReportFilterDto, alias = 's') {
    const conditions: string[] = [`${alias}.status = 'COMPLETED'`];
    const params: any[] = [];

    if (filter.startDate) {
      params.push(filter.startDate);
      conditions.push(`${alias}.sale_date >= $${params.length}`);
    }
    if (filter.endDate) {
      params.push(filter.endDate);
      conditions.push(`${alias}.sale_date <= $${params.length}`);
    }
    if (filter.customerId) {
      params.push(filter.customerId);
      conditions.push(`${alias}.customer_id = $${params.length}`);
    }
    if (filter.sellerId) {
      params.push(filter.sellerId);
      conditions.push(`${alias}.seller_id = $${params.length}`);
    }

    return { where: conditions.join(' AND '), params };
  }
}
