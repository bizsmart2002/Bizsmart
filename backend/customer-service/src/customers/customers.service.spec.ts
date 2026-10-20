import { BadRequestException, NotFoundException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { of } from 'rxjs';
import { CustomersService } from './customers.service';
import { Customer } from './entities/customer.entity';

describe('CustomersService', () => {
  let service: CustomersService;
  let repo: { find: jest.Mock; findOne: jest.Mock; save: jest.Mock; create: jest.Mock };
  let httpService: { get: jest.Mock };

  beforeEach(async () => {
    repo = {
      find: jest.fn(),
      findOne: jest.fn(),
      save: jest.fn((x) => Promise.resolve({ id: 1, ...x })),
      create: jest.fn((x) => x),
    };
    httpService = { get: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CustomersService,
        { provide: getRepositoryToken(Customer), useValue: repo },
        { provide: HttpService, useValue: httpService },
        { provide: ConfigService, useValue: { get: (_: string, def: string) => def } },
      ],
    }).compile();

    service = module.get(CustomersService);
  });

  afterEach(() => jest.clearAllMocks());

  it('crea un cliente nuevo cuando el documento no está registrado', async () => {
    repo.findOne.mockResolvedValue(null);

    const customer = await service.create({ name: 'María Torres', document: 'CC-123' } as any);

    expect(customer.active).toBe(true);
  });

  it('rechaza crear un cliente con un documento ya registrado', async () => {
    repo.findOne.mockResolvedValue({ id: 1, document: 'CC-123' });

    await expect(service.create({ name: 'Otro', document: 'CC-123' } as any)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('lanza NotFoundException al buscar un cliente que no existe', async () => {
    repo.findOne.mockResolvedValue(null);
    await expect(service.findOne(999)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('purchaseHistory: valida que el cliente exista antes de pedir el historial a sales-service', async () => {
    repo.findOne.mockResolvedValue({ id: 1, name: 'María Torres' });
    httpService.get.mockReturnValue(of({ data: [{ id: 50, total: 7000 }] }));

    const history = await service.purchaseHistory(1, 'Bearer token');

    expect(history).toEqual([{ id: 50, total: 7000 }]);
    expect(httpService.get).toHaveBeenCalledWith(
      expect.stringContaining('/sales'),
      expect.objectContaining({ params: { customerId: 1 } }),
    );
  });

  it('purchaseHistory: propaga el 404 si el cliente no existe, sin llamar a sales-service', async () => {
    repo.findOne.mockResolvedValue(null);

    await expect(service.purchaseHistory(999, 'Bearer token')).rejects.toBeInstanceOf(NotFoundException);
    expect(httpService.get).not.toHaveBeenCalled();
  });
});
