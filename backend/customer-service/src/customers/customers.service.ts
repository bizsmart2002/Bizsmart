import { HttpService } from '@nestjs/axios';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { firstValueFrom } from 'rxjs';
import { Repository } from 'typeorm';
import { CreateCustomerDto, UpdateCustomerDto } from './dto/customer.dto';
import { Customer } from './entities/customer.entity';

@Injectable()
export class CustomersService {
  private readonly salesServiceUrl: string;

  constructor(
    @InjectRepository(Customer) private readonly repo: Repository<Customer>,
    private readonly http: HttpService,
    config: ConfigService,
  ) {
    this.salesServiceUrl = config.get<string>('SALES_SERVICE_URL', 'http://localhost:3004');
  }

  findAll() {
    return this.repo.find({ order: { name: 'ASC' } });
  }

  async findOne(id: number) {
    const customer = await this.repo.findOne({ where: { id } });
    if (!customer) throw new NotFoundException('Cliente no encontrado');
    return customer;
  }

  async create(dto: CreateCustomerDto) {
    const existing = await this.repo.findOne({ where: { document: dto.document } });
    if (existing) throw new BadRequestException('Ya existe un cliente con ese documento');
    return this.repo.save(this.repo.create({ ...dto, active: true }));
  }

  async update(id: number, dto: UpdateCustomerDto) {
    const customer = await this.findOne(id);
    Object.assign(customer, dto);
    return this.repo.save(customer);
  }

  // HU09/3.2.6: historial de compras -> delega en sales-service.
  async purchaseHistory(id: number, authHeader: string) {
    await this.findOne(id); // 404 si el cliente no existe
    const { data } = await firstValueFrom(
      this.http.get(`${this.salesServiceUrl}/sales`, {
        params: { customerId: id },
        headers: { Authorization: authHeader },
      }),
    );
    return data;
  }
}
