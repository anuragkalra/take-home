# Architectural Analysis: Anvara Sponsorship Marketplace

**Principal System Architect Review**

---

## 1. Architectural Pattern

**Pattern: Monorepo with Two-Tier Client-Server Architecture (Loosely Layered)**

This is a **pnpm monorepo** containing two applications (`apps/frontend`, `apps/backend`) and three shared config packages (`packages/config`, `packages/eslint-config`, `packages/prettier-config`). The architecture follows a **loosely layered** pattern, but notably lacks a formal service/business-logic layer.

### Concern Separation

| Layer | Implementation | Separation Quality |
|---|---|---|
| **UI** | Next.js 16 App Router (React 19) with Tailwind CSS | **Weak** — Client components directly call API functions with no intermediate abstraction |
| **Business Logic** | Embedded directly in Express route handlers | **None** — Route files contain validation, DB queries, and response formatting in a single function body |
| **Data Access** | Prisma 7 ORM with PostgreSQL adapter | **Strong** — Clean Prisma schema with well-defined relations, but no repository abstraction |
| **Authentication** | Better Auth (split: server config in frontend, passthrough middleware in backend) | **Fragmented** — Auth configuration lives in the frontend (`auth.ts`), while the backend auth middleware (`src/auth.ts`) is a non-functional stub that calls `next()` unconditionally |

**Verdict:** This is a **flat two-tier architecture** masquerading as a three-tier one. The backend has no service layer — Express routes directly compose Prisma queries, validate input, and format responses in the same function scope. The frontend similarly collapses data-fetching and presentation into `useEffect` + `useState` inside client components.

---

## 2. Component Topology

### Core Modules (Critical Path)

```
┌─────────────────────────────────────────────────────────┐
│                    FRONTEND (Next.js 16)                 │
│                                                         │
│  app/layout.tsx ─── Nav                                 │
│  ├── app/marketplace/         (public browsing)         │
│  │   ├── page.tsx → AdSlotGrid (client)                 │
│  │   └── [id]/page.tsx → AdSlotDetail (client)          │
│  ├── app/dashboard/                                     │
│  │   ├── sponsor/page.tsx → CampaignList (client)       │
│  │   └── publisher/page.tsx → AdSlotList (client)       │
│  ├── app/login/page.tsx                                 │
│  └── lib/                                               │
│      ├── api.ts           (fetch wrapper)               │
│      ├── types.ts         (manual type defs)            │
│      └── auth-helpers.ts  (role resolution)             │
│                                                         │
│  auth.ts          (Better Auth server config)           │
│  auth-client.ts   (Better Auth client config)           │
└─────────────────┬───────────────────────────────────────┘
                  │ HTTP (fetch, no auth headers)
┌─────────────────▼───────────────────────────────────────┐
│                    BACKEND (Express 5)                   │
│                                                         │
│  src/index.ts ─── cors + json middleware                │
│  └── src/routes/index.ts (route aggregator)             │
│      ├── auth.ts          (role lookup)                 │
│      ├── sponsors.ts      (CRUD)                        │
│      ├── publishers.ts    (CRUD)                        │
│      ├── campaigns.ts     (CRUD)                        │
│      ├── adSlots.ts       (CRUD + book/unbook)          │
│      ├── placements.ts    (CRUD)                        │
│      ├── dashboard.ts     (aggregate stats)             │
│      └── health.ts        (healthcheck)                 │
│                                                         │
│  src/db.ts        (Prisma singleton)                    │
│  src/auth.ts      (non-functional middleware stub)      │
└─────────────────┬───────────────────────────────────────┘
                  │ Prisma ORM
┌─────────────────▼───────────────────────────────────────┐
│                  PostgreSQL (Docker)                     │
│  prisma/schema.prisma                                   │
│  6 models + Better Auth managed tables                  │
└─────────────────────────────────────────────────────────┘
```

### Communication Patterns

- **Frontend → Backend:** Raw `fetch()` via `lib/api.ts`. No interceptors, no retry logic, no auth token attachment. The API client is a thin 7-line generic wrapper.
- **Dashboard pages** use a hybrid: the **page-level** server component checks auth via `auth.api.getSession()` + `getUserRole()`, then renders a **client component** that re-fetches data independently from the backend API.
- **Backend → DB:** Direct Prisma calls in every route handler. No repository pattern, no unit-of-work. Each route file imports `prisma` directly from `db.ts`.

### Core vs. Peripheral

| Core | Peripheral |
|---|---|
| `prisma/schema.prisma` — the real system-of-record | `packages/*` — config-only, no shared logic |
| `src/routes/adSlots.ts`, `campaigns.ts`, `placements.ts` — the marketplace business logic | `dashboard.ts` — read-only aggregate, no writes |
| `lib/api.ts` — sole data gateway from frontend | `health.ts` — infra endpoint |
| `auth.ts` (frontend) — the only real auth implementation | `auth.ts` (backend) — non-functional stub |

---

## 3. Data Flow & State Strategy

### Data Lifecycle Trace: "Ad Slot appears in Marketplace"

```
1. PostgreSQL (ad_slots table)
       ↓ Prisma ORM query
2. Express route handler (adSlots.ts GET /)
   - Applies query filters from URL params
   - Includes publisher relation
   - Returns raw JSON
       ↓ HTTP response (no transformation layer)
3. lib/api.ts generic fetch wrapper
   - Typed as api<any[]> — type safety abandoned here
       ↓ Promise<any[]>
4. AdSlotGrid client component
   - useEffect on mount triggers getAdSlots()
   - useState stores response in local state
   - Renders grid cards
```

### State Management Strategy: **None (Distributed Ephemeral)**

| Aspect | Implementation |
|---|---|
| **Pattern** | Per-component `useState` + `useEffect` (vanilla React) |
| **React Query** | Listed as dependency in `package.json` but **never imported or used** anywhere in the codebase |
| **Context API** | Not used |
| **Redux/Zustand** | Not present |
| **Server State** | Dashboard pages use server components for auth gating only, then delegate to client components for data |

### Source of Truth Evaluation

**The database is the sole source of truth**, which is correct. However, the path from DB to UI has no caching, deduplication, or staleness management:

- **No client-side cache:** Every component mount triggers a fresh API call. Navigating away and back re-fetches everything.
- **No optimistic updates:** The UI lacks mutation functions (no PUT/DELETE exposed in `api.ts`).
- **No server-side data revalidation:** Despite using Next.js App Router (which supports RSC data fetching and ISR), data flows through client-side `useEffect` hooks exclusively.
- **Stale closure risk:** The `CampaignList` component depends on `session?.user?.id` in its `useEffect` dependency array but chains two sequential fetches (role lookup → campaign fetch), creating potential race conditions if session changes mid-flight.

---

## 4. Interface Design & Type Safety

### TypeScript Configuration

Both apps use strict TypeScript compilation. However, the **runtime type discipline is poor**:

### Frontend Type Analysis

- `lib/types.ts` defines `Campaign`, `AdSlot`, `Placement` interfaces **manually** — they do NOT import from Prisma's generated types.
- These manual types are **incomplete**: `Campaign` lists 4 statuses vs Prisma's 7 (`PENDING_REVIEW`, `APPROVED`, `CANCELLED` missing). `AdSlot` is missing `NATIVE` type. `Placement` is missing `APPROVED`, `PAUSED`, `REJECTED` statuses.
- **The types file is never imported.** The API client (`lib/api.ts`) types everything as `any[]` or `any`. Every component uses `useState<any[]>([])`.

### Backend Type Analysis

- `db.ts` re-exports Prisma-generated types and enums — good practice.
- Route handlers use these types implicitly through Prisma calls, but **request bodies are untyped** (`req.body` is `any`).
- No input validation library (no Zod, no Joi, no express-validator). Validation is ad-hoc `if (!name || !budget)` checks.
- Enum casting uses unsafe `as string as 'LITERAL'` patterns (e.g., `adSlots.ts:16`).

### Cross-Layer Contract

**There is no shared type contract between frontend and backend.** The monorepo structure could support a shared `packages/types` package, but this doesn't exist. The manual frontend types have already drifted from the Prisma schema (missing enum values, different field names). The `any` typing in `api.ts` means the compiler provides zero protection against API response shape changes.

---

## 5. System Constraints & Trade-offs

### Trade-off 1: Speed of Development over Type Safety

**Evidence:** `@tanstack/react-query` is installed but unused. `lib/types.ts` exists but is never imported. Every data-bearing variable is typed as `any`. This pattern suggests rapid prototyping where the developer moved fast and planned to backfill type safety later.

**Impact:** Changes to the Prisma schema (e.g., renaming a field) will not produce any compile-time errors in the frontend. Bugs will only manifest at runtime.

### Trade-off 2: Client-Side Rendering over Server-Side Data Fetching

**Evidence:** All 8 `'use client'` components fetch data via `useEffect`. The App Router's server component data-fetching capabilities (which would eliminate the need for a separate API call for SSR pages) are unused for data loading. Dashboard pages use server components *only* for auth gating, then immediately hand off to client components.

**Impact:** Every page load produces a loading spinner → API call → render cycle (waterfall). No SEO benefit from SSR. The backend is hit with N+1 request patterns (role lookup + data fetch in `CampaignList`).

### Trade-off 3: Open Access over Security

**Evidence:** The `authMiddleware` in `backend/src/auth.ts` is a passthrough (`next()` with no validation). CORS is configured with defaults (all origins). No rate limiting. The `/api/ad-slots/:id/unbook` endpoint exists "for testing" with no auth guard — anyone can unbook any slot. API endpoints accept `sponsorId`/`publisherId` as client-supplied parameters with no verification that the authenticated user owns those entities.

**Impact:** Every write endpoint is effectively unauthenticated. Any client can create campaigns, book ad slots, or create placements for any sponsor/publisher. This is expected for a take-home but would be a critical vulnerability in production.

---

## 6. Scalability Audit: Where It Breaks at 10x Features / 100x Data

### Break Point 1: No Pagination — The Database Killer

`findMany()` calls in every route have **no `take`/`skip` parameters**. The marketplace page fetches ALL ad slots. The campaigns page fetches ALL campaigns for a sponsor. At 100x data (thousands of ad slots, hundreds of campaigns per sponsor), these endpoints will return multi-megabyte JSON payloads, consuming backend memory and saturating network bandwidth. The PostgreSQL queries will also degrade as table scans replace index seeks.

### Break Point 2: Fat Route Handlers — The Maintenance Bottleneck

At 10x features, each route file will balloon. `adSlots.ts` already has 5 endpoints at 180 lines. Adding filtering, sorting, pagination, analytics, approval workflows, and access control would push each file to 500+ lines. Without a service layer, business logic cannot be reused (e.g., "check if a sponsor has budget remaining" would be duplicated across campaigns, placements, and booking routes).

### Break Point 3: Client-Side State — The UX Collapse

With no shared state management, adding cross-cutting features becomes exponentially harder. Consider: "Show a notification badge in the Nav when a placement is approved." Today, the Nav has no awareness of placement state. Without a global state store or event system, you'd need to either poll or add WebSockets — but every component manages its own isolated state, so there's no coordination layer to propagate events.

### Break Point 4: No Shared Types — The Integration Tax

At 10x features, the frontend and backend teams (or the same developer working on both) will spend increasing time debugging runtime type mismatches. Every new API field requires manual synchronization between `lib/types.ts` (if it were even used), the Prisma schema, and the route handler response shapes.

### Break Point 5: Auth Architecture — The Security Redesign

The current auth is split across three locations: Better Auth config in the frontend, a passthrough middleware in the backend, and a role-lookup API that the frontend calls server-to-server. This fragmented approach means adding authorization to new endpoints requires understanding and modifying multiple files. At scale, every new feature needs explicit "who can access this?" decisions wired through a non-existent middleware chain.

---

## 7. Refactoring Roadmap: Take-Home → Production-Grade

### Win 1: Introduce a Service Layer + Shared Type Package

**Effort: Medium | Impact: High**

Create `packages/types` exporting interfaces generated from or aligned with the Prisma schema. Create `src/services/` in the backend to extract business logic from route handlers:

```
src/services/
  ├── campaign.service.ts   (create, update, validate budget, check dates)
  ├── adSlot.service.ts     (CRUD, availability checks, booking logic)
  ├── placement.service.ts  (create with validation, approval workflow)
  └── dashboard.service.ts  (aggregate queries)
```

**Why this wins:** Routes become thin orchestrators. Business rules become testable in isolation. The shared types package eliminates the frontend/backend type drift. The existing `db.ts` Prisma re-exports already lay the groundwork for this.

### Win 2: Activate React Query + Server Component Data Fetching

**Effort: Low-Medium | Impact: High**

React Query is already installed. Activating it requires:
1. Add `QueryClientProvider` to `layout.tsx` (hint is already in the code)
2. Replace `useState`/`useEffect` patterns with `useQuery` hooks (automatic caching, deduplication, background refetch, retry)
3. Convert the marketplace and detail pages to server components that fetch data directly (eliminating the loading spinner waterfall)
4. Use server components for initial data + React Query for client-side mutations and optimistic updates

**Why this wins:** Eliminates the loading-spinner-on-every-navigation UX. Enables SSR/streaming for SEO-critical pages (marketplace). React Query's cache prevents redundant API calls. The infrastructure is already in `package.json` — this is literally flipping a switch.

### Win 3: Implement Auth Middleware + Input Validation Pipeline

**Effort: Medium | Impact: Critical for Production**

1. Complete the `authMiddleware` to actually validate Better Auth sessions via cookie/header inspection
2. Add `sponsorId`/`publisherId` to the JWT claims or session lookup so the backend can scope queries without trusting client-supplied IDs
3. Introduce Zod schemas for request body validation on all POST/PUT endpoints, co-located with route files
4. Add pagination parameters (`page`, `limit` with sensible defaults and max caps) to all list endpoints

**Why this wins:** Closes the single biggest security gap. Zod schemas double as runtime validation and TypeScript types, reducing boilerplate. Pagination prevents the 100x-data collapse scenario.

---

## Summary Matrix

| Dimension | Current State | Maturity Rating |
|---|---|---|
| Architecture | Two-tier, no service layer | **2/5** |
| Type Safety | Types defined but unused; `any` everywhere | **1/5** |
| State Management | Vanilla useState, React Query installed but unused | **1/5** |
| Security | Auth middleware is a no-op; all endpoints open | **1/5** |
| Data Modeling | Well-designed Prisma schema with proper relations | **4/5** |
| Code Organization | Clean monorepo structure, consistent file naming | **3/5** |
| Testing Infrastructure | Vitest + Testing Library + Playwright configured | **3/5** |
| Developer Experience | Good tooling (pnpm, tsx watch, Prisma studio, ESLint, Prettier) | **4/5** |

**Overall Assessment:** The strongest asset is the **data model** — the Prisma schema is well-thought-out with proper relations, enums, and indexing hints. The weakest area is the **data flow pipeline** from DB to UI, where type safety, caching, and security all break down. The codebase is structured as a deliberately incomplete take-home project with clear `TODO`/`FIXME`/`BUG` breadcrumbs indicating where improvements are expected.
