# Decisions

Technical decisions made in this project and their rationale.

## Monorepo with PNPM Workspaces

**Choice**: PNPM workspaces over Turborepo, Nx, or Lerna.

**Rationale**: PNPM workspaces provide workspace linking and parallel script execution without additional tooling overhead. Sufficient for a two-app monorepo. Shared configs (TypeScript, ESLint, Prettier) are published as internal packages.

## Separate Frontend and Backend

**Choice**: Next.js frontend + Express backend as separate apps, rather than using Next.js API routes for everything.

**Rationale**: Separating the API server from the frontend reflects a more realistic production architecture. It lets the backend scale independently and avoids coupling data access to the Next.js deployment model. The backend owns all Prisma/database access; the frontend communicates via HTTP.

## Express 5 over Hono/Fastify

**Choice**: Express 5 for the backend API.

**Rationale**: Express is the most widely known Node.js framework, making it accessible for assessment candidates with varying backgrounds. Express 5 brings native promise support for async route handlers.

## Prisma 7 with Driver Adapter

**Choice**: Prisma ORM with `@prisma/adapter-pg` instead of Prisma's built-in connection handling.

**Rationale**: Prisma 7 uses driver adapters as the default connection strategy. The `@prisma/adapter-pg` adapter uses the `pg` library directly, giving more control over connection pooling. Generated client is output to `src/generated/prisma/` to keep it co-located with backend source.

## Better Auth for Authentication

**Choice**: Better Auth over NextAuth/Auth.js, Lucia, or Clerk.

**Rationale**: Better Auth provides a self-hosted, database-backed auth solution that works across both the Next.js frontend and Express backend. It uses the same PostgreSQL database, avoiding external auth service dependencies. Supports email+password out of the box.

## PostgreSQL in Docker (Non-Standard Port)

**Choice**: PostgreSQL 16 Alpine in Docker on port 5498.

**Rationale**: Docker ensures a consistent database environment. The non-standard port (5498 instead of 5432) avoids conflicts with any locally installed PostgreSQL instance.

## Tailwind CSS v4

**Choice**: Tailwind CSS v4 via PostCSS.

**Rationale**: Utility-first CSS framework that keeps styling co-located with markup. v4 simplifies configuration and improves performance. No component library (e.g., shadcn/ui) is included — candidates can add one if desired.

## ESM Throughout

**Choice**: All packages use `"type": "module"` with ESM imports.

**Rationale**: ESM is the standard module system for modern JavaScript. All imports in the backend use `.js` extensions as required by Node.js ESM resolution. This avoids the complexity of dual CJS/ESM builds.

## Vitest over Jest

**Choice**: Vitest for testing.

**Rationale**: Vitest is faster, has native ESM and TypeScript support, and shares configuration with Vite. No need for separate Babel/ts-jest configuration.

## Environment Variable Loading

**Choice**: Backend uses `--env-file` flag; frontend uses `dotenv-cli`.

**Rationale**: The backend leverages Node.js's built-in `--env-file` flag (available in Node 20+) for zero-dependency env loading. The frontend uses `dotenv-cli` because Next.js has its own env loading that doesn't look at the monorepo root `.env` by default.
