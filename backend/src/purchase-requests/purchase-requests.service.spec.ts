/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-return, @typescript-eslint/require-await */
import { ConflictException, NotFoundException } from '@nestjs/common';
import { InventoryTxType, PurchaseRequestStatus } from '@prisma/client';
import { PurchaseRequestsService } from './purchase-requests.service';

describe('PurchaseRequestsService', () => {
  const prisma = {
    department: { findFirst: jest.fn() },
    product: { findMany: jest.fn() },
    purchaseRequest: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
    },
    purchaseRequestItem: { findMany: jest.fn() },
    purchaseRequestStatusHistory: { create: jest.fn() },
    $transaction: jest.fn(),
  };
  const organizations = { getMembership: jest.fn() };
  const auditLogs = { record: jest.fn().mockResolvedValue(undefined) };
  const service = new PurchaseRequestsService(
    prisma as never,
    organizations as never,
    auditLogs as never,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    organizations.getMembership.mockResolvedValue({
      role: 'MEMBER',
      departmentId: 'department-id',
      departmentRole: 'MEMBER',
    });
  });

  it('rejects a department outside the request organization', async () => {
    prisma.department.findFirst.mockResolvedValue(null);

    await expect(
      service.create('user-id', 'organization-id', {
        departmentId: 'department-id',
        title: 'Office equipment',
        items: [
          {
            description: 'Laptop',
            quantity: 1,
            estimatedUnitPrice: 1000,
          },
        ],
      }),
    ).rejects.toBeInstanceOf(NotFoundException);

    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('creates the request and initial history in one transaction', async () => {
    prisma.department.findFirst.mockResolvedValue({ id: 'department-id' });
    prisma.product.findMany.mockResolvedValue([{ id: 'product-id' }]);
    const created = { id: 'request-id' };
    const tx = {
      purchaseRequest: {
        create: jest.fn().mockResolvedValue(created),
      },
      purchaseRequestStatusHistory: { create: jest.fn() },
    };
    prisma.$transaction.mockImplementation(async (callback) => callback(tx));
    jest
      .spyOn(service, 'findOne')
      .mockResolvedValue({ id: 'request-id' } as never);

    await service.create('user-id', 'organization-id', {
      departmentId: 'department-id',
      title: 'Office equipment',
      items: [
        {
          productId: 'product-id',
          description: 'Laptop',
          quantity: 2,
          estimatedUnitPrice: 1000.5,
        },
      ],
    });

    expect(tx.purchaseRequest.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          organizationId: 'organization-id',
          requesterId: 'user-id',
          totalAmount: expect.objectContaining({ d: expect.anything() }),
        }),
      }),
    );
    expect(tx.purchaseRequestStatusHistory.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        purchaseRequestId: 'request-id',
        toStatus: PurchaseRequestStatus.DRAFT,
        changedById: 'user-id',
      }),
    });
    expect(auditLogs.record).toHaveBeenCalledWith(
      tx,
      expect.objectContaining({
        action: 'PURCHASE_REQUEST_CREATED',
        resourceType: 'PURCHASE_REQUEST',
        resourceId: 'request-id',
      }),
    );
  });

  it('returns the original request when a create is retried with the same key', async () => {
    prisma.purchaseRequest.findUnique.mockResolvedValue({
      id: 'request-id',
      organizationId: 'organization-id',
      requesterId: 'user-id',
    });
    jest
      .spyOn(service, 'findOne')
      .mockResolvedValue({ id: 'request-id' } as never);

    await expect(
      service.create(
        'user-id',
        'organization-id',
        { departmentId: 'department-id' } as never,
        'stable-create-key',
      ),
    ).resolves.toEqual({ id: 'request-id' });

    expect(prisma.department.findFirst).not.toHaveBeenCalled();
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('lists only requests in the selected organization', async () => {
    prisma.purchaseRequest.findMany.mockResolvedValue([]);
    prisma.purchaseRequest.count.mockResolvedValue(0);
    prisma.$transaction.mockResolvedValue([[], 0]);

    const result = await service.findAll('user-id', 'organization-id', {
      page: 2,
      limit: 5,
      status: PurchaseRequestStatus.SUBMITTED,
    });

    expect(prisma.purchaseRequest.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          organizationId: 'organization-id',
          status: PurchaseRequestStatus.SUBMITTED,
          AND: { requesterId: 'user-id' },
        },
        skip: 5,
        take: 5,
      }),
    );
    expect(result.meta).toEqual({
      page: 2,
      limit: 5,
      total: 0,
      totalPages: 0,
      hasNext: false,
      hasPrev: true,
    });
  });

  it('rolls back approval when one reserved item has insufficient stock', async () => {
    organizations.getMembership.mockResolvedValue({ role: 'MANAGER' });
    prisma.purchaseRequest.findFirst.mockResolvedValue({
      id: 'request-id',
      requesterId: 'requester-id',
      status: PurchaseRequestStatus.SUBMITTED,
    });
    prisma.purchaseRequestItem.findMany.mockResolvedValue([
      { productId: 'product-a', quantity: 2 },
      { productId: 'product-b', quantity: 3 },
    ]);

    const tx = {
      $queryRaw: jest
        .fn()
        .mockResolvedValueOnce([{ id: 'inventory-a', qty_available: 10 }])
        .mockResolvedValueOnce([{ id: 'inventory-b', qty_available: 1 }]),
      inventoryTransaction: {
        findFirst: jest.fn().mockResolvedValue(null),
        findMany: jest.fn(),
        create: jest.fn(),
      },
      $executeRaw: jest.fn(),
      purchaseRequest: {
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      purchaseRequestStatusHistory: { create: jest.fn() },
    };
    prisma.$transaction.mockImplementation(async (callback) => callback(tx));

    await expect(
      service.approve('request-id', 'manager-id', 'organization-id', {}),
    ).rejects.toBeInstanceOf(ConflictException);

    expect(tx.$executeRaw).toHaveBeenCalledTimes(1);
    expect(tx.inventoryTransaction.create).toHaveBeenCalledTimes(1);
    expect(tx.purchaseRequest.updateMany).toHaveBeenCalledTimes(1);
    expect(tx.purchaseRequestStatusHistory.create).not.toHaveBeenCalled();
  });

  it('aggregates duplicate product lines before reserving inventory', async () => {
    organizations.getMembership.mockResolvedValue({ role: 'MANAGER' });
    prisma.purchaseRequest.findFirst.mockResolvedValue({
      id: 'request-id',
      requesterId: 'requester-id',
      status: PurchaseRequestStatus.SUBMITTED,
    });
    prisma.purchaseRequestItem.findMany.mockResolvedValue([
      { productId: 'product-id', quantity: 2 },
      { productId: 'product-id', quantity: 3 },
    ]);
    const tx = {
      purchaseRequest: {
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      inventoryTransaction: {
        findFirst: jest.fn().mockResolvedValue(null),
        create: jest.fn(),
      },
      $queryRaw: jest
        .fn()
        .mockResolvedValue([
          { id: 'inventory-id', qty_available: 10, qty_reserved: 0 },
        ]),
      $executeRaw: jest.fn(),
      purchaseRequestStatusHistory: { create: jest.fn() },
    };
    prisma.$transaction.mockImplementation(async (callback) => callback(tx));
    jest
      .spyOn(service, 'findOne')
      .mockResolvedValue({ id: 'request-id' } as never);

    await service.approve('request-id', 'manager-id', 'organization-id', {});

    expect(tx.$queryRaw).toHaveBeenCalledTimes(1);
    expect(tx.inventoryTransaction.create).toHaveBeenCalledWith({
      data: {
        inventoryId: 'inventory-id',
        type: InventoryTxType.RESERVE,
        quantity: 5,
        referenceId: 'request-id',
      },
    });
  });

  it('releases every reservation when an approved request is cancelled', async () => {
    prisma.purchaseRequest.findFirst.mockResolvedValue({
      id: 'request-id',
      requesterId: 'requester-id',
      status: PurchaseRequestStatus.APPROVED,
    });
    const tx = {
      inventoryTransaction: {
        findMany: jest.fn().mockResolvedValue([
          { inventoryId: 'inventory-a', quantity: 2 },
          { inventoryId: 'inventory-b', quantity: 3 },
        ]),
        findFirst: jest.fn().mockResolvedValue(null),
        create: jest.fn(),
      },
      $queryRaw: jest
        .fn()
        .mockResolvedValueOnce([{ id: 'inventory-a', qty_reserved: 2 }])
        .mockResolvedValueOnce([{ id: 'inventory-b', qty_reserved: 3 }]),
      $executeRaw: jest.fn(),
      purchaseRequest: {
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      purchaseRequestStatusHistory: { create: jest.fn() },
    };
    prisma.$transaction.mockImplementation(async (callback) => callback(tx));
    jest
      .spyOn(service, 'findOne')
      .mockResolvedValue({ id: 'request-id' } as never);

    await service.cancel('request-id', 'requester-id', 'organization-id');

    expect(tx.$executeRaw).toHaveBeenCalledTimes(2);
    expect(tx.inventoryTransaction.create).toHaveBeenCalledTimes(2);
    expect(tx.purchaseRequest.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          id: 'request-id',
          status: PurchaseRequestStatus.APPROVED,
        }),
        data: expect.objectContaining({
          status: PurchaseRequestStatus.CANCELLED,
        }),
      }),
    );
  });

  it('fulfills an approved request and consumes its inventory reservations', async () => {
    organizations.getMembership.mockResolvedValue({ role: 'MANAGER' });
    prisma.purchaseRequest.findFirst.mockResolvedValue({
      id: 'request-id',
      status: PurchaseRequestStatus.APPROVED,
    });
    const tx = {
      purchaseRequest: {
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      purchaseRequestItem: {
        findMany: jest
          .fn()
          .mockResolvedValue([{ productId: 'product-id', quantity: 3 }]),
      },
      inventoryTransaction: {
        findMany: jest.fn().mockResolvedValue([
          {
            inventoryId: 'inventory-id',
            quantity: 3,
            inventory: { productId: 'product-id' },
          },
        ]),
        create: jest.fn(),
      },
      $queryRaw: jest
        .fn()
        .mockResolvedValue([{ id: 'inventory-id', qty_reserved: 3 }]),
      $executeRaw: jest.fn(),
      purchaseRequestStatusHistory: { create: jest.fn() },
    };
    prisma.$transaction.mockImplementation(async (callback) => callback(tx));
    jest.spyOn(service, 'findOne').mockResolvedValue({
      id: 'request-id',
      status: PurchaseRequestStatus.FULFILLED,
    } as never);

    await expect(
      service.fulfill('request-id', 'manager-id', 'organization-id'),
    ).resolves.toEqual({
      id: 'request-id',
      status: PurchaseRequestStatus.FULFILLED,
    });

    expect(tx.purchaseRequest.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          id: 'request-id',
          organizationId: 'organization-id',
          status: PurchaseRequestStatus.APPROVED,
        },
        data: expect.objectContaining({
          status: PurchaseRequestStatus.FULFILLED,
        }),
      }),
    );
    expect(tx.$executeRaw).toHaveBeenCalledTimes(1);
    expect(tx.inventoryTransaction.create).toHaveBeenCalledWith({
      data: {
        inventoryId: 'inventory-id',
        type: InventoryTxType.FULFILL,
        quantity: 3,
        referenceId: 'request-id',
      },
    });
    expect(tx.purchaseRequestStatusHistory.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        fromStatus: PurchaseRequestStatus.APPROVED,
        toStatus: PurchaseRequestStatus.FULFILLED,
        changedById: 'manager-id',
      }),
    });
  });

  it('rejects fulfillment when the inventory reservation does not cover the request', async () => {
    organizations.getMembership.mockResolvedValue({ role: 'MANAGER' });
    prisma.purchaseRequest.findFirst.mockResolvedValue({
      id: 'request-id',
      status: PurchaseRequestStatus.APPROVED,
    });
    const tx = {
      purchaseRequest: {
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      purchaseRequestItem: {
        findMany: jest
          .fn()
          .mockResolvedValue([{ productId: 'product-id', quantity: 3 }]),
      },
      inventoryTransaction: {
        findMany: jest.fn().mockResolvedValue([]),
        create: jest.fn(),
      },
      $queryRaw: jest.fn(),
      $executeRaw: jest.fn(),
      purchaseRequestStatusHistory: { create: jest.fn() },
    };
    prisma.$transaction.mockImplementation(async (callback) => callback(tx));

    await expect(
      service.fulfill('request-id', 'manager-id', 'organization-id'),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(tx.$executeRaw).not.toHaveBeenCalled();
    expect(tx.purchaseRequestStatusHistory.create).not.toHaveBeenCalled();
  });
});
