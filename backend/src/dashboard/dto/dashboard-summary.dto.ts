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
