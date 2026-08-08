# syntax=docker/dockerfile:1
# Build desde la RAÍZ del monorepo: docker build -f apps/api/Dockerfile .
# (necesita pnpm-workspace.yaml, pnpm-lock.yaml y packages/shared en el contexto)

ARG NODE_VERSION=22-alpine

# ---------------------------------------------------------------------------
FROM node:${NODE_VERSION} AS base
RUN corepack enable
WORKDIR /workspace

# ---------------------------------------------------------------------------
FROM base AS deps
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY packages/shared/package.json packages/shared/package.json
COPY apps/api/package.json apps/api/package.json
RUN pnpm install --frozen-lockfile --filter api... --filter @libreta/shared

# ---------------------------------------------------------------------------
FROM base AS build
COPY --from=deps /workspace ./
COPY packages/shared packages/shared
COPY apps/api apps/api
RUN pnpm --filter api exec prisma generate
RUN pnpm --filter api run build
RUN pnpm deploy --filter api --prod /workspace/deployed/api

# ---------------------------------------------------------------------------
FROM node:${NODE_VERSION} AS runtime
ENV NODE_ENV=production
WORKDIR /app

RUN addgroup -S libreta && adduser -S libreta -G libreta

COPY --from=build /workspace/deployed/api/node_modules ./node_modules
COPY --from=build /workspace/apps/api/dist ./dist
COPY --from=build /workspace/apps/api/prisma ./prisma
COPY --from=build /workspace/apps/api/package.json ./package.json

USER libreta
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD node -e "fetch('http://localhost:3000/health/live').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "dist/main.js"]
