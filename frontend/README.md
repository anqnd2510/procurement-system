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

Use the demo credentials in [`../docs/DEMO_ACCOUNTS.md`](../docs/DEMO_ACCOUNTS.md), or register a new employee account and ask a manager to add it to a workspace and assign its primary department. Public registration creates an `EMPLOYEE`; it does not grant organization-creation or administrative privileges.

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

| Screen             | Integrated backend operations                                                                        | Notes                                                                                                                             |
| ------------------ | ---------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| Sign in / register | `POST /auth/login`, `POST /auth/register`, `GET /auth/me`, `POST /auth/refresh`, `POST /auth/logout` | Access and refresh tokens are kept in `sessionStorage`; expired access tokens are refreshed once and failed sessions are cleared. |
| Overview           | `GET /health/readiness`, `GET /dashboard/summary`, recent purchase requests                          | Dashboard KPIs are aggregated by the backend within the active organization. No spending metric is fabricated.                    |
| Products           | `GET /products/workspace`, create/update/delete                                                      | Authenticated tenant-scoped reads, server-side name/SKU search, pagination, and soft deletion.                                    |
| Categories         | `GET /categories/workspace`, create/update/delete                                                    | Active organization and non-deleted immediate children.                                                                           |
| Inventory          | `GET /inventories/workspace/:productId`, transaction history, stock-in                               | Organization-scoped live balances and paginated ledger.                                                                           |
| Purchase requests  | `GET /purchase-requests`, detail, create/update draft, submit/approve/reject/cancel/fulfill          | Create sends a UUID `Idempotency-Key`; totals are calculated by the server.                                                       |
| Purchase orders    | `GET /purchase-orders`, create from approved request, detail, issue/receive/cancel                   | Real paginated register with status and supplier/order-number search.                                                             |
| Organization       | Memberships, departments, team directory, primary department assignment and department editing       | Managers manage the organization; leads manage their own department; members are read-only.                                       |
| Audit trail        | `GET /audit-logs` with pagination and action/resource filters                                        | Available to organization owners and managers; coverage is limited to events already recorded by the backend.                     |

## Known API limitations

1. Legacy public catalog endpoints remain available for the default demo organization; this frontend uses protected workspace routes.
2. Dashboard values are operational counts and order face values, not invoice/payment accounting. Overview and Audit are organization-owner/manager-only; a department lead is not automatically an organization manager.
3. Reorder points and low-stock alerts are not available because no threshold exists in the current schema. Reserve/release stay coupled to purchase-request state transitions rather than being exposed as independent inventory mutations.
4. The API does not support password reset, MFA, supplier management, invoices, or payment workflows; no screens pretend those operations exist.

## Security notes

- Browser API calls use `credentials: 'omit'`; authentication uses bearer tokens, not cookies.
- Tokens are not logged. `sessionStorage` limits persistence to the current browser tab session, but—as with any browser-held bearer token—an XSS vulnerability could expose them.
- Buttons are hidden/disabled according to organization membership role for usability. The backend guards remain the security boundary and can still return `403`.
- Production hosting must set the API's `ALLOWED_ORIGINS` and serve the frontend over HTTPS.

## UI implementation notes

- Tailwind CSS 4 is compiled by `@tailwindcss/vite`. `src/tailwind.css` defines semantic tokens and imports existing component CSS into the components layer; utility classes remain available for new screens.
- Browser requests use `/api/v1/*` by default. Vite and Nginx strip this prefix before forwarding to NestJS. SPA deep links stay separate from API routes. A custom `VITE_API_BASE_URL` points directly to the backend origin and must allow CORS.
- Page changes preserve cached rows only within the same organization/resource. Debounced search, a small refresh indicator, and non-submitting default buttons prevent unnecessary flashes or document navigation.
- Number inputs reject negative signs and exponent notation, accept decimal commas, and enforce precision/ranges. The backend validates independently.
- `ErrorState` and `ErrorMessage` distinguish neutral 404 recovery from permission/network/server failures. Unknown client routes have a dedicated localized page; a missing backend endpoint is not represented as a successful empty result.
- English/Vietnamese translations cover interface copy and status labels; business data and diagnostic JSON are not translated. Native password-manager autocomplete is supported, but the application never persists passwords.
- Component tests cover error recovery, numeric inputs, button behavior, role policy, API handling, and tenant-safe pagination.
