import { Controller, Get, Headers, Query, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiHeader,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { OrganizationRole } from '@prisma/client';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { OrganizationRoles } from '../common/decorators/organization-roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { OrganizationRolesGuard } from '../common/guards/organization-roles.guard';
import type { User } from '../auth/interfaces/user.interface';
import { AuditLogQueryDto } from './dto/audit-log-query.dto';
import { AuditLogsService } from './audit-logs.service';
import { AuditFilterOptionsResponseDto } from './dto/audit-filter-options-response.dto';

@ApiTags('Audit Logs')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, OrganizationRolesGuard)
@OrganizationRoles(OrganizationRole.OWNER, OrganizationRole.MANAGER)
@Controller('audit-logs')
export class AuditLogsController {
  constructor(private readonly auditLogs: AuditLogsService) {}

  @Get('filters')
  @ApiOperation({ summary: 'List available organization audit filters' })
  @ApiHeader({ name: 'X-Organization-Id', required: true })
  @ApiResponse({ status: 200, type: AuditFilterOptionsResponseDto })
  async filters(
    @CurrentUser() user: User,
    @Headers('x-organization-id') organizationId: string,
  ) {
    return this.auditLogs.findFilterOptions(user.id, organizationId);
  }

  @Get()
  @ApiOperation({
    summary: 'List organization audit events',
    description: 'Returns recent audit events with optional filters.',
  })
  @ApiHeader({ name: 'X-Organization-Id', required: true })
  @ApiResponse({ status: 200, description: 'Audit events returned' })
  async findAll(
    @CurrentUser() user: User,
    @Headers('x-organization-id') organizationId: string,
    @Query() query: AuditLogQueryDto,
  ) {
    return this.auditLogs.findAll(user.id, organizationId, query);
  }
}
