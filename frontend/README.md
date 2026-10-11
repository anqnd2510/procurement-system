# Procurement Workspace Frontend

A standalone React application for operating the Procurement System API. The UI uses live API responses; it does not silently fall back to mock data.

## Requirements

- Node.js 20.19+ and npm 10+
- The NestJS API running locally
- PostgreSQL and Redis available to the API
- Database migrations and seed data applied when using the demo workspace

## Start locally

From the repository root, install the backend and start its database services:

```bash
(cd backend && npm ci)
docker compose up -d postgres redis
cd backend
npm run prisma:generate
npm run db:migrate:deploy
npm run db:seed
npm run start:dev
```

In another terminal:

```bash
cd frontend
npm ci
cp .env.example .env
npm run dev
```

Open <http://localhost:5173>. The Vite development server proxies API routes to `http://localhost:8081`, so local browser requests can send the backend's `Authorization`, `X-Organization-Id`, and `Idempotency-Key` headers without exposing credentials to a mock service. Override the proxy target with `VITE_API_PROXY_TARGET` if the backend listens elsewhere. `VITE_API_BASE_URL` can point to an API origin for deployments that configure CORS correctly.

Use the verified demo credentials in [`../docs/DEMO_ACCOUNTS.md`](../docs/DEMO_ACCOUNTS.md), or register a new employee account. Public registration creates an `EMPLOYEE`; it does not grant administrative access. Create an organization and add existing registered users from **Organization**.

The interface includes English/Vietnamese language switching, light/dark themes, a responsive internal-ERP layout, and browser password-manager autocomplete on sign-in. Passwords are never written to local or session storage. The audit-trail navigation and route are limited to organization owners and managers; API authorization remains authoritative for every operation.

## Frontend commands

```bash
npm run dev
npm run typecheck
npm test
npm run build
npm run preview
```

## Implemented API coverage

The screens below call endpoints present in the NestJS controllers. Successful API responses are unwrapped from the backend's `{ data, code, message }` envelope. The API remains authoritative for validation and authorization.

| Screen             | Integrated backend operations                                                                                            | Notes                                                                                                                                 |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------- |
| Sign in / register | `POST /auth/login`, `POST /auth/register`, `GET /auth/me`, `POST /auth/refresh`, `POST /auth/logout`                     | Access and refresh tokens are kept in `sessionStorage`; expired access tokens are refreshed once and failed sessions are cleared.     |
| Overview           | `GET /health/readiness`, `GET /dashboard/summary`, recent purchase requests                                              | Dashboard KPIs are aggregated by the backend within the active organization. No spending metric is fabricated.                        |
| Products           | `GET /products`, `POST /products`, `PUT /products/:id`, `DELETE /products/:id`                                           | Search is limited to the fetched page because the API has no search parameter. Delete is soft delete.                                 |
| Categories         | `GET /categories`, `POST /categories`, `PUT /categories/:id`, `DELETE /categories/:id`                                   | Uses the immediate child relationships returned by the API.                                                                           |
| Inventory          | `GET /products`, `GET /inventories/:productId`, `GET /inventories/:productId/transactions`, `POST /inventories/stock-in` | History is organization-scoped, paginated, and filterable by movement type and reference. Low-stock thresholds are not in the schema. |
| Purchase requests  | `GET /purchase-requests`, detail, create/update draft, submit/approve/reject/cancel/fulfill                              | Create sends a UUID `Idempotency-Key`; totals are calculated by the server.                                                           |
| Purchase orders    | Create from an approved request, detail, issue, receive, cancel                                                          | There is no PO list endpoint; the page keeps only browser-session lookup IDs and can fetch orders by ID.                              |
| Organization       | `GET /organizations/mine`, create, members, add member, departments, create department                                   | Member removal and role changes do not exist in the API.                                                                              |
| Audit trail        | `GET /audit-logs` with pagination and action/resource filters                                                            | Available to organization owners and managers; coverage is limited to events already recorded by the backend.                         |

## Known API limitations

1. Product and category read services currently select the default `acme-procurement` organization rather than accepting the active organization. To prevent writes into a different organization from disappearing from the catalog view, catalog and inventory mutations are enabled only while that default organization is active. Extend the backend's read contracts with properly authenticated organization scoping before lifting this restriction.
2. No purchase-order collection endpoint exists. The frontend cannot reliably show all existing orders, so it does not present a fake complete register.
3. Reorder points and low-stock alerts are not available because no threshold exists in the current schema. Reserve/release stay coupled to purchase-request state transitions rather than being exposed as independent inventory mutations.
4. The API does not support password reset, MFA, supplier management, invoices, or payment workflows; no screens pretend those operations exist.

## Security notes

- Browser API calls use `credentials: 'omit'`; authentication uses bearer tokens, not cookies.
- Tokens are not logged. `sessionStorage` limits persistence to the current browser tab session, but—as with any browser-held bearer token—an XSS vulnerability could expose them.
- Buttons are hidden/disabled according to organization membership role for usability. The backend guards remain the security boundary and can still return `403`.
- Production hosting must set the API's `ALLOWED_ORIGINS` and serve the frontend over HTTPS.
