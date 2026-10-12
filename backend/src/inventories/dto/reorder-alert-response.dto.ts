import { ApiProperty } from '@nestjs/swagger';
import { PaginationMeta } from '../../common/paginations/paginated-response';
import { ReorderAlertStatus } from './reorder-alert-query.dto';

export class ReorderPolicyResponseDto {
  @ApiProperty({ format: 'uuid', nullable: true })
  inventoryId: string | null;

  @ApiProperty({ format: 'uuid' })
  productId: string;

  @ApiProperty({ example: 5, nullable: true })
  reorderPoint: number | null;

  @ApiProperty({ example: 20, nullable: true })
  targetStock: number | null;
}

export class ReorderAlertResponseDto {
  @ApiProperty({ format: 'uuid' })
  inventoryId: string;

  @ApiProperty({ format: 'uuid' })
  productId: string;

  @ApiProperty({ example: 'Wireless mouse' })
  productName: string;

  @ApiProperty({ example: 'MOU-010' })
  productSku: string;

  @ApiProperty({ example: 4, minimum: 0 })
  qtyAvailable: number;

  @ApiProperty({ example: 2, minimum: 0 })
  qtyReserved: number;

  @ApiProperty({ example: 6, minimum: 0 })
  qtyTotal: number;

  @ApiProperty({ example: 5, minimum: 0 })
  reorderPoint: number;

  @ApiProperty({ example: 20, minimum: 1 })
  targetStock: number;

  @ApiProperty({ example: 10, minimum: 0 })
  incomingQty: number;

  @ApiProperty({ example: 6, minimum: 0 })
  suggestedOrderQty: number;

  @ApiProperty({ enum: ReorderAlertStatus })
  status: ReorderAlertStatus;

  @ApiProperty({ example: '2026-10-12T10:00:00.000Z' })
  updatedAt: Date;
}

export class PaginatedReorderAlertResponseDto {
  @ApiProperty({ type: [ReorderAlertResponseDto] })
  items: ReorderAlertResponseDto[];

  @ApiProperty({ type: PaginationMeta })
  meta: PaginationMeta;
}
