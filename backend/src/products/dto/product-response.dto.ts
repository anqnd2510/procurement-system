import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CategoryInProductDto {
  @ApiProperty({ example: '8b67af55-7655-4d05-92be-3de79075e6e4' })
  id: string;

  @ApiProperty({ example: 'Electronics' })
  name: string;
}

export class ProductResponseDto {
  @ApiProperty({ example: '8b67af55-7655-4d05-92be-3de79075e6e4' })
  id: string;

  @ApiProperty({ example: 'Macbook Pro M4' })
  name: string;

  @ApiProperty({ example: 'MBP-M4' })
  sku: string;

  @ApiPropertyOptional({ example: 'High-performance laptop for professionals' })
  description: string | null;

  @ApiProperty({ example: 1999.99 })
  unit_price: number;

  @ApiPropertyOptional({ example: '8b67af55-7655-4d05-92be-3de79075e6e4' })
  categoryId: string | null;

  @ApiPropertyOptional({ type: () => CategoryInProductDto })
  category: CategoryInProductDto | null;

  @ApiProperty({ example: '2026-01-01T00:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2026-01-01T00:00:00.000Z' })
  updatedAt: Date;
}
