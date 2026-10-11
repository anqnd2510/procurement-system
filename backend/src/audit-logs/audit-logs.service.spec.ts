import { AuditLogsService } from './audit-logs.service';

describe('AuditLogsService', () => {
  const prisma = {
    auditLog: { findMany: jest.fn(), count: jest.fn() },
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
    expect(result.items).toBe(rows);
    expect(result.meta.total).toBe(1);
  });
});
