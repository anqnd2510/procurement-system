export type Role = 'EMPLOYEE' | 'MANAGER' | 'ADMIN';
export type OrganizationRole = 'OWNER' | 'MANAGER' | 'MEMBER';
export type PurchaseRequestStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'APPROVED'
  | 'REJECTED'
  | 'CANCELLED'
  | 'FULFILLED';
export type PurchaseOrderStatus = 'DRAFT' | 'ISSUED' | 'RECEIVED' | 'CANCELLED';
export type InventoryTransactionType =
  | 'STOCK_IN'
  | 'RESERVE'
  | 'RELEASE'
  | 'FULFILL';

export interface DashboardSummary {
  organizationId: string;
  generatedAt: string;
  purchaseRequestsTotal: number;
  purchaseRequestsByStatus: Record<PurchaseRequestStatus, number>;
  awaitingReviewCount: number;
  purchaseOrdersTotal: number;
  purchaseOrdersByStatus: Record<PurchaseOrderStatus, number>;
  purchaseOrderAmountsByStatus: Record<PurchaseOrderStatus, string>;
  outOfStockProducts: number;
  openPurchaseOrdersCount: number;
  activeProducts: number;
  activeCategories: number;
  inventoryTrackedProducts: number;
  inventoryAvailable: number;
  inventoryReserved: number;
  inventoryTotal: number;
}

export interface User {
  id: string;
  email: string;
  role: Role;
}

export interface AuthResult {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface Membership {
  id?: string;
  role: OrganizationRole;
  user?: User;
  createdAt?: string;
  departmentId?: string | null;
  departmentRole?: 'MEMBER' | 'LEAD';
  department?: Pick<Department, 'id' | 'name' | 'code'> | null;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
  members: Membership[];
}

export interface Department {
  id: string;
  organizationId: string;
  name: string;
  code: string;
  createdAt: string;
  _count?: { members: number };
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  description: string | null;
  unit_price: number | string;
  categoryId: string | null;
  category: { id: string; name: string } | null;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  description: string | null;
  parentId: string | null;
  children?: Category[];
  createdAt: string;
  updatedAt: string;
}

export interface PageMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface PageData<T> {
  items: T[];
  meta: PageMeta;
}

export interface RequestItem {
  id?: string;
  productId: string | null;
  description: string;
  quantity: number;
  estimatedUnitPrice: number | string;
  estimatedTotal: number | string;
  notes?: string | null;
  product?: Pick<Product, 'id' | 'name' | 'sku'> | null;
}

export interface PurchaseRequest {
  id: string;
  organizationId: string;
  departmentId: string;
  requesterId: string;
  title: string;
  description: string | null;
  status: PurchaseRequestStatus;
  totalAmount: number | string;
  createdAt: string;
  updatedAt: string;
  department: Pick<Department, 'id' | 'name' | 'code'>;
  requester: Pick<User, 'id' | 'email'>;
  items: RequestItem[];
  history?: Array<{
    id: string;
    fromStatus: PurchaseRequestStatus | null;
    toStatus: PurchaseRequestStatus;
    comment: string | null;
    createdAt: string;
    changedBy: Pick<User, 'id' | 'email'>;
  }>;
}

export interface PurchaseOrder {
  id: string;
  organizationId: string;
  purchaseRequestId: string;
  orderNumber: string;
  supplierName: string;
  status: PurchaseOrderStatus;
  totalAmount: number | string;
  issuedAt: string | null;
  receivedAt: string | null;
  cancelledAt: string | null;
  createdAt: string;
  purchaseRequest?: {
    id: string;
    title: string;
    status: PurchaseRequestStatus;
  };
  createdBy?: Pick<User, 'id' | 'email'>;
  items: Array<{
    id: string;
    productId: string | null;
    description: string;
    quantity: number;
    unitPrice: number | string;
    lineTotal: number | string;
    product?: Pick<Product, 'id' | 'name' | 'sku'> | null;
  }>;
}

export interface Inventory {
  id: string;
  productId: string;
  productName: string;
  productSku: string;
  qtyAvailable: number;
  qtyReserved: number;
  qtyTotal: number;
  updatedAt: string;
}

export interface ReorderPolicy {
  inventoryId: string | null;
  productId: string;
  reorderPoint: number | null;
  targetStock: number | null;
}

export interface ReorderAlert {
  inventoryId: string;
  productId: string;
  productName: string;
  productSku: string;
  qtyAvailable: number;
  qtyReserved: number;
  qtyTotal: number;
  reorderPoint: number;
  targetStock: number;
  incomingQty: number;
  suggestedOrderQty: number;
  status: 'LOW_STOCK' | 'OUT_OF_STOCK';
  updatedAt: string;
}

export interface InventoryTransaction {
  id: string;
  inventoryId: string;
  type: InventoryTransactionType;
  quantity: number;
  referenceId: string | null;
  createdAt: string;
  productId: string;
  productName: string;
  productSku: string;
}

export interface AuditLog {
  id: string;
  organizationId: string;
  actorUserId: string | null;
  action: string;
  resourceType: string;
  resourceId: string;
  resourceName: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  actor: Pick<User, 'id' | 'email'> | null;
}

export interface HealthReport {
  status: 'ok' | 'error';
  info?: Record<string, { status: string }>;
  error?: Record<string, { status: string; message?: string }>;
}
