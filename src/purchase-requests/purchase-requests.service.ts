import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  OrganizationRole,
  InventoryTxType,
  Prisma,
  PurchaseRequestStatus,
} from '@prisma/client';
import { OrganizationsService } from '../organizations/organizations.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  getPaginationParams,
  paginate,
  PaginatedResponse,
} from '../common/paginations/paginated-response';
import { CreatePurchaseRequestDto } from './dto/create-purchase-request.dto';
import { PurchaseRequestQueryDto } from './dto/purchase-request-query.dto';
import { ApprovePurchaseRequestDto } from './dto/approve-purchase-request.dto';
import { RejectPurchaseRequestDto } from './dto/reject-purchase-request.dto';
import { UpdatePurchaseRequestDto } from './dto/update-purchase-request.dto';

type PurchaseRequestWithRelations = Prisma.PurchaseRequestGetPayload<{
  include: {
    department: { select: { id: true; name: true; code: true } };
    requester: { select: { id: true; email: true } };
    items: {
      include: { product: { select: { id: true; name: true; sku: true } } };
    };
    history: {
      orderBy: { createdAt: 'asc' };
      include: { changedBy: { select: { id: true; email: true } } };
    };
  };
}>;

@Injectable()
export class PurchaseRequestsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly organizations: OrganizationsService,
  ) {}

  async create(
    userId: string,
    organizationId: string,
    dto: CreatePurchaseRequestDto,
    idempotencyKey?: string,
  ) {
    await this.organizations.getMembership(userId, organizationId);

    if (idempotencyKey) {
      const existing = await this.prisma.purchaseRequest.findUnique({
        where: { idempotencyKey },
        select: { id: true, organizationId: true, requesterId: true },
      });
      if (existing) {
        if (
          existing.organizationId !== organizationId ||
          existing.requesterId !== userId
        ) {
          throw new ConflictException(
            'Idempotency key is already used by another request',
          );
        }
        return this.findOne(existing.id, userId, organizationId);
      }
    }

    const department = await this.prisma.department.findFirst({
      where: { id: dto.departmentId, organizationId },
    });
    if (!department) {
      throw new NotFoundException(`Department ${dto.departmentId} not found`);
    }

    const productIds = dto.items
      .map((item) => item.productId)
      .filter((id): id is string => Boolean(id));
    const products = productIds.length
      ? await this.prisma.product.findMany({
          where: { id: { in: productIds }, organizationId, deletedAt: null },
          select: { id: true },
        })
      : [];
    const productIdSet = new Set(products.map((product) => product.id));
    const invalidProductId = productIds.find((id) => !productIdSet.has(id));
    if (invalidProductId) {
      throw new NotFoundException(`Product ${invalidProductId} not found`);
    }

    const totalAmount = dto.items.reduce(
      (total, item) => total + item.quantity * item.estimatedUnitPrice,
      0,
    );

    const request = await this.prisma.$transaction(async (tx) => {
      const created = await tx.purchaseRequest.create({
        data: {
          organizationId,
          departmentId: dto.departmentId,
          requesterId: userId,
          idempotencyKey,
          title: dto.title,
          description: dto.description,
          totalAmount: new Prisma.Decimal(totalAmount.toFixed(2)),
          items: {
            create: dto.items.map((item) => ({
              productId: item.productId,
              description: item.description,
              quantity: item.quantity,
              estimatedUnitPrice: new Prisma.Decimal(
                item.estimatedUnitPrice.toFixed(2),
              ),
              estimatedTotal: new Prisma.Decimal(
                (item.quantity * item.estimatedUnitPrice).toFixed(2),
              ),
              notes: item.notes,
            })),
          },
        },
      });

      await tx.purchaseRequestStatusHistory.create({
        data: {
          purchaseRequestId: created.id,
          fromStatus: null,
          toStatus: PurchaseRequestStatus.DRAFT,
          changedById: userId,
        },
      });

      return created;
    });

    return this.findOne(request.id, userId, organizationId);
  }

  async findAll(
    userId: string,
    organizationId: string,
    query: PurchaseRequestQueryDto,
  ): Promise<PaginatedResponse<PurchaseRequestWithRelations>> {
    await this.organizations.getMembership(userId, organizationId);
    const { page = 1, limit = 10 } = query;
    const { skip, take } = getPaginationParams(page, limit);
    const where: Prisma.PurchaseRequestWhereInput = {
      organizationId,
      ...(query.status ? { status: query.status } : {}),
      ...(query.departmentId ? { departmentId: query.departmentId } : {}),
      ...(query.requesterId ? { requesterId: query.requesterId } : {}),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.purchaseRequest.findMany({
        where,
        include: this.relations,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      this.prisma.purchaseRequest.count({ where }),
    ]);

    return paginate(items, total, page, limit);
  }

  async findOne(
    id: string,
    userId: string,
    organizationId: string,
  ): Promise<PurchaseRequestWithRelations> {
    await this.organizations.getMembership(userId, organizationId);
    const request = await this.prisma.purchaseRequest.findFirst({
      where: { id, organizationId },
      include: this.relations,
    });
    if (!request) {
      throw new NotFoundException(`Purchase request ${id} not found`);
    }
    return request;
  }

  async update(
    id: string,
    userId: string,
    organizationId: string,
    dto: UpdatePurchaseRequestDto,
  ) {
    const request = await this.getRequestForTransition(
      id,
      userId,
      organizationId,
    );
    if (request.requesterId !== userId) {
      throw new ForbiddenException(
        'Only the requester can update this request',
      );
    }
    this.assertStatus(request.status, PurchaseRequestStatus.DRAFT, 'update');

    const departmentId = dto.departmentId;
    if (departmentId) {
      const department = await this.prisma.department.findFirst({
        where: { id: departmentId, organizationId },
      });
      if (!department) {
        throw new NotFoundException(`Department ${departmentId} not found`);
      }
    }

    let totalAmount: number | undefined;
    if (dto.items) {
      const productIds = dto.items
        .map((item) => item.productId)
        .filter((productId): productId is string => Boolean(productId));
      const products = productIds.length
        ? await this.prisma.product.findMany({
            where: { id: { in: productIds }, organizationId, deletedAt: null },
            select: { id: true },
          })
        : [];
      const productIdSet = new Set(products.map((product) => product.id));
      const invalidProductId = productIds.find(
        (productId) => !productIdSet.has(productId),
      );
      if (invalidProductId) {
        throw new NotFoundException(`Product ${invalidProductId} not found`);
      }
      totalAmount = dto.items.reduce(
        (total, item) => total + item.quantity * item.estimatedUnitPrice,
        0,
      );
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.purchaseRequest.update({
        where: { id },
        data: {
          ...(departmentId ? { departmentId } : {}),
          ...(dto.title !== undefined ? { title: dto.title } : {}),
          ...(dto.description !== undefined
            ? { description: dto.description }
            : {}),
          ...(totalAmount !== undefined
            ? { totalAmount: new Prisma.Decimal(totalAmount.toFixed(2)) }
            : {}),
          ...(dto.items
            ? {
                items: {
                  deleteMany: {},
                  create: dto.items.map((item) => ({
                    productId: item.productId,
                    description: item.description,
                    quantity: item.quantity,
                    estimatedUnitPrice: new Prisma.Decimal(
                      item.estimatedUnitPrice.toFixed(2),
                    ),
                    estimatedTotal: new Prisma.Decimal(
                      (item.quantity * item.estimatedUnitPrice).toFixed(2),
                    ),
                    notes: item.notes,
                  })),
                },
              }
            : {}),
        },
      });
    });

    return this.findOne(id, userId, organizationId);
  }

  async submit(id: string, userId: string, organizationId: string) {
    const request = await this.getRequestForTransition(
      id,
      userId,
      organizationId,
    );
    if (request.requesterId !== userId) {
      throw new ForbiddenException(
        'Only the requester can submit this request',
      );
    }
    this.assertStatus(request.status, PurchaseRequestStatus.DRAFT, 'submit');
    return this.transition(
      request,
      userId,
      organizationId,
      PurchaseRequestStatus.SUBMITTED,
    );
  }

  async approve(
    id: string,
    userId: string,
    organizationId: string,
    dto: ApprovePurchaseRequestDto,
  ) {
    await this.requireManager(userId, organizationId);
    const request = await this.getRequestForTransition(
      id,
      userId,
      organizationId,
    );
    this.assertStatus(
      request.status,
      PurchaseRequestStatus.SUBMITTED,
      'approve',
    );
    const items = await this.prisma.purchaseRequestItem.findMany({
      where: { purchaseRequestId: id, productId: { not: null } },
      select: { productId: true, quantity: true },
    });
    return this.transition(
      request,
      userId,
      organizationId,
      PurchaseRequestStatus.APPROVED,
      dto.comment,
      items,
    );
  }

  async reject(
    id: string,
    userId: string,
    organizationId: string,
    dto: RejectPurchaseRequestDto,
  ) {
    await this.requireManager(userId, organizationId);
    const request = await this.getRequestForTransition(
      id,
      userId,
      organizationId,
    );
    this.assertStatus(
      request.status,
      PurchaseRequestStatus.SUBMITTED,
      'reject',
    );
    return this.transition(
      request,
      userId,
      organizationId,
      PurchaseRequestStatus.REJECTED,
      dto.reason,
    );
  }

  async cancel(id: string, userId: string, organizationId: string) {
    const request = await this.getRequestForTransition(
      id,
      userId,
      organizationId,
    );
    if (request.requesterId !== userId) {
      throw new ForbiddenException(
        'Only the requester can cancel this request',
      );
    }
    if (
      request.status !== PurchaseRequestStatus.DRAFT &&
      request.status !== PurchaseRequestStatus.SUBMITTED &&
      request.status !== PurchaseRequestStatus.APPROVED
    ) {
      throw new ConflictException(
        `Cannot cancel a ${request.status.toLowerCase()} purchase request`,
      );
    }
    return this.transition(
      request,
      userId,
      organizationId,
      PurchaseRequestStatus.CANCELLED,
    );
  }

  private async getRequestForTransition(
    id: string,
    userId: string,
    organizationId: string,
  ) {
    await this.organizations.getMembership(userId, organizationId);
    const request = await this.prisma.purchaseRequest.findFirst({
      where: { id, organizationId },
      select: { id: true, requesterId: true, status: true },
    });
    if (!request) {
      throw new NotFoundException(`Purchase request ${id} not found`);
    }
    return request;
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

  private assertStatus(
    current: PurchaseRequestStatus,
    expected: PurchaseRequestStatus,
    action: string,
  ) {
    if (current !== expected) {
      throw new ConflictException(
        `Cannot ${action} a ${current.toLowerCase()} purchase request`,
      );
    }
  }

  private async transition(
    request: { id: string; status: PurchaseRequestStatus },
    userId: string,
    organizationId: string,
    toStatus: PurchaseRequestStatus,
    comment?: string,
    reserveItems: { productId: string | null; quantity: number }[] = [],
  ) {
    await this.prisma.$transaction(async (tx) => {
      if (toStatus === PurchaseRequestStatus.CANCELLED) {
        const reservations = await tx.inventoryTransaction.findMany({
          where: { referenceId: request.id, type: InventoryTxType.RESERVE },
          select: { inventoryId: true, quantity: true },
        });

        for (const reservation of reservations) {
          const existingRelease = await tx.inventoryTransaction.findFirst({
            where: {
              inventoryId: reservation.inventoryId,
              referenceId: request.id,
              type: InventoryTxType.RELEASE,
            },
          });
          if (existingRelease) continue;

          const rows = await tx.$queryRaw<
            { id: string; qty_reserved: number }[]
          >`
            SELECT id, qty_reserved
            FROM inventory
            WHERE id = ${reservation.inventoryId}::uuid
            FOR UPDATE
          `;
          if (rows.length === 0) {
            throw new NotFoundException(
              `Inventory ${reservation.inventoryId} not found`,
            );
          }
          if (rows[0].qty_reserved < reservation.quantity) {
            throw new ConflictException(
              `Cannot release ${reservation.quantity} reserved units from inventory ${reservation.inventoryId}`,
            );
          }
          await tx.$executeRaw`
            UPDATE inventory
            SET qty_available = qty_available + ${reservation.quantity},
                qty_reserved = qty_reserved - ${reservation.quantity},
                updated_at = NOW()
            WHERE id = ${reservation.inventoryId}::uuid
          `;
          await tx.inventoryTransaction.create({
            data: {
              inventoryId: reservation.inventoryId,
              type: InventoryTxType.RELEASE,
              quantity: reservation.quantity,
              referenceId: request.id,
            },
          });
        }
      }
      for (const item of reserveItems) {
        if (!item.productId) continue;
        const rows = await tx.$queryRaw<
          { id: string; qty_available: number; qty_reserved: number }[]
        >`
          SELECT id, qty_available, qty_reserved
          FROM inventory
          WHERE product_id = ${item.productId}::uuid
          FOR UPDATE
        `;
        if (rows.length === 0) {
          throw new NotFoundException(
            `Inventory for product ${item.productId} not found`,
          );
        }
        const inventory = rows[0];
        const existing = await tx.inventoryTransaction.findFirst({
          where: {
            inventoryId: inventory.id,
            referenceId: request.id,
            type: InventoryTxType.RESERVE,
          },
        });
        if (existing) continue;
        if (inventory.qty_available < item.quantity) {
          throw new ConflictException(
            `Insufficient stock for product ${item.productId}. Available: ${inventory.qty_available}, requested: ${item.quantity}`,
          );
        }
        await tx.$executeRaw`
          UPDATE inventory
          SET qty_available = qty_available - ${item.quantity},
              qty_reserved = qty_reserved + ${item.quantity},
              updated_at = NOW()
          WHERE id = ${inventory.id}::uuid
        `;
        await tx.inventoryTransaction.create({
          data: {
            inventoryId: inventory.id,
            type: InventoryTxType.RESERVE,
            quantity: item.quantity,
            referenceId: request.id,
          },
        });
      }
      await tx.purchaseRequest.update({
        where: { id: request.id },
        data: {
          status: toStatus,
          ...(toStatus === PurchaseRequestStatus.SUBMITTED
            ? { submittedAt: new Date() }
            : {}),
          ...(toStatus === PurchaseRequestStatus.APPROVED
            ? { approvedAt: new Date() }
            : {}),
          ...(toStatus === PurchaseRequestStatus.REJECTED
            ? { rejectedAt: new Date() }
            : {}),
          ...(toStatus === PurchaseRequestStatus.CANCELLED
            ? { cancelledAt: new Date() }
            : {}),
        },
      });
      await tx.purchaseRequestStatusHistory.create({
        data: {
          purchaseRequestId: request.id,
          fromStatus: request.status,
          toStatus,
          changedById: userId,
          comment,
        },
      });
    });
    return this.findOne(request.id, userId, organizationId);
  }

  private readonly relations = {
    department: { select: { id: true, name: true, code: true } },
    requester: { select: { id: true, email: true } },
    items: {
      include: { product: { select: { id: true, name: true, sku: true } } },
    },
    history: {
      orderBy: { createdAt: 'asc' as const },
      include: { changedBy: { select: { id: true, email: true } } },
    },
  } satisfies Prisma.PurchaseRequestInclude;
}
