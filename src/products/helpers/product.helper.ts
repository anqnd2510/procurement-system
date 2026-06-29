import { ProductResponseDto } from '../dto/product-response.dto';
import { ProductRaw } from '../types/product.type';

export class ProductHelper {
  static toDto(product: ProductRaw): ProductResponseDto {
    return {
      id: product.id,
      name: product.name,
      sku: product.sku,
      description: product.description,
      unit_price:
        typeof product.unit_price === 'object'
          ? product.unit_price.toNumber()
          : product.unit_price,
      categoryId: product.categoryId,
      category: product.category ?? null,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    };
  }
}
