# syntax=docker/dockerfile:1.7
# Multi-stage image: `dev` for docker-compose development, `runner` for a production-like build.

ARG NODE_VERSION=24-alpine

FROM node:${NODE_VERSION} AS base
ENV PNPM_HOME=/pnpm PATH=/pnpm:$PATH NEXT_TELEMETRY_DISABLED=1 npm_config_store_dir=/pnpm/store
RUN apk add --no-cache libc6-compat && corepack enable
WORKDIR /app

# --------------------------------------------------------------------------- dependencies
FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
# --ignore-scripts: the Supabase CLI (a devDependency) isn't needed inside the container.
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile --ignore-scripts

# --------------------------------------------------------------------------- development
FROM base AS dev
ENV NODE_ENV=development
EXPOSE 3000
# Source is bind-mounted by docker-compose; node_modules lives in a volume so the container
# keeps its own (Linux) native binaries. Install is fast when the lockfile hasn't changed.
CMD ["sh", "-c", "pnpm install --frozen-lockfile --ignore-scripts && pnpm dev --hostname 0.0.0.0"]

# --------------------------------------------------------------------------- build
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# NEXT_PUBLIC_* values are inlined into the browser bundle at build time.
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
ARG NEXT_PUBLIC_SITE_URL=http://localhost:3000
ARG SUPABASE_INTERNAL_URL
ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL \
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=$NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY \
    NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL \
    SUPABASE_INTERNAL_URL=$SUPABASE_INTERNAL_URL
# Public pages are prerendered with real data, so Supabase must be reachable during the build.
RUN pnpm build

# --------------------------------------------------------------------------- production
FROM node:${NODE_VERSION} AS runner
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3000 HOSTNAME=0.0.0.0
RUN addgroup -S -g 1001 nodejs && adduser -S -u 1001 -G nodejs nextjs
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]
