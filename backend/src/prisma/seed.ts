/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call */
import dotenv from 'dotenv';
import { resolve } from 'node:path';
dotenv.config({ path: resolve(process.cwd(), '../.env') });
dotenv.config();
import { PrismaClient, Prisma } from '@prisma/client';
import {
  InventoryTxType,
  OrganizationRole,
  PurchaseOrderStatus,
  PurchaseRequestStatus,
  Role,
} from '@prisma/client';
import * as bcrypt from 'bcrypt';
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

const DEMO_CATEGORIES = [
  {
    legacyId: CATEGORY_IDS.laptops,
    name: 'Laptops',
    description: 'Business laptops, workstations, and mobile computers.',
  },
  {
    legacyId: CATEGORY_IDS.headphones,
    name: 'Headphones',
    description: 'Headsets and audio equipment for work and collaboration.',
  },
  {
    legacyId: CATEGORY_IDS.keyboards,
    name: 'Keyboards',
    description: 'Wired, wireless, and ergonomic keyboards.',
  },
  {
    legacyId: CATEGORY_IDS.mouses,
    name: 'Mice',
    description: 'Standard, wireless, and ergonomic computer mice.',
  },
  {
    legacyId: CATEGORY_IDS.monitors,
    name: 'Monitors',
    description: 'Office displays, professional monitors, and accessories.',
  },
];

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

type DemoUserDefinition = {
  email: string;
  role: Role;
  organizationRole: OrganizationRole;
};

type DemoRequestLine = {
  sku: string;
  quantity: number;
  notes?: string;
};

type DemoRequestFixture = {
  key: string;
  title: string;
  description: string;
  departmentCode: string;
  requesterEmail: string;
  ageInDays: number;
  status: PurchaseRequestStatus;
  lines: DemoRequestLine[];
  purchaseOrder?: {
    orderNumber: string;
    supplierName: string;
    status: PurchaseOrderStatus;
  };
};

const demoUsers: DemoUserDefinition[] = [
  {
    email: 'admin@example.com',
    role: Role.ADMIN,
    organizationRole: OrganizationRole.OWNER,
  },
  {
    email: 'manager@example.com',
    role: Role.MANAGER,
    organizationRole: OrganizationRole.MANAGER,
  },
  {
    email: 'employee@example.com',
    role: Role.EMPLOYEE,
    organizationRole: OrganizationRole.MEMBER,
  },
  {
    email: 'procurement.lead@example.com',
    role: Role.MANAGER,
    organizationRole: OrganizationRole.MANAGER,
  },
  {
    email: 'finance@example.com',
    role: Role.EMPLOYEE,
    organizationRole: OrganizationRole.MEMBER,
  },
  {
    email: 'it@example.com',
    role: Role.EMPLOYEE,
    organizationRole: OrganizationRole.MEMBER,
  },
  {
    email: 'operations@example.com',
    role: Role.EMPLOYEE,
    organizationRole: OrganizationRole.MEMBER,
  },
  {
    email: 'facilities@example.com',
    role: Role.EMPLOYEE,
    organizationRole: OrganizationRole.MEMBER,
  },
];

const demoDepartments = [
  { code: 'PROC', name: 'Procurement' },
  { code: 'FIN', name: 'Finance' },
  { code: 'IT', name: 'Information Technology' },
  { code: 'OPS', name: 'Operations' },
  { code: 'FAC', name: 'Facilities' },
];

const demoRequests: DemoRequestFixture[] = [
  {
    key: 'draft-developer-workstations',
    title: 'Developer workstation refresh',
    description: 'Draft request for two engineering workstations and displays.',
    departmentCode: 'IT',
    requesterEmail: 'it@example.com',
    ageInDays: 2,
    status: PurchaseRequestStatus.DRAFT,
    lines: [
      { sku: 'LAP-001', quantity: 2, notes: 'For incoming engineers.' },
      { sku: 'MON-002', quantity: 2 },
    ],
  },
  {
    key: 'draft-meeting-room-peripherals',
    title: 'Meeting room peripherals',
    description: 'Accessories for the newly renovated meeting room.',
    departmentCode: 'FAC',
    requesterEmail: 'facilities@example.com',
    ageInDays: 3,
    status: PurchaseRequestStatus.DRAFT,
    lines: [
      { sku: 'HDP-010', quantity: 3 },
      { sku: 'KEY-003', quantity: 3 },
    ],
  },
  {
    key: 'submitted-finance-monitors',
    title: 'Finance team display upgrades',
    description: 'Additional displays for month-end reporting workloads.',
    departmentCode: 'FIN',
    requesterEmail: 'finance@example.com',
    ageInDays: 8,
    status: PurchaseRequestStatus.SUBMITTED,
    lines: [{ sku: 'MON-007', quantity: 3 }],
  },
  {
    key: 'submitted-operations-keyboards',
    title: 'Operations keyboard replacement',
    description: 'Replace worn keyboards at the operations desks.',
    departmentCode: 'OPS',
    requesterEmail: 'operations@example.com',
    ageInDays: 7,
    status: PurchaseRequestStatus.SUBMITTED,
    lines: [{ sku: 'KEY-007', quantity: 8 }],
  },
  {
    key: 'submitted-it-audio',
    title: 'Remote support headsets',
    description: 'Headsets for the expanded internal support rotation.',
    departmentCode: 'IT',
    requesterEmail: 'it@example.com',
    ageInDays: 6,
    status: PurchaseRequestStatus.SUBMITTED,
    lines: [{ sku: 'HDP-010', quantity: 5 }],
  },
  {
    key: 'submitted-procurement-laptops',
    title: 'Procurement team laptop request',
    description: 'Portable laptops for supplier visits and audits.',
    departmentCode: 'PROC',
    requesterEmail: 'procurement.lead@example.com',
    ageInDays: 5,
    status: PurchaseRequestStatus.SUBMITTED,
    lines: [{ sku: 'LAP-002', quantity: 2 }],
  },
  {
    key: 'approved-laptop-refresh',
    title: 'Quarterly laptop refresh',
    description: 'Approved replacement laptops for the service desk.',
    departmentCode: 'IT',
    requesterEmail: 'it@example.com',
    ageInDays: 28,
    status: PurchaseRequestStatus.APPROVED,
    lines: [
      { sku: 'LAP-007', quantity: 3 },
      { sku: 'MOU-001', quantity: 3 },
    ],
    purchaseOrder: {
      orderNumber: 'PO-DEMO-2026-0001',
      supplierName: 'Northstar Business Supply',
      status: PurchaseOrderStatus.DRAFT,
    },
  },
  {
    key: 'approved-design-monitors',
    title: 'Design studio monitor procurement',
    description: 'Color-accurate monitors for the internal design team.',
    departmentCode: 'OPS',
    requesterEmail: 'operations@example.com',
    ageInDays: 24,
    status: PurchaseRequestStatus.APPROVED,
    lines: [
      { sku: 'MON-007', quantity: 2 },
      { sku: 'KEY-002', quantity: 2 },
    ],
    purchaseOrder: {
      orderNumber: 'PO-DEMO-2026-0002',
      supplierName: 'Apex Office Technology',
      status: PurchaseOrderStatus.ISSUED,
    },
  },
  {
    key: 'approved-conference-audio',
    title: 'Conference room audio equipment',
    description: 'Noise-cancelling headsets for shared conference rooms.',
    departmentCode: 'FAC',
    requesterEmail: 'facilities@example.com',
    ageInDays: 20,
    status: PurchaseRequestStatus.APPROVED,
    lines: [{ sku: 'HDP-001', quantity: 4 }],
    purchaseOrder: {
      orderNumber: 'PO-DEMO-2026-0003',
      supplierName: 'ClearSound Enterprise',
      status: PurchaseOrderStatus.RECEIVED,
    },
  },
  {
    key: 'approved-warehouse-mice',
    title: 'Warehouse workstation accessories',
    description: 'Wireless peripherals for the warehouse office stations.',
    departmentCode: 'OPS',
    requesterEmail: 'operations@example.com',
    ageInDays: 18,
    status: PurchaseRequestStatus.APPROVED,
    lines: [{ sku: 'MOU-008', quantity: 6 }],
    purchaseOrder: {
      orderNumber: 'PO-DEMO-2026-0004',
      supplierName: 'Metro Workplace Goods',
      status: PurchaseOrderStatus.CANCELLED,
    },
  },
  {
    key: 'rejected-premium-laptops',
    title: 'Premium laptop request',
    description: 'Deferred pending the next hardware budget review.',
    departmentCode: 'FIN',
    requesterEmail: 'finance@example.com',
    ageInDays: 16,
    status: PurchaseRequestStatus.REJECTED,
    lines: [{ sku: 'LAP-010', quantity: 2 }],
  },
  {
    key: 'rejected-gaming-displays',
    title: 'High-refresh display request',
    description:
      'Not approved because the requested specification is not required.',
    departmentCode: 'IT',
    requesterEmail: 'it@example.com',
    ageInDays: 14,
    status: PurchaseRequestStatus.REJECTED,
    lines: [{ sku: 'MON-005', quantity: 3 }],
  },
  {
    key: 'cancelled-approved-office-keyboards',
    title: 'Office keyboard replacement',
    description:
      'Cancelled after the department consolidated its equipment order.',
    departmentCode: 'OPS',
    requesterEmail: 'operations@example.com',
    ageInDays: 12,
    status: PurchaseRequestStatus.CANCELLED,
    lines: [{ sku: 'KEY-001', quantity: 4 }],
  },
  {
    key: 'fulfilled-it-laptop-dock-alternative',
    title: 'IT support laptop allocation',
    description: 'Completed workstation allocation for the support team.',
    departmentCode: 'IT',
    requesterEmail: 'it@example.com',
    ageInDays: 35,
    status: PurchaseRequestStatus.FULFILLED,
    lines: [{ sku: 'LAP-004', quantity: 2 }],
  },
  {
    key: 'fulfilled-finance-headsets',
    title: 'Finance video-call headsets',
    description: 'Headsets delivered to the finance team.',
    departmentCode: 'FIN',
    requesterEmail: 'finance@example.com',
    ageInDays: 32,
    status: PurchaseRequestStatus.FULFILLED,
    lines: [{ sku: 'HDP-002', quantity: 3 }],
  },
  {
    key: 'fulfilled-facilities-mice',
    title: 'Facilities desk peripherals',
    description: 'Completed replacement of failing desk peripherals.',
    departmentCode: 'FAC',
    requesterEmail: 'facilities@example.com',
    ageInDays: 30,
    status: PurchaseRequestStatus.FULFILLED,
    lines: [{ sku: 'MOU-003', quantity: 5 }],
  },
];

type InventoryMovementInput = {
  organizationId: string;
  productId: string;
  type: InventoryTxType;
  quantity: number;
  referenceId: string;
  createdAt: Date;
};

async function applyInventoryMovement(
  tx: Prisma.TransactionClient,
  movement: InventoryMovementInput,
) {
  const inventory = await tx.inventory.findUnique({
    where: { productId: movement.productId },
  });
  if (!inventory || inventory.organizationId !== movement.organizationId) {
    throw new Error(
      `Demo inventory is missing or outside the organization for product ${movement.productId}`,
    );
  }

  if (
    movement.type === InventoryTxType.RESERVE &&
    inventory.qtyAvailable < movement.quantity
  ) {
    throw new Error(
      `Not enough demo stock to reserve ${movement.quantity} units for product ${movement.productId}`,
    );
  }
  if (
    (movement.type === InventoryTxType.RELEASE ||
      movement.type === InventoryTxType.FULFILL) &&
    inventory.qtyReserved < movement.quantity
  ) {
    throw new Error(
      `Not enough demo reserved stock for ${movement.type} on product ${movement.productId}`,
    );
  }

  const balanceChange: Prisma.InventoryUpdateInput =
    movement.type === InventoryTxType.STOCK_IN
      ? { qtyAvailable: { increment: movement.quantity } }
      : movement.type === InventoryTxType.RESERVE
        ? {
            qtyAvailable: { decrement: movement.quantity },
            qtyReserved: { increment: movement.quantity },
          }
        : movement.type === InventoryTxType.RELEASE
          ? {
              qtyAvailable: { increment: movement.quantity },
              qtyReserved: { decrement: movement.quantity },
            }
          : { qtyReserved: { decrement: movement.quantity } };

  await tx.inventory.update({
    where: { id: inventory.id },
    data: balanceChange,
  });
  await tx.inventoryTransaction.create({
    data: {
      inventoryId: inventory.id,
      type: movement.type,
      quantity: movement.quantity,
      referenceId: movement.referenceId,
      createdAt: movement.createdAt,
    },
  });
}

function buildRequestTimeline(
  status: PurchaseRequestStatus,
  requesterId: string,
  managerId: string,
  createdAt: Date,
) {
  const events: {
    fromStatus: PurchaseRequestStatus | null;
    toStatus: PurchaseRequestStatus;
    changedById: string;
    comment?: string;
    createdAt: Date;
  }[] = [
    {
      fromStatus: null,
      toStatus: PurchaseRequestStatus.DRAFT,
      changedById: requesterId,
      createdAt,
    },
  ];

  if (status === PurchaseRequestStatus.DRAFT) return events;

  const submittedAt = new Date(createdAt.getTime() + 6 * 60 * 60 * 1000);
  events.push({
    fromStatus: PurchaseRequestStatus.DRAFT,
    toStatus: PurchaseRequestStatus.SUBMITTED,
    changedById: requesterId,
    createdAt: submittedAt,
  });
  if (status === PurchaseRequestStatus.SUBMITTED) return events;

  if (status === PurchaseRequestStatus.REJECTED) {
    events.push({
      fromStatus: PurchaseRequestStatus.SUBMITTED,
      toStatus: PurchaseRequestStatus.REJECTED,
      changedById: managerId,
      comment: 'Demo decision: request deferred for budget or policy review.',
      createdAt: new Date(createdAt.getTime() + 30 * 60 * 60 * 1000),
    });
    return events;
  }

  const approvedAt = new Date(createdAt.getTime() + 30 * 60 * 60 * 1000);
  events.push({
    fromStatus: PurchaseRequestStatus.SUBMITTED,
    toStatus: PurchaseRequestStatus.APPROVED,
    changedById: managerId,
    comment: 'Demo approval for the organization test dataset.',
    createdAt: approvedAt,
  });
  if (status === PurchaseRequestStatus.APPROVED) return events;

  if (status === PurchaseRequestStatus.CANCELLED) {
    events.push({
      fromStatus: PurchaseRequestStatus.APPROVED,
      toStatus: PurchaseRequestStatus.CANCELLED,
      changedById: requesterId,
      comment: 'Demo cancellation after the department consolidated its needs.',
      createdAt: new Date(createdAt.getTime() + 54 * 60 * 60 * 1000),
    });
    return events;
  }

  events.push({
    fromStatus: PurchaseRequestStatus.APPROVED,
    toStatus: PurchaseRequestStatus.FULFILLED,
    changedById: managerId,
    comment: 'Demo fulfillment recorded for the completed request.',
    createdAt: new Date(createdAt.getTime() + 96 * 60 * 60 * 1000),
  });
  return events;
}

async function seedOpeningInventory(
  organizationId: string,
  product: { id: string; sku: string },
  openingQuantity: number,
  createdAt: Date,
) {
  const referenceId = `DEMO:OPENING:${product.sku}`;
  await prisma.$transaction(async (tx) => {
    const inventory = await tx.inventory.findUnique({
      where: { productId: product.id },
    });
    if (!inventory) {
      await tx.inventory.create({
        data: {
          organizationId,
          productId: product.id,
          qtyAvailable: openingQuantity,
          qtyReserved: 0,
          transactions: {
            create: {
              type: InventoryTxType.STOCK_IN,
              quantity: openingQuantity,
              referenceId,
              createdAt,
            },
          },
        },
      });
      return;
    }
    if (inventory.organizationId !== organizationId) {
      throw new Error(
        `Inventory for SKU ${product.sku} belongs to another organization`,
      );
    }

    const existingOpening = await tx.inventoryTransaction.findFirst({
      where: {
        inventoryId: inventory.id,
        type: InventoryTxType.STOCK_IN,
        referenceId,
      },
    });
    if (existingOpening) return;

    await applyInventoryMovement(tx, {
      organizationId,
      productId: product.id,
      type: InventoryTxType.STOCK_IN,
      quantity: openingQuantity,
      referenceId,
      createdAt,
    });
  });
}

async function seedRequestFixture(
  fixture: DemoRequestFixture,
  organizationId: string,
  userByEmail: Map<string, { id: string }>,
  departmentByCode: Map<string, { id: string }>,
  productBySku: Map<
    string,
    { id: string; name: string; unit_price: Prisma.Decimal }
  >,
  managerId: string,
  now: Date,
) {
  const idempotencyKey = `demo:${fixture.key}`;
  const existing = await prisma.purchaseRequest.findUnique({
    where: { idempotencyKey },
    select: { id: true, organizationId: true },
  });
  if (existing) {
    if (existing.organizationId !== organizationId) {
      throw new Error(
        `Demo request key ${fixture.key} belongs to another organization`,
      );
    }
    return existing.id;
  }

  const requester = userByEmail.get(fixture.requesterEmail);
  const department = departmentByCode.get(fixture.departmentCode);
  if (!requester || !department) {
    throw new Error(`Missing demo requester or department for ${fixture.key}`);
  }

  const lines = fixture.lines.map((line) => {
    const product = productBySku.get(line.sku);
    if (!product) throw new Error(`Missing demo product with SKU ${line.sku}`);
    const estimatedUnitPrice = new Prisma.Decimal(product.unit_price);
    const estimatedTotal = estimatedUnitPrice.mul(line.quantity);
    return {
      productId: product.id,
      description: product.name,
      quantity: line.quantity,
      estimatedUnitPrice,
      estimatedTotal,
      notes: line.notes,
    };
  });
  const totalAmount = lines.reduce(
    (total, line) => total.add(line.estimatedTotal),
    new Prisma.Decimal(0),
  );
  const createdAt = new Date(
    now.getTime() - fixture.ageInDays * 24 * 60 * 60 * 1000,
  );
  const timeline = buildRequestTimeline(
    fixture.status,
    requester.id,
    managerId,
    createdAt,
  );
  const timestampFor = (target: PurchaseRequestStatus) =>
    timeline.find((event) => event.toStatus === target)?.createdAt ?? null;

  return prisma.$transaction(async (tx) => {
    const request = await tx.purchaseRequest.create({
      data: {
        organizationId,
        departmentId: department.id,
        requesterId: requester.id,
        idempotencyKey,
        title: fixture.title,
        description: fixture.description,
        status: fixture.status,
        totalAmount,
        submittedAt: timestampFor(PurchaseRequestStatus.SUBMITTED),
        approvedAt: timestampFor(PurchaseRequestStatus.APPROVED),
        rejectedAt: timestampFor(PurchaseRequestStatus.REJECTED),
        cancelledAt: timestampFor(PurchaseRequestStatus.CANCELLED),
        fulfilledAt: timestampFor(PurchaseRequestStatus.FULFILLED),
        createdAt,
        updatedAt: timeline[timeline.length - 1].createdAt,
        items: { create: lines },
        history: { create: timeline },
      },
    });

    await tx.auditLog.createMany({
      data: timeline.map((event, index) => ({
        organizationId,
        actorUserId: event.changedById,
        action:
          index === 0
            ? 'PURCHASE_REQUEST_CREATED'
            : 'PURCHASE_REQUEST_STATUS_CHANGED',
        resourceType: 'PURCHASE_REQUEST',
        resourceId: request.id,
        metadata: {
          fromStatus: event.fromStatus,
          toStatus: event.toStatus,
          demoRecord: true,
        },
        createdAt: event.createdAt,
      })),
    });

    const approvedAt = timestampFor(PurchaseRequestStatus.APPROVED);
    if (approvedAt) {
      for (const line of lines) {
        if (!line.productId) continue;
        await applyInventoryMovement(tx, {
          organizationId,
          productId: line.productId,
          type: InventoryTxType.RESERVE,
          quantity: line.quantity,
          referenceId: request.id,
          createdAt: approvedAt,
        });
      }
    }

    const cancelledAt = timestampFor(PurchaseRequestStatus.CANCELLED);
    if (cancelledAt) {
      for (const line of lines) {
        if (!line.productId) continue;
        await applyInventoryMovement(tx, {
          organizationId,
          productId: line.productId,
          type: InventoryTxType.RELEASE,
          quantity: line.quantity,
          referenceId: request.id,
          createdAt: cancelledAt,
        });
      }
    }

    const fulfilledAt = timestampFor(PurchaseRequestStatus.FULFILLED);
    if (fulfilledAt) {
      for (const line of lines) {
        if (!line.productId) continue;
        await applyInventoryMovement(tx, {
          organizationId,
          productId: line.productId,
          type: InventoryTxType.FULFILL,
          quantity: line.quantity,
          referenceId: request.id,
          createdAt: fulfilledAt,
        });
      }
    }

    return request.id;
  });
}

async function seedPurchaseOrderFixture(
  fixture: DemoRequestFixture,
  requestId: string,
  organizationId: string,
  createdById: string,
) {
  if (!fixture.purchaseOrder) return false;
  const existingOrder = await prisma.purchaseOrder.findUnique({
    where: { purchaseRequestId: requestId },
    select: { id: true },
  });
  if (existingOrder) return false;

  const request = await prisma.purchaseRequest.findFirst({
    where: {
      id: requestId,
      organizationId,
      status: PurchaseRequestStatus.APPROVED,
    },
    include: { items: true },
  });
  if (!request) {
    console.warn(
      `Skipped demo PO for ${fixture.key}: request is no longer approved.`,
    );
    return false;
  }

  const orderCreatedAt = new Date(
    request.createdAt.getTime() + 36 * 60 * 60 * 1000,
  );
  const issuedAt =
    fixture.purchaseOrder.status === PurchaseOrderStatus.DRAFT
      ? null
      : new Date(orderCreatedAt.getTime() + 12 * 60 * 60 * 1000);
  const receivedAt =
    fixture.purchaseOrder.status === PurchaseOrderStatus.RECEIVED
      ? new Date(orderCreatedAt.getTime() + 36 * 60 * 60 * 1000)
      : null;
  const cancelledAt =
    fixture.purchaseOrder.status === PurchaseOrderStatus.CANCELLED
      ? new Date(orderCreatedAt.getTime() + 36 * 60 * 60 * 1000)
      : null;

  await prisma.$transaction(async (tx) => {
    const order = await tx.purchaseOrder.create({
      data: {
        organizationId,
        purchaseRequestId: request.id,
        createdById,
        orderNumber: fixture.purchaseOrder!.orderNumber,
        supplierName: fixture.purchaseOrder!.supplierName,
        status: fixture.purchaseOrder!.status,
        totalAmount: request.totalAmount,
        issuedAt,
        receivedAt,
        cancelledAt,
        createdAt: orderCreatedAt,
        updatedAt: cancelledAt ?? receivedAt ?? issuedAt ?? orderCreatedAt,
        items: {
          create: request.items.map((item) => ({
            productId: item.productId,
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.estimatedUnitPrice,
            lineTotal: item.estimatedTotal,
          })),
        },
      },
    });

    const orderAudit: Prisma.AuditLogCreateManyInput[] = [
      {
        organizationId,
        actorUserId: createdById,
        action: 'PURCHASE_ORDER_CREATED',
        resourceType: 'PURCHASE_ORDER',
        resourceId: order.id,
        metadata: {
          purchaseRequestId: request.id,
          orderNumber: order.orderNumber,
          supplierName: order.supplierName,
          demoRecord: true,
        },
        createdAt: orderCreatedAt,
      },
    ];
    if (issuedAt) {
      orderAudit.push({
        organizationId,
        actorUserId: createdById,
        action: 'PURCHASE_ORDER_ISSUED',
        resourceType: 'PURCHASE_ORDER',
        resourceId: order.id,
        metadata: { toStatus: PurchaseOrderStatus.ISSUED, demoRecord: true },
        createdAt: issuedAt,
      });
    }
    if (receivedAt) {
      orderAudit.push({
        organizationId,
        actorUserId: createdById,
        action: 'PURCHASE_ORDER_RECEIVED',
        resourceType: 'PURCHASE_ORDER',
        resourceId: order.id,
        metadata: { toStatus: PurchaseOrderStatus.RECEIVED, demoRecord: true },
        createdAt: receivedAt,
      });
    }
    if (cancelledAt) {
      orderAudit.push({
        organizationId,
        actorUserId: createdById,
        action: 'PURCHASE_ORDER_CANCELLED',
        resourceType: 'PURCHASE_ORDER',
        resourceId: order.id,
        metadata: {
          fromStatus: issuedAt
            ? PurchaseOrderStatus.ISSUED
            : PurchaseOrderStatus.DRAFT,
          toStatus: PurchaseOrderStatus.CANCELLED,
          demoRecord: true,
        },
        createdAt: cancelledAt,
      });
    }
    await tx.auditLog.createMany({ data: orderAudit });

    if (receivedAt) {
      for (const item of request.items) {
        if (!item.productId) continue;
        await applyInventoryMovement(tx, {
          organizationId,
          productId: item.productId,
          type: InventoryTxType.STOCK_IN,
          quantity: item.quantity,
          referenceId: order.id,
          createdAt: receivedAt,
        });
      }
    }
  });
  return true;
}

async function main() {
  const now = new Date();
  const passwordHash = await bcrypt.hash('password123', 10);
  const userByEmail = new Map<string, { id: string }>();
  for (const definition of demoUsers) {
    const existing = await prisma.user.findUnique({
      where: { email: definition.email },
      select: { id: true },
    });
    const user =
      existing ??
      (await prisma.user.create({
        data: {
          email: definition.email,
          password: passwordHash,
          role: definition.role,
        },
        select: { id: true },
      }));
    userByEmail.set(definition.email, user);
  }

  const admin = userByEmail.get('admin@example.com');
  const manager = userByEmail.get('manager@example.com');
  if (!admin || !manager)
    throw new Error('Demo owner or manager user is missing');

  const organization = await prisma.organization.upsert({
    where: { slug: 'acme-procurement' },
    update: { name: 'Acme Procurement' },
    create: {
      name: 'Acme Procurement',
      slug: 'acme-procurement',
      createdById: admin.id,
    },
  });

  for (const definition of demoUsers) {
    const user = userByEmail.get(definition.email);
    if (!user) throw new Error(`Demo user ${definition.email} is missing`);
    await prisma.organizationMember.upsert({
      where: {
        organizationId_userId: {
          organizationId: organization.id,
          userId: user.id,
        },
      },
      update: { role: definition.organizationRole },
      create: {
        organizationId: organization.id,
        userId: user.id,
        role: definition.organizationRole,
      },
    });
  }

  const departmentByCode = new Map<string, { id: string }>();
  for (const department of demoDepartments) {
    const seeded = await prisma.department.upsert({
      where: {
        organizationId_code: {
          organizationId: organization.id,
          code: department.code,
        },
      },
      update: { name: department.name },
      create: {
        organizationId: organization.id,
        createdById: admin.id,
        name: department.name,
        code: department.code,
      },
      select: { id: true },
    });
    departmentByCode.set(department.code, seeded);
  }

  const categoryIdByLegacyId = new Map<string, string>();
  for (const categoryDefinition of DEMO_CATEGORIES) {
    const existing = await prisma.category.findUnique({
      where: { name: categoryDefinition.name },
    });
    if (existing && existing.organizationId !== organization.id) {
      throw new Error(
        `Category name ${categoryDefinition.name} is already used by another organization`,
      );
    }
    const category = existing
      ? await prisma.category.update({
          where: { id: existing.id },
          data: {
            description: categoryDefinition.description,
            deletedAt: null,
          },
          select: { id: true },
        })
      : await prisma.category.create({
          data: {
            organizationId: organization.id,
            name: categoryDefinition.name,
            description: categoryDefinition.description,
          },
          select: { id: true },
        });
    categoryIdByLegacyId.set(categoryDefinition.legacyId, category.id);
  }

  const productBySku = new Map<
    string,
    { id: string; sku: string; name: string; unit_price: Prisma.Decimal }
  >();
  for (const product of products) {
    const categoryId = categoryIdByLegacyId.get(product.categoryId);
    if (!categoryId) throw new Error(`Missing category for SKU ${product.sku}`);
    const existing = await prisma.product.findUnique({
      where: { sku: product.sku },
      select: { organizationId: true },
    });
    if (existing && existing.organizationId !== organization.id) {
      throw new Error(
        `Product SKU ${product.sku} is already used by another organization`,
      );
    }
    const seeded = await prisma.product.upsert({
      where: { sku: product.sku },
      update: {
        name: product.name,
        description: product.description,
        unit_price: new Prisma.Decimal(product.unit_price),
        categoryId,
        organizationId: organization.id,
        deletedAt: null,
      },
      create: {
        ...product,
        categoryId,
        organizationId: organization.id,
        unit_price: new Prisma.Decimal(product.unit_price),
      },
      select: { id: true, sku: true, name: true, unit_price: true },
    });
    productBySku.set(product.sku, seeded);
  }

  for (const [index, product] of [...productBySku.values()].entries()) {
    await seedOpeningInventory(
      organization.id,
      product,
      18 + ((index * 11) % 47),
      new Date(now.getTime() - (90 - (index % 30)) * 24 * 60 * 60 * 1000),
    );
  }

  let createdPurchaseOrders = 0;
  for (const fixture of demoRequests) {
    const requestId = await seedRequestFixture(
      fixture,
      organization.id,
      userByEmail,
      departmentByCode,
      productBySku,
      manager.id,
      now,
    );
    if (
      await seedPurchaseOrderFixture(
        fixture,
        requestId,
        organization.id,
        manager.id,
      )
    ) {
      createdPurchaseOrders += 1;
    }
  }

  const [
    categoryCount,
    productCount,
    inventoryCount,
    requestCount,
    orderCount,
  ] = await Promise.all([
    prisma.category.count({
      where: { organizationId: organization.id, deletedAt: null },
    }),
    prisma.product.count({
      where: { organizationId: organization.id, deletedAt: null },
    }),
    prisma.inventory.count({ where: { organizationId: organization.id } }),
    prisma.purchaseRequest.count({
      where: { organizationId: organization.id },
    }),
    prisma.purchaseOrder.count({ where: { organizationId: organization.id } }),
  ]);

  console.log(`Seeded demo organization: ${organization.name}`);
  console.log(
    `Demo users: ${demoUsers.length}; departments: ${demoDepartments.length}`,
  );
  console.log(
    `Catalog: ${categoryCount} categories, ${productCount} products, ${inventoryCount} inventory records.`,
  );
  console.log(
    `Procurement workflow: ${requestCount} requests, ${orderCount} purchase orders (${createdPurchaseOrders} newly created this run).`,
  );
  console.log(
    'Seed is additive and repeatable; it does not reset or delete database records.',
  );
}

main()
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
