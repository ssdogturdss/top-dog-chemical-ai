# =============================================================================
# Top Dog Chemical AI — Production Dockerfile
# Multi-stage: builder (full monorepo) → runner (API only, lean image)
# =============================================================================

# ---------------------------------------------------------------------------
# Stage 1 — builder
# ---------------------------------------------------------------------------
FROM node:22-slim AS builder

WORKDIR /app

# Enable corepack so pnpm is available without an extra install step
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy workspace manifests and lockfile first for layer caching
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY tsconfig.base.json tsconfig.json ./

# Copy package.json files for all workspace packages (cache-friendly)
COPY lib/db/package.json                          lib/db/
COPY lib/api-spec/package.json                    lib/api-spec/
COPY lib/api-zod/package.json                     lib/api-zod/
COPY lib/api-client-react/package.json            lib/api-client-react/
COPY lib/integrations-openai-ai-server/package.json lib/integrations-openai-ai-server/
COPY lib/integrations-openai-ai-react/package.json  lib/integrations-openai-ai-react/
COPY artifacts/api-server/package.json            artifacts/api-server/
COPY artifacts/top-dog-app/package.json           artifacts/top-dog-app/
COPY scripts/package.json                         scripts/

# Install all dependencies (including dev — needed for the build)
RUN pnpm install --frozen-lockfile

# Copy all source
COPY . .

# Build every package (type-check + bundle)
# Vite build for the frontend — set BASE_PATH to "/" for Docker
ENV BASE_PATH=/
ENV NODE_ENV=production
RUN pnpm build

# ---------------------------------------------------------------------------
# Stage 2 — runner
# ---------------------------------------------------------------------------
FROM node:22-slim AS runner

WORKDIR /app

# Enable corepack
RUN corepack enable && corepack prepare pnpm@latest --activate

# Create a non-root user for security
RUN addgroup --system topdog && adduser --system --ingroup topdog topdog

# Copy workspace manifests so pnpm can resolve production deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY lib/db/package.json                          lib/db/
COPY lib/api-spec/package.json                    lib/api-spec/
COPY lib/api-zod/package.json                     lib/api-zod/
COPY lib/api-client-react/package.json            lib/api-client-react/
COPY lib/integrations-openai-ai-server/package.json lib/integrations-openai-ai-server/
COPY lib/integrations-openai-ai-react/package.json  lib/integrations-openai-ai-react/
COPY artifacts/api-server/package.json            artifacts/api-server/
COPY artifacts/top-dog-app/package.json           artifacts/top-dog-app/
COPY scripts/package.json                         scripts/

# Install production dependencies only
RUN pnpm install --frozen-lockfile --prod

# Copy built API server bundle from builder
COPY --from=builder /app/artifacts/api-server/dist ./artifacts/api-server/dist

# Copy built frontend static files — the API server can serve these
COPY --from=builder /app/artifacts/top-dog-app/dist/public ./public

# Copy DB schema/seed (needed for runtime migrations and seeding)
COPY --from=builder /app/lib/db/src ./lib/db/src
COPY --from=builder /app/lib/db/drizzle.config.ts ./lib/db/
COPY --from=builder /app/lib/db/drizzle ./lib/db/drizzle

RUN chown -R topdog:topdog /app
USER topdog

# Expose the API server port (override with PORT env var)
EXPOSE 8080

ENV NODE_ENV=production
ENV PORT=8080

# Healthcheck — polls the health endpoint every 30s
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD node -e "require('http').get('http://localhost:' + (process.env.PORT || 8080) + '/api/health', r => process.exit(r.statusCode === 200 ? 0 : 1)).on('error', () => process.exit(1))"

CMD ["node", "--enable-source-maps", "./artifacts/api-server/dist/index.mjs"]
