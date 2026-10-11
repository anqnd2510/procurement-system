import { ApiProperty } from '@nestjs/swagger';
import { PurchaseOrderStatus, PurchaseRequestStatus } from '@prisma/client';

export class DashboardSummaryDto {
  @ApiProperty({ format: 'uuid' })
  organizationId: string;

  @ApiProperty({ example: '2026-10-11T12:30:00.000Z' })
  generatedAt: string;

  @ApiProperty({ example: 24 })
  purchaseRequestsTotal: number;

  @ApiProperty({
    type: 'object',
    additionalProperties: { type: 'integer' },
    example: {
      DRAFT: 3,
      SUBMITTED: 4,
      APPROVED: 7,
      REJECTED: 2,
      CANCELLED: 1,
      FULFILLED: 7,
    },
  })
  purchaseRequestsByStatus: Record<PurchaseRequestStatus, number>;

  @ApiProperty({ example: 4 })
  awaitingReviewCount: number;

  @ApiProperty({ example: 12 })
  purchaseOrdersTotal: number;

  @ApiProperty({
    type: 'object',
    additionalProperties: { type: 'integer' },
    example: { DRAFT: 2, ISSUED: 3, RECEIVED: 6, CANCELLED: 1 },
  })
  purchaseOrdersByStatus: Record<PurchaseOrderStatus, number>;

  @ApiProperty({
    type: 'object',
    additionalProperties: { type: 'string' },
    description:
      'Order face value by status, in the configured catalog currency. Decimal strings; not actual payments or accounting spend.',
    example: {
      DRAFT: '120.00',
      ISSUED: '450.50',
      RECEIVED: '2000.00',
      CANCELLED: '0.00',
    },
  })
  purchaseOrderAmountsByStatus: Record<PurchaseOrderStatus, string>;

  @ApiProperty({
    description:
      'Active products with no inventory record or zero available stock',
    example: 3,
  })
  outOfStockProducts: number;

  @ApiProperty({ example: 5 })
  openPurchaseOrdersCount: number;

  @ApiProperty({ example: 86 })
  activeProducts: number;

  @ApiProperty({ example: 9 })
  activeCategories: number;

  @ApiProperty({ example: 72 })
  inventoryTrackedProducts: number;

  @ApiProperty({ example: 245 })
  inventoryAvailable: number;

  @ApiProperty({ example: 18 })
  inventoryReserved: number;

  @ApiProperty({ example: 263, description: 'Available plus reserved stock' })
  inventoryTotal: number;
}
