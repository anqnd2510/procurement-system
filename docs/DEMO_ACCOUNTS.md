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

The seed is designed to be non-destructive and idempotent. It creates missing demo users, organization records, memberships, departments, and products without deleting existing products or inventory.
