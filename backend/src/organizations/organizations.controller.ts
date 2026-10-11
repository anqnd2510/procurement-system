import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { User } from '../auth/interfaces/user.interface';
import { AddMemberDto } from './dto/add-member.dto';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { OrganizationsService } from './organizations.service';

@ApiTags('Organizations')
@ApiBearerAuth('JWT-auth')
@Controller('organizations')
export class OrganizationsController {
  constructor(private readonly organizationsService: OrganizationsService) {}

  @Post()
  @ApiOperation({ summary: 'Create an organization and become its owner' })
  create(@CurrentUser() user: User, @Body() dto: CreateOrganizationDto) {
    return this.organizationsService.create(user.id, dto);
  }

  @Get('mine')
  @ApiOperation({ summary: 'List organizations for the current user' })
  findMine(@CurrentUser() user: User) {
    return this.organizationsService.findMine(user.id);
  }

  @Get(':organizationId/members')
  @ApiOperation({ summary: 'List organization members' })
  listMembers(
    @CurrentUser() user: User,
    @Param('organizationId') organizationId: string,
  ) {
    return this.organizationsService.listMembers(user.id, organizationId);
  }

  @Post(':organizationId/members')
  @ApiOperation({ summary: 'Add an existing user to an organization' })
  addMember(
    @CurrentUser() user: User,
    @Param('organizationId') organizationId: string,
    @Body() dto: AddMemberDto,
  ) {
    return this.organizationsService.addMember(user.id, organizationId, dto);
  }

  @Get(':organizationId/departments')
  @ApiOperation({ summary: 'List organization departments' })
  listDepartments(
    @CurrentUser() user: User,
    @Param('organizationId') organizationId: string,
  ) {
    return this.organizationsService.listDepartments(user.id, organizationId);
  }

  @Post(':organizationId/departments')
  @ApiOperation({ summary: 'Create an organization department' })
  createDepartment(
    @CurrentUser() user: User,
    @Param('organizationId') organizationId: string,
    @Body() dto: CreateDepartmentDto,
  ) {
    return this.organizationsService.createDepartment(
      user.id,
      organizationId,
      dto,
    );
  }
}
