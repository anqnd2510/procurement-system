import { SetMetadata } from '@nestjs/common';
import { OrganizationRole } from '@prisma/client';

export const ORGANIZATION_ROLES_KEY = 'organization_roles';
export const OrganizationRoles = (...roles: OrganizationRole[]) =>
  SetMetadata(ORGANIZATION_ROLES_KEY, roles);
