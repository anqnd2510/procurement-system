/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-return, @typescript-eslint/require-await */
import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import {
  InventoryTxType,
  PurchaseOrderStatus,
  PurchaseRequestStatus,
} from '@prisma/client';
import { PurchaseOrdersService } from './purchase-orders.service';

describe('PurchaseOrdersService', () => {
  const prisma = {
    purchaseRequest: { findFirst: jest.fn() },
    purchaseOrder: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      updateMany: jest.fn(),
    },
    $transaction: jest.fn(),
  };
  const organizations = { getMembership: jest.fn() };
  const auditLogs = { record: jest.fn().mockResolvedValue(undefined) };
  const service = new PurchaseOrdersService(
    prisma as never,
    organizations as never,
    auditLogs as never,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    prisma.$transaction.mockReset();
  });

  it('requires an organization manager', async () => {
    organizations.getMembership.mockResolvedValue({ role: 'MEMBER' });

    await expect(
      service.createFromRequest('request-id', 'user-id', 'organization-id', {
        supplierName: 'Supplier',
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('requires an approved purchase request', async () => {
    organizations.getMembership.mockResolvedValue({ role: 'MANAGER' });
    prisma.purchaseRequest.findFirst.mockResolvedValue(null);

    await expect(
      service.createFromRequest('request-id', 'user-id', 'organization-id', {
        supplierName: 'Supplier',
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('creates a purchase order with item and total snapshots', async () => {
    organizations.getMembership.mockResolvedValue({ role: 'MANAGER' });
    prisma.purchaseRequest.findFirst.mockResolvedValue({
      id: 'request-id',
      status: PurchaseRequestStatus.APPROVED,
      items: [
        {
          productId: 'product-id',
          description: 'Laptop',
          quantity: 2,
          estimatedUnitPrice: 100,
          estimatedTotal: 200,
        },
      ],
    });
    prisma.purchaseOrder.findUnique.mockResolvedValue(null);
    const tx = {
      purchaseOrder: {
        create: jest.fn().mockResolvedValue({ id: 'order-id', items: [] }),
      },
    };
    prisma.$transaction.mockImplementation(async (callback) => callback(tx));

    await service.createFromRequest(
      'request-id',
      'user-id',
      'organization-id',
      {
        supplierName: 'Supplier',
      },
    );

    expect(tx.purchaseOrder.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          purchaseRequestId: 'request-id',
          supplierName: 'Supplier',
          items: expect.objectContaining({
            create: [
              expect.objectContaining({
                description: 'Laptop',
                quantity: 2,
                unitPrice: 100,
                lineTotal: 200,
              }),
            ],
          }),
        }),
      }),
    );
    expect(auditLogs.record).toHaveBeenCalledWith(
      tx,
      expect.objectContaining({
        action: 'PURCHASE_ORDER_CREATED',
        resourceType: 'PURCHASE_ORDER',
        resourceId: 'order-id',
        metadata: expect.objectContaining({
          purchaseRequestId: 'request-id',
        }),
      }),
    );
  });

  it('issues a draft order with a conditional status update', async () => {
    organizations.getMembership.mockResolvedValue({ role: 'MANAGER' });
    prisma.purchaseOrder.findFirst.mockResolvedValue({
      id: 'order-id',
      status: PurchaseOrderStatus.DRAFT,
    });
    const tx = {
      purchaseOrder: { updateMany: jest.fn().mockResolvedValue({ count: 1 }) },
    };
    prisma.$transaction.mockImplementation(async (callback) => callback(tx));
    jest.spyOn(service, 'findOne').mockResolvedValue({
      id: 'order-id',
      status: PurchaseOrderStatus.ISSUED,
    } as never);

    await expect(
      service.issue('order-id', 'user-id', 'organization-id'),
    ).resolves.toEqual({ id: 'order-id', status: PurchaseOrderStatus.ISSUED });

    expect(tx.purchaseOrder.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          id: 'order-id',
          organizationId: 'organization-id',
          status: PurchaseOrderStatus.DRAFT,
        },
        data: expect.objectContaining({ status: PurchaseOrderStatus.ISSUED }),
      }),
    );
  });

  it('rejects issuing an order that is not a draft', async () => {
    organizations.getMembership.mockResolvedValue({ role: 'MANAGER' });
    prisma.purchaseOrder.findFirst.mockResolvedValue({
      id: 'order-id',
      status: PurchaseOrderStatus.ISSUED,
    });

    await expect(
      service.issue('order-id', 'user-id', 'organization-id'),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(prisma.purchaseOrder.updateMany).not.toHaveBeenCalled();
  });

  it('detects a concurrent status change while issuing', async () => {
    organizations.getMembership.mockResolvedValue({ role: 'MANAGER' });
    prisma.purchaseOrder.findFirst.mockResolvedValue({
      id: 'order-id',
      status: PurchaseOrderStatus.DRAFT,
    });
    const tx = {
      purchaseOrder: { updateMany: jest.fn().mockResolvedValue({ count: 0 }) },
    };
    prisma.$transaction.mockImplementation(async (callback) => callback(tx));

    await expect(
      service.issue('order-id', 'user-id', 'organization-id'),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('receives an issued order and stocks linked products in one transaction', async () => {
    organizations.getMembership.mockResolvedValue({ role: 'MANAGER' });
    const tx = {
      purchaseOrder: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'order-id',
          status: PurchaseOrderStatus.ISSUED,
          items: [
            {
              productId: 'product-id',
              quantity: 4,
              product: { organizationId: 'organization-id' },
            },
            { productId: null, quantity: 1, product: null },
          ],
        }),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      inventory: {
        upsert: jest.fn().mockResolvedValue({
          id: 'inventory-id',
          organizationId: 'organization-id',
        }),
      },
      inventoryTransaction: { create: jest.fn() },
    };
    prisma.$transaction.mockImplementation(async (callback) => callback(tx));
    jest.spyOn(service, 'findOne').mockResolvedValue({
      id: 'order-id',
      status: PurchaseOrderStatus.RECEIVED,
    } as never);

    await expect(
      service.receive('order-id', 'user-id', 'organization-id'),
    ).resolves.toEqual({
      id: 'order-id',
      status: PurchaseOrderStatus.RECEIVED,
    });

    expect(tx.purchaseOrder.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          id: 'order-id',
          organizationId: 'organization-id',
          status: PurchaseOrderStatus.ISSUED,
        },
        data: expect.objectContaining({ status: PurchaseOrderStatus.RECEIVED }),
      }),
    );
    expect(tx.inventory.upsert).toHaveBeenCalledTimes(1);
    expect(tx.inventory.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { productId: 'product-id' },
        create: expect.objectContaining({
          organizationId: 'organization-id',
          qtyAvailable: 4,
        }),
        update: { qtyAvailable: { increment: 4 } },
      }),
    );
    expect(tx.inventoryTransaction.create).toHaveBeenCalledWith({
      data: {
        inventoryId: 'inventory-id',
        type: InventoryTxType.STOCK_IN,
        quantity: 4,
        referenceId: 'order-id',
      },
    });
  });

  it('does not receive an order unless it has been issued', async () => {
    organizations.getMembership.mockResolvedValue({ role: 'MANAGER' });
    const tx = {
      purchaseOrder: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'order-id',
          status: PurchaseOrderStatus.DRAFT,
          items: [],
        }),
        updateMany: jest.fn(),
      },
      inventory: { upsert: jest.fn() },
      inventoryTransaction: { create: jest.fn() },
    };
    prisma.$transaction.mockImplementation(async (callback) => callback(tx));

    await expect(
      service.receive('order-id', 'user-id', 'organization-id'),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(tx.purchaseOrder.updateMany).not.toHaveBeenCalled();
    expect(tx.inventory.upsert).not.toHaveBeenCalled();
  });

  it('cancels an issued order with a conditional status update', async () => {
    organizations.getMembership.mockResolvedValue({ role: 'MANAGER' });
    prisma.purchaseOrder.findFirst.mockResolvedValue({
      id: 'order-id',
      status: PurchaseOrderStatus.ISSUED,
    });
    const tx = {
      purchaseOrder: { updateMany: jest.fn().mockResolvedValue({ count: 1 }) },
    };
    prisma.$transaction.mockImplementation(async (callback) => callback(tx));
    jest.spyOn(service, 'findOne').mockResolvedValue({
      id: 'order-id',
      status: PurchaseOrderStatus.CANCELLED,
    } as never);

    await expect(
      service.cancel('order-id', 'user-id', 'organization-id'),
    ).resolves.toEqual({
      id: 'order-id',
      status: PurchaseOrderStatus.CANCELLED,
    });

    expect(tx.purchaseOrder.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          id: 'order-id',
          organizationId: 'organization-id',
          status: {
            in: [PurchaseOrderStatus.DRAFT, PurchaseOrderStatus.ISSUED],
          },
        },
        data: expect.objectContaining({
          status: PurchaseOrderStatus.CANCELLED,
        }),
      }),
    );
  });

  it('does not cancel a received order', async () => {
    organizations.getMembership.mockResolvedValue({ role: 'MANAGER' });
    prisma.purchaseOrder.findFirst.mockResolvedValue({
      id: 'order-id',
      status: PurchaseOrderStatus.RECEIVED,
    });

    await expect(
      service.cancel('order-id', 'user-id', 'organization-id'),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(prisma.purchaseOrder.updateMany).not.toHaveBeenCalled();
  });

  it('returns the cancelled order on a cancellation retry', async () => {
    organizations.getMembership.mockResolvedValue({ role: 'MANAGER' });
    prisma.purchaseOrder.findFirst.mockResolvedValue({
      id: 'order-id',
      status: PurchaseOrderStatus.CANCELLED,
    });
    jest.spyOn(service, 'findOne').mockResolvedValue({
      id: 'order-id',
      status: PurchaseOrderStatus.CANCELLED,
    } as never);

    await expect(
      service.cancel('order-id', 'user-id', 'organization-id'),
    ).resolves.toEqual({
      id: 'order-id',
      status: PurchaseOrderStatus.CANCELLED,
    });
    expect(prisma.purchaseOrder.updateMany).not.toHaveBeenCalled();
  });
});
