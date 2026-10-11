import { ApiProperty } from '@nestjs/swagger';
import { DepartmentRole } from '@prisma/client';
import { IsEnum, IsUUID, ValidateIf } from 'class-validator';

export class AssignDepartmentDto {
  @ApiProperty({
    type: String,
    format: 'uuid',
    nullable: true,
    description: 'Primary department in this organization, or null to unassign',
  })
  @ValidateIf((_object, value: unknown) => value !== null)
  @IsUUID()
  departmentId: string | null;

  @ApiProperty({
    enum: DepartmentRole,
    description:
      'A department lead does not gain organization-manager permissions',
  })
  @IsEnum(DepartmentRole)
  departmentRole: DepartmentRole;
}
