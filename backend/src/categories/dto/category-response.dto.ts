import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CategoryResponseDto {
  @ApiProperty({ example: '8b67af55-7655-4d05-92be-3de79075e6e4' })
  id: string;

  @ApiProperty({ example: 'Electronics' })
  name: string;

  @ApiPropertyOptional({ example: 'All electronic devices and accessories' })
  description: string | null;

  @ApiPropertyOptional({
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    description: 'Parent category ID — null if root',
  })
  parentId: string | null;

  @ApiPropertyOptional({ description: 'Immediate children categories' })
  children?: ChildCategoryDto[];

  @ApiProperty({ example: '2026-01-01T00:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2026-01-01T00:00:00.000Z' })
  updatedAt: Date;
}

// For use exclusively with the `children` property of `CategoryResponseDto`, avoid endles circular references.

export class ChildCategoryDto {
  @ApiProperty({ example: '8b67af55-7655-4d05-92be-3de79075e6e4' })
  id: string;

  @ApiProperty({ example: 'Laptops' })
  name: string;

  @ApiPropertyOptional({ example: 'Portable computers' })
  description: string | null;

  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  parentId: string | null;

  @ApiProperty({ example: '2026-01-01T00:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2026-01-01T00:00:00.000Z' })
  updatedAt: Date;
}
