import { Injectable } from '@nestjs/common';
import { PurchaseOrderStatus, PurchaseRequestStatus } from '@prisma/client';
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
    await this.organizations.getMembership(userId, organizationId);

    const [
      requestGroups,
      purchaseOrderGroups,
      activeProducts,
      activeCategories,
      inventoryAggregate,
    ] = await Promise.all([
      this.prisma.purchaseRequest.groupBy({
        by: ['status'],
        where: { organizationId },
        _count: { _all: true },
      }),
      this.prisma.purchaseOrder.groupBy({
        by: ['status'],
        where: { organizationId },
        _count: { _all: true },
      }),
      this.prisma.product.count({
        where: { organizationId, deletedAt: null },
      }),
      this.prisma.category.count({
        where: { organizationId, deletedAt: null },
      }),
      this.prisma.inventory.aggregate({
        where: { organizationId },
        _count: { _all: true },
        _sum: { qtyAvailable: true, qtyReserved: true },
      }),
    ]);

    const purchaseRequestsByStatus = Object.fromEntries(
      Object.values(PurchaseRequestStatus).map((status) => [status, 0]),
    ) as Record<PurchaseRequestStatus, number>;
    for (const group of requestGroups) {
      purchaseRequestsByStatus[group.status] = group._count._all;
    }

    const purchaseOrdersByStatus = Object.fromEntries(
      Object.values(PurchaseOrderStatus).map((status) => [status, 0]),
    ) as Record<PurchaseOrderStatus, number>;
    for (const group of purchaseOrderGroups) {
      purchaseOrdersByStatus[group.status] = group._count._all;
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
