import { ApiPropertyOptional } from '@nestjs/swagger';
import { InventoryTxType } from '@prisma/client';
import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import { PaginationQuery } from '../../common/paginations/pagination-query';

export class InventoryTransactionQueryDto extends PaginationQuery {
  @ApiPropertyOptional({ enum: InventoryTxType })
  @IsOptional()
  @IsEnum(InventoryTxType)
  type?: InventoryTxType;

  @ApiPropertyOptional({
    format: 'uuid',
    description:
      'Filter ledger entries by their originating request or order ID',
  })
  @IsOptional()
  @IsUUID()
  referenceId?: string;
}
