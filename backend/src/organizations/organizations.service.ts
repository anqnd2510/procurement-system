import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { OrganizationRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AddMemberDto } from './dto/add-member.dto';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { CreateOrganizationDto } from './dto/create-organization.dto';

@Injectable()
export class OrganizationsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateOrganizationDto) {
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
      include: { members: { where: { userId }, select: { role: true } } },
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
    await this.getMembership(userId, organizationId);
    return this.prisma.organizationMember.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'asc' },
      include: { user: { select: { id: true, email: true, role: true } } },
    });
  }

  async createDepartment(
    userId: string,
    organizationId: string,
    dto: CreateDepartmentDto,
  ) {
    await this.requireManager(userId, organizationId);
    return this.prisma.department.create({
      data: {
        organizationId,
        createdById: userId,
        name: dto.name,
        code: dto.code,
      },
    });
  }

  async listDepartments(userId: string, organizationId: string) {
    await this.getMembership(userId, organizationId);
    return this.prisma.department.findMany({
      where: { organizationId },
      orderBy: { name: 'asc' },
    });
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
