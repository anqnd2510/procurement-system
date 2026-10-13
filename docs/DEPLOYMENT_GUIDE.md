# Free Demo Deployment Guide

This guide deploys the React/Vite frontend to Vercel and the NestJS API to Render. Neon hosts PostgreSQL, and Upstash hosts Redis. The services have separate free-tier limits, so this setup is intended for a portfolio demo and learning rather than a production service with an uptime guarantee.

## What you need

- A GitHub account with access to this repository.
- Free accounts on Vercel, Render, Neon, and Upstash.
- No Gmail account is required. You can sign in to these providers with GitHub or another email address they accept. Never share your password, recovery code, or provider secrets in chat.

Vercel's Hobby plan is free for personal projects. Render's free web service can sleep after inactivity, so its first request may take around a minute to wake. Neon and Upstash also enforce usage limits on their free plans. Review the providers' current pricing pages before using this setup for anything important.

## 1. Create the PostgreSQL database on Neon

1. Sign in to Neon and create a project. Choose a region near the Render service; this project targets Singapore.
2. Open the project's connection details and copy the connection string for the application role.
3. Keep the full connection string private. It contains a database password.
4. Do not create a second database inside Render; `render.yaml` expects this external database.

The connection string should be a PostgreSQL URL and use TLS, commonly with `sslmode=require`. Do not commit it to the repository.

## 2. Create Redis on Upstash

1. Create a Redis database in a region near the API.
2. Copy its Redis connection URL. It should use `rediss://` when TLS is enabled.
3. Keep this URL private; it contains a password.

The backend accepts `REDIS_URL` for managed TLS Redis. Local Docker Compose continues to use `REDIS_HOST`, `REDIS_PORT`, and `REDIS_PASSWORD`.

## 3. Deploy the API on Render

1. Sign in to Render with GitHub and create a new **Blueprint** from this repository.
2. Render reads the root `render.yaml`. Confirm the service is named `supplydesk-api`, uses the `develop` branch, and uses the free plan.
3. When Render asks for unsynced environment values, enter:
   - `DATABASE_URL`: the pooled Neon PostgreSQL connection string for API traffic (hostname includes `-pooler`).
   - `DATABASE_URL_UNPOOLED`: the direct Neon PostgreSQL connection string for Prisma migrations (hostname does not include `-pooler`).
   - `REDIS_URL`: the Upstash `rediss://` URL.
   - `ALLOWED_ORIGINS`: temporarily set `https://example.vercel.app`; replace this with the actual Vercel production domain after step 4.

4. Let Render create the service and wait for the first deployment. The container runs `prisma migrate deploy` over the direct database connection before starting NestJS; the running API uses the pooled `DATABASE_URL`.
5. Open the Render service and copy its public URL, for example `https://supplydesk-api.onrender.com`.
6. Check `https://<your-api-host>/health/liveness`. It should return a successful response.

The Blueprint generates `JWT_SECRET` for the service. Do not reuse the local development secret.

## 4. Deploy the frontend on Vercel

1. Sign in to Vercel with GitHub and import this repository.
2. Set **Root Directory** to `frontend`.
3. Set the production branch to `develop`.
4. Vercel should detect Vite. Use `npm run build` as the build command and `dist` as the output directory.
5. Add the environment variable `VITE_API_BASE_URL` with the Render API origin, for example `https://supplydesk-api.onrender.com`. Do not add `/api/v1` or a trailing slash; the backend routes are served from the origin root.
6. Deploy and copy the production domain Vercel assigns, for example `https://supplydesk-demo.vercel.app`.

The `frontend/vercel.json` rewrite lets React Router URLs load directly when opened or refreshed.

## 5. Finish the cross-origin settings

1. In Render, edit `ALLOWED_ORIGINS` and set it to the exact Vercel production origin, such as `https://supplydesk-demo.vercel.app`.
2. Save the value and redeploy/restart the API if Render requests it.
3. Open the Vercel site and test login, organization selection, dashboard, purchase requests, inventory, and sign out.
4. Open the API health endpoint again. `/health/readiness` checks PostgreSQL and Redis as well as the running API.

For Vercel preview deployments, each preview has its own origin. They will not be allowed by this exact-origin production CORS setting. Use the production deployment for this first demo.

## 6. Seed demo data

The deployment does not seed demo data automatically. Once the API is connected to Neon, run the additive seed from a trusted local terminal with the production `DATABASE_URL` configured in that terminal:

```bash
cd backend
npm ci
npm run db:seed
```

Never paste the production database URL into source control or a chat. The seed is repeatable and additive, but it creates demo users with known credentials. Use only fake demo information, review [Demo accounts](DEMO_ACCOUNTS.md), and change or remove those accounts before presenting a public instance.

## Troubleshooting

- **Browser reports a CORS error:** check `ALLOWED_ORIGINS` exactly matches the Vercel origin, including `https://` and without a trailing slash.
- **API reports a Redis connection error:** verify `REDIS_URL` starts with `rediss://` and was copied from the Upstash connection details.
- **Database connection fails:** verify the Neon URL, password encoding, database name, and TLS setting.
- **API returns 503 on readiness:** inspect the Render logs and verify both managed service URLs. Liveness can still succeed while a dependency is unavailable.
- **First API request is slow:** Render's free service may have been asleep; wait for it to start and retry.
- **A migration fails:** inspect the Render deploy logs before retrying. Do not run `db:reset` against the hosted database.

## Free-tier caveats

- Free service limits, quotas, account policies, and retention terms can change.
- Render may sleep the API while idle; expect a cold start.
- Neon and Upstash free plans have storage, compute, bandwidth, and command limits.
- This setup has no uptime guarantee or managed backup plan. Keep a separate database export before any risky migration or demo reset.
- Do not use real employee, supplier, or purchase data in this public demo.
