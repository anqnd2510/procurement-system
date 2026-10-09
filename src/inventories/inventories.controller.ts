import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Role } from '@prisma/client';

import { InventoriesService } from './inventories.service';
import { StockInDto } from './dto/stock-in.dto';
import { InventoryResponseDto } from './dto/inventory-response.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Public } from '../common/decorators/public.decorator';

@ApiTags('Inventories')
@Controller('inventories')
export class InventoriesController {
  constructor(private readonly inventoriesService: InventoriesService) {}

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

  // ─── POST /inventories/stock-in — admin only ───────────────────────────────

  @Post('stock-in')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth('JWT-auth')
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
  async stockIn(@Body() dto: StockInDto): Promise<InventoryResponseDto> {
    return this.inventoriesService.stockIn(dto);
  }
}
