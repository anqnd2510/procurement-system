import { Decimal } from '@prisma/client/runtime/client';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsUUID,
  IsNumber,
  Min,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    example: 'Macbook Pro M4',
  })
  name: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    example: 'MBP-M4',
  })
  sku: string;

  @IsOptional()
  @IsString()
  @ApiProperty({
    example: 'High-performance laptop for professionals',
  })
  description?: string;

  @IsNumber()
  @Min(0)
  @ApiProperty({
    example: 1999.99,
  })
  unit_price: Decimal;

  @IsOptional()
  @IsUUID()
  @ApiProperty({
    example: 'e2fd6f89-c6df-4d0d-8f1d-3d4b63d2f0a',
    required: false,
  })
  categoryId?: string;
}
