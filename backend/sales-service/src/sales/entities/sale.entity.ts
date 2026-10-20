import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

export type SaleStatus = 'COMPLETED' | 'CANCELLED';

@Entity({ schema: 'sales', name: 'sales' })
export class Sale {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Column({ name: 'customer_id', type: 'bigint', nullable: true })
  customerId: number | null;

  @Column({ name: 'seller_id', type: 'bigint' })
  sellerId: number;

  @Column({ name: 'sale_date', type: 'timestamptz' })
  saleDate: Date;

  @Column({ type: 'numeric', precision: 14, scale: 2 })
  subtotal: number;

  @Column({ type: 'numeric', precision: 14, scale: 2 })
  total: number;

  @Column({ default: 'COMPLETED' })
  status: SaleStatus;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
