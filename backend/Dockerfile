FROM node:22-alpine AS dependencies

WORKDIR /app
RUN apk add --no-cache openssl

COPY package.json package-lock.json ./
RUN npm ci

FROM dependencies AS build

COPY . .
RUN DATABASE_URL=postgresql://build:build@localhost:5432/build?schema=public npm run prisma:generate
RUN npm run build
RUN npm prune --omit=dev

FROM dependencies AS migrations

COPY . .
RUN DATABASE_URL=postgresql://build:build@localhost:5432/build?schema=public npm run prisma:generate
USER node
CMD ["npm", "run", "db:migrate:deploy"]

FROM node:22-alpine AS production

ENV NODE_ENV=production \
    NODE_OPTIONS=--enable-source-maps

WORKDIR /app
RUN apk add --no-cache openssl \
    && addgroup -S -g 10001 app \
    && adduser -S -u 10001 -G app app

COPY package.json package-lock.json ./
COPY --from=build --chown=app:app /app/node_modules ./node_modules
COPY --from=build --chown=app:app /app/dist ./dist
COPY --from=build --chown=app:app /app/src/prisma ./src/prisma
COPY --from=build --chown=app:app /app/prisma.config.ts ./prisma.config.ts

USER app
EXPOSE 8081

HEALTHCHECK --interval=30s --timeout=3s --start-period=30s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:8081/health/liveness').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "dist/src/main.js"]
