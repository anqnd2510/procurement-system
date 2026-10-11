import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { OrganizationRole } from '@prisma/client';
import { OrganizationsService } from '../../organizations/organizations.service';
import type { User } from '../../auth/interfaces/user.interface';
import { ORGANIZATION_ROLES_KEY } from '../decorators/organization-roles.decorator';

type OrganizationRequest = {
  user: User;
  headers: Record<string, string | string[] | undefined>;
};

@Injectable()
export class OrganizationRolesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly organizations: OrganizationsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<OrganizationRole[]>(
      ORGANIZATION_ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!requiredRoles) return true;

    const request = context.switchToHttp().getRequest<OrganizationRequest>();
    const organizationId = request.headers['x-organization-id'];
    const normalizedOrganizationId = Array.isArray(organizationId)
      ? organizationId[0]
      : organizationId;
    const membership = await this.organizations.getMembership(
      request.user.id,
      normalizedOrganizationId ?? '',
    );

    return requiredRoles.includes(membership.role);
  }
}
