import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
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

import { InventoriesService } from './inventories.service';
import { StockInDto } from './dto/stock-in.dto';
import { InventoryResponseDto } from './dto/inventory-response.dto';
import { InventoryTransactionQueryDto } from './dto/inventory-transaction-query.dto';
import { PaginatedInventoryTransactionResponseDto } from './dto/inventory-transaction-response.dto';
import { UpdateReorderPolicyDto } from './dto/update-reorder-policy.dto';
import {
  PaginatedReorderAlertResponseDto,
  ReorderPolicyResponseDto,
} from './dto/reorder-alert-response.dto';
import { ReorderAlertQueryDto } from './dto/reorder-alert-query.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { OrganizationRolesGuard } from '../common/guards/organization-roles.guard';
import { OrganizationRoles } from '../common/decorators/organization-roles.decorator';
import { Public } from '../common/decorators/public.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { User } from '../auth/interfaces/user.interface';

@ApiTags('Inventories')
@Controller('inventories')
export class InventoriesController {
  constructor(private readonly inventoriesService: InventoriesService) {}

  @Get('workspace/reorder-alerts')
  @UseGuards(JwtAuthGuard, OrganizationRolesGuard)
  @OrganizationRoles(OrganizationRole.OWNER, OrganizationRole.MANAGER)
  @ApiBearerAuth('JWT-auth')
  @ApiHeader({
    name: 'X-Organization-Id',
    required: true,
    schema: { type: 'string', format: 'uuid' },
  })
  @ApiOperation({
    summary: 'List inventory items at or below their reorder point',
    description:
      'Calculates alerts synchronously. Incoming quantity includes items on issued purchase orders only; no background job is used.',
  })
  @ApiResponse({ status: 200, type: PaginatedReorderAlertResponseDto })
  @ApiResponse({ status: 403, description: 'Owner or manager role required' })
  findReorderAlerts(
    @CurrentUser() user: User,
    @Headers('x-organization-id') organizationId: string,
    @Query() query: ReorderAlertQueryDto,
  ) {
    return this.inventoriesService.findReorderAlerts(
      user.id,
      organizationId,
      query,
    );
  }

  @Get('workspace/:productId/reorder-policy')
  @UseGuards(JwtAuthGuard, OrganizationRolesGuard)
  @OrganizationRoles(OrganizationRole.OWNER, OrganizationRole.MANAGER)
  @ApiBearerAuth('JWT-auth')
  @ApiHeader({
    name: 'X-Organization-Id',
    required: true,
    schema: { type: 'string', format: 'uuid' },
  })
  @ApiParam({ name: 'productId', format: 'uuid' })
  @ApiOperation({ summary: 'Read a product reorder policy' })
  @ApiResponse({ status: 200, type: ReorderPolicyResponseDto })
  @ApiResponse({ status: 403, description: 'Owner or manager role required' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  findReorderPolicy(
    @Param('productId', ParseUUIDPipe) productId: string,
    @CurrentUser() user: User,
    @Headers('x-organization-id') organizationId: string,
  ) {
    return this.inventoriesService.findReorderPolicy(
      productId,
      user.id,
      organizationId,
    );
  }

  @Put('workspace/:productId/reorder-policy')
  @UseGuards(JwtAuthGuard, OrganizationRolesGuard)
  @OrganizationRoles(OrganizationRole.OWNER, OrganizationRole.MANAGER)
  @ApiBearerAuth('JWT-auth')
  @ApiHeader({
    name: 'X-Organization-Id',
    required: true,
    schema: { type: 'string', format: 'uuid' },
  })
  @ApiParam({ name: 'productId', format: 'uuid' })
  @ApiOperation({
    summary: 'Set or disable a product reorder policy',
    description:
      'Both values are required. Set both to null to disable alerts. Creating a policy also creates a zero-stock inventory record if needed.',
  })
  @ApiResponse({ status: 200, type: ReorderPolicyResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid reorder policy values' })
  @ApiResponse({ status: 403, description: 'Owner or manager role required' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  updateReorderPolicy(
    @Param('productId', ParseUUIDPipe) productId: string,
    @CurrentUser() user: User,
    @Headers('x-organization-id') organizationId: string,
    @Body() dto: UpdateReorderPolicyDto,
  ) {
    return this.inventoriesService.updateReorderPolicy(
      productId,
      user.id,
      organizationId,
      dto,
    );
  }

  @Get('workspace/:productId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiHeader({
    name: 'X-Organization-Id',
    required: true,
    schema: { type: 'string', format: 'uuid' },
  })
  @ApiOperation({
    summary: 'Get active product stock in the selected organization',
  })
  @ApiParam({ name: 'productId', format: 'uuid' })
  @ApiResponse({ status: 200, type: InventoryResponseDto })
  @ApiResponse({ status: 403, description: 'Organization membership required' })
  @ApiResponse({ status: 404, description: 'Inventory not found' })
  findWorkspace(
    @Param('productId', ParseUUIDPipe) productId: string,
    @CurrentUser() user: User,
    @Headers('x-organization-id') organizationId: string,
  ) {
    return this.inventoriesService.findWorkspace(
      productId,
      user.id,
      organizationId,
    );
  }

  // ─── GET /inventories/:productId — public ──────────────────────────────────

  @Public()
  @Get(':productId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get inventory by product ID',
    description: 'Returns current stock levels for a specific product',
  })
  @ApiParam({
    name: 'productId',
    type: 'string',
    format: 'uuid',
    description: 'Product UUID',
    example: '8b67af55-7655-4d05-92be-3de79075e6e4',
  })
  @ApiResponse({
    status: 200,
    description: 'Inventory record found',
    type: InventoryResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Inventory not found' })
  async findByProductId(
    @Param('productId') productId: string,
  ): Promise<InventoryResponseDto> {
    return this.inventoriesService.findByProductId(productId);
  }

  @Get(':productId/transactions')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiHeader({
    name: 'X-Organization-Id',
    required: true,
    description: 'Organization scope for this inventory history',
  })
  @ApiOperation({
    summary: 'List inventory transactions for a product',
    description:
      'Returns the organization-scoped inventory ledger in reverse chronological order.',
  })
  @ApiParam({ name: 'productId', type: 'string', format: 'uuid' })
  @ApiResponse({
    status: 200,
    description: 'Paginated inventory history returned',
    type: PaginatedInventoryTransactionResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'User is not an organization member',
  })
  @ApiResponse({ status: 404, description: 'Product inventory not found' })
  async findTransactions(
    @Param('productId') productId: string,
    @CurrentUser() user: User,
    @Headers('x-organization-id') organizationId: string,
    @Query() query: InventoryTransactionQueryDto,
  ) {
    return this.inventoriesService.findTransactions(
      productId,
      user.id,
      organizationId,
      query,
    );
  }

  // ─── POST /inventories/stock-in — admin only ───────────────────────────────

  @Post('stock-in')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, OrganizationRolesGuard)
  @OrganizationRoles(OrganizationRole.OWNER, OrganizationRole.MANAGER)
  @ApiBearerAuth('JWT-auth')
  @ApiHeader({
    name: 'X-Organization-Id',
    required: true,
    description: 'Organization scope for the stock-in operation',
  })
  @ApiOperation({
    summary: 'Stock in — admin only',
    description:
      'Add quantity to a product inventory. Creates inventory record if it does not exist yet.',
  })
  @ApiResponse({
    status: 200,
    description: 'Stock updated successfully',
    type: InventoryResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Product not found' })
  @ApiResponse({ status: 403, description: 'Forbidden — admin only' })
  async stockIn(
    @Body() dto: StockInDto,
    @CurrentUser() user: User,
    @Headers('x-organization-id') organizationId: string,
  ): Promise<InventoryResponseDto> {
    return this.inventoriesService.stockIn(dto, user.id, organizationId);
  }
}
