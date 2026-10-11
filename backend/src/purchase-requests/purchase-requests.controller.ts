import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
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
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { OrganizationRoles } from '../common/decorators/organization-roles.decorator';
import { OrganizationRolesGuard } from '../common/guards/organization-roles.guard';
import type { User } from '../auth/interfaces/user.interface';
import { ApprovePurchaseRequestDto } from './dto/approve-purchase-request.dto';
import { CreatePurchaseRequestDto } from './dto/create-purchase-request.dto';
import { PurchaseRequestQueryDto } from './dto/purchase-request-query.dto';
import { RejectPurchaseRequestDto } from './dto/reject-purchase-request.dto';
import { UpdatePurchaseRequestDto } from './dto/update-purchase-request.dto';
import { PurchaseRequestsService } from './purchase-requests.service';

@ApiTags('Purchase Requests')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('purchase-requests')
export class PurchaseRequestsController {
  constructor(
    private readonly purchaseRequestsService: PurchaseRequestsService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a purchase request',
    description:
      'Creates a draft purchase request for the selected organization.',
  })
  @ApiResponse({ status: 201, description: 'Purchase request created' })
  @ApiHeader({
    name: 'Idempotency-Key',
    required: false,
    description: 'Stable key used to safely retry request creation',
  })
  @ApiResponse({ status: 400, description: 'Invalid request data' })
  @ApiResponse({
    status: 403,
    description: 'User is not an organization member',
  })
  async create(
    @Body() dto: CreatePurchaseRequestDto,
    @CurrentUser() user: User,
    @Headers('x-organization-id') organizationId: string,
    @Headers('idempotency-key') idempotencyKey?: string,
  ) {
    return this.purchaseRequestsService.create(
      user.id,
      organizationId,
      dto,
      idempotencyKey,
    );
  }

  @Get()
  @ApiOperation({
    summary: 'List purchase requests',
    description: 'Lists purchase requests within the selected organization.',
  })
  @ApiResponse({ status: 200, description: 'Purchase requests returned' })
  async findAll(
    @CurrentUser() user: User,
    @Headers('x-organization-id') organizationId: string,
    @Query() query: PurchaseRequestQueryDto,
  ) {
    return this.purchaseRequestsService.findAll(user.id, organizationId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a purchase request by ID' })
  @ApiParam({
    name: 'id',
    format: 'uuid',
    description: 'Purchase request UUID',
  })
  @ApiResponse({ status: 200, description: 'Purchase request returned' })
  @ApiResponse({ status: 404, description: 'Purchase request not found' })
  async findOne(
    @Param('id') id: string,
    @CurrentUser() user: User,
    @Headers('x-organization-id') organizationId: string,
  ) {
    return this.purchaseRequestsService.findOne(id, user.id, organizationId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a draft purchase request' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Purchase request updated' })
  @ApiResponse({ status: 409, description: 'Request is not in draft status' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdatePurchaseRequestDto,
    @CurrentUser() user: User,
    @Headers('x-organization-id') organizationId: string,
  ) {
    return this.purchaseRequestsService.update(
      id,
      user.id,
      organizationId,
      dto,
    );
  }

  @Post(':id/submit')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Submit a draft purchase request' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Purchase request submitted' })
  async submit(
    @Param('id') id: string,
    @CurrentUser() user: User,
    @Headers('x-organization-id') organizationId: string,
  ) {
    return this.purchaseRequestsService.submit(id, user.id, organizationId);
  }

  @Post(':id/approve')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Approve a submitted request — organization manager or assigned department lead',
    description:
      'Self-approval and cross-department lead approvals are forbidden.',
  })
  @ApiResponse({
    status: 403,
    description: 'Approval permission required; cannot approve own request',
  })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Purchase request approved' })
  async approve(
    @Param('id') id: string,
    @Body() dto: ApprovePurchaseRequestDto,
    @CurrentUser() user: User,
    @Headers('x-organization-id') organizationId: string,
  ) {
    return this.purchaseRequestsService.approve(
      id,
      user.id,
      organizationId,
      dto,
    );
  }

  @Post(':id/reject')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Reject a submitted request — organization manager or assigned department lead',
    description:
      'Cannot reject own request or requests outside the department lead scope.',
  })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Purchase request rejected' })
  async reject(
    @Param('id') id: string,
    @Body() dto: RejectPurchaseRequestDto,
    @CurrentUser() user: User,
    @Headers('x-organization-id') organizationId: string,
  ) {
    return this.purchaseRequestsService.reject(
      id,
      user.id,
      organizationId,
      dto,
    );
  }

  @Post(':id/cancel')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancel a draft or submitted purchase request' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Purchase request cancelled' })
  async cancel(
    @Param('id') id: string,
    @CurrentUser() user: User,
    @Headers('x-organization-id') organizationId: string,
  ) {
    return this.purchaseRequestsService.cancel(id, user.id, organizationId);
  }

  @Post(':id/fulfill')
  @HttpCode(HttpStatus.OK)
  @UseGuards(OrganizationRolesGuard)
  @OrganizationRoles(OrganizationRole.OWNER, OrganizationRole.MANAGER)
  @ApiOperation({ summary: 'Fulfill an approved purchase request' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiHeader({ name: 'X-Organization-Id', required: true })
  @ApiResponse({ status: 200, description: 'Purchase request fulfilled' })
  @ApiResponse({ status: 409, description: 'Request cannot be fulfilled' })
  async fulfill(
    @Param('id') id: string,
    @CurrentUser() user: User,
    @Headers('x-organization-id') organizationId: string,
  ) {
    return this.purchaseRequestsService.fulfill(id, user.id, organizationId);
  }
}
