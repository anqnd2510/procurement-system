import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreatePurchaseOrderDto {
  @ApiProperty({ example: 'Acme Office Supplies' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  supplierName: string;
}
