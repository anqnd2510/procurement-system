import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiHeader,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { OrganizationRole } from '@prisma/client';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { OrganizationRoles } from '../common/decorators/organization-roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { OrganizationRolesGuard } from '../common/guards/organization-roles.guard';
import type { User } from '../auth/interfaces/user.interface';
import { CreatePurchaseOrderDto } from './dto/create-purchase-order.dto';
import { PurchaseOrdersService } from './purchase-orders.service';

@ApiTags('Purchase Orders')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('purchase-orders')
export class PurchaseOrdersController {
  constructor(private readonly purchaseOrdersService: PurchaseOrdersService) {}

  @Post('from-request/:purchaseRequestId')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(OrganizationRolesGuard)
  @OrganizationRoles(OrganizationRole.OWNER, OrganizationRole.MANAGER)
  @ApiOperation({ summary: 'Create a purchase order from an approved request' })
  @ApiParam({ name: 'purchaseRequestId', format: 'uuid' })
  @ApiHeader({ name: 'X-Organization-Id', required: true })
  @ApiResponse({ status: 201, description: 'Purchase order created' })
  async createFromRequest(
    @Param('purchaseRequestId') purchaseRequestId: string,
    @Body() dto: CreatePurchaseOrderDto,
    @CurrentUser() user: User,
    @Headers('x-organization-id') organizationId: string,
  ) {
    return this.purchaseOrdersService.createFromRequest(
      purchaseRequestId,
      user.id,
      organizationId,
      dto,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a purchase order by ID' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiHeader({ name: 'X-Organization-Id', required: true })
  @ApiResponse({ status: 200, description: 'Purchase order returned' })
  @ApiResponse({ status: 404, description: 'Purchase order not found' })
  async findOne(
    @Param('id') id: string,
    @CurrentUser() user: User,
    @Headers('x-organization-id') organizationId: string,
  ) {
    return this.purchaseOrdersService.findOne(id, user.id, organizationId);
  }

  @Post(':id/issue')
  @HttpCode(HttpStatus.OK)
  @UseGuards(OrganizationRolesGuard)
  @OrganizationRoles(OrganizationRole.OWNER, OrganizationRole.MANAGER)
  @ApiOperation({ summary: 'Issue a draft purchase order to its supplier' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiHeader({ name: 'X-Organization-Id', required: true })
  @ApiResponse({ status: 200, description: 'Purchase order issued' })
  @ApiResponse({ status: 409, description: 'Purchase order is not a draft' })
  async issue(
    @Param('id') id: string,
    @CurrentUser() user: User,
    @Headers('x-organization-id') organizationId: string,
  ) {
    return this.purchaseOrdersService.issue(id, user.id, organizationId);
  }

  @Post(':id/receive')
  @HttpCode(HttpStatus.OK)
  @UseGuards(OrganizationRolesGuard)
  @OrganizationRoles(OrganizationRole.OWNER, OrganizationRole.MANAGER)
  @ApiOperation({ summary: 'Receive an issued purchase order into inventory' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiHeader({ name: 'X-Organization-Id', required: true })
  @ApiResponse({ status: 200, description: 'Purchase order received' })
  @ApiResponse({
    status: 409,
    description: 'Purchase order cannot be received',
  })
  async receive(
    @Param('id') id: string,
    @CurrentUser() user: User,
    @Headers('x-organization-id') organizationId: string,
  ) {
    return this.purchaseOrdersService.receive(id, user.id, organizationId);
  }

  @Post(':id/cancel')
  @HttpCode(HttpStatus.OK)
  @UseGuards(OrganizationRolesGuard)
  @OrganizationRoles(OrganizationRole.OWNER, OrganizationRole.MANAGER)
  @ApiOperation({ summary: 'Cancel a draft or issued purchase order' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiHeader({ name: 'X-Organization-Id', required: true })
  @ApiResponse({ status: 200, description: 'Purchase order cancelled' })
  @ApiResponse({
    status: 409,
    description: 'Purchase order cannot be cancelled',
  })
  async cancel(
    @Param('id') id: string,
    @CurrentUser() user: User,
    @Headers('x-organization-id') organizationId: string,
  ) {
    return this.purchaseOrdersService.cancel(id, user.id, organizationId);
  }
}
