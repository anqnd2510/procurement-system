import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { OrganizationRole, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AddMemberDto } from './dto/add-member.dto';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { AssignDepartmentDto } from './dto/assign-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';
import { leadsDepartment, managesOrganization } from './membership-policy';

@Injectable()
export class OrganizationsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateOrganizationDto) {
    const actor = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });
    if (!actor || (actor.role !== 'ADMIN' && actor.role !== 'MANAGER')) {
      throw new ForbiddenException(
        'Only system administrators and managers can create organizations',
      );
    }
    const existing = await this.prisma.organization.findUnique({
      where: { slug: dto.slug },
    });
    if (existing)
      throw new ConflictException('Organization slug already exists');

    return this.prisma.organization.create({
      data: {
        name: dto.name,
        slug: dto.slug,
        createdById: userId,
        members: { create: { userId, role: OrganizationRole.OWNER } },
      },
      include: {
        members: { include: { user: { select: { id: true, email: true } } } },
      },
    });
  }

  findMine(userId: string) {
    return this.prisma.organization.findMany({
      where: { members: { some: { userId } } },
      orderBy: { createdAt: 'desc' },
      include: {
        members: {
          where: { userId },
          select: {
            id: true,
            role: true,
            departmentId: true,
            departmentRole: true,
            department: { select: { id: true, name: true, code: true } },
          },
        },
      },
    });
  }

  async getMembership(userId: string, organizationId: string) {
    if (!organizationId) {
      throw new BadRequestException('X-Organization-Id header is required');
    }
    const membership = await this.prisma.organizationMember.findUnique({
      where: { organizationId_userId: { organizationId, userId } },
    });
    if (!membership)
      throw new ForbiddenException('User is not a member of this organization');
    return membership;
  }

  async getDefaultOrganizationId() {
    const organization = await this.prisma.organization.findUnique({
      where: { slug: 'acme-procurement' },
      select: { id: true },
    });
    if (!organization)
      throw new NotFoundException('Default organization not found');
    return organization.id;
  }

  async addMember(userId: string, organizationId: string, dto: AddMemberDto) {
    await this.requireManager(userId, organizationId);
    if (dto.role === OrganizationRole.OWNER) {
      throw new ForbiddenException(
        'The owner role can only be assigned during organization creation',
      );
    }
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (!user)
      throw new NotFoundException('User with this email was not found');
    const existing = await this.prisma.organizationMember.findUnique({
      where: { organizationId_userId: { organizationId, userId: user.id } },
    });
    if (existing)
      throw new ConflictException('User is already an organization member');
    return this.prisma.organizationMember.create({
      data: {
        organizationId,
        userId: user.id,
        role: dto.role ?? OrganizationRole.MEMBER,
      },
      include: { user: { select: { id: true, email: true, role: true } } },
    });
  }

  async listMembers(userId: string, organizationId: string) {
    const member = await this.getMembership(userId, organizationId);
    if (!managesOrganization(member) && !leadsDepartment(member))
      throw new ForbiddenException(
        'Organization manager or department lead permission is required',
      );
    return this.prisma.organizationMember.findMany({
      where: {
        organizationId,
        ...(!managesOrganization(member)
          ? { departmentId: member.departmentId }
          : {}),
      },
      orderBy: { createdAt: 'asc' },
      include: {
        user: { select: { id: true, email: true, role: true } },
        department: { select: { id: true, name: true, code: true } },
      },
    });
  }

  async createDepartment(
    userId: string,
    organizationId: string,
    dto: CreateDepartmentDto,
  ) {
    await this.requireManager(userId, organizationId);
    try {
      return await this.prisma.department.create({
        data: {
          organizationId,
          createdById: userId,
          name: dto.name,
          code: dto.code,
        },
      });
    } catch (error) {
      this.handleDepartmentConflict(error);
    }
  }

  async listDepartments(userId: string, organizationId: string) {
    const member = await this.getMembership(userId, organizationId);
    return this.prisma.department.findMany({
      where: {
        organizationId,
        ...(!managesOrganization(member)
          ? { id: member.departmentId ?? '' }
          : {}),
      },
      orderBy: { name: 'asc' },
      include: { _count: { select: { members: true } } },
    });
  }

  async assignDepartment(
    userId: string,
    organizationId: string,
    memberId: string,
    dto: AssignDepartmentDto,
  ) {
    await this.requireManager(userId, organizationId);
    if (dto.departmentRole === 'LEAD' && !dto.departmentId)
      throw new BadRequestException(
        'Assign a department before appointing its lead',
      );
    return this.prisma
      .$transaction(async (tx) => {
        const member = await tx.organizationMember.findFirst({
          where: { id: memberId, organizationId },
        });
        if (!member)
          throw new NotFoundException('Organization member not found');
        if (dto.departmentId) {
          const department = await tx.department.findFirst({
            where: { id: dto.departmentId, organizationId },
          });
          if (!department)
            throw new NotFoundException(
              'Department not found in this organization',
            );
        }
        // Full replacement makes repeat calls safe. The partial unique index prevents two leads in races.
        return tx.organizationMember.update({
          where: { id: memberId, organizationId },
          data: {
            departmentId: dto.departmentId,
            departmentRole: dto.departmentRole,
          },
          include: {
            user: { select: { id: true, email: true, role: true } },
            department: { select: { id: true, name: true, code: true } },
          },
        });
      })
      .catch((error: unknown) => {
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === 'P2002'
        )
          throw new ConflictException(
            'This department already has a lead. Reassign the current lead first.',
          );
        throw error;
      });
  }

  async updateDepartment(
    userId: string,
    organizationId: string,
    departmentId: string,
    dto: UpdateDepartmentDto,
  ) {
    const member = await this.getMembership(userId, organizationId);
    if (
      !managesOrganization(member) &&
      !(leadsDepartment(member) && member.departmentId === departmentId)
    )
      throw new ForbiddenException(
        'You can only manage your assigned department',
      );
    const department = await this.prisma.department.findFirst({
      where: { id: departmentId, organizationId },
    });
    if (!department)
      throw new NotFoundException('Department not found in this organization');
    try {
      return await this.prisma.department.update({
        where: { id: departmentId, organizationId },
        data: dto,
      });
    } catch (error) {
      this.handleDepartmentConflict(error);
    }
  }

  private handleDepartmentConflict(error: unknown): never {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    )
      throw new ConflictException(
        'Department code already exists in this organization',
      );
    throw error;
  }

  private async requireManager(userId: string, organizationId: string) {
    const membership = await this.getMembership(userId, organizationId);
    const managerRoles: OrganizationRole[] = [
      OrganizationRole.OWNER,
      OrganizationRole.MANAGER,
    ];
    if (!managerRoles.includes(membership.role)) {
      throw new ForbiddenException(
        'Organization manager permission is required',
      );
    }
    return membership;
  }
}
