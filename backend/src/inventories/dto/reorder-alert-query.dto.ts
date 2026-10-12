import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { PaginationQuery } from '../../common/paginations/pagination-query';

export enum ReorderAlertStatus {
  LOW_STOCK = 'LOW_STOCK',
  OUT_OF_STOCK = 'OUT_OF_STOCK',
}

export class ReorderAlertQueryDto extends PaginationQuery {
  @ApiPropertyOptional({ enum: ReorderAlertStatus })
  @IsOptional()
  @IsEnum(ReorderAlertStatus)
  status?: ReorderAlertStatus;

  @ApiPropertyOptional({ maxLength: 100, example: 'monitor' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  search?: string;
}
