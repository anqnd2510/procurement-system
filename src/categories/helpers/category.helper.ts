import {
  CategoryResponseDto,
  ChildCategoryDto,
} from '../dto/category-response.dto';

export class CategoryHelper {
  static toChildDto(child: {
    id: string;
    name: string;
    description: string | null;
    parentId: string | null;
    createdAt: Date;
    updatedAt: Date;
  }): ChildCategoryDto {
    return {
      id: child.id,
      name: child.name,
      description: child.description,
      parentId: child.parentId,
      createdAt: child.createdAt,
      updatedAt: child.updatedAt,
    };
  }
  static toResponseDto(
    category: {
      id: string;
      name: string;
      description: string | null;
      parentId: string | null;
      createdAt: Date;
      updatedAt: Date;
      children?: {
        id: string;
        name: string;
        description: string | null;
        parentId: string | null;
        createdAt: Date;
        updatedAt: Date;
      }[];
    },
    includeChildren = false,
  ): CategoryResponseDto {
    const dto: CategoryResponseDto = {
      id: category.id,
      name: category.name,
      description: category.description,
      parentId: category.parentId,
      createdAt: category.createdAt,
      updatedAt: category.updatedAt,
    };

    if (includeChildren && category.children) {
      dto.children = category.children
        .filter((c) => !('deletedAt' in c) || c['deletedAt'] === null)
        .map((c) => this.toChildDto(c));
    }

    return dto;
  }
}
