# Procurement System - Solo Engineering Rules

## Purpose

This is a NestJS/Prisma procurement backend with a separate React frontend. Use this workflow for every task:

```text
inspect -> plan -> implement -> test -> review -> verify
```

Do not expand scope before understanding the impact on the database, authorization, and transactions.

## Stack and structure

- NestJS + TypeScript.
- Prisma + PostgreSQL.
- Redis for throttling and future background jobs.
- JWT authentication.
- Backend domain modules live under `backend/src/<domain>`.
- Backend shared code lives under `backend/src/common`.
- Prisma schema and migrations live under `backend/src/prisma`.
- The React/Vite frontend lives under `frontend/` and consumes the backend API; it must not fake unavailable server data.
- Docker Compose and repository-wide documentation/automation remain at the repository root.

## Mandatory rules

1. Read related code before changing it.
2. Every feature must include DTO validation, business rules, Swagger documentation, and tests.
3. Controllers must not contain business logic or call Prisma directly.
4. Never accept role or permission from an unprotected public endpoint.
5. Inventory, money, and business-state changes must use transactions.
6. Retryable endpoints must have an idempotency strategy.
7. Never edit an applied migration; create a new migration.
8. Never log passwords, JWTs, refresh tokens, or secrets.
9. Soft-deleted records must be excluded from default queries.
10. Do not add major dependencies or infrastructure without a concrete use case.

## Workflow

Before coding: identify affected modules/entities, inspect related code, write acceptance criteria, and review migration risks.

While coding: prefer small changes, keep state transitions in services, calculate totals on the server, and protect retryable actions with `Idempotency-Key`.

After coding, run the relevant backend and frontend checks:

```bash
(cd backend && npm run format:check)
(cd backend && npm run lint:check)
(cd backend && npm run build)
(cd backend && npm test -- --runInBand)
(cd frontend && npm run typecheck)
(cd frontend && npm test)
(cd frontend && npm run build)
```

For Prisma changes:

```bash
(cd backend && npm run db:validate)
(cd backend && npx prisma generate)
(cd backend && npm run db:migrate:status)
```

## Solo review checklist

- [ ] Authorization covers resource and organization scope.
- [ ] Input and business rules are validated.
- [ ] Error cases are handled.
- [ ] Related writes use a transaction.
- [ ] Race-prone operations use locking or optimistic versioning.
- [ ] Retries do not duplicate data or inventory changes.
- [ ] Passwords and tokens are absent from responses and logs.
- [ ] List queries have appropriate pagination and filtering.
- [ ] Migration and compatibility risks were reviewed.
- [ ] Happy paths and failure paths are tested.

## Priority order

1. Data correctness.
2. Authorization and security.
3. Transaction and concurrency safety.
4. Testability.
5. Performance.
6. Convenience.

## ECC scope

This repository uses a minimal solo version of ECC ideas: research before implementation, a small plan, tests and builds as quality gates, self-review, and ADRs. It intentionally does not use multi-agent orchestration, the full hook/memory/instinct system, every command shim, or automatic changes outside task scope.

