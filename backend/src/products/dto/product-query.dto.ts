import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';
import { PaginationQuery } from '../../common/paginations/pagination-query';

export class ProductQueryDto extends PaginationQuery {
  @ApiPropertyOptional({
    description: 'Case-insensitive name or SKU search',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  search?: string;
}
