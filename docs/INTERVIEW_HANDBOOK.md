# SupplyDesk Interview Handbook

Prepare to explain SupplyDesk from the business problem to database correctness, user experience, testing, and delivery. The strongest interview answers connect a real requirement to the implementation, show a failure case, and acknowledge the trade-off.

This handbook describes the repository as of 13 October 2026. **Implemented** means present in source or configuration, not independently proven in a production deployment. **Improvement** means a design you can discuss without claiming it already exists. Examples are teaching scenarios, not production measurements.

Start with chapters 1, 6–12, and 20–22 for a backend interview. Include chapters 15–19 for a full-stack role. Use chapter 26 for rehearsal after studying the code.

## Contents

1. [Present the project](#1-present-the-project)
2. [Read the architecture](#2-read-the-architecture)
3. [JavaScript and TypeScript foundations](#3-javascript-and-typescript-foundations)
4. [Node.js and asynchronous execution](#4-nodejs-and-asynchronous-execution)
5. [NestJS and the HTTP request lifecycle](#5-nestjs-and-the-http-request-lifecycle)
6. [Authentication and session security](#6-authentication-and-session-security)
7. [Authorization and tenant isolation](#7-authorization-and-tenant-isolation)
8. [Database modeling and migrations](#8-database-modeling-and-migrations)
9. [Purchase request state transitions](#9-purchase-request-state-transitions)
10. [Transactions and concurrency](#10-transactions-and-concurrency)
11. [Inventory and idempotency](#11-inventory-and-idempotency)
12. [Purchase orders and money](#12-purchase-orders-and-money)
13. [HTTP contracts and validation](#13-http-contracts-and-validation)
14. [Redis and rate limiting](#14-redis-and-rate-limiting)
15. [Restock settings and dashboard queries](#15-restock-settings-and-dashboard-queries)
16. [Audit history and observability](#16-audit-history-and-observability)
17. [React and frontend architecture](#17-react-and-frontend-architecture)
18. [TanStack Query and the API client](#18-tanstack-query-and-the-api-client)
19. [Accessible and usable interfaces](#19-accessible-and-usable-interfaces)
20. [Testing strategy](#20-testing-strategy)
21. [Docker and networking](#21-docker-and-networking)
22. [CI and GitHub Actions](#22-ci-and-github-actions)
23. [Designing CD and safe releases](#23-designing-cd-and-safe-releases)
24. [Performance and troubleshooting](#24-performance-and-troubleshooting)
25. [Trade-offs and honest limitations](#25-trade-offs-and-honest-limitations)
26. [Interview questions and answer checkpoints](#26-interview-questions-and-answer-checkpoints)
27. [Practical exercises and study schedule](#27-practical-exercises-and-study-schedule)
28. [Interview presentation and final checklist](#28-interview-presentation-and-final-checklist)

## 1 Present the project

### The business problem

SupplyDesk is a small internal procurement and inventory application. Employees submit requests, authorized people review them, managers create supplier orders, and inventory movements are recorded with their originating business operation. Organizations keep their data separate. Departments determine some of the review and read permissions.

Be able to distinguish these concepts:

| Concept | Business meaning | Example |
| --- | --- | --- |
| Purchase request | An internal request for goods or services | An employee requests two monitors |
| Approval | An authorized internal decision | A department lead approves a colleague's request |
| Reservation | Existing stock is assigned to a request | Two available monitors become reserved |
| Purchase order | An order addressed to a supplier | A manager records an order for monitors |
| Receipt | Goods enter inventory | An issued order is received |
| Fulfillment | Reserved goods leave inventory for the request | The employee receives the reserved monitors |
| Restock reminder | Available stock reaches a configured threshold | Available stock is at or below 10 |

An approval is not a supplier payment. A receipt is not request fulfillment. An order total is not actual accounting expenditure. These distinctions prevent misleading answers about both business behavior and dashboard metrics.

### A defensible introduction

> SupplyDesk is a full-stack procurement MVP with a React frontend and a NestJS API. PostgreSQL stores organization membership, requests, orders, and inventory. The backend enforces organization and department permissions, calculates request totals, and updates inventory together with movement history in transactions. I use conditional status updates and row locks to prevent conflicting operations from corrupting stock. GitHub Actions checks both applications, applies migrations to an isolated test database, runs API integration tests, and builds their container images. The repository does not yet configure production deployment or background inventory workers.

Adapt first-person claims to work you actually understand and performed. If AI helped implement a feature, be ready to explain how you reviewed its assumptions and verified its behavior.

### The business limitation interviewers may notice

Approval currently reserves existing stock for product-linked lines. Therefore a request for a product with no available stock may fail approval, even though a real procurement department often purchases precisely because stock is unavailable. Orders can then be created from approved requests and received into stock.

Explain this as an MVP limitation. A fuller model would separate purchasing approval from inventory allocation, support shortages/backorders, and allocate received stock to outstanding demand. The current schema also does not model partial receipts, split suppliers, invoices, or multi-currency accounting.

### Readiness levels

| Priority | Expected ability |
| --- | --- |
| Essential | Explain the domain, API request flow, auth, tenant isolation, transactions, inventory arithmetic, and actual CI |
| Strong | Explain concurrent requests, idempotency gaps, SQL indexes, testing boundaries, React query caching, Docker networking |
| Advanced | Propose migration-safe deployments, reliable retries, capacity planning, observability, and measured performance improvements |

## 2 Read the architecture

The repository is a modular backend plus a separate frontend in one repository. Each application has its own package manifest, lockfile, build, and Dockerfile. Shared repository automation lives at the root. This is not a set of independently deployed domain microservices and does not require a workspace orchestrator to describe accurately.

```text
Browser
  React application
    API client + bearer token + selected organization
      Nginx reverse proxy in the container setup
        NestJS API
          Authentication, validation, authorization
          Domain services
            PostgreSQL via Prisma and the pg adapter
            Redis for rate limiting
```

### Source map

| Area | Read first | Explain |
| --- | --- | --- |
| Bootstrap | [main.ts](../backend/src/main.ts), [AppModule](../backend/src/app.module.ts) | Middleware, global guards, validation, Swagger |
| Authentication | [AuthService](../backend/src/auth/auth.service.ts), [JWT strategy](../backend/src/auth/strategies/jwt.strategy.ts) | Password checks, tokens, current user lookup |
| Tenant policy | [Membership policy](../backend/src/organizations/membership-policy.ts), [OrganizationsService](../backend/src/organizations/organizations.service.ts) | Organization and department access |
| Schema | [schema.prisma](../backend/src/prisma/schema.prisma) | Relations, constraints, indexes, decimals |
| Requests | [PurchaseRequestsService](../backend/src/purchase-requests/purchase-requests.service.ts) | Drafts, decisions, reservation, fulfillment |
| Orders | [PurchaseOrdersService](../backend/src/purchase-orders/purchase-orders.service.ts) | Snapshot lines, issue, receive, cancel |
| Inventory | [InventoriesService](../backend/src/inventories/inventories.service.ts) | Stock receipts, row locks, restock calculation |
| Audit | [AuditLogsService](../backend/src/audit-logs/audit-logs.service.ts) | Transactional audit recording and readable resource names |
| Dashboard | [DashboardService](../backend/src/dashboard/dashboard.service.ts) | Database aggregates and snapshot consistency |
| Frontend | [App.tsx](../frontend/src/App.tsx), [API client](../frontend/src/lib/api.ts) | Routing, lazy loading, auth refresh, errors |
| CI | [ci.yml](../.github/workflows/ci.yml), [container.yml](../.github/workflows/container.yml) | Quality gates and image builds |

### Why a modular monolith

A single application can update request status, stock, history, and audit records using one database transaction. Domain modules preserve navigable code boundaries without introducing service discovery, network failures between domains, or distributed transactions.

The trade-off is shared deployment and shared process resources. A badly performing report can affect transactional endpoints. Module boundaries are conventions and dependency rules, not network isolation.

Do not claim microservices are the automatic next step. First identify an independently scalable workload or organizational ownership boundary. A worker could eventually become a separate process, but background work is outside the current inventory implementation.

## 3 JavaScript and TypeScript foundations

Know these concepts through examples from this repository:

| Topic | What to explain | Project connection |
| --- | --- | --- |
| `const`, mutation, references | A constant binding can still point to a mutable object | Request line objects and React state copies |
| `null` versus `undefined` | Explicit absence versus omitted input | Both restock fields must be null to disable a policy |
| Promises and `async/await` | Errors reject promises; `await` does not block the entire process | Prisma calls and API requests |
| Closures | Functions capture bindings from their execution context | Mutation callbacks and selected organization |
| Array operations and `Map` | Grouping and deduplication, including complexity | Duplicate request lines are aggregated by product before reserve |
| Union types | Restrict allowed values and narrow by checks | Request status and inventory movement types |
| Generics | Preserve relationships between input/output types | `api.get<T>` and paginated responses |
| `unknown` versus `any` | Validate unknown values before use | API error payload parsing |
| Interfaces and classes | Types are erased; classes can carry runtime metadata | NestJS DTO decorators need runtime classes |
| Structural typing | Compatibility depends on shape | Prisma projections and response types |
| Optional chaining and nullish coalescing | Preserve meaningful zero values | Missing inventory aggregates become zero |
| Numbers and precision | Binary floating point differs from decimal money | Backend uses `Prisma.Decimal` for totals |

**Common trap:** `api.get<Product>()` does not validate the server's JSON at runtime. It gives TypeScript a type assumption. DTO validation protects incoming backend requests; a frontend runtime response validator would be a separate feature.

**Practice:** explain why `value || 10` overwrites zero but `value ?? 10` does not. Then identify where zero is a valid reorder point.

## 4 Node.js and asynchronous execution

The main JavaScript execution thread runs callbacks and promise continuations. Database and network waits allow other work to proceed. Asynchronous code does not make CPU-heavy JavaScript free: a large synchronous calculation still delays other callbacks.

Know the distinction between the event loop, OS networking, and the worker pool used by some native operations. Do not claim every asynchronous operation is handled by one identical mechanism.

For SupplyDesk:

- Awaiting PostgreSQL is normal I/O work; a tight CPU loop calculating a large report would still block the process.
- Password hashing has a computational cost. Benchmark the configured bcrypt work factor rather than increasing it arbitrarily.
- `Promise.all` can overlap independent work, but it does not increase a database connection's ability to execute simultaneous statements.
- A Prisma interactive transaction uses one connection. Writing `Promise.all` inside it does not imply SQL statements execute concurrently on that connection.
- Connection pools let separate requests use separate connections; more application replicas multiply the potential database connection count.
- An unhandled rejected promise, a leaked timer, or an undisposed connection can make shutdown and tests unreliable.

Read [PrismaService](../backend/src/prisma/prisma.service.ts): it creates a `pg` pool, wraps it with `PrismaPg`, and connects/disconnects through Nest lifecycle hooks. Explain why creating a new pool per HTTP request would be wasteful.

**Follow-up question:** if API replicas double, what happens to total database connections? Answer with the sum of pool capacities across replicas, then discuss measured concurrency and database limits.

## 5 NestJS and the HTTP request lifecycle

Learn the roles of module, controller, provider, dependency injection, guard, pipe, interceptor, and exception filter. A controller translates an HTTP call into a service call; the service owns the business operation. Prisma access in controllers would make business rules harder to reuse and test.

The general lifecycle is middleware, guards, inbound interceptors, pipes, controller/service execution, outbound interceptors, and exception handling when needed. Explain that exceptions can short-circuit this path. The official [NestJS lifecycle guide](https://docs.nestjs.com/faq/request-lifecycle) describes ordering and scope.

Current bootstrap choices:

- Helmet adds HTTP security headers; its policy settings still need deployment-specific review.
- CORS defines which browser origins may read cross-origin responses. It is not endpoint authorization.
- Compression reduces suitable response sizes at a CPU cost.
- A global JWT guard protects routes unless they are marked public.
- A global throttler guard applies request limits.
- `ValidationPipe` transforms DTO input, strips/rejects unexpected properties according to its configuration, and executes validators. Here `whitelist`, `forbidNonWhitelisted`, and `transform` are enabled.
- Swagger documents endpoint usage; it does not make the endpoint secure or validate every response.

### Validation has separate layers

1. The frontend helps a user enter a valid value.
2. DTO validation rejects malformed HTTP data, such as a negative quantity.
3. The service rejects business violations, such as a valid department ID from another organization.
4. The database enforces constraints against competing writers and code paths that bypass the API.

Nested request items use `ValidateNested` and `Type` so their validators run. Understand why a TypeScript interface alone cannot perform that runtime validation.

The exception filter currently catches `HttpException` and returns a common envelope. It uses `exception.message`; it does not comprehensively map Prisma errors or preserve every detailed validation response. Discuss that limitation when asked about error consistency.

## 6 Authentication and session security

### What the implementation does

Public registration assigns `EMPLOYEE`; the caller cannot choose an administrative role. Passwords are hashed with bcrypt using 10 salt rounds. Login returns a 15-minute access token and a 7-day refresh token. Access and refresh JWTs carry different `type` claims.

The access-token strategy validates signature/expiration and rejects refresh tokens used as access tokens. It then reads the user from the database, so the returned global role is current rather than blindly trusting the role copied into an old JWT.

Refresh records are stored in PostgreSQL. Refreshing deletes the old record and generates/stores a replacement. Logout deletes the specified refresh record; logout-all removes the user's refresh records.

### Questions to prepare

**Why hash rather than encrypt passwords?** Login needs to verify a candidate password, not recover the original. A salted password hash supports verification without keeping reversible credentials. A fast general-purpose hash is inappropriate for passwords because attackers can test guesses too cheaply.

**Is a JWT encrypted?** A signed JWT normally provides integrity and authenticity, not payload confidentiality. Decoding its payload does not mean its signature is valid. Do not put passwords or private secrets into claims.

**Why have two tokens?** Short-lived access tokens limit the lifetime of a stolen access credential. A refresh mechanism supports continued sessions without repeatedly asking for a password. It introduces revocation, rotation, storage, and replay concerns.

**Does logout immediately invalidate every access token?** Not in this design. Existing signed access tokens may remain usable until expiry while the user record still exists. Immediate revocation would need an additional mechanism, such as a session version or revocation store, with lookup and availability costs.

**Where are browser tokens stored?** In `sessionStorage`. The application uses bearer headers and sends API requests with `credentials: 'omit'`. Session storage is accessible to JavaScript, so XSS can expose tokens. It is not equivalent to an HttpOnly cookie.

### Improvements to discuss honestly

- Refresh token values are stored directly, not as hashes. Hashing stored refresh credentials would reduce the impact of a database disclosure.
- Refresh rotation uses separate database operations rather than one atomic consume-and-replace transaction. Concurrent refreshes and failures between deletion and replacement need stronger handling.
- The schema has a `revokedAt` field, but the current path primarily deletes tokens; do not describe a complete token-family/reuse-detection design.
- The frontend shares one refresh promise within a module instance, limiting duplicate refresh calls in that browser context. It is not coordination across every tab or device.
- Cookie-based sessions could reduce JavaScript token exposure, but require deliberate cookie attributes, CSRF protection, CORS, and deployment-origin decisions.
- Password reset, MFA, and sophisticated abuse detection are outside the implemented scope.

Also prepare XSS, CSRF, SQL injection, broken object-level authorization, secret management, TLS, least privilege, and credential-redaction explanations. Connect each to an actual entry point instead of reciting a security acronym list.

## 7 Authorization and tenant isolation

Authentication identifies a user. Authorization checks whether that user may perform this action on this resource in this organization.

There are three distinct role dimensions:

| Dimension | Values | Meaning |
| --- | --- | --- |
| Global user role | EMPLOYEE, MANAGER, ADMIN | Account-level capabilities, such as organization creation |
| Organization membership role | OWNER, MANAGER, MEMBER | Authority within a specific organization |
| Department role | MEMBER, LEAD | Department-level responsibility within that membership |

The `X-Organization-Id` header is a requested context, not proof of access. The backend must validate membership and scope data queries. A global administrator does not automatically own all tenant data.

### Current read and action scope

- Organization owners/managers can read requests across their organization.
- Department leads can read their own requests plus requests from their assigned department.
- Ordinary members can read their own requests.
- Order reads inherit scope through the linked request.
- Owners/managers and eligible department leads can review other people's requests; self-approval and self-rejection are prohibited.
- Ordinary members create requests for their primary department. Organization managers can choose another valid department in the same organization.
- A member has at most one primary department per organization; a department has at most one lead.
- Dashboard and audit routes require organization management privileges. A dedicated HR role is not implemented.

### Explain the defenses in sequence

For `GET /purchase-requests/:id`, validate the token, load membership, constrain the query by organization and read scope, then return a safe projection. Hiding a sidebar link improves usability but cannot prevent a direct HTTP request.

For a department assignment, checking that both records independently exist is insufficient. They must belong to the same organization. A composite foreign key reinforces this requirement in PostgreSQL.

### Adversarial examples

1. Replace only the organization header with another tenant's ID.
2. Keep the correct header but use a foreign request/product ID.
3. Use a manager's own request to attempt self-approval.
4. Move a member to a different department, then submit an old draft.
5. Switch organizations while the browser is still fetching the old organization's products.

Be ready to explain both the API response and whether any previous UI data can briefly appear. Backend filtering and frontend cache scoping solve different parts of the problem.

**Trade-off:** shared tables with organization keys are relatively simple to operate, but every access path must preserve scope. Schema-per-tenant, database-per-tenant, and PostgreSQL row-level security are alternatives with different isolation and operational costs; they are not implemented here.

## 8 Database modeling and migrations

Draw the core relationships from memory:

```text
User --< OrganizationMember >-- Organization
                    |
                    +-- optional primary Department

Organization --< Department --< PurchaseRequest --< PurchaseRequestItem
                                       |
                                       +--< StatusHistory
                                       +-- optional PurchaseOrder --< OrderItem

Organization --< Product -- optional Inventory --< InventoryTransaction
Organization identifier --< AuditLog
```

### Important constraints

| Constraint | Problem it prevents |
| --- | --- |
| Unique organization/user membership | Duplicate membership rows |
| Unique organization/department code | Duplicate department codes in one organization |
| Composite membership department foreign key | Cross-organization department assignments |
| Partial unique index on a department lead | Two concurrent lead assignments succeeding |
| Unique inventory product ID | Multiple inventory balances for one product |
| Unique purchase-order request ID | Multiple orders for the same request under the current model |
| Unique request idempotency key | Two successful inserts using the same non-null key |
| Restock policy CHECK constraint | Half-configured or invalid threshold/target pairs |

A prior application query cannot replace a uniqueness constraint. Two requests can both observe that a record does not exist before either inserts it.

### Details worth noticing

- Most IDs are `String @default(uuid())` without `@db.Uuid`. The values look like UUIDs but the PostgreSQL columns are TEXT.
- Raw SQL casts must match the physical type. A comparison between TEXT and a parameter explicitly cast to UUID caused the earlier `42883` error.
- Product SKU and category name uniqueness are currently global. If two organizations should reuse the same code/name, tenant-scoped uniqueness would require a schema and compatibility change.
- Products and categories use `deletedAt`. Active catalog queries exclude deleted rows, while historical lines preserve their own description and price information.
- Not all cross-organization relations have composite database foreign keys. Some checks remain service responsibilities.
- Inventory nonnegative balances are guarded by business logic; the inspected migrations do not add general nonnegative CHECK constraints for both stock columns.
- Audit organization IDs deliberately have no organization foreign key so the historical identifier can survive organization deletion. This trades strict referential integrity for retention.

### SQL knowledge to prepare

Know primary/foreign keys, unique versus nonunique indexes, composite index ordering, null semantics, `INNER JOIN` versus `LEFT JOIN`, `GROUP BY`, `COUNT`, `SUM`, `COALESCE`, `GREATEST`, CTEs, parameterized queries, and transaction boundaries.

Explain why a LEFT JOIN is appropriate when a product has no incoming order, and why `COALESCE(..., 0)` is needed. Explain why `SUM(integer)` can produce a wider result and why raw query results may contain `bigint` values that cannot be directly JSON-serialized.

### Migration knowledge

`migrate dev` supports development schema iteration; `migrate deploy` applies checked-in migrations to another environment. `prisma generate` creates client code; it does not apply schema changes. Schema validation is also different from checking a running database's migration status.

Never edit an already applied migration to change production history. Add a migration. For risky changes, expand the schema, deploy compatible code, backfill/verify, and remove the old structure later. Review lock duration, data volume, nullability, and rollback compatibility before running schema changes.

## 9 Purchase request state transitions

Read the transition methods rather than inferring behavior from button labels.

| Operation | From | To | Main rule or effect |
| --- | --- | --- | --- |
| Create | No request | DRAFT | Validate tenant/department/items and calculate total |
| Edit | DRAFT | DRAFT | Requester edits; current department constraints apply |
| Submit | DRAFT | SUBMITTED | Requester submits a valid draft |
| Approve | SUBMITTED | APPROVED | Authorized reviewer; reserve product-linked items |
| Reject | SUBMITTED | REJECTED | Authorized reviewer; record reason |
| Cancel | DRAFT, SUBMITTED, APPROVED | CANCELLED | Requester cancels; release existing reservations |
| Fulfill | APPROVED | FULFILLED | Organization manager consumes reservations |

Status history describes the workflow transition and actor. Inventory history describes stock movement. Audit logs provide a broader activity record. They overlap in context but answer different questions.

**Why not expose a generic unrestricted status update?** A change from SUBMITTED to APPROVED has side effects and permission rules. Letting callers set arbitrary statuses bypasses the state machine and can produce an approved request with no reservation.

**What prevents two approvals?** A conditional update claims the expected status inside the transaction. Only one transition should successfully change that state; the other operation detects a changed status.

**What if the second product has insufficient stock?** Throw inside the transaction so the earlier reservation, status update, history, and audit changes all roll back. Demonstrate this with the PostgreSQL integration test, not only a mocked service test.

## 10 Transactions and concurrency

### Explain ACID through this project

- Atomicity: approve plus reserve plus history succeeds as one unit or rolls back.
- Consistency: enforced invariants hold after a successful operation, provided the application and constraints express them correctly.
- Isolation: concurrent database operations interact according to the transaction isolation level and locks.
- Durability: committed database changes survive under PostgreSQL's configured durability guarantees; backups and restore capability are separate operational concerns.

Putting statements in a transaction alone does not prove an unsafe read-then-write algorithm is race-free.

### Overselling example

Assume available stock is 5 and requests A and B each need 4.

| Step | Request A | Request B |
| --- | --- | --- |
| Unsafe read | Reads 5 | Reads 5 |
| Unsafe decision | Believes 4 are available | Believes 4 are available |
| Outcome risk | Reserves 4 | Also reserves 4 based on stale information |

The implemented reservation path locks the inventory row with `SELECT ... FOR UPDATE`, checks available quantity, updates counters, and records the movement within the transaction. A competing locking writer waits and then must evaluate the resulting state. Normal snapshot reads are not all blocked by a row lock. See [PostgreSQL row locking](https://www.postgresql.org/docs/16/explicit-locking.html).

### Conditional state updates

This is the intent of the service's `updateMany` check:

```sql
UPDATE purchase_requests
SET status = 'APPROVED'
WHERE id = :id
  AND organization_id = :organization_id
  AND status = 'SUBMITTED';
```

Treat an affected-row count different from one as a conflict. This resembles compare-and-set on the state; it is not a numeric version-column implementation.

### An alternative to an explicit read lock

For a single balance, a conditional atomic update can combine the check with the update:

```sql
UPDATE inventory
SET qty_available = qty_available - :quantity,
    qty_reserved = qty_reserved + :quantity
WHERE product_id = :product_id
  AND organization_id = :organization_id
  AND qty_available >= :quantity
RETURNING id;
```

This is an alternative design, not a claim about the current SQL. It can reduce a read round trip, but still needs a transaction with movement/audit records and careful error interpretation.

### Isolation levels and snapshots

Read Committed is PostgreSQL's default. Multiple statements can observe different committed states. Repeatable Read gives a transaction a consistent snapshot for its reads; it does not mean all business anomalies disappear. Serializable provides a stronger guarantee and can require transaction retries. See [PostgreSQL isolation](https://www.postgresql.org/docs/16/transaction-iso.html).

SupplyDesk explicitly uses Repeatable Read for dashboard aggregates, purchase-order list/count, and restock alert list/count. Do not claim every paginated endpoint uses it: other lists use default transactions or independent queries.

### Deadlocks and timeouts

Two multi-product requests can lock product rows in opposite orders. A robust improvement is to aggregate and sort product IDs before taking locks, keep transactions short, and retry recognized transient conflicts with bounded backoff. A transaction retry must replay the whole operation safely; retrying a random final statement is not equivalent.

The current approval path aggregates duplicate lines but does not establish a universal sorted locking order. A row-lock strategy therefore does not justify saying deadlocks are impossible.

Avoid external HTTP calls while holding stock locks. Transactions occupy connections and may make unrelated operations wait. Explain how pool wait, lock wait, and slow query execution differ during diagnosis. [Prisma transaction guidance](https://www.prisma.io/docs/orm/fundamentals/transactions) also covers interactive transaction considerations.

## 11 Inventory and idempotency

### Inventory arithmetic

`qtyTotal` is derived as available plus reserved. The database stores available and reserved, not a separately maintained total.

| Operation for quantity q | Available change | Reserved change | Total change |
| --- | --- | --- | --- |
| STOCK_IN | +q | 0 | +q |
| RESERVE | −q | +q | 0 |
| RELEASE | +q | −q | 0 |
| FULFILL | 0 | −q | −q |

Example: `(10 available, 0 reserved)` becomes `(7, 3)` after reserving 3. Fulfilling those 3 produces `(7, 0)`. Returning available to 10 during fulfillment would invent stock.

Movement quantities are positive amounts interpreted using movement type; they are not signed balance deltas. A `referenceId` associates a movement with a request or order.

Duplicate request lines for the same product are aggregated before reservation. Otherwise an existing-reservation check could cause later duplicate lines to be skipped and under-reserve the request.

### Idempotency is about business effects

If the server commits and the response is lost, the client cannot infer that nothing happened. A retry must not create another business effect unintentionally.

| Operation | Current protection | Limitation |
| --- | --- | --- |
| Create request | Optional unique key; replay lookup checks actor and organization | No request-body fingerprint; concurrent insert race does not replay the winner automatically |
| Request transition | Expected-state update and transaction | Repeated transitions can return a conflict rather than the first response |
| Request fulfillment | Already-fulfilled lookup plus transactional state claim | Concurrency may still produce a conflict response |
| Create order | Unique request relation | Duplicate creation is rejected; this is not successful response replay |
| Receive order | Expected ISSUED state changed transactionally | A repeat receipt is rejected instead of adding stock again |
| Manual stock-in | Atomic balance increment and ledger transaction | No idempotency key; a manual retry can duplicate the receipt |
| Update restock settings | Replaces the settings; sequential unchanged values skip audit | Concurrent calls are not a complete exactly-once audit guarantee |

### The create-request gaps to explain

The current key is globally unique, optional, and stored on the request. Reusing it for the same actor and organization returns the existing request even if the caller supplied a different body. A stronger design stores a canonical request fingerprint and rejects mismatched reuse.

Two first-time calls with the same key can both miss the preliminary lookup. The database constraint prevents two successful inserts, but the losing call needs explicit unique-conflict handling to retrieve and return the winner cleanly.

The frontend creates a fresh UUID inside the create mutation invocation. The API client's auth-refresh retry retains the original options/key, but a new manual submission invokes the mutation again and gets a new key. For reliable retry after an ambiguous network failure, retain one key for the logical submission until its outcome is known.

**Strong answer:** “The implementation prevents several duplicate effects, but it is not a universal exactly-once system. I would improve payload matching, conflict replay, and client key lifetime before claiming robust retry semantics.”

Standalone `reserve`, `release`, and `fulfill` service helpers also exist. They are not independent public controller endpoints and should not be confused with the transaction owned by PurchaseRequestsService. In particular, the older helpers use single-reservation lookups in places and check some duplicates before locking; do not assume they offer the same multi-item/concurrency guarantees as the request workflow.

## 12 Purchase orders and money

An order is created from an approved request. The service copies item descriptions, quantities, unit prices, and totals into order lines. Later catalog changes should not silently rewrite an existing order's historical value.

Current order states are DRAFT, ISSUED, RECEIVED, and CANCELLED. Receipt claims the ISSUED state, increments inventory for product-linked lines, writes movements, and records audit activity in one transaction. Custom service lines with no product ID do not create inventory.

Prepare to explain:

- Why one order per request is a modeling constraint, and why supporting split orders would require changing it.
- Why supplier name is currently text rather than a supplier-management domain.
- Why receipt is all-or-nothing, with no received-quantity tracking per line.
- Why cancelling an order does not by itself release a request reservation.
- Why a snapshot protects historical meaning even when a product is renamed or soft-deleted.
- Why checking approval before a transaction can require stronger coordination if concurrent request cancellation is allowed. Do not claim all cross-aggregate races are closed.

### Decimal arithmetic

JavaScript numbers cannot exactly represent every decimal fraction. The backend uses `Prisma.Decimal` for request sums and order totals. Request/order monetary columns use `Decimal(14, 2)`; product prices use `Decimal(12, 2)`. The total helper checks the supported request-total maximum.

Example: three lines at 0.10 should total 0.30 according to the intended currency scale. The frontend can show an estimate, but the server calculates the accepted total from line inputs.

Current DTOs accept prices as JavaScript numbers with two-decimal validation. This is better than arbitrary floating-point summation, but it is not a lossless decimal-string boundary at every stage. For a financial system, consider decimal-string input, explicit currency, rounding rules, tax handling, and immutable accounting records.

**Common trap:** translating USD formatting into Vietnamese does not convert USD to VND. Locale formatting and currency conversion are different operations.

## 13 HTTP contracts and validation

Know method semantics, safe reads, idempotent effects, status codes, request headers, query parameters, body validation, and response envelopes.

| Status | Typical meaning here | UI behavior |
| --- | --- | --- |
| 400 | Invalid fields or business input | Help the user correct values |
| 401 | Missing/invalid/expired authentication | Refresh once where appropriate or sign in |
| 403 | Authenticated but not permitted | Explain lack of access |
| 404 | Missing or inaccessible scoped resource | Neutral recovery rather than a fabricated empty result |
| 409 | State or uniqueness conflict | Refresh state and resolve the conflict |
| 429 | Rate limit exceeded | Wait before retrying |
| 500 | Unexpected server failure | Generic user feedback and server-side diagnosis |

A POST is not inherently retry-safe. A PUT's intended replacement semantics do not guarantee the implementation has no duplicate auxiliary side effects. Explain the actual endpoint behavior.

Pagination returns items plus metadata. Offset pagination is straightforward and supports page numbers; large offsets can become expensive and rows may shift between page requests. Cursor pagination improves some large-list access patterns but changes navigation and does not provide arbitrary page jumps cheaply.

Stable ordering should include a unique tie-breaker, such as creation time plus ID. Some current lists already do this; do not claim it is universal without checking the endpoint.

Swagger documents bearer auth, required organization context, DTOs, and response expectations. Keep documentation aligned with runtime guards and validation. HTTP header names are case-insensitive, but duplicated OpenAPI declarations with inconsistent casing can create confusing duplicate fields in Swagger UI.

## 14 Redis and rate limiting

Redis is currently used for throttling. It is not an inventory source of truth, a general dashboard cache, or an inventory background-job queue.

The application configures short, medium, and long limits. The storage implementation uses namespaced keys, hit counters, TTLs, and temporary blocking keys. Understand `INCR`, `PTTL`, `PEXPIRE`, `MULTI/EXEC`, `SCAN`, and what happens when Redis cannot be reached.

### A useful implementation critique

The current counter increment and TTL read are grouped with `MULTI/EXEC`, but setting a missing expiration occurs afterward. There is a gap if the process fails between those operations. Multiple clients can also interact with expiration initialization. A Lua script or another atomic construction could handle the counter and expiration together.

Prepare these trade-offs:

- Shared Redis coordinates limits across API replicas; process-local counters do not.
- Fixed-window-style counters are simpler than sliding windows or token buckets but can allow boundary bursts.
- IP-based throttling can punish users behind one shared network and depends on trustworthy proxy/IP configuration.
- Per-user and per-organization limits may fit business endpoints better, while login needs special abuse controls.
- Failing open during Redis failure preserves availability but weakens limiting; failing closed protects limits but may block legitimate use. Describe the desired policy and verify actual error handling before claiming one.

Queues, outbox processing, and event-driven inventory are possible future discussion topics only. No worker is added or required by this handbook.

## 15 Restock settings and dashboard queries

### Restock calculation

This feature is now present in source, although the older README boundary list still says it is not modeled.

Let available stock be A, reminder threshold R, desired stock T, and incoming quantity I from ISSUED purchase orders.

```text
Reminder appears when A <= R
Suggested order quantity = max(0, T - A - I)
OUT_OF_STOCK when A = 0; otherwise LOW_STOCK
```

With R=10, T=20, A=6, and I=8, the suggestion is 6. If I becomes 18, the reminder can still appear because available stock is low, while the suggested order quantity becomes zero. This distinction prevents duplicate purchasing while acknowledging that incoming stock is not usable yet.

Draft, cancelled, and received orders do not count as incoming in this calculation. A received order already contributes to actual stock. Reserved stock is already excluded from available stock and must not be subtracted twice.

Settings require both values, R >= 0 and T > R, or both null to disable. The database CHECK constraint reinforces this. The UI defaults new settings to 10 and 20; those defaults do not mean every product automatically has a persisted policy.

The alert query uses a CTE to aggregate incoming order quantities, tenant filters on related data, soft-delete exclusion, and deterministic ordering. A Repeatable Read transaction keeps the returned page and count aligned. The result is calculated on demand, not by a scheduled job.

### Dashboard meaning and cost

DashboardService uses grouped counts, decimal amount sums, and inventory aggregates. It avoids downloading every request to calculate totals in the browser.

Be precise about KPI definitions: open orders include draft and issued orders; order amount by status is the face value of orders; products with no inventory row can count as having no available stock. These are business definitions, not interchangeable metrics.

Possible scaling options include additional indexes, an aggregate cache with tenant-specific keys, a reporting replica, or materialized views. Each changes freshness, operational complexity, or consistency. Start with query plans and latency measurements before choosing one.

## 16 Audit history and observability

Audit events are written using the same Prisma transaction as important business changes. If that transaction fails, the event should not falsely claim a successful operation.

The UI renders readable activity and product names rather than showing raw JSON/UUIDs. The backend enriches inventory events with related product names within the organization. Since that lookup uses the current product name, it is not a guaranteed snapshot of the name at event time.

Distinguish:

| Record | Purpose |
| --- | --- |
| Request status history | Explain the request's state transitions and reviewer comments |
| Inventory transaction | Explain changes in available/reserved stock |
| Audit event | Attribute a business action to an actor and resource |
| Application log | Diagnose execution and failures |
| Metric | Measure rates, latency, errors, and capacity over time |
| Distributed trace | Follow one operation across components |

This is not event sourcing: balances and business rows remain the primary state, and audit events are not a complete source from which the system is rebuilt. Nor are ordinary database audit rows automatically tamper-proof.

Current logging is minimal; the logging interceptor mainly prints before/after timing. Improvements include structured logs, request IDs, sanitized organization/action identifiers, outcome and duration, and explicit error capture. Never log bearer tokens, passwords, or refresh credentials.

For an operations discussion, define p50/p95/p99 latency, request rate, error rate, connection-pool wait, lock wait, and database/Redis health. No latency or throughput result should be quoted without a reproducible measurement.

## 17 React and frontend architecture

The frontend uses React, TypeScript, Vite, React Router, TanStack Query, i18next, Radix primitives, and locally owned shadcn-style controls with Tailwind and shared CSS. Do not describe the entire UI as generated by an external component library or claim TanStack Router/Table are installed merely because TanStack Query is used.

Prepare these React topics:

- Component rendering, props, state, and derived state.
- Controlled forms and immutable updates to request-line arrays.
- Stable list keys and why an item's ID is safer than its array index when rows can be removed.
- Effects for synchronizing with external state; cleanup and dependency arrays.
- Stale closures in asynchronous operations and organization switching.
- Context for authentication, organization, preferences, and notifications.
- Lazy routes and Suspense for splitting route bundles.
- Why memoization has a cost and should target measured or evident problems.
- Why UI role checks improve usability but must match backend enforcement.

The shared [NotificationProvider](../frontend/src/components/NotificationProvider.tsx) supplies application toasts and confirmation dialogs. Confirming resolves an asynchronous decision; cancelling should send no mutation. Review provider cleanup, focus behavior, repeated openings, and error/success timing rather than treating a toast as a decorative detail.

## 18 TanStack Query and the API client

### Separate server state from local form state

Database-backed lists, request details, and KPI summaries are server state. Unsaved form fields, an open modal, and the current search input are local UI state. Query caching does not eliminate the need to manage a draft independently.

A good query key includes every parameter that affects the result: organization, resource ID, page, filters, and search where relevant. Missing organization scope can expose a previous tenant's cached data in the UI even if the API itself is secure.

### Background refresh without a hard reload

`keepScopedData` retains previous data only when the tenant/resource prefix matches. The UI can show a subtle refresh indicator while another page is loading. Changing organizations must clear that visual carry-over.

Mutations invalidate affected lists, details, stock, audit history, and dashboard summaries. Incorrectly narrow invalidation leaves stale KPIs; broad invalidation creates unnecessary requests. Inventory changes use authoritative server results because optimistic balance changes require difficult rollback behavior under conflict.

### Searchable product selection

The shared product picker debounces search, queries the server's full catalog, loads more results as requested, and retains the selected label. Client-filtering only the first fetched page would hide valid products. Abort signals help stop obsolete requests; correctly scoped keys also keep late responses associated with the query that produced them.

### Auth and retry behavior

The API client attaches bearer credentials, selected organization, and optional idempotency key. A 401 can trigger one shared refresh promise and one retry with `retryAuth: false`, preventing an endless refresh loop. The retry retains the request's original organization context.

Queries have bounded retries with nonretryable client errors excluded. Mutations have automatic retries disabled. This reduces accidental duplicate writes but does not solve ambiguous network outcomes; server-side idempotency remains necessary.

Know the difference between loading an empty cache and fetching updated data in the background. Also explain stale time, cache lifetime, invalidation, enabled queries, and why refetching on every focus event may be undesirable for this internal app.

## 19 Accessible and usable interfaces

Prepare to explain a concrete improvement, not just say the design is responsive:

- Labels remain associated with controls and required fields are understandable.
- Numeric entry helps block negative quantities while API validation remains authoritative.
- Product selectors support keyboard navigation and bounded scrolling.
- Dialogs manage focus and return it appropriately when closed.
- Shared notifications use status/alert semantics; those ARIA roles are not browser `alert()` popups.
- Actions display pending state and guard against duplicate clicks.
- Light/dark themes use semantic foreground, background, and border tokens.
- Layouts use flexible columns and `min-width: 0` where long content would otherwise overflow.
- Dates and currencies use locale-aware formatting; user-entered business text is preserved.
- A missing resource offers navigation/retry help, while permission and server failures remain distinct.

Component tests and a successful build cannot prove visual contrast or mobile usability. Browser inspection, keyboard checks, long translated labels, empty/error states, and real viewport sizes provide different evidence.

## 20 Testing strategy

### What the repository contains

| Layer | Tools | Evidence it can provide |
| --- | --- | --- |
| Backend unit/service tests | Jest, Nest testing utilities, mocks | Branches, policies, expected collaboration between services |
| Backend API integration tests | Supertest, Nest application, real PostgreSQL | HTTP validation, tenant filtering, constraints, actual stock writes and rollback |
| Frontend tests | Vitest, Testing Library, jsdom | Controls, request forms, query state, response handling, notifications |
| Static checks | TypeScript, ESLint, Prettier, Prisma validation | Type/style/schema issues before runtime |
| Container builds | Docker Buildx | Image build instructions and dependency/build compatibility |

### Boundaries you must state accurately

The workspace e2e suite creates a Nest test application and real PostgreSQL fixtures. It overrides the throttler guard, so those tests do not prove production throttling. It also does not execute the full `main.ts` bootstrap, Nginx, browser, and deployment network. Calling it a real-database API integration suite is precise.

A mocked `$transaction` that throws proves the service propagates an error, not that PostgreSQL actually rolled back earlier writes. Real database assertions are required for that claim.

Fixtures use generated identifiers and targeted cleanup. An isolated test database remains the correct default. Do not point destructive or fixture-heavy tests at a production database.

### High-value test cases to explain

1. A member cannot read a colleague's request outside their allowed scope.
2. A department lead cannot review their own request.
3. A foreign department assignment fails at the database constraint boundary.
4. Two attempts to appoint different leads cannot both succeed.
5. Approval of multiple items rolls back all stock changes when one item is unavailable.
6. Duplicate product lines reserve their combined quantity.
7. Receipt cannot add stock twice for the same order transition.
8. Cancel returns reserved units; fulfill consumes reserved units.
9. Restock suggestions count issued incoming stock but exclude foreign/deleted data.
10. A tenant switch does not display the old tenant's placeholder rows.
11. Cancelling a confirmation dialog does not send an operation.
12. An expired access token triggers at most one refresh attempt per retry chain.

A dedicated concurrent HTTP test for competing inventory approvals would be stronger than several sequential calls. Use independent requests/connections, synchronization where needed, and assert total movements and balances. Do not assume `Promise.all` alone makes every race reproduce reliably.

### Practical commands

Run from the repository root with the appropriate isolated services configured:

```bash
(cd backend && npm run format:check)
(cd backend && npm run lint:check)
(cd backend && npm run typecheck)
(cd backend && npm run build)
(cd backend && npm test -- --runInBand)
(cd backend && npm run db:validate)
(cd backend && npm run db:migrate:status)
(cd backend && npm run test:e2e -- --runInBand)
(cd frontend && npm run typecheck)
(cd frontend && npm test)
(cd frontend && npm run build)
```

For interviews, report test results from an identified run rather than memorizing a count that changes with the code. A green suite demonstrates the tested cases, not universal correctness or production load capacity.

## 21 Docker and networking

### Current Compose topology

| Service | Role | Default host access |
| --- | --- | --- |
| postgres | Persistent relational data | 127.0.0.1:5433 to container 5432 |
| redis | Throttle state | 127.0.0.1:6380 to container 6379 |
| migrate | One-shot schema deployment | No HTTP port |
| backend | NestJS runtime | 127.0.0.1:8081 |
| frontend | Nginx serving the React build | 127.0.0.1:8082 to container 8080 |

Inside the Compose network, the API connects to `postgres:5432` and `redis:6379`. `localhost` inside an API container refers to that container, not the developer's computer or the database container.

The migration service waits for database health. The backend depends on successful migration completion and Redis health. The frontend waits for backend health. A container being started is not the same as its application being ready.

### Multi-stage builds

Backend stages separate dependency installation, build, migration tooling, and production runtime. The production image uses a non-root user and a compiled entry point. The frontend builds static files in Node and serves them with unprivileged Nginx. Build-time tools do not all need to remain in the final runtime image. See [Docker multi-stage builds](https://docs.docker.com/build/building/multi-stage/).

Know layer caching, build context, `.dockerignore`, image versus container, named volume versus writable container layer, and how lockfiles support reproducible installation.

### Reverse proxy behavior

The frontend sends default API calls to `/api/v1`. Nginx proxies `/api/v1/` to the backend root, so `/api/v1/products/workspace` reaches `/products/workspace`. The trailing slash in `proxy_pass` matters. `/api` is separately proxied for Swagger. Other frontend routes fall back to `index.html` for SPA navigation.

Vite `VITE_*` values are compiled into browser assets and are public. Changing an environment variable on an already built static frontend does not automatically rewrite its JavaScript. Never put server secrets in these values.

Named PostgreSQL volumes outlive ordinary container replacement. `docker compose down -v` removes volumes and can delete local data. Image rollback does not restore database contents.

## 22 CI and GitHub Actions

### CI versus the two meanings of CD

Continuous integration automatically evaluates changes frequently through reproducible checks. Continuous delivery keeps a validated release ready for a controlled production deployment. Continuous deployment automatically releases passing changes to production according to its rules.

SupplyDesk currently has CI plus container build validation. The checked-in container workflow has `push: false`, and no workflow deploys the application to production. Do not claim automated EC2 deployment based on an old repository description or an image build passing.

### Workflow vocabulary

Be comfortable with event, workflow, job, runner, step, action, service container, expression, environment variable, secret, artifact, cache, permission, matrix, `needs`, `if`, and concurrency group.

A runner executes a job. Steps in a job run in sequence. Different jobs can run independently unless dependencies are declared. Service containers provide dependencies for a job; they are not your production database.

### What triggers this repository

| Workflow or job | Trigger | Result |
| --- | --- | --- |
| CI Quality checks | Pushes to all branches and pull requests | Backend/frontend validation plus database/API tests |
| CI Dependency review | Pull requests only | Review dependency changes introduced by the PR |
| Container build | Pushes to main/develop and PRs targeting them | Build backend and frontend production images without publishing |

The CI concurrency group uses workflow and ref and cancels obsolete runs for that group. This reduces wasted work when another commit arrives. It does not necessarily merge push and pull-request runs into one, because their refs can differ.

### Walk through the Quality checks job

| Step | Why it exists | Typical failure |
| --- | --- | --- |
| Checkout | Obtain the code under test | Wrong ref or missing repository access |
| Setup Node and npm cache | Establish runtime and reuse downloaded packages | Version mismatch or stale assumptions about dependencies |
| Backend `npm ci` | Install from the backend lockfile | Manifest and lockfile disagree |
| Generate Prisma client | Match generated client to schema | Adapter/generator configuration issue |
| Validate Prisma schema | Detect invalid schema definitions | Invalid relation or schema configuration |
| Format check | Enforce formatting without silently changing code | Local changes were not formatted |
| Typecheck | Reject compile-time incompatibilities | Wrong DTO shape, missing types |
| Lint | Check configured static rules | Unsafe/unused code or style rule violations |
| Build backend | Produce compiled application | Build-only configuration or module-resolution issue |
| Unit tests | Verify isolated behavior | Regressed rule or incorrect mock setup |
| Apply migrations | Build the CI database from migration history | SQL error, invalid constraint, missing prerequisite |
| API integration tests | Exercise real PostgreSQL and HTTP behavior | Tenant leak, type mismatch, transaction failure |
| Frontend `npm ci` | Install the frontend independently | Undeclared dependency masked locally |
| Frontend typecheck | Validate application and Vite configuration | Missing Node types for Vite configuration |
| Frontend tests | Verify controls and request behavior | Broken provider setup, validation, or UI interaction |
| Frontend build | Produce deployable static assets | Bundler/import/configuration failure |

PostgreSQL 16 and Redis 7 are provisioned as service containers with health checks. The job sets CI-specific connection values and a test JWT secret. The runner connects through mapped localhost ports. Migrations are applied to this isolated database before integration tests.

The npm cache is a performance optimization, not a replacement for `npm ci`. A clean runner should never depend on locally present backend packages to typecheck the frontend.

### Why the previous frontend type failure matters

The Vite configuration runs in a Node tooling environment, while application code targets the browser. Errors around `node:url` and `import.meta.url` can reveal missing Node type declarations or an incorrect tooling tsconfig. The frontend now declares its own `@types/node` and selects Node types in `tsconfig.node.json`.

The lesson is independent, reproducible applications: a developer's installed packages or TypeScript build cache must not hide missing declarations from clean CI.

### Dependency review and Dependabot

Dependency review evaluates dependency changes in a pull request using dependency graph information; it is not evidence that the entire deployed system is vulnerability-free. Enabling Dependency Graph addresses a missing prerequisite, not every possible failed review. Expand the vulnerability/error section and identify the package, affected path, advisory, and available fix. See [GitHub dependency review](https://docs.github.com/en/code-security/concepts/supply-chain-security/dependency-review).

Do not infer failure from the last visible log line. Artifact upload can succeed even when a previous security check failed. Conversely, a scorecard section's presence does not by itself prove it caused the failure.

Dependabot proposes updates; tests and review evaluate compatibility. Current npm configuration still targets `/`, while application manifests live under `/backend` and `/frontend`. Treat separate directory entries as a needed configuration improvement, not a completed feature.

Temporary npm overrides constrain transitive packages. Explain the dependency chain, compatibility risk, verification, and removal condition. An override should not become an unexplained permanent patch.

### Branch protection

The repository contains a ruleset template protecting the default branch from deletion and non-fast-forward pushes, requiring a PR, requiring resolved conversations, and requiring the `Quality checks` status. It allows zero approving reviews for solo work and requests strict status-check behavior.

Having a JSON template committed does not prove it is applied in GitHub settings. The template also does not list `Dependency review` or `Build production images` as required checks. Distinguish a check that runs from a check that blocks merging.

Explain why a required check's name must match the job status exactly, why a permanently skipped required job can block a PR, and how strict checks keep validation aligned with the target branch.

### Pipeline security and efficiency

The workflow defaults to read-only repository content permissions, with additional PR permissions on dependency review. Scope permissions per job. Treat pull-request code as untrusted execution input, especially when considering secrets or privileged trigger types.

Potential improvements include pinned action commit SHAs, deliberate dependency update review, artifact retention, image scanning, and build provenance. They are not all currently configured.

CI uses Node 20 while Docker images use Node 22. Aligning versions or intentionally testing a supported matrix would reduce environment surprises. Frontend/backend checks could run as separate jobs for speed, but shared acceptance status and job dependencies must be designed carefully.

### A strong CI explanation

> A clean GitHub runner installs each application from its lockfile. It generates the Prisma client, checks formatting/types/lint, builds and unit-tests the API, applies migrations to an isolated PostgreSQL instance, and runs real API/database tests. It then typechecks, tests, and builds the frontend. Separate jobs review PR dependencies and build both production images. The branch ruleset template requires the quality job. Production publishing and deployment are the next delivery stage, not part of the current workflow.

## 23 Designing CD and safe releases

This chapter is a proposed extension. It does not describe an existing deployment pipeline.

### A practical release sequence

```text
Validated commit
  -> Build versioned images
  -> Publish immutable image references
  -> Deploy the same images to staging
  -> Run migrations and smoke checks under a controlled release procedure
  -> Approve production if required
  -> Deploy the validated images to production
  -> Verify readiness, business smoke checks, and error/latency signals
  -> Retain the previous compatible release for recovery
```

Use a commit SHA or image digest to identify exactly what was tested and deployed. Rebuilding from source independently in production can introduce a different artifact. Mutable tags such as `latest` are convenient pointers but insufficient release records by themselves.

For a small deployment, one VM with containers may be enough. Managed PostgreSQL, backups, TLS termination, and restricted network access can matter more than immediately adopting Kubernetes. A single VM is simpler but has a shared failure boundary and weaker scaling options.

### Environments and credentials

Define separate development, staging, and production configuration and databases. GitHub environments can scope deployment secrets and protection rules; deployment concurrency should prevent overlapping releases to the same target. Avoid automatically cancelling a release halfway through a migration. See [GitHub deployment controls](https://docs.github.com/en/actions/how-tos/deploy/configure-and-manage-deployments/control-deployments).

Where a cloud provider supports it, GitHub OIDC can exchange a workflow identity for short-lived cloud credentials. Restrict trust to the intended repository, ref/environment, and audience. This reduces long-lived cloud keys but still requires correct cloud authorization. See [GitHub OIDC](https://docs.github.com/en/actions/concepts/security/openid-connect).

Keep runtime secrets out of images and frontend builds. Use the deployment platform's secret mechanism. A database credential used to run migrations may need broader privileges than the application's normal runtime credential.

### Database release safety

Application and database versions coexist during rollouts. An older application must continue working while an expanded schema is introduced; a destructive schema contraction belongs after the transition is complete.

Before deploying a migration, review SQL, estimate table size/lock impact, test against representative data, check backup/restore readiness, and decide whether it is compatible with the previous application version. Migration success on an empty CI database is necessary but does not model every production data shape or large-table lock cost.

A failed application deployment can often switch back to a previous image. A migration that deleted data cannot be undone by switching images. Recovery may require a forward repair, a compatible rollback, or a database restore with an explicit data-loss window.

### Deployment strategies

| Strategy | Benefit | Cost or limitation |
| --- | --- | --- |
| Stop and replace | Simple for a small deployment | Downtime and limited fault isolation |
| Rolling update | Gradual replacement | Old/new versions and schema must coexist |
| Blue-green | Clear traffic switch and application rollback | Additional capacity and database compatibility work |
| Canary | Observe a smaller traffic slice first | Routing, metrics, and interpretation are more complex |

Liveness asks whether the process is alive. Readiness asks whether it can serve relevant traffic. A successful container health check does not prove login, tenant authorization, and order receipt all work after deployment. Use a small, deliberate smoke-test set with disposable test data where writes are necessary.

Prepare recovery objectives: RPO is the acceptable data-loss window; RTO is the acceptable time to recover. Backups without tested restores are incomplete recovery evidence.

## 24 Performance and troubleshooting

### Database and API performance

Start with a measurable symptom. Capture the endpoint, parameters, tenant size, latency distribution, query count, and query plans. Examine `EXPLAIN (ANALYZE, BUFFERS)` on an appropriate test environment before adding indexes. Remember that ANALYZE executes the statement.

Candidate bottlenecks include substring catalog search, deep offset pagination, large relation includes on request lists, repeated membership queries, hot inventory rows, aggregate dashboards, and oversized connection pools across replicas.

A B-tree index on a name column does not automatically make every `%substring%` ILIKE search efficient. A trigram index or a different search approach might help, at the cost of index size and write maintenance. Query parameters must remain bound; safe parameterization and wildcard semantics are separate topics.

Avoid claiming every Prisma `include` creates an N+1 problem or that it eliminates all N+1 problems. Inspect emitted SQL and actual application loops.

### Failure diagnosis table

| Symptom | What it suggests | First checks |
| --- | --- | --- |
| `EADDRINUSE` on 8081 | Another process/container owns the port | Listening process, Compose port mapping, duplicate watch process |
| PostgreSQL `42883 text = uuid` | Raw SQL parameter and column types disagree | Actual column type, Prisma native type, explicit casts |
| 401 across pages | Expired/invalid session or failed refresh | Token type, expiry, secret configuration, refresh response |
| 403 only in one organization | Membership or resource scope differs | Current organization and department/global role distinction |
| Product search misses known items | Search scope, pagination, soft-delete, or query issue | Actual API parameters and results, not only visible options |
| CI fails but local passes | Undeclared dependency or environment mismatch | Lockfiles, clean install, Node versions, generated artifacts |
| Dependency review fails after upload | Earlier review finding or prerequisite failed | First error and expanded vulnerability section |
| Container is running but API fails | Process state differs from readiness | Health response, service DNS, migration result, connection configuration |
| Duplicate stock after retry | Committed write lost its response | Movement history, operation key, receipt semantics |
| One request hangs | Lock, pool, slow query, or network wait | Database activity/locks, pool wait, timeout logs |
| Different tenant's rows flash briefly | UI cache/placeholder scope problem | Query key and retained-data predicate |
| White screen after frontend deploy | Asset/base-path or cache mismatch | Network failures, asset hashes, SPA fallback, frontend API base |

Useful read-only commands include `lsof -nP -iTCP:8081 -sTCP:LISTEN`, `docker compose ps`, `docker compose logs --tail=100 backend`, and `npm run db:migrate:status` from the backend directory. Review logs before sharing them and avoid exposing credentials.

## 25 Trade-offs and honest limitations

### Decisions you should defend

| Choice | Why it fits | What it costs |
| --- | --- | --- |
| NestJS modules | Structured domain organization and dependency injection | More framework conventions and boilerplate |
| Prisma plus selective raw SQL | Typed CRUD plus explicit locking/aggregate control | Two query styles and raw SQL type responsibility |
| PostgreSQL | Transactions, relationships, constraints, reporting | Schema evolution and database operations |
| Shared tenant tables | Simple shared deployment and cross-domain transactions | Consistent scoping required on every path |
| Row locks plus conditional status writes | Direct protection of stock and workflow transitions | Waiting, deadlocks, and transaction-duration costs |
| Derived inventory total | Avoid another balance that can drift | Must consistently calculate it in responses and aggregates |
| Snapshot order lines | Preserve the meaning of an issued order | Duplicate historical data by design |
| Server-calculated decimal totals | Centralized, more predictable monetary calculations | Still needs explicit boundary/rounding/currency policy |
| TanStack Query | Cached server state, loading, invalidation | Query-key and invalidation design becomes correctness work |
| Locally owned UI components | Consistent product design and adaptable behavior | Accessibility and maintenance remain project responsibilities |
| Separate frontend/backend builds | Independent install/build/runtime boundaries | Two dependency trees and coordinated API contracts |
| On-demand restock calculation | Current DB state without worker infrastructure | Query cost grows with inventory and order volume |

### Claims to avoid

| Do not claim | Accurate description |
| --- | --- |
| Production-ready financial ERP | Internal procurement MVP with documented boundaries |
| All endpoints are idempotent | Selected operations constrain duplicate effects; manual stock-in remains vulnerable to retries |
| JWT means no database lookup | Access validation loads the current user; authorization loads membership |
| Refresh tokens are hashed | Current database stores their token values directly |
| All races are solved | Important transitions use transactions/locks; some race and retry gaps remain |
| Role-based UI is security | Backend scope and authorization enforce access |
| Full event sourcing | Business tables plus stock/status/audit histories |
| Background inventory processing | No inventory job worker is implemented |
| Automatic production CD | Current workflows check code and build images without publishing/deploying |
| Every green job blocks merge | The ruleset template specifically requires Quality checks |
| Dependency Graph fixes vulnerabilities | It enables dependency information; findings still require investigation |
| Full browser end-to-end coverage | API integration and jsdom component tests cover narrower boundaries |
| Tested at enterprise scale | No production-scale performance claim without measurements |

The most useful improvement order is correctness/security first: reliable token rotation, complete idempotency, coherent purchase/allocation semantics, additional database invariants, concurrency tests, then measured performance and release automation.

## 26 Interview questions and answer checkpoints

Answer each aloud in two minutes. A complete answer includes the current implementation, one failure scenario, and a trade-off. Refer to the earlier chapters for fuller explanations.

### Domain and architecture

1. **What problem does SupplyDesk solve?** Explain requests, authorized decisions, stock accountability, and tenant separation.
2. **How is a purchase request different from an order?** Internal demand versus a supplier-facing record; separate state machines.
3. **Why a modular monolith?** Single-database transactions and manageable solo operations; shared deployment is the cost.
4. **Why NestJS instead of plain Express?** Module/DI conventions and testable providers; acknowledge framework overhead.
5. **Why PostgreSQL rather than a document database?** Relationships, constraints, transactional writes, and aggregate reads fit the domain.
6. **What is the least realistic business rule today?** Approval requires existing stock; propose separating approval and allocation.
7. **What would you extract first if scale grew?** Identify a measured workload and independent boundary; do not invent a microservice need.

### Authentication and permissions

8. **What happens after login?** Password verification, access/refresh issuance, session storage, authenticated API requests.
9. **Can a refresh token be used as an access token?** Strategies reject the wrong token type.
10. **What happens after a role change?** Current global user lookup helps, while organization permissions are independently loaded.
11. **Does logout revoke the access token?** Not immediately in the current implementation.
12. **Why can a global ADMIN still be denied tenant data?** Global role and organization membership are separate.
13. **Can someone edit the organization header?** Yes; the backend treats it as untrusted context and verifies membership/scope.
14. **How do you prevent self-approval?** Compare reviewer identity to requester after loading the scoped request.
15. **What changes when a person changes departments?** Current membership affects access/creation; historical requests are not rewritten.
16. **What would you harden in authentication?** Stored refresh hashes, atomic rotation, token-family rules, and browser credential strategy.

### Database and consistency

17. **Why both service checks and constraints?** User-friendly errors plus protection against concurrent writers and bypass paths.
18. **Why a composite department foreign key?** Existence alone does not guarantee same-organization ownership.
19. **How does a partial unique index enforce one lead?** It applies uniqueness only to lead rows.
20. **Why did TEXT versus UUID fail?** Physical column type differs from the appearance of the ID value.
21. **Does a transaction prevent overselling automatically?** No; explain locking or a conditional atomic update.
22. **Explain approve with two concurrent callers.** Conditional request claim plus locked inventory updates and transactional history.
23. **What if the last line has insufficient stock?** Throw and roll back every earlier change in the transaction.
24. **Can a row lock block all reads?** Ordinary snapshot reads differ from competing writes/locking reads.
25. **How might a deadlock happen?** Opposite lock acquisition order across two products; sort lock order and handle transient failures.
26. **Why not make every transaction Serializable?** Stronger guarantees cost contention/retries; choose based on invariants and workload.
27. **Why Repeatable Read for dashboards?** Multiple aggregate reads should describe one snapshot.
28. **Are list count and rows always from one snapshot?** Only where implemented; inspect each endpoint's transaction/isolation behavior.
29. **Why retain price snapshots?** Historical order meaning must survive catalog edits.
30. **Why are global SKU/category uniqueness constraints questionable?** Independent tenants may legitimately reuse identifiers.

### Inventory and retries

31. **What happens to total stock on reserve?** Total stays the same while available becomes reserved.
32. **What happens on fulfill?** Reserved and total decrease; available does not increase.
33. **Why aggregate repeated product lines?** Reserve the combined requirement and avoid skipping duplicate lines.
34. **Server committed but client timed out; what now?** Unknown outcome; reconcile or retry using a stable logical operation key.
35. **Is a unique idempotency key enough?** No; scope, payload matching, concurrent conflicts, retention, and replay behavior matter.
36. **Can retrying stock-in duplicate stock?** Yes; current manual stock-in lacks an operation key.
37. **Is a second receipt safe?** State transition prevents another successful stock addition; response replay is a separate contract.
38. **Why can low stock show zero suggested order?** Issued incoming quantity already covers the desired stock level.
39. **Do the 10/20 UI defaults apply to every product in the DB?** No; saved settings determine enabled policies.
40. **Why no queue for restock alerts?** On-demand querying satisfies the present feature without asynchronous infrastructure.

### API and frontend

41. **Why DTO classes instead of only interfaces?** Runtime validation/transformation metadata.
42. **What should be 400 versus 409?** Invalid input versus conflict with current state; apply consistently.
43. **Does CORS secure the API?** It is a browser cross-origin policy, not authorization.
44. **How do you avoid old tenant data flashing?** Tenant-specific query keys and scoped placeholder retention.
45. **Why no hard page refresh after a mutation?** Invalidate/refetch affected server state and keep local navigation/layout intact.
46. **Why debounce product search?** Reduce needless requests while still searching the full server-side catalog.
47. **Why not optimistic inventory updates?** Correct rollback and conflict handling are more complex than using authoritative results.
48. **How do toasts differ from validation errors?** Operation feedback can be transient; actionable form errors should remain discoverable.

### Testing and operations

49. **What can a mock never prove here?** Actual PostgreSQL type behavior, constraint enforcement, and transaction rollback.
50. **What does the e2e suite bypass?** Throttling and parts of production bootstrap/proxy/browser behavior.
51. **How would you test a race?** Competing requests/connections, controlled starting conditions, and final invariant assertions.
52. **Why does CI use its own database?** Repeatable migration/test state without modifying application data.
53. **Why can a running container still be unhealthy?** Process existence is weaker than dependency/readiness checks.
54. **Why do container connections use service names?** Each container has its own localhost; Compose provides service networking.
55. **How do you investigate p95 latency growth?** Correlate application latency with pool wait, lock wait, query plans, and workload.

### CI and CD

56. **What runs on every change?** Describe the trigger/job table precisely, including PR-only dependency review.
57. **Why `npm ci`?** Lockfile-driven clean installation and detection of manifest/lock disagreement.
58. **Why generate Prisma before compiling?** Generated types/client must match the checked-in schema.
59. **Does building a Docker image deploy it?** No; distinguish build, push, pull, start, route traffic, and verify.
60. **How would you promote a tested release?** Publish immutable images and deploy the same artifact through staging/production.
61. **How would you protect production credentials?** Environment-scoped secrets or short-lived OIDC credentials with restricted trust.
62. **What if migrations pass but the new app fails?** Decide based on previous-app compatibility; image rollback alone cannot undo data loss.
63. **What is required by branch protection?** The checked-in template requires Quality checks; live settings must be verified separately.
64. **What if Dependency Graph is enabled but review is still red?** Read the actual advisory/error and changed dependency chain.
65. **Why align Node versions?** Reduce runtime/tooling differences between CI, local development, and Docker.
66. **What is missing from this CD story?** Image publishing, target environment, deployment control, post-deploy checks, and tested recovery.

## 27 Practical exercises and study schedule

Use a disposable local/test database for write exercises. These are practice tasks, not features already implemented.

### Exercises that demonstrate understanding

| Exercise | Expected proof |
| --- | --- |
| Explain one request from button to SQL | Identify route, API wrapper, controller, policy, service transaction, and response |
| Attempt a foreign-tenant resource read | No protected data is returned despite a valid login |
| Compete for limited stock | Successful reservations do not exceed availability; failed request leaves no partial history |
| Fail the second item during approval | All earlier stock/state writes roll back |
| Replay creation with one key | Existing request is returned; document current changed-body behavior |
| Simulate response loss | Show why a new manual key can duplicate intent and propose a stable-key design |
| Calculate restock suggestions | Test no incoming stock, sufficient incoming stock, disabled policy, zero stock |
| Change a catalog price | Existing order snapshot retains its historical value |
| Switch tenant during product search | No old-tenant selection/results leak into the new context |
| Run checks after a clean install | Frontend and backend do not rely on each other's node_modules |
| Read one failing pipeline | Locate the first real error, identify its environment, and propose a targeted fix |
| Rehearse a failed deployment | Identify the exact image, migration version, rollback compatibility, and smoke checks |

### A fourteen-day plan

| Day | Focus | Deliverable |
| --- | --- | --- |
| 1 | Business flow and architecture | Explain the project in 90 seconds; draw core relationships |
| 2 | TypeScript and Node.js | Explain async execution, DTO runtime behavior, and decimal pitfalls |
| 3 | NestJS request lifecycle | Trace one protected endpoint end to end |
| 4 | Authentication | Explain login/refresh/logout and identify current hardening gaps |
| 5 | Authorization | Write the global/organization/department permission matrix from memory |
| 6 | SQL and migrations | Explain every important constraint and the TEXT/UUID issue |
| 7 | Transactions | Walk through competing approvals and multi-item rollback |
| 8 | Inventory and idempotency | Derive balance formulas and explain ambiguous retries |
| 9 | Orders, restock, dashboard | Explain snapshots, incoming stock, and KPI semantics |
| 10 | React and TanStack Query | Trace mutation invalidation, tenant switches, and auth refresh |
| 11 | Testing | Separate mock evidence from real database/browser evidence |
| 12 | Docker and networking | Explain service names, ports, volumes, stages, and proxy paths |
| 13 | CI and proposed CD | Present the actual workflow and a safe release/rollback plan |
| 14 | Mock interview | Answer chapter 26; demonstrate two flows and one rejected operation |

With only three days, prioritize business semantics, auth/tenant isolation, approval transactions, idempotency, real-database testing, and current CI. Spend the final session rehearsing aloud rather than adding another library.

## 28 Interview presentation and final checklist

### A ten-minute project walkthrough

1. Explain the business problem and the three role dimensions.
2. Create or open a request and show department scope.
3. Review it using another eligible account and show the stock reservation.
4. Explain the transaction and failed-insufficient-stock case using source/test evidence.
5. Show fulfillment or a controlled receipt and its history.
6. Show tenant isolation or a forbidden self-review action.
7. Present the CI jobs and point out what production CD would add.
8. Finish with two current limitations and a reasoned improvement order.

Use prepared demo data and an isolated environment. A smooth happy-path demo is useful; a well-explained rejected operation demonstrates that the business rules are real.

### Answer structure

For a technical decision, use: **requirement → failure risk → implementation → evidence → trade-off → next improvement**.

Example:

> Two managers can review requests that need the same product. An ordinary read and decrement can use stale stock. The approval transaction claims the request's expected state, locks inventory rows, checks availability, updates available/reserved quantities, and writes history. The real-database test verifies rollback when stock is insufficient. Locks introduce contention and possible deadlocks, so consistent lock ordering and bounded transient retries are improvements I would make next.

### Evidence and honesty checklist

- [ ] I can explain the business limitation of reserving stock during approval.
- [ ] I can distinguish global roles, organization roles, and department roles.
- [ ] I can derive reserve, release, receipt, and fulfillment arithmetic.
- [ ] I can explain where a transaction starts and why a conflict rolls it back.
- [ ] I can distinguish row locking from a conditional status update.
- [ ] I can describe idempotency gaps without calling every operation exactly-once.
- [ ] I know refresh-token storage and rotation behavior in the actual code.
- [ ] I can identify at least one meaningful database constraint and its concurrent failure case.
- [ ] I can explain frontend cache scoping and why hidden buttons are not authorization.
- [ ] I can explain what unit, database integration, and browser tests each prove.
- [ ] I can narrate the existing CI workflow without claiming it deploys production.
- [ ] I can explain how a future release would publish, deploy, verify, and recover.
- [ ] I have no invented production traffic, uptime, latency, coverage, or customer numbers.
- [ ] I can open the relevant source and explain a method without relying on memorized slogans.

### Further reading

Use the official sources linked in the relevant chapters for lifecycle, transaction/isolation behavior, Docker stages, dependency review, deployment controls, and OIDC. For implementation details, start with the source map in chapter 2 and the actual test assertions. README prose can lag behind code; reconcile discrepancies before presenting a feature as implemented.
