import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { User } from '../auth/interfaces/user.interface';
import { AddMemberDto } from './dto/add-member.dto';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { OrganizationsService } from './organizations.service';
import { AssignDepartmentDto } from './dto/assign-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';

@ApiTags('Organizations')
@ApiBearerAuth('JWT-auth')
@Controller('organizations')
export class OrganizationsController {
  constructor(private readonly organizationsService: OrganizationsService) {}

  @Patch(':organizationId/members/:memberId/department')
  @ApiOperation({
    summary:
      'Replace primary department and department role — organization owner or manager only',
    description:
      'Idempotent assignment. One primary department per membership and one lead per department. Cross-organization assignments are rejected.',
  })
  @ApiResponse({
    status: 409,
    description:
      'The department already has a lead; reassign the current lead first',
  })
  assignDepartment(
    @CurrentUser() user: User,
    @Param('organizationId', ParseUUIDPipe) organizationId: string,
    @Param('memberId', ParseUUIDPipe) memberId: string,
    @Body() dto: AssignDepartmentDto,
  ) {
    return this.organizationsService.assignDepartment(
      user.id,
      organizationId,
      memberId,
      dto,
    );
  }

  @Patch(':organizationId/departments/:departmentId')
  @ApiOperation({
    summary:
      'Update department identity — organization manager or its assigned department lead',
  })
  @ApiResponse({ status: 403, description: 'Cannot manage another department' })
  updateDepartment(
    @CurrentUser() user: User,
    @Param('organizationId', ParseUUIDPipe) organizationId: string,
    @Param('departmentId', ParseUUIDPipe) departmentId: string,
    @Body() dto: UpdateDepartmentDto,
  ) {
    return this.organizationsService.updateDepartment(
      user.id,
      organizationId,
      departmentId,
      dto,
    );
  }

  @Post()
  @ApiOperation({
    summary: 'Create an organization — system administrator or manager only',
  })
  @ApiResponse({
    status: 403,
    description:
      'System ADMIN or MANAGER role required; public registration cannot grant these roles',
  })
  create(@CurrentUser() user: User, @Body() dto: CreateOrganizationDto) {
    return this.organizationsService.create(user.id, dto);
  }

  @Get('mine')
  @ApiOperation({ summary: 'List organizations for the current user' })
  findMine(@CurrentUser() user: User) {
    return this.organizationsService.findMine(user.id);
  }

  @Get(':organizationId/members')
  @ApiOperation({
    summary:
      'List organization members — managers see the organization; department leads see only their team',
  })
  @ApiResponse({
    status: 403,
    description:
      'Organization manager or assigned department lead permission required',
  })
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
