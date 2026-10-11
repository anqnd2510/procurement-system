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

@ApiTags('Dashboard')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
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
    description: 'User is not an organization member',
  })
  async getSummary(
    @CurrentUser() user: User,
    @Headers('x-organization-id') organizationId: string,
  ): Promise<DashboardSummaryDto> {
    return this.dashboardService.getSummary(user.id, organizationId);
  }
}
