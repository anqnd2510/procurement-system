import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class RejectPurchaseRequestDto {
  @ApiProperty({
    example: 'Budget is not available this quarter.',
    minLength: 1,
    maxLength: 1000,
    description: 'A non-blank reason, saved in the request status history.',
  })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  reason: string;
}
