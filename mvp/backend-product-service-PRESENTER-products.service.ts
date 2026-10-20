import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { AuditService } from '../common/audit/audit.service';
import { Category } from '../categories/entities/category.entity';
import { CreateProductDto, UpdateProductDto } from './dto/product.dto';
import { Product } from './entities/product.entity';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product) private readonly repo: Repository<Product>,
    @InjectRepository(Category) private readonly categories: Repository<Category>,
    private readonly audit: AuditService,
  ) {}

  findAll(onlyActive = false) {
    return this.repo.find({
      where: onlyActive ? { active: true } : {},
      order: { name: 'ASC' },
    });
  }

  async findOne(id: number) {
    const product = await this.repo.findOne({ where: { id } });
    if (!product) throw new NotFoundException('Producto no encontrado');
    return product;
  }

  async create(dto: CreateProductDto, actingUserId: number) {
    let category: Category | null = null;
    if (dto.categoryId) {
      category = await this.categories.findOne({ where: { id: dto.categoryId } });
      if (!category) throw new BadRequestException('Categoría inválida');
    }

    const product = await this.repo.save(
      this.repo.create({
        name: dto.name,
        description: dto.description,
        category,
        price: dto.price,
        minimumStock: dto.minimumStock,
        active: true,
      }),
    );

    await this.audit.log({
      userId: actingUserId,
      action: 'CREATE',
      entity: 'Product',
      entityId: product.id,
      details: { name: product.name, price: product.price },
    });

    return product;
  }

  async update(id: number, dto: UpdateProductDto, actingUserId: number) {
    const product = await this.findOne(id);

    if (dto.categoryId !== undefined) {
      const category = await this.categories.findOne({ where: { id: dto.categoryId } });
      if (!category) throw new BadRequestException('Categoría inválida');
      product.category = category;
    }

    if (dto.name !== undefined) product.name = dto.name;
    if (dto.description !== undefined) product.description = dto.description;
    if (dto.price !== undefined) product.price = dto.price;
    if (dto.minimumStock !== undefined) product.minimumStock = dto.minimumStock;
    if (dto.active !== undefined) product.active = dto.active;

    const saved = await this.repo.save(product);

    await this.audit.log({
      userId: actingUserId,
      action: 'UPDATE',
      entity: 'Product',
      entityId: saved.id,
    });

    return saved;
  }

  async deactivate(id: number, actingUserId: number) {
    const product = await this.findOne(id);
    product.active = false;
    const saved = await this.repo.save(product);

    await this.audit.log({
      userId: actingUserId,
      action: 'DEACTIVATE',
      entity: 'Product',
      entityId: saved.id,
    });

    return saved;
  }

  // Usado internamente por sales-service (vía HTTP) para validar
  // existencia/precio/estado antes de registrar una venta.
  async findManyByIds(ids: number[]) {
    return this.repo.findBy({ id: In(ids) });
  }
}
