import { ApiProperty } from '@nestjs/swagger';

export class AuditFilterOptionsResponseDto {
  @ApiProperty({ type: [String] })
  actions!: string[];

  @ApiProperty({ type: [String] })
  resourceTypes!: string[];
}
