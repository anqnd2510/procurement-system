import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { OrganizationsService } from './organizations.service';
import { requestReadScope } from './membership-policy';

describe('Organization and department boundaries', () => {
  function setup(
    role = 'MEMBER',
    departmentId: string | null = 'dept-a',
    departmentRole = 'MEMBER',
  ) {
    const prisma = {
      user: { findUnique: jest.fn().mockResolvedValue({ role: 'EMPLOYEE' }) },
      organization: { findUnique: jest.fn(), create: jest.fn() },
      organizationMember: {
        findUnique: jest
          .fn()
          .mockResolvedValue({ role, departmentId, departmentRole }),
        findFirst: jest.fn().mockResolvedValue({ id: 'member' }),
        findMany: jest.fn().mockResolvedValue([]),
        update: jest.fn().mockResolvedValue({ id: 'member' }),
      },
      department: {
        findMany: jest.fn().mockResolvedValue([]),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      $transaction: jest.fn(),
    };
    prisma.$transaction.mockImplementation(
      (callback: (tx: typeof prisma) => unknown) =>
        Promise.resolve(callback(prisma)),
    );
    return { prisma, service: new OrganizationsService(prisma as never) };
  }

  it('denies organization creation to an employee, even if they own another organization', async () => {
    const { service, prisma } = setup('OWNER');
    await expect(
      service.create('user', { name: 'Test', slug: 'test' }),
    ).rejects.toThrow(ForbiddenException);
    expect(prisma.organization.create).not.toHaveBeenCalled();
  });

  it.each(['ADMIN', 'MANAGER'])(
    'allows system %s to create an organization',
    async (role) => {
      const { service, prisma } = setup();
      prisma.user.findUnique.mockResolvedValue({ role });
      await service.create('user', { name: 'Test', slug: 'test' });
      expect(prisma.organization.create).toHaveBeenCalledWith({
        data: {
          name: 'Test',
          slug: 'test',
          createdById: 'user',
          members: { create: { userId: 'user', role: 'OWNER' } },
        },
        include: {
          members: { include: { user: { select: { id: true, email: true } } } },
        },
      });
    },
  );

  it('shows only the primary department to a member', async () => {
    const { service, prisma } = setup();
    await service.listDepartments('user', 'org');
    expect(prisma.department.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { organizationId: 'org', id: 'dept-a' },
      }),
    );
  });

  it('does not give an unassigned member the full department directory', async () => {
    const { service, prisma } = setup('MEMBER', null);
    await service.listDepartments('user', 'org');
    expect(prisma.department.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { organizationId: 'org', id: '' } }),
    );
  });

  it('allows a lead to see only their team and edit only their department', async () => {
    const { service, prisma } = setup('MEMBER', 'dept-a', 'LEAD');
    await service.listMembers('lead', 'org');
    expect(prisma.organizationMember.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { organizationId: 'org', departmentId: 'dept-a' },
      }),
    );
    await expect(
      service.updateDepartment('lead', 'org', 'dept-b', { name: 'Changed' }),
    ).rejects.toThrow(ForbiddenException);
    await expect(
      service.createDepartment('lead', 'org', { name: 'New', code: 'NEW' }),
    ).rejects.toThrow(ForbiddenException);
    await expect(
      service.assignDepartment('lead', 'org', 'member', {
        departmentId: 'dept-a',
        departmentRole: 'LEAD',
      }),
    ).rejects.toThrow(ForbiddenException);
    expect(prisma.department.update).not.toHaveBeenCalled();
    prisma.department.findFirst.mockResolvedValue({ id: 'dept-a' });
    await service.updateDepartment('lead', 'org', 'dept-a', {
      name: 'IT Team',
    });
    expect(prisma.department.update).toHaveBeenCalledWith({
      where: { id: 'dept-a', organizationId: 'org' },
      data: { name: 'IT Team' },
    });
  });

  it('rejects cross-organization department assignments before writing', async () => {
    const { service, prisma } = setup('MANAGER');
    prisma.department.findFirst.mockResolvedValue(null);
    await expect(
      service.assignDepartment('manager', 'org', 'member', {
        departmentId: 'foreign-dept',
        departmentRole: 'MEMBER',
      }),
    ).rejects.toThrow(NotFoundException);
    expect(prisma.organizationMember.update).not.toHaveBeenCalled();
  });

  it('replaces assignments idempotently without changing organization permissions', async () => {
    const { service, prisma } = setup('MANAGER');
    prisma.department.findFirst.mockResolvedValue({ id: 'dept-a' });
    const assignment = {
      departmentId: 'dept-a',
      departmentRole: 'LEAD' as const,
    };
    await service.assignDepartment('manager', 'org', 'member', assignment);
    await service.assignDepartment('manager', 'org', 'member', assignment);
    expect(prisma.organizationMember.update).toHaveBeenLastCalledWith(
      expect.objectContaining({
        where: { id: 'member', organizationId: 'org' },
        data: assignment,
      }),
    );
  });

  it('keeps request scopes independent of global account titles', () => {
    expect(
      requestReadScope(
        {
          role: 'MEMBER',
          departmentId: 'dept',
          departmentRole: 'MEMBER',
        } as never,
        'user',
      ),
    ).toEqual({ requesterId: 'user' });
    expect(
      requestReadScope(
        {
          role: 'MEMBER',
          departmentId: 'dept',
          departmentRole: 'LEAD',
        } as never,
        'user',
      ),
    ).toEqual({ OR: [{ requesterId: 'user' }, { departmentId: 'dept' }] });
    expect(requestReadScope({ role: 'OWNER' } as never, 'user')).toEqual({});
  });
});
