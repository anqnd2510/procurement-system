# Procurement System - Backend Upgrade Plan

## Goal

Evolve the current NestJS application into a procurement and inventory platform:

```text
Purchase Request -> Approval -> RFQ/Quote -> Purchase Order
       -> Goods Receipt -> Inventory -> Invoice Matching -> Payment
```

The target system should demonstrate multi-tenancy, RBAC, state machines, transactions, concurrency control, idempotency, background jobs, audit logging, observability, and reporting.

## Current foundation

- NestJS, TypeScript, Prisma, PostgreSQL, and Redis.
- JWT access and refresh tokens.
- Global JWT guard, public-route decorator, and roles.
- Category hierarchy, products, SKU generation, and soft delete.
- Inventory with available/reserved quantities.
- Inventory transactions: `STOCK_IN`, `RESERVE`, `RELEASE`, and `FULFILL`.
- Row locking with `SELECT FOR UPDATE`.
- Swagger, Helmet, CORS, compression, and validation.

## Phase 0 - Stabilize the foundation

- Fix Jest path aliases and mock dependencies in unit tests.
- Make public registration always create `EMPLOYEE`; only authorized admins can manage roles.
- Validate token type and configure token TTL through environment variables.
- Use a consistent refresh-token revocation strategy.
- Remove duplicate inventory providers/controllers from `AppModule`.
- Add `.env.example` and environment validation.
- Standardize error responses and add request IDs.
- Document local setup, Docker, migrations, seeding, and Swagger.

Done when build, formatting, lint, tests, Prisma validation, and Docker startup work.

## Phase 1 - Organization and authorization

Add `Organization`, `Department`, `OrganizationMember`, `Permission`, and `RolePermission`.

Every business entity should eventually have an `organizationId`. Add organization scope checks and permission guards. Test that users cannot access data from another organization.

Example permissions:

```text
product.read
product.manage
purchase_request.create
purchase_request.approve
inventory.stock_in
```

## Phase 2 - Purchase requests

Add `PurchaseRequest` and `PurchaseRequestItem`.

Suggested states:

```text
DRAFT -> SUBMITTED -> IN_REVIEW -> APPROVED
                         |             |
                      REJECTED       CONVERTED

DRAFT/SUBMITTED -> CANCELLED
```

Endpoints:

- `POST /purchase-requests`
- `GET /purchase-requests`
- `GET /purchase-requests/:id`
- `PATCH /purchase-requests/:id`
- `POST /purchase-requests/:id/submit`
- `POST /purchase-requests/:id/cancel`

Only draft requests can be edited. Totals, quantities, and validation must be calculated on the server. Create the request and items in one transaction.

## Phase 3 - Approval workflow

Add `ApprovalWorkflow`, `ApprovalWorkflowStep`, `ApprovalInstance`, `ApprovalStepInstance`, and `ApprovalAction`.

The MVP should support sequential approvals, approve/reject/request-changes, comments, department/role-based approvers, and amount-based rules. Protect approval actions with transactions, row locking, idempotency keys, and audit logs.

Example:

```text
Under 10m: Department Manager -> Procurement Manager
10m-100m: Department Manager -> Procurement -> Finance
Over 100m: add Director approval
```

## Phase 4 - Suppliers and RFQ

Add suppliers, contacts, supplier products, RFQs, RFQ items, supplier invitations, quotes, and quote items.

Support multiple supplier quotes, deadlines, price/lead-time/payment-term comparison, and awarding one or more suppliers. Freeze quote data after the deadline and snapshot the awarded quote when creating a purchase order.

## Phase 5 - Purchase orders

Add `PurchaseOrder`, `PurchaseOrderItem`, `PurchaseOrderRevision`, and status history.

```text
DRAFT -> PENDING_APPROVAL -> APPROVED -> SENT -> ACKNOWLEDGED
                                      -> PARTIALLY_RECEIVED -> RECEIVED -> CLOSED
                                      -> CANCELLED
```

Approved orders must use revisions instead of direct mutation. Calculate totals on the server, add optimistic versioning, and record every status transition.

## Phase 6 - Goods receiving and inventory

Add warehouses, locations, goods receipts, receipt items, and inventory adjustments.

When a receipt is confirmed, lock the PO item, prevent over-receiving, update received quantities, increase available inventory, write an inventory transaction, and update the PO status atomically.

Improve the existing inventory model with warehouse scope, idempotent stock-in, partial receiving, reservation expiry, and reconciliation jobs.

## Phase 7 - Invoices and three-way matching

Add `Invoice`, `InvoiceItem`, `MatchingResult`, and `Payment`.

Match purchase order, goods receipt, and supplier invoice. Check item identity, received quantity, unit price tolerance, tax, discounts, shipping fees, and duplicate invoice numbers.

## Phase 8 - Events and background jobs

Start with BullMQ and Redis for notifications, email, webhooks, reports, low-stock alerts, reconciliation, and approval reminders.

Use retry with exponential backoff, dead-letter queues, job status, attempt counts, and idempotent handlers. Keep slow work out of HTTP requests.

## Phase 9 - Audit, security, and observability

Add append-only `AuditLog` fields for actor, organization, action, entity, before/after data, request ID, IP, user agent, and timestamp.

Add structured logs, request IDs, latency/error metrics, query timing, queue metrics, and health checks for PostgreSQL, Redis, and workers.

Add password policy, login lockout, refresh-token rotation, secret rotation, payload limits, and authorization tests. Never log passwords or tokens.

## Phase 10 - Reporting and search

Add spending by month/department/category, supplier spend, approval time, request aging, inventory turnover, stock-out frequency, and fulfillment rate.

Start with PostgreSQL indexes and full-text search. Add OpenSearch only when real scale requires it.

## Cross-cutting standards

- Retryable actions use `Idempotency-Key` and store the request hash/result.
- State transitions live in services, not controllers.
- Use page/limit pagination for normal lists and cursor pagination for large logs/transactions.
- Every feature needs schema/migration, validation, authorization, tests, documentation, and seed data.

## Testing strategy

- Unit tests for state transitions, permissions, totals, and inventory calculations.
- Integration tests with real PostgreSQL and Redis for transactions, rollback, locking, and idempotency.
- End-to-end test for login -> request -> approval -> PO -> receiving -> inventory -> invoice matching.
- Always test retries, concurrent reservations, cross-tenant access, duplicate approvals, partial receipts, duplicate invoices, and rollback.

## Recommended delivery order

1. Foundation and tests.
2. Organization and permissions.
3. Purchase requests.
4. Approval workflow.
5. Purchase orders.
6. Goods receiving and inventory integration.
7. Suppliers and RFQs.
8. Invoice matching.
9. Queues and events.
10. Audit, security, and observability.
11. Reporting and search.

## First four sprints

### Sprint 1 - Stabilize

Fix Jest aliases, mocks, registration roles, duplicate providers, environment documentation, error responses, and request IDs.

### Sprint 2 - Organization

Create organizations, departments, members, permission guards, organization scoping, and cross-organization tests.

### Sprint 3 - Purchase request

Implement request/item schema, draft CRUD, submit/cancel, server-side totals, and status history.

### Sprint 4 - Approval MVP

Implement sequential workflow, approve/reject, approval tasks, locking, idempotency, and audit logging.

