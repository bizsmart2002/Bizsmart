import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditService } from '../common/audit/audit.service';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/category.dto';
import { Category } from './entities/category.entity';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category) private readonly repo: Repository<Category>,
    private readonly audit: AuditService,
  ) {}

  findAll() {
    return this.repo.find({ order: { name: 'ASC' } });
  }

  async findOne(id: number) {
    const category = await this.repo.findOne({ where: { id } });
    if (!category) throw new NotFoundException('Categoría no encontrada');
    return category;
  }

  async create(dto: CreateCategoryDto, actingUserId: number) {
    const saved = await this.repo.save(this.repo.create(dto));
    await this.audit.log({
      userId: actingUserId,
      action: 'CREATE',
      entity: 'Category',
      entityId: saved.id,
      details: { name: saved.name },
    });
    return saved;
  }

  async update(id: number, dto: UpdateCategoryDto, actingUserId: number) {
    const category = await this.findOne(id);
    Object.assign(category, dto);
    const saved = await this.repo.save(category);
    await this.audit.log({
      userId: actingUserId,
      action: 'UPDATE',
      entity: 'Category',
      entityId: saved.id,
    });
    return saved;
  }
}
