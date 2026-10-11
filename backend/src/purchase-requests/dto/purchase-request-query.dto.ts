import { ApiPropertyOptional } from '@nestjs/swagger';
import { PurchaseRequestStatus } from '@prisma/client';
import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import { PaginationQuery } from '../../common/paginations/pagination-query';

export class PurchaseRequestQueryDto extends PaginationQuery {
  @ApiPropertyOptional({ enum: PurchaseRequestStatus })
  @IsEnum(PurchaseRequestStatus)
  @IsOptional()
  status?: PurchaseRequestStatus;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsUUID()
  @IsOptional()
  departmentId?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsUUID()
  @IsOptional()
  requesterId?: string;
}
