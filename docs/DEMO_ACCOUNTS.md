# Demo Accounts

These accounts are seeded for local development and API testing only.

> **Security warning:** These credentials are public demo credentials. Never use them in staging or production. Change or remove them before deploying outside local development.

## Shared password

```text
password123
```

## Accounts

| Email | Global role | Organization role | Organization |
| --- | --- | --- | --- |
| `admin@example.com` | `ADMIN` | `OWNER` | Acme Procurement |
| `manager@example.com` | `MANAGER` | `MANAGER` | Acme Procurement |
| `employee@example.com` | `EMPLOYEE` | `MEMBER` | Acme Procurement |
| `procurement.lead@example.com` | `MANAGER` | `MANAGER` | Acme Procurement |
| `finance@example.com` | `EMPLOYEE` | `MEMBER` | Acme Procurement |
| `it@example.com` | `EMPLOYEE` | `MEMBER` | Acme Procurement |
| `operations@example.com` | `EMPLOYEE` | `MEMBER` | Acme Procurement |
| `facilities@example.com` | `EMPLOYEE` | `MEMBER` | Acme Procurement |

## Login example

```bash
curl -X POST http://localhost:8081/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@example.com","password":"password123"}'
```

Use the returned access token with protected endpoints:

```bash
curl http://localhost:8081/organizations/mine \
  -H 'Authorization: Bearer <access-token>'
```

## Seed command

```bash
npm run db:seed
```

The seed is designed to be additive and repeatable. It creates missing demo users, organization records, memberships, departments, categories, products, inventory, purchase requests, purchase orders, transaction history, and audit events. Existing demo workflow records are not reset when the seed is rerun, and the script never deletes database records.

The demo dataset includes requests in draft, submitted, approved, rejected, cancelled, and fulfilled states; purchase orders in draft, issued, received, and cancelled states; and stock-in, reserve, release, and fulfill inventory transactions.
