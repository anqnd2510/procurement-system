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
  ApiResponse,
  ApiTags,
  ApiParam,
} from '@nestjs/swagger';

import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { ProductResponseDto } from './dto/product-response.dto';

import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

import { Role } from '@prisma/client';
import { Public } from 'src/common/decorators/public.decorator';

@ApiTags('Products')
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Create a new product',
  })
  @ApiResponse({
    status: 201,
    description: 'Product created successfully',
    type: ProductResponseDto,
  })
  @ApiResponse({
    status: 409,
    description: 'SKU already exists',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden',
  })
  async create(@Body() dto: CreateProductDto): Promise<ProductResponseDto> {
    return this.productsService.createProduct(dto);
  }

  @Public()
  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Get a product by ID',
  })
  @ApiParam({
    name: 'id',
    type: 'string',
    format: 'uuid',
    description: 'Product UUID',
    example: '8b67af55-7655-4d05-92be-3de79075e6e4',
  })
  @ApiResponse({
    status: 200,
    description: 'Product retrieved successfully',
    type: ProductResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Product not found',
  })
  async getById(@Param('id') id: string): Promise<ProductResponseDto> {
    console.log(`Fetching product with ID: ${id}`);
    return this.productsService.getProductById(id);
  }
}
