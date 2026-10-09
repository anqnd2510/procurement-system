import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { OrganizationRole } from '@prisma/client';
import { IsEmail, IsEnum, IsOptional } from 'class-validator';

export class AddMemberDto {
  @ApiProperty({ example: 'employee@example.com' })
  @IsEmail()
  email: string;

  @ApiPropertyOptional({
    enum: OrganizationRole,
    default: OrganizationRole.MEMBER,
  })
  @IsEnum(OrganizationRole)
  @IsOptional()
  role?: OrganizationRole;
}
