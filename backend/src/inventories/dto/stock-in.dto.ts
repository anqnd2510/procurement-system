import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsPositive, IsUUID, Max } from 'class-validator';

export class StockInDto {
  @ApiProperty({
    example: '8b67af55-7655-4d05-92be-3de79075e6e4',
    description: 'Product UUID to stock in',
    format: 'uuid',
  })
  @IsUUID()
  productId: string;

  @ApiProperty({
    example: 10,
    minimum: 1,
    maximum: 2147483647,
    description: 'Quantity to add — must be greater than 0',
  })
  @IsInt()
  @IsPositive()
  @Max(2147483647)
  quantity: number;
}
