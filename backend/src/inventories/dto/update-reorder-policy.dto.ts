import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

const MAX_STOCK_QUANTITY = 2_147_483_647;

export class UpdateReorderPolicyDto {
  @ApiProperty({
    example: 5,
    minimum: 0,
    maximum: MAX_STOCK_QUANTITY,
    nullable: true,
    description:
      'Alert when available stock is at or below this value; null disables the policy.',
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(MAX_STOCK_QUANTITY)
  reorderPoint!: number | null;

  @ApiProperty({
    example: 20,
    minimum: 1,
    maximum: MAX_STOCK_QUANTITY,
    nullable: true,
    description:
      'Desired available stock after replenishment; must exceed reorderPoint.',
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(MAX_STOCK_QUANTITY)
  targetStock!: number | null;
}
