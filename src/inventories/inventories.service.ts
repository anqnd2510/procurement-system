import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { InventoryResponseDto } from './dto/inventory-response.dto';
import { InventoryHelper } from './helpers/inventory.helper';
import { StockInDto } from './dto/stock-in.dto';
import { InventoryTxType } from '@prisma/client';
import { OrganizationsService } from '../organizations/organizations.service';

type InventoryRow = {
  id: string;
  product_id: string;
  qty_available: number;
  qty_reserved: number;
  updated_at: Date;
};

@Injectable()
export class InventoriesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly organizations: OrganizationsService,
  ) {}

  // ─── GET /inventory/:productId ─────────────────────────────────────────────
  async findByProductId(productId: string): Promise<InventoryResponseDto> {
    const organizationId = await this.organizations.getDefaultOrganizationId();
    const inventory = await this.prisma.inventory.findUnique({
      where: { productId },
      include: {
        product: { select: { name: true, sku: true, organizationId: true } },
      },
    });

    if (!inventory) {
      throw new NotFoundException(
        `Inventory for product ${productId} not found`,
      );
    }
    if (inventory.product.organizationId !== organizationId) {
      throw new NotFoundException(
        `Inventory for product ${productId} not found`,
      );
    }

    return InventoryHelper.toDto(inventory);
  }

  // ─── POST /inventory/stock-in ──────────────────────────────────────────────
  async stockIn(
    dto: StockInDto,
    userId: string,
    organizationId: string,
  ): Promise<InventoryResponseDto> {
    await this.organizations.getMembership(userId, organizationId);
    // Validate product exists and is not deleted
    const product = await this.prisma.product.findFirst({
      where: { id: dto.productId, deletedAt: null, organizationId },
    });
    if (!product) {
      throw new NotFoundException(`Product ${dto.productId} not found`);
    }

    // upsert: create inventory record if it doesn't exist (first time receiving stock)
    // update: increase qtyAvailable if inventory record already exists
    await this.prisma.$transaction(async (tx) => {
      const updated = await tx.inventory.upsert({
        where: { productId: dto.productId },
        create: {
          productId: dto.productId,
          organizationId,
          qtyAvailable: dto.quantity,
          qtyReserved: 0,
        },
        update: {
          qtyAvailable: { increment: dto.quantity },
        },
      });

      // Write transaction log
      await tx.inventoryTransaction.create({
        data: {
          inventoryId: updated.id,
          type: InventoryTxType.STOCK_IN,
          quantity: dto.quantity,
          referenceId: null, // STOCK_IN does not have a referenceId
        },
      });

      return updated;
    });

    // Fetch again with product info to build DTO
    return this.findByProductId(dto.productId);
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // RESERVE
  // Giữ hàng cho 1 order. Đây là method cần SELECT FOR UPDATE để tránh race condition.
  //
  // Race condition xảy ra khi:
  //   Laptop Dell còn 1 cái. 3 request cùng lúc:
  //   A đọc available=1 ✓ → B đọc available=1 ✓ → C đọc available=1 ✓
  //   A update available=0 → B update available=-1 ✗ → C update available=-2 ✗
  //
  // SELECT FOR UPDATE fix bằng cách lock row:
  //   A lock → B/C block → A commit → B đọc available=0 → 409 → C đọc available=0 → 409
  // ─────────────────────────────────────────────────────────────────────────────
  async reserve(
    orderId: string,
    productId: string,
    qty: number,
  ): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      // BƯỚC 1: SELECT FOR UPDATE
      // Lock row inventory của product này.
      // Mọi transaction khác cố SELECT FOR UPDATE cùng row → bị BLOCK cho đến khi
      // transaction này COMMIT hoặc ROLLBACK.
      // $queryRaw bắt buộc vì Prisma không có API native cho FOR UPDATE.
      const rows = await tx.$queryRaw<InventoryRow[]>`
        SELECT id, product_id, qty_available, qty_reserved, updated_at
        FROM inventory
        WHERE product_id = ${productId}::uuid
        FOR UPDATE
      `;

      if (rows.length === 0) {
        throw new NotFoundException(
          `Inventory for product ${productId} not found. Run stock-in first.`,
        );
      }

      const inventory = rows[0];

      // BƯỚC 2: IDEMPOTENCY CHECK
      // Idempotency = gọi nhiều lần cùng input → kết quả như nhau, không double-reserve.
      // Tại sao cần?
      //   - Client timeout rồi retry: server đã reserve xong nhưng response bị mất.
      //     Nếu không check → reserve thêm lần 2 → sai.
      //   - Order service crash và restart, gọi lại reserve.
      // Cách check: nếu orderId đã có trong log với type=RESERVE → đã làm rồi, return.
      const existing = await tx.inventoryTransaction.findFirst({
        where: {
          inventoryId: inventory.id,
          referenceId: orderId,
          type: InventoryTxType.RESERVE,
        },
      });

      if (existing) {
        return; // Idempotent: đã reserve rồi, không làm gì thêm
      }

      // BƯỚC 3: CHECK ĐỦ HÀNG
      // So sánh với qtyAvailable, KHÔNG phải qtyAvailable + qtyReserved.
      // qtyReserved đang thuộc về các order khác rồi — không được đụng vào.
      if (inventory.qty_available < qty) {
        throw new ConflictException(
          `Insufficient stock. Available: ${inventory.qty_available}, requested: ${qty}`,
        );
      }

      // BƯỚC 4: UPDATE SỐ LƯỢNG
      // available giảm: hàng "rút khỏi kệ vào ngăn chờ order"
      // reserved tăng: hàng đang được giữ cho order này
      // Dùng $executeRaw để update trong cùng transaction đang giữ lock.
      await tx.$executeRaw`
        UPDATE inventory
        SET
          qty_available = qty_available - ${qty},
          qty_reserved  = qty_reserved  + ${qty},
          updated_at    = NOW()
        WHERE id = ${inventory.id}::uuid
      `;

      // BƯỚC 5: GHI TRANSACTION LOG
      // referenceId = orderId → sau này release()/fulfill() lookup theo đây
      // để biết cần hoàn/xác nhận đúng bao nhiêu qty cho order này.
      await tx.inventoryTransaction.create({
        data: {
          inventoryId: inventory.id,
          type: InventoryTxType.RESERVE,
          quantity: qty,
          referenceId: orderId,
        },
      });

      // BƯỚC 6: COMMIT (tự động)
      // Prisma $transaction tự COMMIT khi callback resolve.
      // Tự ROLLBACK nếu callback throw — đảm bảo atomicity.
    });
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // RELEASE
  // Hoàn trả hàng đã reserve khi order bị REJECTED hoặc CANCELLED.
  //
  // Tại sao lookup qty từ log thay vì nhận từ param?
  //   → An toàn hơn: không tin số caller truyền vào.
  //   → Đúng hơn: hoàn đúng số đã reserve, không thừa không thiếu.
  // ─────────────────────────────────────────────────────────────────────────────
  async release(orderId: string): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      // BƯỚC 1: TÌM RESERVE TRANSACTION
      // Lookup theo orderId để biết đã reserve bao nhiêu.
      // Không tìm thấy → order chưa reserve → không cần làm gì.
      const reserveTx = await tx.inventoryTransaction.findFirst({
        where: { referenceId: orderId, type: InventoryTxType.RESERVE },
      });

      if (!reserveTx) {
        return; // Chưa reserve → không cần release
      }

      // BƯỚC 2: IDEMPOTENCY CHECK
      const existingRelease = await tx.inventoryTransaction.findFirst({
        where: { referenceId: orderId, type: InventoryTxType.RELEASE },
      });

      if (existingRelease) {
        return; // Đã release rồi
      }

      // BƯỚC 3: SELECT FOR UPDATE để lock row
      const rows = await tx.$queryRaw<InventoryRow[]>`
        SELECT id, product_id, qty_available, qty_reserved, updated_at
        FROM inventory
        WHERE id = ${reserveTx.inventoryId}::uuid
        FOR UPDATE
      `;

      if (rows.length === 0) {
        throw new NotFoundException(
          `Inventory ${reserveTx.inventoryId} not found`,
        );
      }

      const inventory = rows[0];
      const qty = reserveTx.quantity; // Lấy qty từ log, không từ param

      // Sanity check: reserved không được âm sau khi release
      if (inventory.qty_reserved < qty) {
        throw new BadRequestException(
          `Cannot release ${qty} — only ${inventory.qty_reserved} reserved`,
        );
      }

      // BƯỚC 4: UPDATE — đảo ngược của RESERVE
      // reserved giảm: hàng rời "ngăn chờ order"
      // available tăng: hàng trở lại kệ, có thể order lại
      await tx.$executeRaw`
        UPDATE inventory
        SET
          qty_available = qty_available + ${qty},
          qty_reserved  = qty_reserved  - ${qty},
          updated_at    = NOW()
        WHERE id = ${inventory.id}::uuid
      `;

      // BƯỚC 5: GHI LOG
      await tx.inventoryTransaction.create({
        data: {
          inventoryId: inventory.id,
          type: InventoryTxType.RELEASE,
          quantity: qty,
          referenceId: orderId,
        },
      });
    });
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // FULFILL
  // Xác nhận xuất kho thật sự khi order FULFILLED.
  // CHỈ giảm qty_reserved, KHÔNG tăng qty_available.
  //
  // Tại sao không tăng available?
  // Flow số liệu qua 1 order:
  //   Ban đầu:        available=10, reserved=0
  //   Sau RESERVE:    available=8,  reserved=2   ← hàng rút khỏi kệ
  //   Sau FULFILL:    available=8,  reserved=0   ← hàng xuất khỏi kho
  //
  //   Nếu tăng available khi FULFILL:
  //   Sau FULFILL:    available=10, reserved=0   ← SAI, như chưa xuất hàng
  //
  // Hàng đã rời kệ từ lúc RESERVE. FULFILL chỉ xác nhận "đã giao cho khách".
  // ─────────────────────────────────────────────────────────────────────────────
  async fulfill(orderId: string): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      // BƯỚC 1: TÌM RESERVE TRANSACTION
      const reserveTx = await tx.inventoryTransaction.findFirst({
        where: { referenceId: orderId, type: InventoryTxType.RESERVE },
      });

      if (!reserveTx) {
        throw new NotFoundException(
          `No reserve transaction found for order ${orderId}. Cannot fulfill.`,
        );
      }

      // BƯỚC 2: IDEMPOTENCY CHECK
      const existingFulfill = await tx.inventoryTransaction.findFirst({
        where: { referenceId: orderId, type: InventoryTxType.FULFILL },
      });

      if (existingFulfill) {
        return; // Đã fulfill rồi
      }

      // BƯỚC 3: SELECT FOR UPDATE
      const rows = await tx.$queryRaw<InventoryRow[]>`
        SELECT id, product_id, qty_available, qty_reserved, updated_at
        FROM inventory
        WHERE id = ${reserveTx.inventoryId}::uuid
        FOR UPDATE
      `;

      if (rows.length === 0) {
        throw new NotFoundException(
          `Inventory ${reserveTx.inventoryId} not found`,
        );
      }

      const inventory = rows[0];
      const qty = reserveTx.quantity;

      if (inventory.qty_reserved < qty) {
        throw new BadRequestException(
          `Cannot fulfill ${qty} — only ${inventory.qty_reserved} reserved`,
        );
      }

      // BƯỚC 4: UPDATE — CHỈ giảm reserved, available không đổi
      await tx.$executeRaw`
        UPDATE inventory
        SET
          qty_reserved = qty_reserved - ${qty},
          updated_at   = NOW()
        WHERE id = ${inventory.id}::uuid
      `;

      // BƯỚC 5: GHI LOG
      await tx.inventoryTransaction.create({
        data: {
          inventoryId: inventory.id,
          type: InventoryTxType.FULFILL,
          quantity: qty,
          referenceId: orderId,
        },
      });
    });
  }
}
