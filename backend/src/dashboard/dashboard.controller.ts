import { Controller, Get, Headers, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiHeader,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { User } from '../auth/interfaces/user.interface';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { DashboardSummaryDto } from './dto/dashboard-summary.dto';
import { DashboardService } from './dashboard.service';
import { OrganizationRole } from '@prisma/client';
import { OrganizationRolesGuard } from '../common/guards/organization-roles.guard';
import { OrganizationRoles } from '../common/decorators/organization-roles.decorator';

@ApiTags('Dashboard')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, OrganizationRolesGuard)
@OrganizationRoles(OrganizationRole.OWNER, OrganizationRole.MANAGER)
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('summary')
  @ApiOperation({
    summary: 'Get organization dashboard KPIs',
    description:
      'Returns live, organization-scoped request, order, catalog, and inventory aggregates.',
  })
  @ApiHeader({
    name: 'X-Organization-Id',
    required: true,
    description: 'Organization whose metrics should be summarized',
  })
  @ApiResponse({ status: 200, type: DashboardSummaryDto })
  @ApiResponse({
    status: 403,
    description: 'Organization owner or manager permission required',
  })
  async getSummary(
    @CurrentUser() user: User,
    @Headers('x-organization-id') organizationId: string,
  ): Promise<DashboardSummaryDto> {
    return this.dashboardService.getSummary(user.id, organizationId);
  }
}
