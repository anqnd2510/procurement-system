import { InventoryResponseDto } from '../dto/inventory-response.dto';

export class InventoryHelper {
  static toDto(inventory: {
    id: string;
    productId: string;
    qtyAvailable: number;
    qtyReserved: number;
    updatedAt: Date;
    product: { name: string; sku: string };
  }): InventoryResponseDto {
    return {
      id: inventory.id,
      productId: inventory.productId,
      productName: inventory.product.name,
      productSku: inventory.product.sku,
      qtyAvailable: inventory.qtyAvailable,
      qtyReserved: inventory.qtyReserved,
      qtyTotal: inventory.qtyAvailable + inventory.qtyReserved, // tính runtime
      updatedAt: inventory.updatedAt,
    };
  }
}
