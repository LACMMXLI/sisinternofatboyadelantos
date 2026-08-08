# syntax=docker/dockerfile:1
# Build desde la RAÍZ del monorepo: docker build -f apps/web/Dockerfile .

ARG NODE_VERSION=22-alpine

# ---------------------------------------------------------------------------
FROM node:${NODE_VERSION} AS base
RUN corepack enable
WORKDIR /workspace

# ---------------------------------------------------------------------------
FROM base AS deps
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY packages/shared/package.json packages/shared/package.json
COPY apps/web/package.json apps/web/package.json
RUN pnpm install --frozen-lockfile --filter web... --filter @libreta/shared

# ---------------------------------------------------------------------------
FROM base AS build
COPY --from=deps /workspace ./
COPY packages/shared packages/shared
COPY apps/web apps/web
ARG VITE_API_URL=/api/v1
ENV VITE_API_URL=${VITE_API_URL}
RUN pnpm --filter web run build

# ---------------------------------------------------------------------------
FROM nginx:1.27-alpine AS runtime
COPY infra/nginx/web.conf /etc/nginx/conf.d/default.conf
COPY --from=build /workspace/apps/web/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -q -O- http://localhost/ >/dev/null || exit 1

CMD ["nginx", "-g", "daemon off;"]
