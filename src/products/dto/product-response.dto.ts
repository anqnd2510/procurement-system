import { Decimal } from '@prisma/client/runtime/client';

export class ProductResponseDto {
  id: string;
  name: string;
  sku: string;
  description?: string | null;
  unit_price: number | Decimal;
  categoryId?: string | null;
  createdAt: Date;
}
