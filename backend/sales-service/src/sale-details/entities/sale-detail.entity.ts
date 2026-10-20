import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ schema: 'sales', name: 'sale_details' })
export class SaleDetail {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Column({ name: 'sale_id', type: 'bigint' })
  saleId: number;

  @Column({ name: 'product_id', type: 'bigint' })
  productId: number;

  @Column('int')
  quantity: number;

  @Column({ name: 'unit_price', type: 'numeric', precision: 12, scale: 2 })
  unitPrice: number;

  @Column({ type: 'numeric', precision: 14, scale: 2 })
  subtotal: number;
}
