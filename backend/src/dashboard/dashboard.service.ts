import { ForbiddenException, Injectable } from '@nestjs/common';
import {
  Prisma,
  PurchaseOrderStatus,
  PurchaseRequestStatus,
} from '@prisma/client';
import { OrganizationsService } from '../organizations/organizations.service';
import { PrismaService } from '../prisma/prisma.service';
import { DashboardSummaryDto } from './dto/dashboard-summary.dto';

@Injectable()
export class DashboardService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly organizations: OrganizationsService,
  ) {}

  async getSummary(
    userId: string,
    organizationId: string,
  ): Promise<DashboardSummaryDto> {
    const membership = await this.organizations.getMembership(
      userId,
      organizationId,
    );
    if (membership.role !== 'OWNER' && membership.role !== 'MANAGER') {
      throw new ForbiddenException(
        'Organization manager permission is required',
      );
    }

    const requestGroupsQuery = this.prisma.purchaseRequest.groupBy({
      by: ['status'],
      where: { organizationId },
      _count: { _all: true },
    });
    const orderGroupsQuery = this.prisma.purchaseOrder.groupBy({
      by: ['status'],
      where: { organizationId },
      _count: { _all: true },
      _sum: { totalAmount: true },
    });
    const [
      requestGroups,
      purchaseOrderGroups,
      activeProducts,
      activeCategories,
      inventoryAggregate,
      outOfStockProducts,
    ] = await this.prisma.$transaction(
      [
        requestGroupsQuery,
        orderGroupsQuery,
        this.prisma.product.count({
          where: { organizationId, deletedAt: null },
        }),
        this.prisma.category.count({
          where: { organizationId, deletedAt: null },
        }),
        this.prisma.inventory.aggregate({
          where: {
            organizationId,
            product: { deletedAt: null, organizationId },
          },
          _count: { _all: true },
          _sum: { qtyAvailable: true, qtyReserved: true },
        }),
        this.prisma.product.count({
          where: {
            organizationId,
            deletedAt: null,
            OR: [{ inventory: null }, { inventory: { qtyAvailable: 0 } }],
          },
        }),
      ],
      { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead },
    );

    const purchaseRequestsByStatus = Object.fromEntries(
      Object.values(PurchaseRequestStatus).map((status) => [status, 0]),
    ) as Record<PurchaseRequestStatus, number>;
    for (const group of requestGroups) {
      purchaseRequestsByStatus[group.status] = group._count._all;
    }

    const purchaseOrdersByStatus = Object.fromEntries(
      Object.values(PurchaseOrderStatus).map((status) => [status, 0]),
    ) as Record<PurchaseOrderStatus, number>;
    const purchaseOrderAmountsByStatus = Object.fromEntries(
      Object.values(PurchaseOrderStatus).map((status) => [status, '0.00']),
    ) as Record<PurchaseOrderStatus, string>;
    for (const group of purchaseOrderGroups) {
      purchaseOrdersByStatus[group.status] = group._count._all;
      purchaseOrderAmountsByStatus[group.status] =
        group._sum.totalAmount?.toFixed(2) ?? '0.00';
    }

    const inventoryAvailable = inventoryAggregate._sum.qtyAvailable ?? 0;
    const inventoryReserved = inventoryAggregate._sum.qtyReserved ?? 0;

    return {
      organizationId,
      generatedAt: new Date().toISOString(),
      purchaseRequestsTotal: Object.values(purchaseRequestsByStatus).reduce(
        (total, count) => total + count,
        0,
      ),
      purchaseRequestsByStatus,
      awaitingReviewCount: purchaseRequestsByStatus.SUBMITTED,
      purchaseOrdersTotal: Object.values(purchaseOrdersByStatus).reduce(
        (total, count) => total + count,
        0,
      ),
      purchaseOrdersByStatus,
      purchaseOrderAmountsByStatus,
      outOfStockProducts,
      openPurchaseOrdersCount:
        purchaseOrdersByStatus.DRAFT + purchaseOrdersByStatus.ISSUED,
      activeProducts,
      activeCategories,
      inventoryTrackedProducts: inventoryAggregate._count._all,
      inventoryAvailable,
      inventoryReserved,
      inventoryTotal: inventoryAvailable + inventoryReserved,
    };
  }
}
