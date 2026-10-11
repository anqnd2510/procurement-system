/* eslint-disable @typescript-eslint/unbound-method -- Assertions inspect Jest mock methods, not unbound service methods. */
import { Test, TestingModule } from '@nestjs/testing';
import { InventoriesService } from './inventories.service';
import { PrismaService } from '../prisma/prisma.service';
import { OrganizationsService } from '../organizations/organizations.service';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { InventoryTxType } from '@prisma/client';

describe('InventoriesService', () => {
  let service: InventoriesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InventoriesService,
        { provide: PrismaService, useValue: {} },
        { provide: OrganizationsService, useValue: {} },
        { provide: AuditLogsService, useValue: {} },
      ],
    }).compile();

    service = module.get<InventoriesService>(InventoriesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('lists paginated transactions scoped to the selected organization', async () => {
    const product = {
      id: 'product-1',
      name: 'Keyboard',
      sku: 'KEY-1',
      inventory: { id: 'inventory-1' },
    };
    const row = {
      id: 'transaction-1',
      inventoryId: 'inventory-1',
      type: InventoryTxType.STOCK_IN,
      quantity: 4,
      referenceId: null,
      createdAt: new Date('2026-10-11T10:00:00.000Z'),
    };
    const prisma = {
      product: { findFirst: jest.fn().mockResolvedValue(product) },
      inventoryTransaction: {
        findMany: jest.fn().mockResolvedValue([row]),
        count: jest.fn().mockResolvedValue(11),
      },
    } as unknown as PrismaService;
    const organizations = {
      getMembership: jest.fn().mockResolvedValue({ role: 'MEMBER' }),
    } as unknown as OrganizationsService;
    service = new InventoriesService(
      prisma,
      organizations,
      {} as AuditLogsService,
    );

    const result = await service.findTransactions(
      'product-1',
      'user-1',
      'organization-1',
      { page: 2, limit: 5, type: InventoryTxType.STOCK_IN },
    );

    expect(organizations.getMembership).toHaveBeenCalledWith(
      'user-1',
      'organization-1',
    );
    expect(prisma.product.findFirst).toHaveBeenCalledWith({
      where: {
        id: 'product-1',
        organizationId: 'organization-1',
        deletedAt: null,
      },
      select: {
        id: true,
        name: true,
        sku: true,
        inventory: { select: { id: true } },
      },
    });
    expect(prisma.inventoryTransaction.findMany).toHaveBeenCalledWith({
      where: { inventoryId: 'inventory-1', type: InventoryTxType.STOCK_IN },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      skip: 5,
      take: 5,
    });
    expect(result).toMatchObject({
      items: [
        {
          id: 'transaction-1',
          productName: 'Keyboard',
          productSku: 'KEY-1',
        },
      ],
      meta: { page: 2, limit: 5, total: 11, totalPages: 3, hasNext: true },
    });
  });

  it('does not expose an inventory from another organization', async () => {
    const prisma = {
      product: { findFirst: jest.fn().mockResolvedValue(null) },
      inventoryTransaction: { findMany: jest.fn(), count: jest.fn() },
    } as unknown as PrismaService;
    const organizations = {
      getMembership: jest.fn().mockResolvedValue({ role: 'MEMBER' }),
    } as unknown as OrganizationsService;
    service = new InventoriesService(
      prisma,
      organizations,
      {} as AuditLogsService,
    );

    await expect(
      service.findTransactions('product-foreign', 'user-1', 'organization-1', {
        page: 1,
        limit: 10,
      }),
    ).rejects.toThrow('Inventory for product product-foreign not found');
    expect(prisma.inventoryTransaction.findMany).not.toHaveBeenCalled();
  });
});
