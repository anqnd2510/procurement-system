import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { OrganizationsService } from '../organizations/organizations.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  getPaginationParams,
  paginate,
  PaginatedResponse,
} from '../common/paginations/paginated-response';
import { AuditLogQueryDto } from './dto/audit-log-query.dto';

export type AuditLogEvent = {
  organizationId: string;
  actorUserId?: string | null;
  action: string;
  resourceType: string;
  resourceId: string;
  metadata?: Prisma.InputJsonValue;
};

type AuditLogRecord = Prisma.AuditLogGetPayload<{
  include: { actor: { select: { id: true; email: true } } };
}>;

@Injectable()
export class AuditLogsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly organizations: OrganizationsService,
  ) {}

  async record(tx: Prisma.TransactionClient, event: AuditLogEvent) {
    await tx.auditLog.create({
      data: {
        organizationId: event.organizationId,
        actorUserId: event.actorUserId,
        action: event.action,
        resourceType: event.resourceType,
        resourceId: event.resourceId,
        ...(event.metadata ? { metadata: event.metadata } : {}),
      },
    });
  }

  async findFilterOptions(userId: string, organizationId: string) {
    await this.organizations.getMembership(userId, organizationId);
    const where = { organizationId };
    const [actions, resourceTypes] = await Promise.all([
      this.prisma.auditLog.groupBy({
        where,
        by: ['action'],
        orderBy: { action: 'asc' },
      }),
      this.prisma.auditLog.groupBy({
        where,
        by: ['resourceType'],
        orderBy: { resourceType: 'asc' },
      }),
    ]);
    return {
      actions: actions.map(({ action }) => action),
      resourceTypes: resourceTypes.map(({ resourceType }) => resourceType),
    };
  }

  async findAll(
    userId: string,
    organizationId: string,
    query: AuditLogQueryDto,
  ): Promise<
    PaginatedResponse<AuditLogRecord & { resourceName: string | null }>
  > {
    await this.organizations.getMembership(userId, organizationId);
    const { page = 1, limit = 10 } = query;
    const { skip, take } = getPaginationParams(page, limit);
    const where: Prisma.AuditLogWhereInput = {
      organizationId,
      ...(query.action ? { action: query.action } : {}),
      ...(query.resourceType ? { resourceType: query.resourceType } : {}),
      ...(query.resourceId ? { resourceId: query.resourceId } : {}),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.auditLog.findMany({
        where,
        include: { actor: { select: { id: true, email: true } } },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    const inventoryIds = items
      .filter((item) => item.resourceType === 'INVENTORY')
      .map((item) => item.resourceId);
    const inventoryNames = inventoryIds.length
      ? await this.prisma.inventory.findMany({
          where: { id: { in: inventoryIds }, organizationId },
          select: { id: true, product: { select: { name: true } } },
        })
      : [];
    const nameByInventoryId = new Map(
      inventoryNames.map(({ id, product }) => [id, product.name]),
    );
    const presentedItems = items.map((item) => ({
      ...item,
      resourceName:
        item.resourceType === 'INVENTORY'
          ? (nameByInventoryId.get(item.resourceId) ?? null)
          : null,
    }));

    return paginate(presentedItems, total, page, limit);
  }
}
