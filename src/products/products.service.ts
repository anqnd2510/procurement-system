import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { CreateProductDto } from './dto/create-product.dto';
import { ProductResponseDto } from './dto/product-response.dto';
@Injectable()
export class ProductsService {
  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {}

  async createProduct(
    createProductDto: CreateProductDto,
  ): Promise<ProductResponseDto> {
    const existingProduct = await this.prisma.product.findUnique({
      where: {
        sku: createProductDto.sku,
      },
    });

    if (existingProduct) {
      throw new ConflictException('SKU already exists');
    }

    const product = await this.prisma.product.create({
      data: {
        name: createProductDto.name,
        sku: createProductDto.sku,
        description: createProductDto.description,
        unit_price: createProductDto.unit_price,
        categoryId: createProductDto.categoryId,
      },
    });

    return product;
  }

  async getProductById(id: string): Promise<ProductResponseDto> {
    const product = await this.prisma.product.findUnique({
      where: { id: id },
    });
    if (!product) {
      throw new NotFoundException('Product not found');
    }
    return product;
  }
}
