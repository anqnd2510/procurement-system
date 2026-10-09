# Procurement System API

![Node.js](https://img.shields.io/badge/Node.js-20+-339933?logo=node.js&logoColor=white)
![NestJS](https://img.shields.io/badge/NestJS-11-e0234e?logo=nestjs&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169e1?logo=postgresql&logoColor=white)
![Redis](https://img.shields.io/badge/Redis-7-dc382d?logo=redis&logoColor=white)

A production-oriented procurement backend built with NestJS, Prisma, PostgreSQL, Redis, and JWT authentication.

The current system provides authentication, product and category management, inventory operations, health checks, rate limiting, validation, Swagger documentation, and transaction-safe inventory flows.

## Contents

- [Features](#features)
- [Architecture](#architecture)
- [Requirements](#requirements)
- [Getting started](#getting-started)
- [Environment variables](#environment-variables)
- [Database commands](#database-commands)
- [API documentation](#api-documentation)
- [Public endpoints](#public-endpoints)
- [Authentication](#authentication)
- [Testing and quality checks](#testing-and-quality-checks)
- [Docker](#docker)
- [Project structure](#project-structure)
- [Roadmap](#roadmap)

## Features

- JWT access and refresh token authentication.
- Password hashing with bcrypt.
- Role-based access control with `EMPLOYEE`, `MANAGER`, and `ADMIN` roles.
- Public read-only catalog endpoints.
- Product management with SKU generation and uniqueness checks.
- Hierarchical categories with soft deletion.
- Inventory stock-in, reservation, release, and fulfillment.
- Transaction-safe inventory updates with PostgreSQL row locking.
- Redis-backed rate limiting.
- Global validation, exception handling, response transformation, and request logging.
- Swagger/OpenAPI documentation.
- Helmet security headers, CORS, and response compression.
- PostgreSQL and Redis health checks.

## Architecture

```text
                     +----------------+
                     |   REST API     |
                     | NestJS         |
                     +-------+--------+
                             |
       +---------------------+---------------------+
       |                     |                     |
   Auth Module        Catalog Modules       Inventory Module
       |              Products/Categories          |
       +---------------------+---------------------+
                             |
                 +-----------+-----------+
                 |                       |
             PostgreSQL                Redis
             Prisma ORM           Rate limiting/cache
```

The application follows a modular monolith approach. Domain modules own their controllers, services, DTOs, helpers, and tests. Shared infrastructure is kept under `src/common`.

## Requirements

- Node.js 20 or newer.
- npm 10 or newer.
- PostgreSQL 16 or compatible.
- Redis 7 or compatible.
- Docker and Docker Compose are recommended for local infrastructure.

## Getting started

### 1. Install dependencies

```bash
npm ci
```

### 2. Start PostgreSQL and Redis

```bash
docker compose up -d postgres redis
```

### 3. Configure the environment

```bash
cp .env.example .env
```

Update `.env` with local credentials and secrets. Never commit `.env` or production secrets.

### 4. Generate Prisma Client and apply migrations

```bash
npm run prisma:generate
npm run db:migrate:deploy
```

For local development where you need to create a new migration:

```bash
npm run db:migrate
```

### 5. Seed development data

```bash
npm run db:seed
```

### 6. Start the API

```bash
npm run start:dev
```

The local server runs on `http://localhost:8081` by default.

## Environment variables

| Variable | Description | Example |
| --- | --- | --- |
| `NODE_ENV` | Runtime environment | `development` |
| `PORT` | HTTP server port | `8081` |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://postgres:password@localhost:5432/postgres?schema=public` |
| `JWT_SECRET` | Secret used to sign JWTs | Change this value |
| `REDIS_HOST` | Redis hostname | `localhost` |
| `REDIS_PORT` | Redis port | `6379` |
| `REDIS_PASSWORD` | Redis password, if enabled | Empty for local Redis |
| `REDIS_DB` | Redis database index | `0` |

See [.env.example](.env.example) for the complete template.

## Database commands

```bash
npm run db:validate
npm run db:format
npm run prisma:generate
npm run db:migrate
npm run db:migrate:status
npm run db:migrate:deploy
npm run prisma:studio
npm run db:seed
```

`npm run db:reset` is destructive and should only be used for local development. Never edit an applied migration; create a new migration for every schema change.

## API documentation

With the local server running, open:

```text
http://localhost:8081/api
```

Swagger supports the `JWT-auth` bearer scheme. Use the **Authorize** button and enter `Bearer <access-token>`.

The Docker Compose application is exposed on port `8080`:

```text
http://localhost:8080/api
```

## Public endpoints

These endpoints do not require a JWT and are useful for smoke testing:

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/` | Basic application smoke test |
| `GET` | `/health/liveness` | Confirms that the process is running |
| `GET` | `/health` | Checks PostgreSQL, Redis, memory, and disk |
| `GET` | `/health/readiness` | Checks core dependencies |
| `POST` | `/auth/register` | Register an employee account |
| `POST` | `/auth/login` | Login and receive tokens |
| `POST` | `/auth/refresh` | Rotate a refresh token |
| `GET` | `/products` | List public products |
| `GET` | `/products/:id` | Get a public product |
| `GET` | `/categories` | List public categories |
| `GET` | `/categories/:id` | Get a public category |
| `GET` | `/inventories/:productId` | Get public inventory information |

Quick smoke test:

```bash
curl http://localhost:8081/
curl http://localhost:8081/health/liveness
```

Use `/health` or `/health/readiness` when you also want to verify infrastructure dependencies.

## Authentication

### Register

```bash
curl -X POST http://localhost:8081/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"email":"employee@example.com","password":"password123"}'
```

Public registration always creates an `EMPLOYEE` account. Administrative roles must not be assigned through public registration.

### Login

```bash
curl -X POST http://localhost:8081/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"employee@example.com","password":"password123"}'
```

Use the returned `accessToken` for protected endpoints:

```bash
curl http://localhost:8081/auth/me \
  -H 'Authorization: Bearer <access-token>'
```

Product, category, and inventory write operations require an authenticated `ADMIN` account.

## Testing and quality checks

Run the complete local quality gate:

```bash
npm run format:check
npm run lint:check
npm run build
npm test -- --runInBand
```

Other useful commands:

```bash
npm run test:watch
npm run test:cov
npm run test:e2e
```

## Docker

Start the complete stack:

```bash
docker compose up --build
```

| Service | Host port | Purpose |
| --- | --- | --- |
| `app` | `8080` | NestJS API |
| `postgres` | `5432` | PostgreSQL |
| `redis` | `6379` | Redis |

The application container runs database migrations through `docker-entrypoint.sh`, runs as a non-root user, and exposes a liveness health check.

Stop the stack:

```bash
docker compose down
```

To remove local database and Redis volumes as well, use this destructive command only when you intentionally want to lose local data:

```bash
docker compose down -v
```

## Project structure

```text
src/
├── auth/                 Authentication and JWT strategies
├── categories/           Category hierarchy and management
├── common/               Guards, decorators, filters, interceptors, utilities
├── health/               Liveness, readiness, and dependency health checks
├── inventories/          Stock and inventory transaction logic
├── prisma/               Prisma service, schema, migrations, and seed
├── products/             Product catalog and SKU management
├── redis/                Redis connection and throttling storage
├── app.module.ts         Root application module
└── main.ts               Application bootstrap and Swagger setup
```

Development rules are documented in [AGENTS.md](AGENTS.md). The planned backend evolution is documented in [UPGRADE_PLAN.md](UPGRADE_PLAN.md).

## Roadmap

1. Add organizations, departments, and scoped authorization.
2. Add purchase requests and request items.
3. Add a reusable approval workflow engine.
4. Add suppliers, RFQs, quotes, and purchase orders.
5. Connect goods receiving to inventory.
6. Add invoice matching and payment workflows.
7. Add background jobs, audit logs, observability, and reporting.

## Security notes

- Use a strong random `JWT_SECRET` outside local development.
- Never commit `.env`, credentials, access tokens, or database dumps.
- Keep public registration restricted to the default employee role.
- Protect all write operations with authentication and authorization.
- Review migrations and transaction boundaries before deployment.

## License

This project is currently private and unlicensed for redistribution. Add an explicit license before publishing it for external use.
