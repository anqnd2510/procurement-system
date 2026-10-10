import { ForbiddenException, BadRequestException } from '@nestjs/common';
import { OrganizationRole, Role } from '@prisma/client';
import { Reflector } from '@nestjs/core';
import { OrganizationRolesGuard } from './organization-roles.guard';
import { OrganizationsService } from '../../organizations/organizations.service';

describe('OrganizationRolesGuard', () => {
  const reflector = { getAllAndOverride: jest.fn() } as unknown as Reflector;
  const getMembershipMock = jest.fn();
  const organizations = {
    getMembership: getMembershipMock,
  } as unknown as OrganizationsService;
  const guard = new OrganizationRolesGuard(reflector, organizations);
  const context = {
    getHandler: jest.fn(),
    getClass: jest.fn(),
    switchToHttp: () => ({
      getRequest: () => ({
        user: { id: 'user-1', email: 'user@example.com', role: Role.EMPLOYEE },
        headers: { 'x-organization-id': 'org-1' },
      }),
    }),
  } as unknown as Parameters<OrganizationRolesGuard['canActivate']>[0];

  beforeEach(() => jest.clearAllMocks());

  it('allows a member when the required organization role matches', async () => {
    reflector.getAllAndOverride = jest
      .fn()
      .mockReturnValue([OrganizationRole.MEMBER]);
    getMembershipMock.mockResolvedValue({ role: OrganizationRole.MEMBER });

    await expect(guard.canActivate(context)).resolves.toBe(true);
  });

  it('denies a member when manager access is required', async () => {
    reflector.getAllAndOverride = jest
      .fn()
      .mockReturnValue([OrganizationRole.OWNER, OrganizationRole.MANAGER]);
    getMembershipMock.mockResolvedValue({ role: OrganizationRole.MEMBER });

    await expect(guard.canActivate(context)).resolves.toBe(false);
  });

  it('propagates membership denial for a user outside the organization', async () => {
    reflector.getAllAndOverride = jest
      .fn()
      .mockReturnValue([OrganizationRole.MANAGER]);
    getMembershipMock.mockRejectedValue(
      new ForbiddenException('User is not a member of this organization'),
    );

    await expect(guard.canActivate(context)).rejects.toThrow(
      ForbiddenException,
    );
  });

  it('rejects requests without an organization header', async () => {
    reflector.getAllAndOverride = jest
      .fn()
      .mockReturnValue([OrganizationRole.MANAGER]);
    getMembershipMock.mockRejectedValue(
      new BadRequestException('X-Organization-Id header is required'),
    );

    await expect(guard.canActivate(context)).rejects.toThrow(
      BadRequestException,
    );
    expect(getMembershipMock).toHaveBeenCalledWith('user-1', 'org-1');
  });

  it('allows endpoints without organization role metadata', async () => {
    reflector.getAllAndOverride = jest.fn().mockReturnValue(undefined);

    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(getMembershipMock).not.toHaveBeenCalled();
  });
});
