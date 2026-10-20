import { Column, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity({ schema: 'inventory', name: 'inventory' })
export class Inventory {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Column({ name: 'product_id', type: 'bigint', unique: true })
  productId: number;

  @Column({ name: 'current_stock', type: 'int', default: 0 })
  currentStock: number;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
