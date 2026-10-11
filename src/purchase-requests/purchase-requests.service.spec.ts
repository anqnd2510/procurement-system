/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-return, @typescript-eslint/require-await */
import { ConflictException, NotFoundException } from '@nestjs/common';
import { PurchaseRequestStatus } from '@prisma/client';
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
  const service = new PurchaseRequestsService(
    prisma as never,
    organizations as never,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    organizations.getMembership.mockResolvedValue({ role: 'MEMBER' });
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
        {} as never,
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
        create: jest.fn(),
      },
      $executeRaw: jest.fn(),
      purchaseRequest: { update: jest.fn() },
      purchaseRequestStatusHistory: { create: jest.fn() },
    };
    prisma.$transaction.mockImplementation(async (callback) => callback(tx));

    await expect(
      service.approve('request-id', 'manager-id', 'organization-id', {}),
    ).rejects.toBeInstanceOf(ConflictException);

    expect(tx.$executeRaw).toHaveBeenCalledTimes(1);
    expect(tx.inventoryTransaction.create).toHaveBeenCalledTimes(1);
    expect(tx.purchaseRequest.update).not.toHaveBeenCalled();
    expect(tx.purchaseRequestStatusHistory.create).not.toHaveBeenCalled();
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
      purchaseRequest: { update: jest.fn() },
      purchaseRequestStatusHistory: { create: jest.fn() },
    };
    prisma.$transaction.mockImplementation(async (callback) => callback(tx));
    jest
      .spyOn(service, 'findOne')
      .mockResolvedValue({ id: 'request-id' } as never);

    await service.cancel('request-id', 'requester-id', 'organization-id');

    expect(tx.$executeRaw).toHaveBeenCalledTimes(2);
    expect(tx.inventoryTransaction.create).toHaveBeenCalledTimes(2);
    expect(tx.purchaseRequest.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'request-id' },
        data: expect.objectContaining({
          status: PurchaseRequestStatus.CANCELLED,
        }),
      }),
    );
  });
});
