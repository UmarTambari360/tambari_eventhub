# ─── Stage 1: Dependencies ────────────────────────────────────────────────────
FROM node:20-alpine AS deps

RUN npm install -g pnpm@9.15.9

WORKDIR /app

# Copy workspace manifests for cache-efficient installs
COPY pnpm-workspace.yaml ./
COPY package.json ./
COPY .npmrc ./
COPY packages/config/package.json ./packages/config/
COPY packages/validators/package.json ./packages/validators/
COPY packages/types/package.json ./packages/types/
COPY apps/api/package.json ./apps/api/

RUN pnpm install --frozen-lockfile

# ─── Stage 2: Builder ─────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

RUN npm install -g pnpm@9.15.9

WORKDIR /app

# Copy deps from previous stage
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages/config/node_modules ./packages/config/node_modules
COPY --from=deps /app/packages/validators/node_modules ./packages/validators/node_modules
COPY --from=deps /app/packages/types/node_modules ./packages/types/node_modules
COPY --from=deps /app/apps/api/node_modules ./apps/api/node_modules

# Copy source
COPY packages/ ./packages/
COPY apps/api/ ./apps/api/
COPY pnpm-workspace.yaml ./
COPY package.json ./
COPY .npmrc ./

# Build shared packages first, then API
RUN pnpm --filter @eventhub/validators build && \
    pnpm --filter @eventhub/types build && \
    pnpm --filter api build

# ─── Stage 3: Runner ─────────────────────────────────────────────────────────
FROM node:20-alpine AS runner

RUN npm install -g pnpm@9.15.9

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 --ingroup nodejs nodejs

WORKDIR /app

# Copy workspace manifests for production install
COPY pnpm-workspace.yaml ./
COPY package.json ./
COPY .npmrc ./
COPY packages/config/package.json ./packages/config/
COPY packages/validators/package.json ./packages/validators/
COPY packages/types/package.json ./packages/types/
COPY apps/api/package.json ./apps/api/

# Install production dependencies only
RUN pnpm install --frozen-lockfile --prod && \
    # Clean pnpm cache to reduce image size
    pnpm store prune

# Copy compiled output from builder
COPY --from=builder /app/packages/validators/dist ./packages/validators/dist
COPY --from=builder /app/packages/types/dist ./packages/types/dist
COPY --from=builder /app/apps/api/dist ./apps/api/dist

# Switch to non-root user
USER nodejs

EXPOSE 4000

ENV NODE_ENV=production

# Health check — Railway uses this
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD wget -qO- http://localhost:4000/health || exit 1

CMD ["node", "apps/api/dist/index.js"]