import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

// Referencia de SOLO LECTURA a catalog.products. inventory-service no es
// dueño de esta tabla (product-service lo es); al vivir en la misma
// instancia PostgreSQL (ver Fase 1, sección 1) se permite esta lectura
// directa para poder mostrar nombre/stock mínimo sin llamadas HTTP extra.
// NUNCA se escribe a través de esta entidad.
@Entity({ schema: 'catalog', name: 'products' })
export class ProductRef {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Column()
  name: string;

  @Column({ name: 'minimum_stock', type: 'int' })
  minimumStock: number;

  @Column()
  active: boolean;
}
