import 'dotenv/config';
import { PrismaClient, Prisma } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL is not set');
}

const pool = new Pool({ connectionString });
const prisma = new PrismaClient({
  adapter: new PrismaPg(pool),
});

const CATEGORY_IDS = {
  laptops: '8a0020ee-fb51-4c80-954d-f58d497d18d7',
  headphones: '6d12fb6b-4aa4-43a2-a6d3-ec32642f34dc',
  keyboards: 'a38186e6-e0b4-4d2c-8c6f-5029fed2792c',
  mouses: '6ebf0bff-b8b7-4dee-9809-d6da8a0a00ce',
  monitors: '6c7f0519-b5dd-47c3-97b3-5b71682e9a1c',
};

const products = [
  // Laptops
  {
    name: 'Laptop Pro 14',
    description: '14-inch business laptop with strong performance.',
    unit_price: '1299.00',
    sku: 'LAP-001',
    categoryId: CATEGORY_IDS.laptops,
  },
  {
    name: 'Laptop Air 13',
    description: 'Lightweight laptop for daily productivity.',
    unit_price: '999.00',
    sku: 'LAP-002',
    categoryId: CATEGORY_IDS.laptops,
  },
  {
    name: 'Gaming Laptop 16',
    description: 'High-refresh gaming laptop with dedicated graphics.',
    unit_price: '1899.00',
    sku: 'LAP-003',
    categoryId: CATEGORY_IDS.laptops,
  },
  {
    name: 'Laptop Student 15',
    description: 'Affordable laptop for school and office use.',
    unit_price: '749.00',
    sku: 'LAP-004',
    categoryId: CATEGORY_IDS.laptops,
  },
  {
    name: 'Laptop Creator 16',
    description: 'Powerful laptop for design and content creation.',
    unit_price: '2199.00',
    sku: 'LAP-005',
    categoryId: CATEGORY_IDS.laptops,
  },
  {
    name: 'Laptop Ultra 13',
    description: 'Premium ultra-portable laptop with long battery life.',
    unit_price: '1599.00',
    sku: 'LAP-006',
    categoryId: CATEGORY_IDS.laptops,
  },
  {
    name: 'Laptop Business 15',
    description: 'Reliable laptop for enterprise workloads.',
    unit_price: '1399.00',
    sku: 'LAP-007',
    categoryId: CATEGORY_IDS.laptops,
  },
  {
    name: 'Laptop Touch 14',
    description: 'Touchscreen laptop for flexible work.',
    unit_price: '1149.00',
    sku: 'LAP-008',
    categoryId: CATEGORY_IDS.laptops,
  },
  {
    name: 'Laptop Flex 15',
    description: 'Convertible laptop for work and entertainment.',
    unit_price: '1249.00',
    sku: 'LAP-009',
    categoryId: CATEGORY_IDS.laptops,
  },
  {
    name: 'Laptop Max 17',
    description: 'Large-screen laptop for demanding users.',
    unit_price: '2299.00',
    sku: 'LAP-010',
    categoryId: CATEGORY_IDS.laptops,
  },

  // Monitors
  {
    name: 'Monitor 24 FHD',
    description: '24-inch Full HD monitor for office setups.',
    unit_price: '179.00',
    sku: 'MON-001',
    categoryId: CATEGORY_IDS.monitors,
  },
  {
    name: 'Monitor 27 QHD',
    description: '27-inch QHD monitor with crisp visuals.',
    unit_price: '299.00',
    sku: 'MON-002',
    categoryId: CATEGORY_IDS.monitors,
  },
  {
    name: 'Monitor 32 4K',
    description: '32-inch 4K monitor for sharp detail.',
    unit_price: '499.00',
    sku: 'MON-003',
    categoryId: CATEGORY_IDS.monitors,
  },
  {
    name: 'Monitor UltraWide 34',
    description: 'Ultrawide monitor for multitasking.',
    unit_price: '649.00',
    sku: 'MON-004',
    categoryId: CATEGORY_IDS.monitors,
  },
  {
    name: 'Monitor Gaming 27',
    description: 'High refresh rate gaming monitor.',
    unit_price: '369.00',
    sku: 'MON-005',
    categoryId: CATEGORY_IDS.monitors,
  },
  {
    name: 'Monitor Portable 15',
    description: 'Portable monitor for travel and remote work.',
    unit_price: '219.00',
    sku: 'MON-006',
    categoryId: CATEGORY_IDS.monitors,
  },
  {
    name: 'Monitor Pro 32',
    description: 'Professional monitor for productivity.',
    unit_price: '579.00',
    sku: 'MON-007',
    categoryId: CATEGORY_IDS.monitors,
  },
  {
    name: 'Monitor Curved 27',
    description: 'Curved display for immersive viewing.',
    unit_price: '339.00',
    sku: 'MON-008',
    categoryId: CATEGORY_IDS.monitors,
  },
  {
    name: 'Monitor HDR 27',
    description: 'HDR monitor with vibrant color output.',
    unit_price: '429.00',
    sku: 'MON-009',
    categoryId: CATEGORY_IDS.monitors,
  },
  {
    name: 'Monitor Office 22',
    description: 'Compact monitor for desk and office use.',
    unit_price: '149.00',
    sku: 'MON-010',
    categoryId: CATEGORY_IDS.monitors,
  },

  // Keyboards
  {
    name: 'Keyboard Mechanical TKL',
    description: 'Tenkeyless mechanical keyboard.',
    unit_price: '129.00',
    sku: 'KEY-001',
    categoryId: CATEGORY_IDS.keyboards,
  },
  {
    name: 'Keyboard Mechanical Full',
    description: 'Full-size mechanical keyboard.',
    unit_price: '149.00',
    sku: 'KEY-002',
    categoryId: CATEGORY_IDS.keyboards,
  },
  {
    name: 'Keyboard Wireless Slim',
    description: 'Slim wireless keyboard for office use.',
    unit_price: '79.00',
    sku: 'KEY-003',
    categoryId: CATEGORY_IDS.keyboards,
  },
  {
    name: 'Keyboard Gaming RGB',
    description: 'RGB gaming keyboard with fast response.',
    unit_price: '109.00',
    sku: 'KEY-004',
    categoryId: CATEGORY_IDS.keyboards,
  },
  {
    name: 'Keyboard Ergonomic Split',
    description: 'Ergonomic split keyboard for comfort.',
    unit_price: '159.00',
    sku: 'KEY-005',
    categoryId: CATEGORY_IDS.keyboards,
  },
  {
    name: 'Keyboard Compact 75',
    description: 'Compact 75 percent keyboard layout.',
    unit_price: '99.00',
    sku: 'KEY-006',
    categoryId: CATEGORY_IDS.keyboards,
  },
  {
    name: 'Keyboard Office Silent',
    description: 'Quiet keyboard for shared workspaces.',
    unit_price: '69.00',
    sku: 'KEY-007',
    categoryId: CATEGORY_IDS.keyboards,
  },
  {
    name: 'Keyboard Bluetooth Multi',
    description: 'Bluetooth keyboard for multiple devices.',
    unit_price: '89.00',
    sku: 'KEY-008',
    categoryId: CATEGORY_IDS.keyboards,
  },
  {
    name: 'Keyboard Mechanical HotSwap',
    description: 'Hot-swappable mechanical keyboard.',
    unit_price: '139.00',
    sku: 'KEY-009',
    categoryId: CATEGORY_IDS.keyboards,
  },
  {
    name: 'Keyboard Premium Aluminum',
    description: 'Premium aluminum keyboard with durable build.',
    unit_price: '179.00',
    sku: 'KEY-010',
    categoryId: CATEGORY_IDS.keyboards,
  },

  // Mouses
  {
    name: 'Mouse Wireless Pro',
    description: 'Comfortable wireless mouse for daily use.',
    unit_price: '49.00',
    sku: 'MOU-001',
    categoryId: CATEGORY_IDS.mouses,
  },
  {
    name: 'Mouse Gaming DPI',
    description: 'Gaming mouse with adjustable DPI.',
    unit_price: '69.00',
    sku: 'MOU-002',
    categoryId: CATEGORY_IDS.mouses,
  },
  {
    name: 'Mouse Ergonomic Vertical',
    description: 'Vertical mouse for ergonomic comfort.',
    unit_price: '59.00',
    sku: 'MOU-003',
    categoryId: CATEGORY_IDS.mouses,
  },
  {
    name: 'Mouse Compact Travel',
    description: 'Small mouse for travel and mobile work.',
    unit_price: '39.00',
    sku: 'MOU-004',
    categoryId: CATEGORY_IDS.mouses,
  },
  {
    name: 'Mouse Bluetooth Multi',
    description: 'Bluetooth mouse for multiple devices.',
    unit_price: '54.00',
    sku: 'MOU-005',
    categoryId: CATEGORY_IDS.mouses,
  },
  {
    name: 'Mouse Silent Click',
    description: 'Quiet-click mouse for office environments.',
    unit_price: '44.00',
    sku: 'MOU-006',
    categoryId: CATEGORY_IDS.mouses,
  },
  {
    name: 'Mouse Precision Pro',
    description: 'Precision mouse for accurate control.',
    unit_price: '64.00',
    sku: 'MOU-007',
    categoryId: CATEGORY_IDS.mouses,
  },
  {
    name: 'Mouse Rechargeable',
    description: 'Rechargeable mouse with long battery life.',
    unit_price: '52.00',
    sku: 'MOU-008',
    categoryId: CATEGORY_IDS.mouses,
  },
  {
    name: 'Mouse RGB Gaming',
    description: 'RGB mouse for gamers.',
    unit_price: '74.00',
    sku: 'MOU-009',
    categoryId: CATEGORY_IDS.mouses,
  },
  {
    name: 'Mouse Office Basic',
    description: 'Simple mouse for everyday office tasks.',
    unit_price: '29.00',
    sku: 'MOU-010',
    categoryId: CATEGORY_IDS.mouses,
  },

  // Headphones
  {
    name: 'Headphone Wireless ANC',
    description: 'Wireless headphones with active noise cancellation.',
    unit_price: '199.00',
    sku: 'HDP-001',
    categoryId: CATEGORY_IDS.headphones,
  },
  {
    name: 'Headphone Studio OverEar',
    description: 'Studio over-ear headphones for clear sound.',
    unit_price: '149.00',
    sku: 'HDP-002',
    categoryId: CATEGORY_IDS.headphones,
  },
  {
    name: 'Headphone Gaming Surround',
    description: 'Gaming headphones with surround audio.',
    unit_price: '129.00',
    sku: 'HDP-003',
    categoryId: CATEGORY_IDS.headphones,
  },
  {
    name: 'Headphone Bluetooth Sport',
    description: 'Lightweight Bluetooth headphones for workouts.',
    unit_price: '89.00',
    sku: 'HDP-004',
    categoryId: CATEGORY_IDS.headphones,
  },
  {
    name: 'Headphone Noise Cancel',
    description: 'Comfortable headphones with passive isolation.',
    unit_price: '179.00',
    sku: 'HDP-005',
    categoryId: CATEGORY_IDS.headphones,
  },
  {
    name: 'Headphone Wired Pro',
    description: 'Wired headphones with studio-grade clarity.',
    unit_price: '99.00',
    sku: 'HDP-006',
    categoryId: CATEGORY_IDS.headphones,
  },
  {
    name: 'Headphone Travel Foldable',
    description: 'Foldable headphones for easy travel.',
    unit_price: '79.00',
    sku: 'HDP-007',
    categoryId: CATEGORY_IDS.headphones,
  },
  {
    name: 'Headphone ANC Premium',
    description: 'Premium ANC headphones for focus and travel.',
    unit_price: '249.00',
    sku: 'HDP-008',
    categoryId: CATEGORY_IDS.headphones,
  },
  {
    name: 'Headphone Earbuds Wireless',
    description: 'Compact wireless earbuds for daily use.',
    unit_price: '119.00',
    sku: 'HDP-009',
    categoryId: CATEGORY_IDS.headphones,
  },
  {
    name: 'Headphone Office Headset',
    description: 'Headset for meetings and calls.',
    unit_price: '69.00',
    sku: 'HDP-010',
    categoryId: CATEGORY_IDS.headphones,
  },
];

async function main() {
  await prisma.product.deleteMany();

  await prisma.product.createMany({
    data: products.map((product) => ({
      ...product,
      unit_price: new Prisma.Decimal(product.unit_price),
    })),
  });

  console.log(`Seeded ${products.length} products successfully.`);
}

main()
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
