import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ schema: 'audit', name: 'audit_logs' })
export class AuditLog {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Column({ name: 'user_id', nullable: true, type: 'bigint' })
  userId: number | null;

  @Column()
  action: string; // LOGIN, CREATE, UPDATE, DEACTIVATE, ROLE_CHANGE, SALE, INVENTORY_ADJUSTMENT...

  @Column()
  entity: string; // User, Product, Sale, Inventory...

  @Column({ name: 'entity_id', nullable: true, type: 'bigint' })
  entityId: number | null;

  @Column({ type: 'jsonb', nullable: true })
  details: Record<string, unknown> | null;

  @Column({ name: 'ip_address', nullable: true, type: 'varchar' })
  ipAddress: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
