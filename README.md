# SupplyDesk

### Procurement & Inventory Operations

SupplyDesk is an internal procurement workspace for teams that need a clear, auditable way to request purchases, review approvals, issue purchase orders, and track inventory. It brings the day-to-day workflow into one organization-scoped web application backed by a NestJS API and PostgreSQL.

> **Project status:** Full-stack MVP for local development, API integration, and product demonstration. The current implementation is deliberately documented as it exists today; unsupported workflows are listed under [Product boundaries](#product-boundaries).

![Node.js](https://img.shields.io/badge/Node.js-20.19%2B-339933?logo=node.js&logoColor=white)
![NestJS](https://img.shields.io/badge/NestJS-11-e0234e?logo=nestjs&logoColor=white)
![React](https://img.shields.io/badge/React-18-149eca?logo=react&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169e1?logo=postgresql&logoColor=white)
![Redis](https://img.shields.io/badge/Redis-7-dc382d?logo=redis&logoColor=white)

## Product at a glance

SupplyDesk is designed for internal purchasing and stock operations—not as a public supplier marketplace or a full accounting suite. Employees can submit itemized purchase requests; organization managers can review them, create and issue purchase orders, and receive goods into inventory. The application provides a shared view of requests, orders, catalog data, stock movements, and recorded operational events.

### Core capabilities

- **Purchasing workflow:** Create and edit draft requests, submit them for review, approve or reject them, and fulfill approved requests.
- **Purchase orders:** Search and filter a paginated order register, create an order from an approved request, record a supplier name, issue, receive, or cancel it.
- **Inventory operations:** View tracked quantities and transaction history, record stock-in, and track reservation, release, and fulfillment movements associated with request processing.
- **Product catalog:** Manage products and hierarchical categories, with generated SKUs and soft deletion.
- **Organization workspace:** One primary department per membership, department-scoped team leads, and organization-wide owners/managers. Ordinary members have read-only organization views.
- **Operational visibility:** Manager-only dashboard counts, inventory availability, and order values by status, plus a paginated audit trail for supported actions.
- **Usable internal UI:** Responsive operations layout, English/Vietnamese language switch, light/dark themes, larger content typography, and role-aware navigation.

### Typical operating flow

```text
Employee                         Owner / Manager
   │                                  │
   ├─ Create a draft request           │
   ├─ Submit for review ───────────────► Review and approve or reject
   │                                  ├─ Approved product quantities are reserved
   │                                  ├─ Create a purchase order from the request
   │                                  ├─ Issue the order, then receive the goods
   │                                  └─ Received quantities are added to inventory
   └─ Follow request status             Fulfill the approved request when appropriate
```

The request and purchase-order lifecycles are related but remain separate records. Inventory reservations and state changes are handled by backend services in database transactions; the API is the source of truth for permitted transitions and quantities.

## Product modules

| Workspace             | What it supports                                                                                      |
| --------------------- | ----------------------------------------------------------------------------------------------------- |
| Overview              | Readiness indicator and organization-scoped purchasing, catalog, and inventory KPIs.                  |
| Purchase requests     | Paginated request list, detail, draft editing, submit, approve, reject, cancel, and fulfill actions.  |
| Purchase orders       | Searchable, paginated register; create from an approved request; inspect, issue, receive, and cancel. |
| Inventory             | Product stock levels, transaction history, and supported stock-in operations.                         |
| Products & categories | Catalog maintenance, product identifiers, category hierarchy, and soft deletion.                      |
| Organization          | Organization selection, departments, and membership workflows supported by the API.                   |
| Audit trail           | Organization audit events, available to organization owners and managers.                             |

The frontend uses live API responses and does not substitute mock records when the API is unavailable. The audit-trail item is hidden from other organization roles, while backend authorization remains authoritative for every protected operation.

## Architecture

```text
┌──────────────────────────────┐      ┌──────────────────────────────┐
│ React + Vite operations UI   │ ───► │ NestJS REST API              │
│ React Router, TanStack Query │      │ DTO validation, guards,      │
│ English/Vietnamese, themes   │      │ services, Swagger/OpenAPI    │
└──────────────────────────────┘      └──────────────┬───────────────┘
                                                     │
                                  ┌──────────────────┴──────────────────┐
                                  ▼                                     ▼
                         ┌─────────────────┐                   ┌────────────────┐
                         │ PostgreSQL 16   │                   │ Redis 7        │
                         │ Prisma ORM      │                   │ Rate limiting │
                         └─────────────────┘                   └────────────────┘
```

The backend is a modular monolith: domain modules own their controllers, services, DTOs, and tests. The frontend and backend have independent package manifests, lockfiles, build pipelines, and Docker images. Docker Compose provides an isolated local stack with a one-shot migration service.

### Technology choices

| Area                      | Technology                            | Why it is used here                                                                                       |
| ------------------------- | ------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| API                       | NestJS 11, TypeScript                 | Modular server structure, dependency injection, guards, and DTO-based request handling.                   |
| Persistence               | PostgreSQL 16, Prisma 7               | Relational procurement data, explicit schema/migrations, and transactional writes.                        |
| Concurrency               | PostgreSQL transactions and row locks | Protect stock balances and request fulfillment from conflicting writes.                                   |
| Web application           | React 18, Vite, TypeScript            | Separate, fast-to-build interface that consumes the REST API.                                             |
| UI data and routing       | TanStack Query, React Router          | Query lifecycle/cache management and page-level navigation.                                               |
| UI styling and components | Tailwind CSS 4, Radix UI, Lucide      | Utility styling, semantic light/dark colors, accessible dialog/select primitives, and consistent icons.   |
| Cache / throttling        | Redis 7                               | Shared backend rate-limiting storage. Background inventory workers are not currently part of the runtime. |
| Local runtime             | Docker Compose, Nginx                 | Separate production-style API/UI images and same-origin API proxying for the web container.               |

## Run the product locally

### Prerequisites

- Docker with the Compose plugin.
- Node.js 20.19 or newer and npm 10 or newer for local development (the Docker images use Node.js 22).

### 1. Configure the local environment

If you do not already have a root `.env` file, copy the template:

```bash
test -f .env || cp .env.example .env
```

Review `.env.example` and ensure the root `.env` contains `POSTGRES_PASSWORD`, `REDIS_PASSWORD`, and `JWT_SECRET`. Replace the example values with local-only values before starting the stack. Do not overwrite an existing `.env` without first preserving its settings, and never commit it.

### 2. Start the full stack

```bash
docker compose up --build -d
docker compose ps
```

| Service            | Local address               | Purpose                            |
| ------------------ | --------------------------- | ---------------------------------- |
| SupplyDesk web app | <http://localhost:8082>     | React application served by Nginx. |
| REST API           | <http://localhost:8081>     | NestJS API.                        |
| Swagger UI         | <http://localhost:8081/api> | Interactive API reference.         |
| PostgreSQL         | `localhost:5433`            | Application database.              |
| Redis              | `localhost:6380`            | Rate-limiting storage.             |

The ports bind to loopback by default. Compose waits for PostgreSQL, applies committed Prisma migrations, then starts the API and web application after their dependencies report healthy. Starting the stack does not automatically load demo records.

### 3. Load the demo workspace (optional)

Install backend development dependencies and seed the running local database:

```bash
cd backend
npm ci
npm run prisma:generate
npm run db:seed
```

The seed is additive and repeatable; it does not delete or reset existing database records. It creates a demo organization, users, departments, catalog, inventory, purchase requests, purchase orders, and supported operational history. Demo credentials are for local use only: see [Demo accounts](docs/DEMO_ACCOUNTS.md).

### Run applications outside Docker

Start only the local infrastructure first:

```bash
docker compose up -d postgres redis
```

Then install and start the API:

```bash
cd backend
npm ci
npm run prisma:generate
npm run db:migrate:deploy
npm run db:seed
npm run start:dev
```

In a second terminal, start the web application:

```bash
cd frontend
npm ci
test -f .env || cp .env.example .env
npm run dev
```

Open <http://localhost:5173>. Vite proxies `/api/v1/*` to `http://localhost:8081/*`. Nginx uses the same prefix in the web container. This separates SPA paths such as `/products` from API paths, so refreshing a page does not return raw JSON. Set `VITE_API_PROXY_TARGET` in `frontend/.env` if the API uses a different local address; direct calls to the backend still use unprefixed paths.

## Demo access

Demo accounts are created only when the seed command is run. The shared demo password and role assignments are listed in [docs/DEMO_ACCOUNTS.md](docs/DEMO_ACCOUNTS.md); do not use those credentials outside local development. Public registration creates an employee account and does not grant administrative privileges.

## API and access model

OpenAPI documentation is available at <http://localhost:8081/api>. Use the **Authorize** control with `Bearer <access-token>` for authenticated endpoints. Organization-scoped operations also require an `X-Organization-Id` header for a workspace in which the user is a member.

Useful unauthenticated diagnostics:

| Method | Endpoint            | Purpose                                     |
| ------ | ------------------- | ------------------------------------------- |
| `GET`  | `/`                 | Basic API smoke test.                       |
| `GET`  | `/health/liveness`  | Process liveness.                           |
| `GET`  | `/health/readiness` | PostgreSQL and Redis readiness.             |
| `GET`  | `/health`           | Dependency, memory, and disk health checks. |

For a quick check:

```bash
curl http://localhost:8081/
curl http://localhost:8081/health/readiness
```

The backend combines authenticated identity with organization membership and role checks. UI visibility is a usability measure, not an authorization boundary. Passwords are hashed; access/refresh tokens and credentials must not be logged or committed.

### People, departments, and permissions

Global account roles and organization membership roles are separate. A global `ADMIN` does not automatically gain access to another organization's data. Only global `ADMIN` or `MANAGER` accounts can create organizations; public registration cannot assign these roles.

| Capability                                          | Organization OWNER / MANAGER   | Department LEAD with MEMBER membership    | Ordinary MEMBER               |
| --------------------------------------------------- | ------------------------------ | ----------------------------------------- | ----------------------------- |
| Dashboard and audit trail                           | Entire organization            | No                                        | No                            |
| Request and linked order reads                      | Entire organization            | Own requests and primary department       | Own requests only             |
| Approve / reject                                    | Other people's requests        | Other people's requests in own department | No                            |
| Edit department identity                            | Any department in organization | Own department only                       | No                            |
| Create departments, add members, assign departments | Yes                            | No                                        | No                            |
| Catalog, stock-in, order lifecycle actions          | Yes                            | No                                        | No                            |
| Organization information                            | Full management view           | Own department and team                   | Own membership and department |

A membership has at most one primary department; a department has at most one lead. Composite foreign keys prevent cross-organization assignments, and a partial unique index prevents concurrent lead assignments. Existing memberships remain unassigned after migration until a manager assigns them. Unassigned ordinary members cannot create new requests. Moving departments does not rewrite historical requests; an old draft must be updated before submission. Nobody may approve or reject their own request. There is no separate HR role or multi-stage approval hierarchy in this release.

### API-backed UI behavior

- Forms share locally owned [shadcn/ui Input](https://ui.shadcn.com/docs/components/radix/input), Textarea, and Native Select components styled with Tailwind CSS. Controls use a consistent 44px height, semantic light/dark colors, keyboard focus rings, and disabled/invalid states. Short option lists retain native selects. `frontend/components.json` configures future shadcn additions.
- Purchase request and inventory product selectors share the [shadcn Command + Popover pattern](https://v3.shadcn.com/docs/components/combobox), backed by Radix Popover and cmdk. Search is debounced by 250ms and runs against the entire active organization's catalog by name or SKU, with 20 results per page and an explicit load-more action. Only an open picker fetches data; cancellation and organization-specific query keys keep responses scoped. Selected labels survive new searches and draft editing; choosing a custom request item preserves the entered description and estimate. The list supports keyboard navigation, English/Vietnamese labels, and viewport-bounded light/dark styling.
- Products, requests, purchase orders, inventory history, and audit events share labelled search/filter controls and one responsive pagination pattern. Filters offer explicit choices; text search is reserved for supported server-side search fields. Audit action/resource choices come from `GET /audit-logs/filters`, scoped to the selected organization and available only to owners/managers.
- Purchase request forms default to the member's primary department. Ordinary members see it read-only; organization owners/managers can explicitly request for another department. An unassigned manager must choose a department, while an unassigned ordinary member must ask for assignment. The API validates the supplied `departmentId` against membership and organization scope.
- Approve/reject actions open an inline confirmation form beneath the action buttons, not a browser prompt. Approval comments are optional; rejection reasons must contain non-whitespace text. Both are limited to 1,000 characters and stored in status history. Cancelling the form sends no decision. Request dialogs adapt to mobile viewports and wrap long department names, emails, and history entries.
- Authenticated catalogs use `GET /products/workspace` (server-side search and pagination), `GET /categories/workspace`, and `GET /inventories/workspace/:productId` with the selected organization header.
- `GET /purchase-orders` supports pagination, status, and supplier/order-number search with the same read scope as purchase requests.
- `GET /dashboard/summary` returns an organization-scoped database snapshot. Order values are face values, **not paid spend or accounting expenses**. No-available-stock counts include products without an inventory record; they are not reorder alerts.
- Numeric controls reject negative signs, exponent notation, and excess decimal places. DTOs enforce the same quantity/price bounds on the API; request totals use decimal arithmetic and database-size limits.
- TanStack Query retains the previous page during background fetches only within the same tenant/resource. Mutations refresh related lists and KPIs without reloading the document.
- Missing routes and API records show neutral, localized recovery screens. A missing API endpoint is reported as unavailable, never disguised as an empty collection. Permission, connection, and server errors remain distinct.
- Interface labels, workflow states, dates, and number formatting support English/Vietnamese. User-entered names, descriptions, supplier names, and raw audit metadata are preserved, not machine-translated.

## Product boundaries

The following are known limitations of the current MVP—not hidden behind simulated UI behavior:

- Legacy public catalog/stock reads still expose the default demo organization for compatibility. The web app uses the protected workspace endpoints; disable or restrict legacy public data routes before handling confidential production data.
- Approval currently reserves existing stock. This MVP is not a complete replenishment workflow for products with no available inventory; reserve/release are tied to request transitions, not independent manual operations.
- Manual stock-in has no idempotency key; the UI disables automatic mutation retries. After a network interruption, check stock/history before retrying.
- Member removal, organization-role changes, a dedicated HR role, and multi-level approval chains are not implemented. User and department directories are intended for small internal teams, not large paginated enterprise directories.
- Low-stock alerts and reorder points are not modeled in the current schema.
- Supplier management, quote comparison/RFQs, invoices, accounting, payments, password reset, and MFA are outside the implemented scope.
- Redis is used for rate limiting. A background inventory event/job worker has not been implemented.
- CI validates code and builds images; there is no automated production deployment or image publishing pipeline configured.

These boundaries should be resolved by extending backend contracts and data models first, then integrating corresponding UI—not by fabricating frontend data.

## Development and quality checks

Install each application independently from the repository root:

```bash
(cd backend && npm ci)
(cd frontend && npm ci)
```

Frontend tooling declares its own `@types/node` dependency and loads it in `tsconfig.node.json` for the Node-based Vite configuration. Keep the frontend lockfile committed: CI and Docker must build from `npm ci` without relying on backend dependencies or local TypeScript build caches.

Run the repository's quality gates:

```bash
(cd backend && npm run db:validate)
(cd backend && npm run format:check)
(cd backend && npm run typecheck)
(cd backend && npm run lint:check)
(cd backend && npm run build)
(cd backend && npm test -- --runInBand)
(cd frontend && npm run typecheck)
(cd frontend && npm test)
(cd frontend && npm run build)
```

Backend end-to-end tests use `backend/test/jest-e2e.json` and require reachable PostgreSQL and Redis services:

```bash
cd backend
npm run db:migrate:deploy
npm run test:e2e -- --runInBand
```

Useful database commands (run from `backend/`):

```bash
npm run db:migrate:status
npm run db:migrate:deploy
npm run db:seed
npm run prisma:studio
```

Never edit an applied migration; add a new migration for schema changes. `npm run db:reset` is destructive and should only be used when intentionally rebuilding a local database.

## CI and containers

GitHub Actions runs backend formatting, type, build, and unit checks; frontend type, component, and build checks; Prisma validation/client generation; migration deployment and API integration tests against its isolated PostgreSQL service; dependency review on pull requests; and backend/frontend production image builds. Integration fixtures use generated UUIDs and remove only their own records. Workflow definitions live under `.github/workflows/`.

Dependency Graph must be enabled for the pull-request dependency review. Security updates include removal of unused GraphQL/Apollo packages and scoped overrides for Prisma configuration tooling and YAML dependencies. Keep those overrides under review when upstream packages update; an audit result is a point-in-time check, not a guarantee of future vulnerability status.

Docker Compose includes `postgres`, `redis`, `migrate`, `backend`, and `frontend`. Each app has its own Dockerfile and runtime image; the frontend image uses Nginx to serve the SPA and proxy API routes. Local data is held in named Compose volumes.

Stop containers without deleting their data:

```bash
docker compose down
```

Only when you intentionally want to remove the local database and Redis data, run the destructive volume-removal command:

```bash
docker compose down -v
```

## Repository layout

```text
backend/                  NestJS modules, Prisma schema/migrations, seed, and tests
frontend/                 React application, styles, and frontend tests
docs/                     Demo accounts, ADRs, and project documentation
.github/workflows/        CI, dependency review, and container build workflows
.github/rulesets/         Branch-protection ruleset template
docker-compose.yml        Isolated local full-stack environment
```

Engineering workflow and solo-review rules are documented in [AGENTS.md](AGENTS.md). The broader project upgrade plan is in [UPGRADE_PLAN.md](UPGRADE_PLAN.md).

## License

This project is currently private and unlicensed for redistribution. Add an explicit license before distributing it externally.
