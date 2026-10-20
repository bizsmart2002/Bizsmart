import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Role } from '../../roles/entities/role.entity';

// Model (patrón MVP): entidad de dominio + acceso a datos.
// No contiene lógica de presentación ni de HTTP.
@Entity({ schema: 'auth', name: 'users' })
export class User {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Column()
  name: string;

  @Column({ unique: true })
  email: string;

  @Column({ name: 'password_hash', type: 'varchar', nullable: true })
  passwordHash: string | null;

  // HU02: autenticación con proveedor externo (OAuth 2.0). Un usuario que
  // solo entra por Google, por ejemplo, no tiene password_hash.
  @Column({ name: 'oauth_provider', type: 'varchar', nullable: true })
  oauthProvider: string | null;

  @Column({ name: 'oauth_id', type: 'varchar', nullable: true })
  oauthId: string | null;

  @ManyToOne(() => Role, (role) => role.users, { eager: true })
  @JoinColumn({ name: 'role_id' })
  role: Role;

  @Column({ default: true })
  active: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
