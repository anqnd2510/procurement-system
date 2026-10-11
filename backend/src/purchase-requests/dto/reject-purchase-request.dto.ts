import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class RejectPurchaseRequestDto {
  @ApiProperty({ example: 'Budget is not available this quarter.' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  reason: string;
}
