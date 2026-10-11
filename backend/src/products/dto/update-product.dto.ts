import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsUUID,
  IsNumber,
  IsPositive,
  MaxLength,
} from 'class-validator';

export class UpdateProductDto {
  @ApiPropertyOptional({ example: 'Macbook Pro M4 Pro' })
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  @MaxLength(200)
  name?: string;

  @ApiPropertyOptional({ example: 'MBP-M4-PRO' })
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  @MaxLength(100)
  sku?: string;

  @ApiPropertyOptional({ example: 'Updated description' })
  @IsString()
  @IsOptional()
  @MaxLength(1000)
  description?: string;

  @ApiPropertyOptional({ example: 2199.99 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  @IsOptional()
  unit_price?: number;

  @ApiPropertyOptional({
    example: '8b67af55-7655-4d05-92be-3de79075e6e4',
    format: 'uuid',
    description: 'Set to null to remove from category',
  })
  @IsUUID()
  @IsOptional()
  categoryId?: string;
}
