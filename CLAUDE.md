# CLAUDE.md

## Project Overview

Anvara Sponsorship Marketplace — a full-stack monorepo connecting sponsors with publishers for ad placements. This is a take-home assessment project with intentional bugs and TODOs for candidates to fix.

## Tech Stack

- **Monorepo**: PNPM workspaces (`apps/*`, `packages/*`)
- **Frontend**: Next.js 16, React 19, Tailwind CSS v4, Better Auth (client)
- **Backend**: Express 5, Prisma 7 (PostgreSQL via `@prisma/adapter-pg`), Better Auth
- **Database**: PostgreSQL 16 (Docker, port 5498)
- **Testing**: Vitest
- **Linting**: ESLint 9, Prettier

## Project Structure

```
apps/frontend/          # Next.js app on port 3847
apps/backend/           # Express API on port 4291
packages/config/        # Shared TypeScript config
packages/eslint-config/ # Shared ESLint rules
packages/prettier-config/ # Shared Prettier config
scripts/                # Setup and reset scripts
```

## Commands

```bash
# Development
pnpm dev                 # Start frontend + backend concurrently
pnpm setup-project       # Full automated setup (deps, Docker, DB, seed)
pnpm reset               # Reset database and re-seed

# Build & Quality
pnpm build               # Build all packages
pnpm test                # Run all tests (Vitest)
pnpm lint                # Lint all packages (ESLint 9)
pnpm format              # Format with Prettier
pnpm typecheck           # TypeScript type checking

# Database (run from backend or use filter)
pnpm --filter @anvara/backend db:generate   # Generate Prisma client
pnpm --filter @anvara/backend db:migrate    # Run migrations
pnpm --filter @anvara/backend db:push       # Push schema to DB
pnpm --filter @anvara/backend db:seed       # Seed database
pnpm --filter @anvara/backend db:studio     # Open Prisma Studio

# Docker
docker-compose up -d     # Start PostgreSQL
docker-compose down      # Stop PostgreSQL
```

## Key Files

- `apps/backend/prisma/schema.prisma` — Database schema (Sponsor, Publisher, Campaign, Creative, AdSlot, Placement, Payment)
- `apps/backend/src/index.ts` — Express app entry point
- `apps/backend/src/routes/` — API route handlers
- `apps/backend/src/auth.ts` — Auth middleware (placeholder, needs implementation)
- `apps/backend/src/db.ts` — Prisma client singleton
- `apps/frontend/app/` — Next.js App Router pages
- `apps/frontend/lib/api.ts` — Frontend API client
- `apps/frontend/lib/types.ts` — Shared TypeScript types
- `apps/frontend/auth.ts` — Better Auth configuration
- `.env.example` — Environment variable template

## Environment

- `.env` at repo root, loaded via `--env-file=../../.env` (backend) and `dotenv-cli` (frontend)
- `DATABASE_URL=postgresql://postgres:postgres@localhost:5498/anvara_sponsorships`
- Frontend port: 3847, Backend port: 4291

## Code Conventions

- ESM throughout (`"type": "module"`)
- Prisma generated client at `apps/backend/src/generated/prisma/`
- Backend imports use `.js` extensions (ESM requirement)
- Shared prettier config via `@anvara/prettier-config`
- Route files export Express Router instances

## Known Issues (Intentional)

The codebase has intentional bugs and gaps for assessment purposes:
- `apps/backend/src/utils/helpers.ts` — implicit `any` types, unused variables, logic bugs
- `apps/frontend/lib/utils.ts` — implicit `any` types, unused variables
- `apps/frontend/lib/api.ts` — no error parsing, no auth headers, uses `any` types
- `apps/backend/src/auth.ts` — auth middleware is a no-op placeholder
- CORS is configured with defaults (no origin restriction)
- See `docs/challenges/` for the full list of intended fixes

## Testing

- Vitest for both frontend and backend
- Backend test file: `apps/backend/src/api.test.ts`
- Run `pnpm test` from root or `pnpm --filter @anvara/backend test` / `pnpm --filter @anvara/frontend test`

## Demo Credentials

- Sponsor: `sponsor@example.com` / `password`
- Publisher: `publisher@example.com` / `password`
