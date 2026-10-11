import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';
import { PaginationQuery } from '../../common/paginations/pagination-query';

export class AuditLogQueryDto extends PaginationQuery {
  @ApiPropertyOptional({ example: 'PURCHASE_REQUEST_STATUS_CHANGED' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  action?: string;

  @ApiPropertyOptional({ example: 'PURCHASE_REQUEST' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  resourceType?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  resourceId?: string;
}
