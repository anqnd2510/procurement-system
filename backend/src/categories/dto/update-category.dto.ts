import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsUUID,
  MaxLength,
} from 'class-validator';

export class UpdateCategoryDto {
  @ApiPropertyOptional({
    example: 'Electronics',
    description: 'Category name — must be unique',
  })
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({
    example: 'All electronic devices and accessories',
  })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional({
    example: '8b67af55-7655-4d05-92be-3de79075e6e4',
    description: 'Parent category UUID — set null to move to root',
    format: 'uuid',
  })
  @IsUUID()
  @IsOptional()
  parentId?: string;
}
