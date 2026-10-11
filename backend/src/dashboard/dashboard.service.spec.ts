/* eslint-disable @typescript-eslint/unbound-method -- Assertions inspect Jest mock methods, not unbound service methods. */
import { ForbiddenException } from '@nestjs/common';
import { PurchaseOrderStatus, PurchaseRequestStatus } from '@prisma/client';
import { OrganizationsService } from '../organizations/organizations.service';
import { PrismaService } from '../prisma/prisma.service';
import { DashboardService } from './dashboard.service';

describe('DashboardService', () => {
  it('returns organization-scoped aggregates with zero-filled statuses', async () => {
    const prisma = {
      purchaseRequest: {
        groupBy: jest.fn().mockResolvedValue([
          { status: PurchaseRequestStatus.SUBMITTED, _count: { _all: 2 } },
          { status: PurchaseRequestStatus.FULFILLED, _count: { _all: 3 } },
        ]),
      },
      purchaseOrder: {
        groupBy: jest
          .fn()
          .mockResolvedValue([
            { status: PurchaseOrderStatus.ISSUED, _count: { _all: 4 } },
          ]),
      },
      product: { count: jest.fn().mockResolvedValue(8) },
      category: { count: jest.fn().mockResolvedValue(3) },
      inventory: {
        aggregate: jest.fn().mockResolvedValue({
          _count: { _all: 6 },
          _sum: { qtyAvailable: 20, qtyReserved: 5 },
        }),
      },
    } as unknown as PrismaService;
    const organizations = {
      getMembership: jest.fn().mockResolvedValue({ role: 'MEMBER' }),
    } as unknown as OrganizationsService;
    const service = new DashboardService(prisma, organizations);

    const result = await service.getSummary('user-1', 'organization-1');

    expect(organizations.getMembership).toHaveBeenCalledWith(
      'user-1',
      'organization-1',
    );
    expect(prisma.purchaseRequest.groupBy).toHaveBeenCalledWith({
      by: ['status'],
      where: { organizationId: 'organization-1' },
      _count: { _all: true },
    });
    expect(prisma.product.count).toHaveBeenCalledWith({
      where: { organizationId: 'organization-1', deletedAt: null },
    });
    expect(result).toMatchObject({
      organizationId: 'organization-1',
      purchaseRequestsTotal: 5,
      purchaseRequestsByStatus: {
        DRAFT: 0,
        SUBMITTED: 2,
        FULFILLED: 3,
      },
      awaitingReviewCount: 2,
      purchaseOrdersTotal: 4,
      openPurchaseOrdersCount: 4,
      activeProducts: 8,
      activeCategories: 3,
      inventoryTrackedProducts: 6,
      inventoryAvailable: 20,
      inventoryReserved: 5,
      inventoryTotal: 25,
    });
  });

  it('does not query dashboard data for a non-member', async () => {
    const prisma = {
      purchaseRequest: { groupBy: jest.fn() },
      purchaseOrder: { groupBy: jest.fn() },
      product: { count: jest.fn() },
      category: { count: jest.fn() },
      inventory: { aggregate: jest.fn() },
    } as unknown as PrismaService;
    const organizations = {
      getMembership: jest
        .fn()
        .mockRejectedValue(new ForbiddenException('Not a member')),
    } as unknown as OrganizationsService;
    const service = new DashboardService(prisma, organizations);

    await expect(
      service.getSummary('user-1', 'organization-foreign'),
    ).rejects.toThrow(ForbiddenException);
    expect(prisma.purchaseRequest.groupBy).not.toHaveBeenCalled();
  });
});
