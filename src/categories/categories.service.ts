import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { CategoryResponseDto } from './dto/category-response.dto';
import { CategoryHelper } from './helpers/category.helper';

@Injectable()
export class CategoriesService {
  constructor(private prisma: PrismaService) {}

  // ─── Create ────────────────────────────────────────────────────────────────

  async create(dto: CreateCategoryDto): Promise<CategoryResponseDto> {
    // Check name unique (in scope non-deleted)
    const existing = await this.prisma.category.findFirst({
      where: { name: dto.name, deletedAt: null },
    });
    if (existing) {
      throw new ConflictException(`Category name "${dto.name}" already exists`);
    }

    // Validate parentId if it exists
    if (dto.parentId) {
      const parent = await this.prisma.category.findFirst({
        where: { id: dto.parentId, deletedAt: null },
      });
      if (!parent) {
        throw new NotFoundException(
          `Parent category ${dto.parentId} not found`,
        );
      }
    }

    const category = await this.prisma.category.create({
      data: {
        name: dto.name,
        description: dto.description,
        parentId: dto.parentId ?? null,
      },
      include: { children: true },
    });

    //return CategoryHelper.toChildDto(category, true);
    return CategoryHelper.toChildDto(category);
  }

  // ─── Get all (root categories + their children) ────────────────────────────

  async findAll(): Promise<CategoryResponseDto[]> {
    const categories = await this.prisma.category.findMany({
      where: { deletedAt: null },
      include: {
        children: {
          where: { deletedAt: null },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return categories.map((c) => CategoryHelper.toResponseDto(c, true));
  }

  // ─── Get one ───────────────────────────────────────────────────────────────

  async findOne(id: string): Promise<CategoryResponseDto> {
    const category = await this.prisma.category.findFirst({
      where: { id, deletedAt: null },
      include: {
        children: {
          where: { deletedAt: null },
        },
      },
    });

    if (!category) {
      throw new NotFoundException(`Category ${id} not found`);
    }

    return CategoryHelper.toResponseDto(category, true);
  }

  // ─── Update ────────────────────────────────────────────────────────────────

  async update(
    id: string,
    dto: UpdateCategoryDto,
  ): Promise<CategoryResponseDto> {
    // Check category is existed?
    const existing = await this.prisma.category.findFirst({
      where: { id, deletedAt: null },
    });
    if (!existing) {
      throw new NotFoundException(`Category ${id} not found`);
    }

    // Check name unique if rename
    if (dto.name && dto.name !== existing.name) {
      const nameConflict = await this.prisma.category.findFirst({
        where: { name: dto.name, deletedAt: null, id: { not: id } },
      });
      if (nameConflict) {
        throw new ConflictException(
          `Category name "${dto.name}" already exists`,
        );
      }
    }

    // Không cho phép set parentId = chính nó
    if (dto.parentId === id) {
      throw new BadRequestException('Category cannot be its own parent');
    }

    // Validate parentId nếu có
    if (dto.parentId) {
      const parent = await this.prisma.category.findFirst({
        where: { id: dto.parentId, deletedAt: null },
      });
      if (!parent) {
        throw new NotFoundException(
          `Parent category ${dto.parentId} not found`,
        );
      }
    }

    const updated = await this.prisma.category.update({
      where: { id },
      data: {
        ...(dto.name && { name: dto.name }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.parentId !== undefined && { parentId: dto.parentId ?? null }),
      },
      include: {
        children: {
          where: { deletedAt: null },
        },
      },
    });

    return CategoryHelper.toResponseDto(updated, true);
  }

  // ─── Soft delete ───────────────────────────────────────────────────────────

  async remove(id: string): Promise<{ message: string }> {
    const existing = await this.prisma.category.findFirst({
      where: { id, deletedAt: null },
      include: { products: { where: { deletedAt: null } } },
    });

    if (!existing) {
      throw new NotFoundException(`Category ${id} not found`);
    }

    // No deleting category which have products
    if (existing.products.length > 0) {
      throw new ConflictException(
        `Cannot delete category — it still has ${existing.products.length} active product(s). Reassign products first.`,
      );
    }

    // Soft delete category + all childrens
    await this.prisma.$transaction([
      // Soft delete children first
      this.prisma.category.updateMany({
        where: { parentId: id, deletedAt: null },
        data: { deletedAt: new Date() },
      }),
      // After that, soft delete itself
      this.prisma.category.update({
        where: { id },
        data: { deletedAt: new Date() },
      }),
    ]);

    return { message: `Category ${id} deleted successfully` };
  }
}
