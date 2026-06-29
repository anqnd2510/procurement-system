import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductResponseDto } from './dto/product-response.dto';
import { PRODUCT_SELECT } from './types/product.type';
import { ProductHelper } from './helpers/product.helper';
import {
  getPaginationParams,
  paginate,
  PaginatedResponse,
} from 'src/common/paginations/paginated-response';
import { PaginationQuery } from 'src/common/paginations/pagination-query';
@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  // ─── Create ────────────────────────────────────────────────────────────────

  async create(dto: CreateProductDto): Promise<ProductResponseDto> {
    const existing = await this.prisma.product.findUnique({
      where: { sku: dto.sku },
    });
    if (existing) {
      throw new ConflictException(`SKU "${dto.sku}" already exists`);
    }

    if (dto.categoryId) {
      const category = await this.prisma.category.findFirst({
        where: { id: dto.categoryId, deletedAt: null },
      });
      if (!category) {
        throw new NotFoundException(`Category ${dto.categoryId} not found`);
      }
    }

    const product = await this.prisma.product.create({
      data: {
        name: dto.name,
        sku: dto.sku,
        description: dto.description,
        unit_price: dto.unit_price,
        categoryId: dto.categoryId ?? null,
      },
      select: PRODUCT_SELECT,
    });

    return ProductHelper.toDto(product);
  }

  // ─── Get all ───────────────────────────────────────────────────────────────

  async findAll(
    query: PaginationQuery,
  ): Promise<PaginatedResponse<ProductResponseDto>> {
    const { page = 1, limit = 10 } = query;
    const { skip, take } = getPaginationParams(page, limit);

    const where = { deletedAt: null };

    const [products, total] = await this.prisma.$transaction([
      this.prisma.product.findMany({
        where,
        select: PRODUCT_SELECT,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      this.prisma.product.count({ where }),
    ]);

    return paginate(
      products.map((p) => ProductHelper.toDto(p)),
      total,
      page,
      limit,
    );
  }

  // ─── Get one ───────────────────────────────────────────────────────────────

  async findOne(id: string): Promise<ProductResponseDto> {
    const product = await this.prisma.product.findFirst({
      where: { id, deletedAt: null },
      select: PRODUCT_SELECT,
    });

    if (!product) {
      throw new NotFoundException(`Product ${id} not found`);
    }

    return ProductHelper.toDto(product);
  }

  // ─── Get by category ───────────────────────────────────────────────────────

  async findByCategory(categoryId: string): Promise<ProductResponseDto[]> {
    // Validate category is existed?
    const category = await this.prisma.category.findFirst({
      where: { id: categoryId, deletedAt: null },
    });
    if (!category) {
      throw new NotFoundException(`Category ${categoryId} not found`);
    }

    const products = await this.prisma.product.findMany({
      where: { categoryId, deletedAt: null },
      select: PRODUCT_SELECT,
      orderBy: { createdAt: 'desc' },
    });

    return products.map((p) => ProductHelper.toDto(p));
  }

  // ─── Update ────────────────────────────────────────────────────────────────

  async update(id: string, dto: UpdateProductDto): Promise<ProductResponseDto> {
    const existing = await this.prisma.product.findFirst({
      where: { id, deletedAt: null },
    });
    if (!existing) {
      throw new NotFoundException(`Product ${id} not found`);
    }

    // Check SKU conflict nếu đang đổi SKU
    if (dto.sku && dto.sku !== existing.sku) {
      const skuConflict = await this.prisma.product.findUnique({
        where: { sku: dto.sku },
      });
      if (skuConflict) {
        throw new ConflictException(`SKU "${dto.sku}" already exists`);
      }
    }

    // Validate categoryId nếu có
    if (dto.categoryId) {
      const category = await this.prisma.category.findFirst({
        where: { id: dto.categoryId, deletedAt: null },
      });
      if (!category) {
        throw new NotFoundException(`Category ${dto.categoryId} not found`);
      }
    }

    const updated = await this.prisma.product.update({
      where: { id },
      data: {
        ...(dto.name && { name: dto.name }),
        ...(dto.sku && { sku: dto.sku }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.unit_price !== undefined && { unit_price: dto.unit_price }),
        ...(dto.categoryId !== undefined && {
          categoryId: dto.categoryId ?? null,
        }),
      },
      select: PRODUCT_SELECT,
    });

    return ProductHelper.toDto(updated);
  }

  // ─── Soft delete ───────────────────────────────────────────────────────────

  async remove(id: string): Promise<{ message: string }> {
    const existing = await this.prisma.product.findFirst({
      where: { id, deletedAt: null },
    });
    if (!existing) {
      throw new NotFoundException(`Product ${id} not found`);
    }

    await this.prisma.product.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return { message: `Product ${id} deleted successfully` };
  }
}
