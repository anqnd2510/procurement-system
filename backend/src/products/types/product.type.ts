export type ProductRaw = {
  id: string;
  name: string;
  sku: string;
  description: string | null;
  unit_price: { toNumber(): number } | number;
  categoryId: string | null;
  category: { id: string; name: string } | null;
  createdAt: Date;
  updatedAt: Date;
};

export const PRODUCT_SELECT = {
  id: true,
  name: true,
  sku: true,
  description: true,
  unit_price: true,
  categoryId: true,
  category: {
    select: { id: true, name: true },
  },
  createdAt: true,
  updatedAt: true,
} as const;
