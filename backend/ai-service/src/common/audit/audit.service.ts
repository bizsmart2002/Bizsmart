import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from './audit-log.entity';

// Nunca registrar contraseñas, hashes ni tokens completos (ver ERS 3.3.2 / punto 16).
@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AuditLog) private readonly repo: Repository<AuditLog>,
  ) {}

  async log(params: {
    userId?: number | null;
    action: string;
    entity: string;
    entityId?: number | null;
    details?: Record<string, unknown>;
    ipAddress?: string | null;
  }): Promise<void> {
    const entry = this.repo.create({
      userId: params.userId ?? null,
      action: params.action,
      entity: params.entity,
      entityId: params.entityId ?? null,
      details: params.details ?? null,
      ipAddress: params.ipAddress ?? null,
    });
    await this.repo.save(entry);
  }
}
