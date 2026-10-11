import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import {
  OrganizationRole,
  InventoryTxType,
  Prisma,
  PurchaseOrderStatus,
  PurchaseRequestStatus,
} from '@prisma/client';
import { OrganizationsService } from '../organizations/organizations.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePurchaseOrderDto } from './dto/create-purchase-order.dto';
import { AuditLogsService } from '../audit-logs/audit-logs.service';

@Injectable()
export class PurchaseOrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly organizations: OrganizationsService,
    private readonly auditLogs: AuditLogsService,
  ) {}

  async createFromRequest(
    purchaseRequestId: string,
    userId: string,
    organizationId: string,
    dto: CreatePurchaseOrderDto,
  ) {
    const membership = await this.organizations.getMembership(
      userId,
      organizationId,
    );
    if (
      membership.role !== OrganizationRole.OWNER &&
      membership.role !== OrganizationRole.MANAGER
    ) {
      throw new ForbiddenException(
        'Organization manager permission is required',
      );
    }

    const request = await this.prisma.purchaseRequest.findFirst({
      where: {
        id: purchaseRequestId,
        organizationId,
        status: PurchaseRequestStatus.APPROVED,
      },
      include: { items: true },
    });
    if (!request) {
      throw new NotFoundException(
        `Approved purchase request ${purchaseRequestId} not found`,
      );
    }

    const existing = await this.prisma.purchaseOrder.findUnique({
      where: { purchaseRequestId },
      select: { id: true },
    });
    if (existing) {
      throw new ConflictException(
        `Purchase order already exists for request ${purchaseRequestId}`,
      );
    }

    const totalAmount = request.items.reduce(
      (total, item) => total + Number(item.estimatedTotal),
      0,
    );
    const orderNumber = `PO-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${randomUUID()
      .slice(0, 8)
      .toUpperCase()}`;

    return this.prisma.$transaction(async (tx) => {
      const order = await tx.purchaseOrder.create({
        data: {
          organizationId,
          purchaseRequestId,
          createdById: userId,
          orderNumber,
          supplierName: dto.supplierName,
          totalAmount: new Prisma.Decimal(totalAmount.toFixed(2)),
          items: {
            create: request.items.map((item) => ({
              productId: item.productId,
              description: item.description,
              quantity: item.quantity,
              unitPrice: item.estimatedUnitPrice,
              lineTotal: item.estimatedTotal,
            })),
          },
        },
        include: { items: true },
      });
      await this.auditLogs.record(tx, {
        organizationId,
        actorUserId: userId,
        action: 'PURCHASE_ORDER_CREATED',
        resourceType: 'PURCHASE_ORDER',
        resourceId: order.id,
        metadata: {
          purchaseRequestId,
          orderNumber,
          supplierName: dto.supplierName,
          totalAmount: totalAmount.toFixed(2),
        },
      });
      return order;
    });
  }

  async findOne(id: string, userId: string, organizationId: string) {
    await this.organizations.getMembership(userId, organizationId);
    const order = await this.prisma.purchaseOrder.findFirst({
      where: { id, organizationId },
      include: {
        purchaseRequest: { select: { id: true, title: true, status: true } },
        createdBy: { select: { id: true, email: true } },
        items: {
          include: { product: { select: { id: true, name: true, sku: true } } },
        },
      },
    });
    if (!order) {
      throw new NotFoundException(`Purchase order ${id} not found`);
    }
    return order;
  }

  async issue(id: string, userId: string, organizationId: string) {
    await this.requireManager(userId, organizationId);

    const order = await this.prisma.purchaseOrder.findFirst({
      where: { id, organizationId },
      select: { id: true, status: true },
    });
    if (!order) {
      throw new NotFoundException(`Purchase order ${id} not found`);
    }
    if (order.status !== PurchaseOrderStatus.DRAFT) {
      throw new ConflictException(
        `Cannot issue a ${order.status.toLowerCase()} purchase order`,
      );
    }

    await this.prisma.$transaction(async (tx) => {
      const result = await tx.purchaseOrder.updateMany({
        where: { id, organizationId, status: PurchaseOrderStatus.DRAFT },
        data: { status: PurchaseOrderStatus.ISSUED, issuedAt: new Date() },
      });
      if (result.count !== 1) {
        throw new ConflictException(
          'Purchase order status changed; reload and retry',
        );
      }
      await this.auditLogs.record(tx, {
        organizationId,
        actorUserId: userId,
        action: 'PURCHASE_ORDER_ISSUED',
        resourceType: 'PURCHASE_ORDER',
        resourceId: id,
        metadata: {
          fromStatus: PurchaseOrderStatus.DRAFT,
          toStatus: PurchaseOrderStatus.ISSUED,
        },
      });
    });

    return this.findOne(id, userId, organizationId);
  }

  async receive(id: string, userId: string, organizationId: string) {
    await this.requireManager(userId, organizationId);

    await this.prisma.$transaction(async (tx) => {
      const order = await tx.purchaseOrder.findFirst({
        where: { id, organizationId },
        include: {
          items: {
            include: {
              product: { select: { organizationId: true } },
            },
          },
        },
      });
      if (!order) {
        throw new NotFoundException(`Purchase order ${id} not found`);
      }
      if (order.status !== PurchaseOrderStatus.ISSUED) {
        throw new ConflictException(
          `Cannot receive a ${order.status.toLowerCase()} purchase order`,
        );
      }

      const result = await tx.purchaseOrder.updateMany({
        where: { id, organizationId, status: PurchaseOrderStatus.ISSUED },
        data: { status: PurchaseOrderStatus.RECEIVED, receivedAt: new Date() },
      });
      if (result.count !== 1) {
        throw new ConflictException(
          'Purchase order status changed; reload and retry',
        );
      }

      for (const item of order.items) {
        if (!item.productId) continue;
        if (item.product?.organizationId !== organizationId) {
          throw new ConflictException(
            `Product ${item.productId} is outside the purchase order organization`,
          );
        }

        const inventory = await tx.inventory.upsert({
          where: { productId: item.productId },
          create: {
            productId: item.productId,
            organizationId,
            qtyAvailable: item.quantity,
            qtyReserved: 0,
          },
          update: { qtyAvailable: { increment: item.quantity } },
        });
        if (inventory.organizationId !== organizationId) {
          throw new ConflictException(
            `Inventory for product ${item.productId} is outside the purchase order organization`,
          );
        }

        await tx.inventoryTransaction.create({
          data: {
            inventoryId: inventory.id,
            type: InventoryTxType.STOCK_IN,
            quantity: item.quantity,
            referenceId: id,
          },
        });
      }
      await this.auditLogs.record(tx, {
        organizationId,
        actorUserId: userId,
        action: 'PURCHASE_ORDER_RECEIVED',
        resourceType: 'PURCHASE_ORDER',
        resourceId: id,
        metadata: {
          fromStatus: PurchaseOrderStatus.ISSUED,
          toStatus: PurchaseOrderStatus.RECEIVED,
          inventoryItemCount: order.items.filter((item) => item.productId)
            .length,
        },
      });
    });

    return this.findOne(id, userId, organizationId);
  }

  async cancel(id: string, userId: string, organizationId: string) {
    await this.requireManager(userId, organizationId);

    const order = await this.prisma.purchaseOrder.findFirst({
      where: { id, organizationId },
      select: { id: true, status: true },
    });
    if (!order) {
      throw new NotFoundException(`Purchase order ${id} not found`);
    }
    if (order.status === PurchaseOrderStatus.CANCELLED) {
      return this.findOne(id, userId, organizationId);
    }
    if (
      order.status !== PurchaseOrderStatus.DRAFT &&
      order.status !== PurchaseOrderStatus.ISSUED
    ) {
      throw new ConflictException(
        `Cannot cancel a ${order.status.toLowerCase()} purchase order`,
      );
    }

    await this.prisma.$transaction(async (tx) => {
      const result = await tx.purchaseOrder.updateMany({
        where: {
          id,
          organizationId,
          status: {
            in: [PurchaseOrderStatus.DRAFT, PurchaseOrderStatus.ISSUED],
          },
        },
        data: {
          status: PurchaseOrderStatus.CANCELLED,
          cancelledAt: new Date(),
        },
      });
      if (result.count !== 1) {
        throw new ConflictException(
          'Purchase order status changed; reload and retry',
        );
      }
      await this.auditLogs.record(tx, {
        organizationId,
        actorUserId: userId,
        action: 'PURCHASE_ORDER_CANCELLED',
        resourceType: 'PURCHASE_ORDER',
        resourceId: id,
        metadata: {
          fromStatus: order.status,
          toStatus: PurchaseOrderStatus.CANCELLED,
        },
      });
    });

    return this.findOne(id, userId, organizationId);
  }

  private async requireManager(userId: string, organizationId: string) {
    const membership = await this.organizations.getMembership(
      userId,
      organizationId,
    );
    if (
      membership.role !== OrganizationRole.OWNER &&
      membership.role !== OrganizationRole.MANAGER
    ) {
      throw new ForbiddenException(
        'Organization manager permission is required',
      );
    }
  }
}
