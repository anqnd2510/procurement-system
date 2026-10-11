import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ThrottlerGuard } from '@nestjs/throttler';
import { randomUUID } from 'node:crypto';
import request from 'supertest';
import type { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { InventoriesService } from '../src/inventories/inventories.service';

// Real PostgreSQL fixtures, isolated by UUID. No demo/user data is modified.
describe('Workspace access and validation (PostgreSQL e2e)', () => {
  let app: INestApplication<App>;
  let db: PrismaService;
  const ids = {
    org: randomUUID(),
    otherOrg: randomUUID(),
    dept: randomUUID(),
    otherDept: randomUUID(),
    foreignDept: randomUUID(),
    owner: randomUUID(),
    member: randomUUID(),
    lead: randomUUID(),
    colleague: randomUUID(),
    outsider: randomUUID(),
    memberMembership: randomUUID(),
    product: randomUUID(),
    foreignProduct: randomUUID(),
    category: randomUUID(),
    ownRequest: randomUUID(),
    teamRequest: randomUUID(),
    otherRequest: randomUUID(),
    leadRequest: randomUUID(),
    order: randomUUID(),
    otherOrder: randomUUID(),
  };
  const userIds = [
    ids.owner,
    ids.member,
    ids.lead,
    ids.colleague,
    ids.outsider,
  ];
  const orgIds = [ids.org, ids.otherOrg];
  const tokens = new Map<string, string>();

  beforeAll(async () => {
    const module = await Test.createTestingModule({ imports: [AppModule] })
      .overrideGuard(ThrottlerGuard)
      .useValue({ canActivate: () => true })
      .compile();
    app = module.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
    db = app.get(PrismaService);
    await db.$transaction(async (tx) => {
      await tx.user.createMany({
        data: userIds.map((id) => ({
          id,
          email: `${id}@workspace-test.invalid`,
          password: 'not-a-login-hash',
        })),
      });
      await tx.organization.createMany({
        data: orgIds.map((id) => ({
          id,
          slug: `e2e-${id}`,
          name: 'Isolated test workspace',
          createdById: ids.owner,
        })),
      });
      await tx.department.createMany({
        data: [
          {
            id: ids.dept,
            organizationId: ids.org,
            createdById: ids.owner,
            name: 'IT',
            code: 'IT',
          },
          {
            id: ids.otherDept,
            organizationId: ids.org,
            createdById: ids.owner,
            name: 'Finance',
            code: 'FIN',
          },
          {
            id: ids.foreignDept,
            organizationId: ids.otherOrg,
            createdById: ids.owner,
            name: 'Foreign',
            code: 'IT',
          },
        ],
      });
      await tx.organizationMember.createMany({
        data: [
          { organizationId: ids.org, userId: ids.owner, role: 'OWNER' },
          {
            id: ids.memberMembership,
            organizationId: ids.org,
            userId: ids.member,
            departmentId: ids.dept,
          },
          {
            organizationId: ids.org,
            userId: ids.lead,
            departmentId: ids.dept,
            departmentRole: 'LEAD',
          },
          {
            organizationId: ids.org,
            userId: ids.colleague,
            departmentId: ids.otherDept,
          },
        ],
      });
      await tx.category.create({
        data: {
          id: ids.category,
          organizationId: ids.otherOrg,
          name: `Category ${ids.category}`,
        },
      });
      await tx.product.createMany({
        data: [
          {
            id: ids.product,
            organizationId: ids.org,
            name: 'Test laptop',
            sku: ids.product,
            unit_price: 10,
          },
          {
            id: ids.foreignProduct,
            organizationId: ids.otherOrg,
            name: 'Foreign laptop',
            sku: ids.foreignProduct,
            unit_price: 20,
          },
        ],
      });
      await tx.purchaseRequest.createMany({
        data: [
          {
            id: ids.ownRequest,
            requesterId: ids.member,
            departmentId: ids.dept,
          },
          {
            id: ids.teamRequest,
            requesterId: ids.colleague,
            departmentId: ids.dept,
          },
          {
            id: ids.otherRequest,
            requesterId: ids.colleague,
            departmentId: ids.otherDept,
          },
          {
            id: ids.leadRequest,
            requesterId: ids.lead,
            departmentId: ids.dept,
          },
        ].map((row) => ({
          ...row,
          organizationId: ids.org,
          title: 'Test request',
          status: 'SUBMITTED' as const,
        })),
      });
      await tx.purchaseOrder.createMany({
        data: [
          {
            id: ids.order,
            purchaseRequestId: ids.ownRequest,
            totalAmount: '12.50',
          },
          {
            id: ids.otherOrder,
            purchaseRequestId: ids.otherRequest,
            totalAmount: '7.50',
          },
        ].map((row) => ({
          ...row,
          organizationId: ids.org,
          createdById: ids.owner,
          orderNumber: row.id,
          supplierName: 'Test supplier',
        })),
      });
    });
    const jwt = app.get(JwtService);
    for (const id of userIds)
      tokens.set(
        id,
        jwt.sign({
          sub: id,
          email: `${id}@workspace-test.invalid`,
          role: 'EMPLOYEE',
          type: 'access',
        }),
      );
  });

  afterAll(async () => {
    try {
      if (db)
        await db.$transaction(async (tx) => {
          await tx.auditLog.deleteMany({
            where: { organizationId: { in: orgIds } },
          });
          await tx.purchaseOrder.deleteMany({
            where: { organizationId: { in: orgIds } },
          });
          await tx.purchaseRequest.deleteMany({
            where: { organizationId: { in: orgIds } },
          });
          await tx.organizationMember.deleteMany({
            where: { organizationId: { in: orgIds } },
          });
          await tx.product.deleteMany({
            where: { organizationId: { in: orgIds } },
          });
          await tx.category.deleteMany({
            where: { organizationId: { in: orgIds } },
          });
          await tx.department.deleteMany({
            where: { organizationId: { in: orgIds } },
          });
          await tx.organization.deleteMany({ where: { id: { in: orgIds } } });
          await tx.user.deleteMany({ where: { id: { in: userIds } } });
        });
    } finally {
      await app?.close();
    }
  });

  function auth(userId: string) {
    return {
      Authorization: `Bearer ${tokens.get(userId)}`,
      'X-Organization-Id': ids.org,
    };
  }

  it('protects dashboard aggregates and returns actual decimal totals', async () => {
    await request(app.getHttpServer())
      .get('/dashboard/summary')
      .set(auth(ids.member))
      .expect(403);
    await request(app.getHttpServer())
      .get('/dashboard/summary')
      .set(auth(ids.lead))
      .expect(403);
    await request(app.getHttpServer())
      .get('/dashboard/summary')
      .set(auth(ids.owner))
      .expect(200)
      .expect(
        ({
          body,
        }: {
          body: {
            purchaseOrderAmountsByStatus: { DRAFT: string };
            outOfStockProducts: number;
          };
        }) => {
          expect(body.purchaseOrderAmountsByStatus.DRAFT).toBe('20.00');
          expect(body.outOfStockProducts).toBe(1);
        },
      );
  });

  it('enforces member read-only organization views and a primary department', async () => {
    await request(app.getHttpServer())
      .post('/organizations')
      .set(auth(ids.member))
      .send({ name: 'Blocked', slug: 'blocked' })
      .expect(403);
    await request(app.getHttpServer())
      .post(`/organizations/${ids.org}/departments`)
      .set(auth(ids.member))
      .send({ name: 'Blocked', code: 'NO' })
      .expect(403);
    await request(app.getHttpServer())
      .get(`/organizations/${ids.org}/members`)
      .set(auth(ids.member))
      .expect(403);
    await request(app.getHttpServer())
      .get(`/organizations/${ids.org}/departments`)
      .set(auth(ids.member))
      .expect(200)
      .expect(({ body }: { body: { id: string }[] }) =>
        expect(body.map((row) => row.id)).toEqual([ids.dept]),
      );
    await request(app.getHttpServer())
      .get(`/organizations/${ids.org}/members`)
      .set(auth(ids.lead))
      .expect(200)
      .expect(({ body }: { body: { departmentId: string }[] }) =>
        expect(body.every((row) => row.departmentId === ids.dept)).toBe(true),
      );
  });

  it('rejects cross-tenant assignments and simultaneous department leads at the database boundary', async () => {
    await request(app.getHttpServer())
      .patch(
        `/organizations/${ids.org}/members/${ids.memberMembership}/department`,
      )
      .set(auth(ids.owner))
      .send({ departmentId: ids.foreignDept, departmentRole: 'MEMBER' })
      .expect(404);
    await request(app.getHttpServer())
      .patch(
        `/organizations/${ids.org}/members/${ids.memberMembership}/department`,
      )
      .set(auth(ids.owner))
      .send({ departmentId: ids.dept, departmentRole: 'LEAD' })
      .expect(409);
    await expect(
      db.organizationMember.update({
        where: { id: ids.memberMembership },
        data: { departmentId: ids.foreignDept },
      }),
    ).rejects.toMatchObject({ code: 'P2003' });
  });

  it('allows only own-request reads for members and department reads for leads', async () => {
    await request(app.getHttpServer())
      .get('/purchase-requests')
      .set(auth(ids.member))
      .expect(200)
      .expect(({ body }: { body: { items: { id: string }[] } }) =>
        expect(body.items.map((row) => row.id)).toEqual([ids.ownRequest]),
      );
    await request(app.getHttpServer())
      .get(`/purchase-requests/${ids.teamRequest}`)
      .set(auth(ids.member))
      .expect(404);
    await request(app.getHttpServer())
      .get(`/purchase-requests/${ids.teamRequest}`)
      .set(auth(ids.lead))
      .expect(200);
    await request(app.getHttpServer())
      .get(`/purchase-requests/${ids.otherRequest}`)
      .set(auth(ids.lead))
      .expect(404);
    await request(app.getHttpServer())
      .post(`/purchase-requests/${ids.leadRequest}/approve`)
      .set(auth(ids.lead))
      .send({})
      .expect(403);
    await request(app.getHttpServer())
      .post(`/purchase-requests/${ids.otherRequest}/approve`)
      .set(auth(ids.lead))
      .send({})
      .expect(403);
    await request(app.getHttpServer())
      .post(`/purchase-requests/${ids.teamRequest}/approve`)
      .set(auth(ids.lead))
      .send({})
      .expect(200);
  });

  it('scopes the order register, products and inventory to the active tenant', async () => {
    await request(app.getHttpServer())
      .get('/purchase-orders')
      .set(auth(ids.member))
      .expect(200)
      .expect(({ body }: { body: { items: { id: string }[] } }) =>
        expect(body.items.map((row) => row.id)).toEqual([ids.order]),
      );
    await request(app.getHttpServer())
      .get('/products/workspace?search=LAPTOP')
      .set(auth(ids.member))
      .expect(200)
      .expect(({ body }: { body: { items: { id: string }[] } }) =>
        expect(body.items.map((row) => row.id)).toEqual([ids.product]),
      );
    await request(app.getHttpServer())
      .get(`/inventories/workspace/${ids.foreignProduct}`)
      .set(auth(ids.member))
      .expect(404);
    await request(app.getHttpServer())
      .get('/products/workspace')
      .set(auth(ids.outsider))
      .expect(403);
    await request(app.getHttpServer())
      .post('/products')
      .set(auth(ids.owner))
      .send({
        name: 'Invalid category',
        unit_price: 10,
        categoryId: ids.category,
      })
      .expect(404);
  });

  it('rejects negative, fractional quantities and over-precision prices through the actual API', async () => {
    for (const quantity of [-1, 0, 1.5, 2147483648])
      await request(app.getHttpServer())
        .post('/inventories/stock-in')
        .set(auth(ids.owner))
        .send({ productId: ids.product, quantity })
        .expect(400);
    for (const unit_price of [-1, 0, 1.234])
      await request(app.getHttpServer())
        .post('/products')
        .set(auth(ids.owner))
        .send({ name: 'Invalid price', unit_price })
        .expect(400);
  });

  it('validates request department IDs on create/edit and persists inline review comments', async () => {
    const payload = {
      title: 'Department validation fixture',
      departmentId: ids.dept,
      items: [
        { description: 'Test service', quantity: 1, estimatedUnitPrice: 10 },
      ],
    };
    // DTO validation and tenant authorization remain enforced even without a UI selector.
    await request(app.getHttpServer())
      .post('/purchase-requests')
      .set(auth(ids.member))
      .send({ ...payload, departmentId: 'invalid' })
      .expect(400);
    await request(app.getHttpServer())
      .post('/purchase-requests')
      .set(auth(ids.member))
      .send({ ...payload, departmentId: ids.otherDept })
      .expect(403);
    await request(app.getHttpServer())
      .post('/purchase-requests')
      .set(auth(ids.owner))
      .send({ ...payload, departmentId: ids.foreignDept })
      .expect(404);

    const created = await request(app.getHttpServer())
      .post('/purchase-requests')
      .set(auth(ids.member))
      .send(payload)
      .expect(201);
    const draftId = (created.body as { id: string }).id;
    await request(app.getHttpServer())
      .patch(`/purchase-requests/${draftId}`)
      .set(auth(ids.member))
      .send({ departmentId: ids.otherDept })
      .expect(403);
    await request(app.getHttpServer())
      .post(`/purchase-requests/${draftId}/submit`)
      .set(auth(ids.member))
      .expect(200);
    await request(app.getHttpServer())
      .post(`/purchase-requests/${draftId}/reject`)
      .set(auth(ids.lead))
      .send({ reason: '   \n ' })
      .expect(400);
    expect(
      (await db.purchaseRequest.findUniqueOrThrow({ where: { id: draftId } }))
        .status,
    ).toBe('SUBMITTED');
    await request(app.getHttpServer())
      .post(`/purchase-requests/${draftId}/reject`)
      .set(auth(ids.lead))
      .send({ reason: '  Outside this quarter budget  ' })
      .expect(200);
    const history = await db.purchaseRequestStatusHistory.findFirstOrThrow({
      where: { purchaseRequestId: draftId, toStatus: 'REJECTED' },
    });
    expect(history.comment).toBe('Outside this quarter budget');
    expect(history.changedById).toBe(ids.lead);

    // Organization-level managers retain their explicit cross-department capability.
    const managed = await request(app.getHttpServer())
      .post('/purchase-requests')
      .set(auth(ids.owner))
      .send({ ...payload, departmentId: ids.otherDept })
      .expect(201);
    expect((managed.body as { departmentId: string }).departmentId).toBe(
      ids.otherDept,
    );
  });

  it('reserves, releases and fulfills actual stock using TEXT IDs and rolls back insufficient stock', async () => {
    const product = await db.product.create({
      data: {
        organizationId: ids.org,
        name: 'SQL regression fixture',
        sku: randomUUID(),
        unit_price: 10,
      },
    });
    await request(app.getHttpServer())
      .post('/inventories/stock-in')
      .set(auth(ids.owner))
      .send({ productId: product.id, quantity: 10 })
      .expect(200);
    async function submitted(quantity: number) {
      const result = await request(app.getHttpServer())
        .post('/purchase-requests')
        .set(auth(ids.member))
        .send({
          departmentId: ids.dept,
          title: 'Stock regression fixture',
          items: [
            {
              productId: product.id,
              description: 'Test stock',
              quantity,
              estimatedUnitPrice: 10,
            },
          ],
        })
        .expect(201);
      const id = (result.body as { id: string }).id;
      await request(app.getHttpServer())
        .post(`/purchase-requests/${id}/submit`)
        .set(auth(ids.member))
        .expect(200);
      return id;
    }
    async function expectStock(available: number, reserved: number) {
      expect(
        await db.inventory.findUniqueOrThrow({
          where: { productId: product.id },
        }),
      ).toMatchObject({ qtyAvailable: available, qtyReserved: reserved });
    }

    const cancelledId = await submitted(3);
    await request(app.getHttpServer())
      .post(`/purchase-requests/${cancelledId}/approve`)
      .set(auth(ids.lead))
      .send({ comment: '  Stock checked  ' })
      .expect(200);
    await expectStock(7, 3);
    expect(
      await db.purchaseRequestStatusHistory.findFirstOrThrow({
        where: { purchaseRequestId: cancelledId, toStatus: 'APPROVED' },
      }),
    ).toMatchObject({ comment: 'Stock checked' });
    await request(app.getHttpServer())
      .post(`/purchase-requests/${cancelledId}/approve`)
      .set(auth(ids.lead))
      .send({})
      .expect(409);
    await expectStock(7, 3);
    await request(app.getHttpServer())
      .post(`/purchase-requests/${cancelledId}/cancel`)
      .set(auth(ids.member))
      .expect(200);
    await expectStock(10, 0);

    const fulfilledId = await submitted(4);
    await request(app.getHttpServer())
      .post(`/purchase-requests/${fulfilledId}/approve`)
      .set(auth(ids.lead))
      .send({})
      .expect(200);
    await expectStock(6, 4);
    for (let retry = 0; retry < 2; retry++)
      await request(app.getHttpServer())
        .post(`/purchase-requests/${fulfilledId}/fulfill`)
        .set(auth(ids.owner))
        .expect(200);
    await expectStock(6, 0);
    expect(
      await db.inventoryTransaction.count({
        where: { referenceId: fulfilledId, type: 'FULFILL' },
      }),
    ).toBe(1);

    const insufficientId = await submitted(7);
    await request(app.getHttpServer())
      .post(`/purchase-requests/${insufficientId}/approve`)
      .set(auth(ids.lead))
      .send({})
      .expect(409);
    await expectStock(6, 0);
    expect(
      (
        await db.purchaseRequest.findUniqueOrThrow({
          where: { id: insufficientId },
        })
      ).status,
    ).toBe('SUBMITTED');
    expect(
      await db.inventoryTransaction.count({
        where: { referenceId: insufficientId },
      }),
    ).toBe(0);
    expect(
      await db.purchaseRequestStatusHistory.count({
        where: { purchaseRequestId: insufficientId, toStatus: 'APPROVED' },
      }),
    ).toBe(0);
  });

  it('uses matching TEXT identifiers for standalone inventory service operations', async () => {
    const product = await db.product.create({
      data: {
        organizationId: ids.org,
        name: 'Inventory SQL regression fixture',
        sku: randomUUID(),
        unit_price: 10,
      },
    });
    const inventory = await db.inventory.create({
      data: { organizationId: ids.org, productId: product.id, qtyAvailable: 5 },
    });
    const service = app.get(InventoriesService);
    const releaseRef = randomUUID();
    await service.reserve(releaseRef, product.id, 2);
    await service.reserve(releaseRef, product.id, 2);
    await service.release(releaseRef);
    await service.release(releaseRef);
    expect(
      await db.inventory.findUniqueOrThrow({ where: { id: inventory.id } }),
    ).toMatchObject({ qtyAvailable: 5, qtyReserved: 0 });
    const fulfillRef = randomUUID();
    await service.reserve(fulfillRef, product.id, 3);
    await service.fulfill(fulfillRef);
    await service.fulfill(fulfillRef);
    expect(
      await db.inventory.findUniqueOrThrow({ where: { id: inventory.id } }),
    ).toMatchObject({ qtyAvailable: 2, qtyReserved: 0 });
  });
});
