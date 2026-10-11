import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class ApprovePurchaseRequestDto {
  @ApiPropertyOptional({ example: 'Approved within the department budget.' })
  @IsString()
  @IsOptional()
  @MaxLength(1000)
  comment?: string;
}
