import { ApiProperty } from '@nestjs/swagger';
import { InventoryTxType } from '@prisma/client';
import { PaginationMeta } from '../../common/paginations/paginated-response';

export class InventoryTransactionResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ format: 'uuid' })
  inventoryId: string;

  @ApiProperty({ enum: InventoryTxType, example: InventoryTxType.STOCK_IN })
  type: InventoryTxType;

  @ApiProperty({ example: 12, minimum: 1 })
  quantity: number;

  @ApiProperty({ format: 'uuid', nullable: true })
  referenceId: string | null;

  @ApiProperty({ example: '2026-10-11T12:30:00.000Z' })
  createdAt: Date;

  @ApiProperty({ format: 'uuid' })
  productId: string;

  @ApiProperty({ example: 'Wireless Keyboard' })
  productName: string;

  @ApiProperty({ example: 'KEY-WL-001' })
  productSku: string;
}

export class PaginatedInventoryTransactionResponseDto {
  @ApiProperty({ type: [InventoryTransactionResponseDto] })
  items: InventoryTransactionResponseDto[];

  @ApiProperty({ type: PaginationMeta })
  meta: PaginationMeta;
}
