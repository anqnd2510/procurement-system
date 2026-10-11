import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';

export class CreatePurchaseRequestItemDto {
  @ApiPropertyOptional({ format: 'uuid' })
  @IsUUID()
  @IsOptional()
  productId?: string;

  @ApiProperty({ example: 'Business laptop' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  description: string;

  @ApiProperty({ example: 5, minimum: 1, maximum: 2147483647 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(2147483647)
  quantity: number;

  @ApiProperty({ example: 1299.99, minimum: 0, maximum: 999999999999.99 })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(999999999999.99)
  estimatedUnitPrice: number;

  @ApiPropertyOptional({ example: 'Required before the onboarding date' })
  @IsString()
  @IsOptional()
  @MaxLength(1000)
  notes?: string;
}

export class CreatePurchaseRequestDto {
  @ApiProperty({
    format: 'uuid',
    description:
      'Use the current membership primary department ID. Only organization owners/managers can request for another department in the same organization.',
  })
  @IsUUID()
  departmentId: string;

  @ApiProperty({ example: 'New employee laptops' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title: string;

  @ApiPropertyOptional({ example: 'Equipment for the new engineering team' })
  @IsString()
  @IsOptional()
  @MaxLength(2000)
  description?: string;

  @ApiProperty({ type: [CreatePurchaseRequestItemDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreatePurchaseRequestItemDto)
  items: CreatePurchaseRequestItemDto[];
}
