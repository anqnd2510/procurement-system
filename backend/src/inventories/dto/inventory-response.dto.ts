import { ApiProperty } from '@nestjs/swagger';

export class InventoryResponseDto {
  @ApiProperty({ example: '8b67af55-7655-4d05-92be-3de79075e6e4' })
  id: string;

  @ApiProperty({ example: '8b67af55-7655-4d05-92be-3de79075e6e4' })
  productId: string;

  @ApiProperty({ example: 'Macbook Pro M4' })
  productName: string;

  @ApiProperty({ example: 'MBP-M4' })
  productSku: string;

  @ApiProperty({
    example: 8,
    description: 'Available quantity — can be reserved',
  })
  qtyAvailable: number;

  @ApiProperty({
    example: 2,
    description: 'Reserved quantity — held for pending orders',
  })
  qtyReserved: number;

  @ApiProperty({
    example: 10,
    description: 'Total quantity = available + reserved',
  })
  qtyTotal: number;

  @ApiProperty({ example: '2026-01-01T00:00:00.000Z' })
  updatedAt: Date;
}
