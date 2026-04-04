# Architecture

## System Overview

```
┌─────────────────┐     HTTP/JSON      ┌─────────────────┐     Prisma      ┌──────────────┐
│   Next.js App   │ ──────────────────> │   Express API   │ ─────────────> │  PostgreSQL  │
│   (port 3847)   │                     │   (port 4291)   │                │  (port 5498) │
└─────────────────┘                     └─────────────────┘                └──────────────┘
       │                                        │
       │ Better Auth (client)          Better Auth (server-side via shared DB)
       └────────────────────────────────────────┘
```

## Monorepo Layout

The project uses PNPM workspaces with three workspace groups:

- **`apps/frontend`** (`@anvara/frontend`) — Next.js 16 App Router application. Serves the marketplace UI, role-based dashboards (sponsor/publisher), and auth flows. Communicates with the backend via a simple fetch-based API client (`lib/api.ts`).

- **`apps/backend`** (`@anvara/backend`) — Express 5 REST API. Handles all data access via Prisma ORM with PostgreSQL. Routes are organized by domain entity (sponsors, publishers, campaigns, ad-slots, placements, dashboard, health, auth).

- **`packages/*`** — Shared configuration packages for TypeScript (`config`), ESLint (`eslint-config`), and Prettier (`prettier-config`). Consumed by both apps.

## Data Model

Core entities and their relationships:

```
Sponsor ──< Campaign ──< Creative
                │              │
                └──< Placement >──┘
                        │
Publisher ──< AdSlot ───┘
    │            │
    └── Placement ┘

Sponsor ──< Payment
```

- **Sponsor** — An advertiser with campaigns. Has a subscription tier.
- **Publisher** — A content creator offering ad slots. Tracks monthly views and subscribers.
- **Campaign** — A sponsor's advertising campaign with budget, date range, and targeting.
- **Creative** — Ad creative assets (banner, video, native, etc.) belonging to a campaign.
- **AdSlot** — A publisher's advertising inventory (display, video, newsletter, podcast).
- **Placement** — The join entity connecting a campaign's creative to a publisher's ad slot. Tracks impressions, clicks, conversions.
- **Payment** — Financial transactions for subscriptions and campaign funding.

## Authentication

Better Auth handles user authentication:
- Configured in `apps/frontend/auth.ts` (server-side) and `apps/frontend/auth-client.ts` (client-side)
- Uses PostgreSQL directly (same database) for session/user storage
- Email + password authentication enabled
- Role-based access: sponsors and publishers see different dashboards
- Backend auth middleware (`apps/backend/src/auth.ts`) is currently a placeholder

## Frontend Architecture

- **App Router** (Next.js) with file-based routing
- **Pages**: Landing (`/`), Login (`/login`), Marketplace (`/marketplace`, `/marketplace/[id]`), Dashboards (`/dashboard/sponsor`, `/dashboard/publisher`)
- **API Client**: `lib/api.ts` — simple fetch wrapper, all calls go to the Express backend
- **Styling**: Tailwind CSS v4 via PostCSS
- **Auth routes**: Catch-all at `app/api/auth/[...all]/route.ts` proxying to Better Auth

## Backend Architecture

- **Express 5** with JSON body parsing and CORS
- **Route structure**: Each domain has its own router file in `src/routes/`
- **Database**: Prisma 7 with the `@prisma/adapter-pg` driver adapter for PostgreSQL
- **Prisma client**: Singleton pattern with hot-reload protection in `src/db.ts`
- **All routes** mounted under `/api` prefix

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/login` | User login |
| GET | `/api/sponsors` | List sponsors |
| GET/POST | `/api/campaigns` | List/create campaigns |
| GET | `/api/campaigns/:id` | Get campaign by ID |
| GET/POST | `/api/ad-slots` | List/create ad slots |
| GET | `/api/ad-slots/:id` | Get ad slot by ID |
| GET/POST | `/api/placements` | List/create placements |
| GET | `/api/publishers` | List publishers |
| GET | `/api/dashboard/stats` | Dashboard statistics |
| GET | `/api/health` | Health check |

## Development Environment

- **Docker Compose** runs PostgreSQL 16 Alpine on port 5498
- **`pnpm dev`** starts both frontend and backend concurrently
- **`pnpm setup-project`** automates: install deps, start Docker, push schema, seed data
- Environment variables stored in `.env` at repo root (see `.env.example`)
