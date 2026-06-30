import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsUUID,
  IsNumber,
  IsPositive,
  MaxLength,
} from 'class-validator';

export class CreateProductDto {
  @ApiProperty({ example: 'Macbook Pro M4' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name: string;

  @ApiProperty({
    example: 'MBP-M4',
    description: 'SKU will be generated if not provided',
  })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  sku?: string;

  @ApiPropertyOptional({ example: 'High-performance laptop for professionals' })
  @IsString()
  @IsOptional()
  @MaxLength(1000)
  description?: string;

  @ApiProperty({ example: 1999.99, description: 'Must be greater than 0' })
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  unit_price: number;

  @ApiPropertyOptional({
    example: '8b67af55-7655-4d05-92be-3de79075e6e4',
    description: 'Category UUID — omit to leave uncategorized',
    format: 'uuid',
  })
  @IsUUID()
  @IsOptional()
  categoryId?: string;
}
