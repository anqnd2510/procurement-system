# Demo Accounts

These accounts are seeded for local development and API testing only.

> **Security warning:** These credentials are public demo credentials. Never use them in staging or production. Change or remove them before deploying outside local development.

## Shared password

```text
password123
```

## Accounts

| Email                          | Global role | Organization role          | Organization     |
| ------------------------------ | ----------- | -------------------------- | ---------------- |
| `admin@example.com`            | `ADMIN`     | `OWNER`                    | Acme Procurement |
| `manager@example.com`          | `MANAGER`   | `MANAGER`                  | Acme Procurement |
| `employee@example.com`         | `EMPLOYEE`  | `MEMBER`                   | Acme Procurement |
| `procurement.lead@example.com` | `MANAGER`   | `MANAGER`                  | Acme Procurement |
| `finance@example.com`          | `EMPLOYEE`  | `MEMBER`                   | Acme Procurement |
| `it@example.com`               | `EMPLOYEE`  | `MEMBER`                   | Acme Procurement |
| `it.lead@example.com`          | `EMPLOYEE`  | `MEMBER` (department lead) | Acme Procurement |
| `operations@example.com`       | `EMPLOYEE`  | `MEMBER`                   | Acme Procurement |
| `facilities@example.com`       | `EMPLOYEE`  | `MEMBER`                   | Acme Procurement |

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
cd backend
npm run db:migrate:deploy
npm run db:seed
```

To add demo department assignments without reseeding products, stock, or workflows:

```bash
DEMO_MEMBERSHIPS_ONLY=true npm run db:seed
```

This mode preserves existing passwords, organization roles, names, and non-null department assignments. It creates the missing IT lead demo account. Standard seeding may update demo catalog metadata and demo organization roles; neither mode is intended for production.

## Production demo dataset

Do not run the standard `db:seed` command in production: it uses the public shared demo password. For an explicitly requested demo deployment, use the guarded production mode with an existing `manager@example.com` account:

```bash
cd backend
DEMO_ANCHOR_EMAIL=manager@example.com \
DEMO_SEED_CONFIRM=I_UNDERSTAND_DEMO_DATA_IN_PRODUCTION \
npm run db:seed:production-demo
```

This mode uses `DATABASE_URL_UNPOOLED` when available, preserves the anchor account's password, promotes its global role to `MANAGER`, and creates the demo organization and workflow data additively. Missing fixture accounts receive random password hashes that are never printed; their credentials are intentionally unavailable. The command refuses to run without both confirmation variables, refuses to create the anchor account, and will not take over an organization with the same demo slug if another account created it. It never deletes records. Demo records in this organization are sample data, not real procurement activity.

Primary departments: `employee`, `it`, and `it.lead` belong to IT; `finance` to FIN; `operations` to OPS; `facilities` to FAC; `manager` and `procurement.lead` to PROC. The administrator is organization-wide and may remain unassigned. Only `it.lead` receives department role `LEAD`; `procurement.lead` is an organization manager, not a department-only lead.

Use the employee account to verify that Overview/Audit are hidden, Organization is read-only, and only their own requests/orders appear. Use the IT lead account to review IT requests and edit IT department identity; it cannot access the organization dashboard, create departments, assign people, or approve its own requests. Use the administrator or manager for organization-wide operations. See the [permission matrix](../README.md#people-departments-and-permissions).

The seed is designed to be additive and repeatable. It creates missing demo users, organization records, memberships, departments, categories, products, inventory, purchase requests, purchase orders, transaction history, and audit events. Existing demo workflow records are not reset when the seed is rerun, and the script never deletes database records.

The demo dataset includes requests in draft, submitted, approved, rejected, cancelled, and fulfilled states; purchase orders in draft, issued, received, and cancelled states; and stock-in, reserve, release, and fulfill inventory transactions.
