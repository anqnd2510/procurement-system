import { AuditLogsService } from './audit-logs.service';

describe('AuditLogsService', () => {
  const prisma = {
    auditLog: { findMany: jest.fn(), count: jest.fn(), groupBy: jest.fn() },
    inventory: { findMany: jest.fn() },
    $transaction: jest.fn(),
  };
  const organizations = { getMembership: jest.fn() };
  const service = new AuditLogsService(prisma as never, organizations as never);

  beforeEach(() => {
    jest.clearAllMocks();
    organizations.getMembership.mockResolvedValue({ role: 'MANAGER' });
  });

  it('writes an audit event through the caller transaction', async () => {
    const tx = { auditLog: { create: jest.fn() } };
    await service.record(tx as never, {
      organizationId: 'organization-id',
      actorUserId: 'user-id',
      action: 'PURCHASE_REQUEST_CREATED',
      resourceType: 'PURCHASE_REQUEST',
      resourceId: 'request-id',
      metadata: { status: 'DRAFT' },
    });

    expect(tx.auditLog.create).toHaveBeenCalledWith({
      data: {
        organizationId: 'organization-id',
        actorUserId: 'user-id',
        action: 'PURCHASE_REQUEST_CREATED',
        resourceType: 'PURCHASE_REQUEST',
        resourceId: 'request-id',
        metadata: { status: 'DRAFT' },
      },
    });
  });

  it('lists audit events with organization scope and filters', async () => {
    const rows = [{ id: 'audit-id' }];
    prisma.$transaction.mockResolvedValue([rows, 1]);
    prisma.inventory.findMany.mockResolvedValue([]);

    const result = await service.findAll('user-id', 'organization-id', {
      page: 1,
      limit: 10,
      action: 'PURCHASE_REQUEST_CREATED',
      resourceType: 'PURCHASE_REQUEST',
    });

    expect(prisma.auditLog.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          organizationId: 'organization-id',
          action: 'PURCHASE_REQUEST_CREATED',
          resourceType: 'PURCHASE_REQUEST',
        },
        skip: 0,
        take: 10,
      }),
    );
    expect(result.items).toEqual([{ id: 'audit-id', resourceName: null }]);
    expect(result.meta.total).toBe(1);
  });

  it('resolves inventory event IDs to product names within the organization', async () => {
    prisma.$transaction.mockResolvedValue([
      [
        {
          id: 'audit-id',
          resourceType: 'INVENTORY',
          resourceId: 'inventory-id',
        },
      ],
      1,
    ]);
    prisma.inventory.findMany.mockResolvedValue([
      { id: 'inventory-id', product: { name: 'Office monitor' } },
    ]);

    const result = await service.findAll('user-id', 'organization-id', {
      page: 1,
      limit: 10,
    });

    expect(prisma.inventory.findMany).toHaveBeenCalledWith({
      where: {
        id: { in: ['inventory-id'] },
        organizationId: 'organization-id',
      },
      select: { id: true, product: { select: { name: true } } },
    });
    expect(result.items[0]).toMatchObject({ resourceName: 'Office monitor' });
  });

  it('returns only filter choices from the selected organization', async () => {
    prisma.auditLog.groupBy
      .mockResolvedValueOnce([{ action: 'PURCHASE_ORDER_CREATED' }])
      .mockResolvedValueOnce([{ resourceType: 'PURCHASE_ORDER' }]);
    const result = await service.findFilterOptions(
      'user-id',
      'organization-id',
    );
    expect(organizations.getMembership).toHaveBeenCalledWith(
      'user-id',
      'organization-id',
    );
    expect(prisma.auditLog.groupBy).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        where: { organizationId: 'organization-id' },
        by: ['action'],
      }),
    );
    expect(prisma.auditLog.groupBy).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        where: { organizationId: 'organization-id' },
        by: ['resourceType'],
      }),
    );
    expect(result).toEqual({
      actions: ['PURCHASE_ORDER_CREATED'],
      resourceTypes: ['PURCHASE_ORDER'],
    });
  });
});
