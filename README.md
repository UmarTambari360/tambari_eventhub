# Tambari EventHub

Production-grade event ticketing and management platform for the Nigerian events industry.

## Stack

- **API**: Node.js 20 + Express.js 5 + Drizzle ORM + PostgreSQL 16
- **Web**: Next.js 15 App Router + React 19 + Tailwind CSS 4 + Shadcn UI
- **Infra**: Redis 7, BullMQ, Cloudinary, Paystack, Resend
- **Monorepo**: pnpm workspaces

## Prerequisites

- Node.js >= 20
- pnpm >= 9 (`npm install -g pnpm`)
- Docker + Docker Compose

## Local Setup

### 1. Clone and install

```bash
git clone <repo-url>
cd eventhub
pnpm install
```

### 2. Configure environment variables

```bash
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local
```

Edit `apps/api/.env` and fill in:
- `JWT_ACCESS_SECRET` — min 32 random chars
- `JWT_REFRESH_SECRET` — min 32 random chars (different from access)
- `COOKIE_SECRET` — min 32 random chars
- `BANK_ENCRYPTION_KEY` — 64 hex chars (generate below)
- Cloudinary, Paystack, and Resend credentials

Generate secrets:
```bash
# JWT / Cookie secrets
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# Bank encryption key (AES-256-GCM — must be 64 hex chars)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 3. Start infrastructure

```bash
pnpm docker:up
```

This starts PostgreSQL (port 5432) and Redis (port 6379). Wait for both health checks to pass:

```bash
docker compose ps   # both should show "healthy"
```

### 4. Run migrations and seed

> Available from Phase 2 onwards.

```bash
pnpm db:migrate
pnpm db:seed
```

### 5. Start development servers

```bash
pnpm dev
```

- API: http://localhost:4000
- Web: http://localhost:3000

### 6. Verify

```bash
curl http://localhost:4000/health
# → {"status":"ok","timestamp":"..."}

curl http://localhost:4000/health/ready
# → {"status":"ok","timestamp":"...","checks":{"postgres":true,"redis":true}}
```

## Project Structure