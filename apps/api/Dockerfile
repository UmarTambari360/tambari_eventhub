# ─── Build Stage ─────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

RUN npm install -g pnpm@9.15.9

WORKDIR /app

# Copy workspace manifests for dependency install
COPY pnpm-workspace.yaml ./
COPY package.json ./
COPY .npmrc ./
COPY packages/config/package.json ./packages/config/
COPY packages/validators/package.json ./packages/validators/
COPY packages/types/package.json ./packages/types/
COPY apps/api/package.json ./apps/api/

# Install all dependencies
RUN pnpm install --frozen-lockfile

# Copy source
COPY packages/ ./packages/
COPY apps/api/ ./apps/api/

# Build shared packages first, then API
RUN pnpm --filter @eventhub/validators build && \
    pnpm --filter @eventhub/types build && \
    pnpm --filter api build

# ─── Production Stage ─────────────────────────────────────────────────────────
FROM node:20-alpine AS runner

RUN npm install -g pnpm@9.15.9

WORKDIR /app

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nodejs

COPY pnpm-workspace.yaml ./
COPY package.json ./
COPY .npmrc ./
COPY packages/config/package.json ./packages/config/
COPY packages/validators/package.json ./packages/validators/
COPY packages/types/package.json ./packages/types/
COPY apps/api/package.json ./apps/api/

# Install production dependencies only
RUN pnpm install --frozen-lockfile --prod

# Copy compiled output from builder
COPY --from=builder /app/packages/validators/dist ./packages/validators/dist
COPY --from=builder /app/packages/types/dist ./packages/types/dist
COPY --from=builder /app/apps/api/dist ./apps/api/dist

USER nodejs

EXPOSE 4000

CMD ["node", "apps/api/dist/index.js"]