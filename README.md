<div align="left" style="margin-bottom: 2rem;">
  <img src="https://anvara-production.nyc3.cdn.digitaloceanspaces.com/anvarabluetext.png" alt="Anvara" width="500" />
</div>

# Anvara Take-Home Test

```
## ⚠️ Important: Do NOT Fork This Repository

This is a take-home assessment. Please:

1. **Clone** (not fork) this repository
2. Work on it locally
3. Create your own **new public repository**
4. Push your work there
5. Send us the link to YOUR repository

Do not open pull requests to the original repo.
```

## Table of Contents

- [Anvara Take-Home Test](#anvara-take-home-test)
  - [Table of Contents](#table-of-contents)
  - [tl;dr](#tldr)
  - [About This Assessment](#about-this-assessment)
  - [Tech Stack](#tech-stack)
  - [Assumptions](#assumptions)
  - [Project Structure](#project-structure)
  - [Quick Start](#quick-start)
    - [Clone Repository](#clone-repository)
    - [Automated Setup (Recommended)](#automated-setup-recommended)
    - [Manual Setup](#manual-setup)
  - [Development](#development)
  - [Database](#database)
  - [Authentication](#authentication)
  - [Documentation](#documentation)
    - [Individual Challenges](#individual-challenges)
    - [Bonus Challenges](#bonus-challenges)
  - [Resources](#resources)
  - [Need Help?](#need-help)

## tl;dr

- **�  New here? [Setup the Project](#quick-start)**
- **🎯 Ready to code? [Start the Challenges](#individual-challenges)**
- **❓ Need help? [Check the Docs](docs/README.md)**
- **📤 Done? [Submit Your Work](docs/submission.md)**

## About This Assessment

This take-home test is designed to evaluate your skills across multiple areas of full-stack development. **Complete as many challenges as you can** - you don't need to finish everything!

**Take your time.** Work at your own pace, and submit when you feel you've shown us your best work. Where you stop tells us about your current skill level, and that's perfectly okay. We'd rather see quality work on fewer challenges than rushed attempts at all of them.
A sponsorship marketplace connecting sponsors with publishers, built with modern best practices.

## Tech Stack

- **Frontend**: Next.js 15, React 19, Tailwind CSS v4
- **Backend**: Express.js, Prisma ORM, PostgreSQL
- **Auth**: Better Auth
- **Monorepo**: PNPM workspaces
- **Testing**: Vitest
- **Linting**: ESLint 9

## Assumptions

- Node.js v20+
- PNPM v8+
- Docker installed and running

If not confident, see the [Setup Guide](docs/setup.md)

## Project Structure

```
apps/
├── frontend/                 # Next.js app (port 3847)
│   ├── app/
│   │   ├── components/       # Shared components
│   │   ├── api/auth/         # Better Auth routes
│   │   ├── dashboard/        # Role-based dashboards
│   │   │   ├── sponsor/
│   │   │   └── publisher/
│   │   └── marketplace/      # Public marketplace
│   └── lib/
│       ├── api.ts            # API client
│       ├── types.ts          # Type definitions
│       └── utils.ts          # Utilities
│
├── backend/                  # Express API (port 4291)
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── seed.ts
│   └── src/
│       ├── index.ts          # API routes
│       ├── db.ts             # Prisma client
│       └── utils/
│           └── helpers.ts
│
└── packages/
    ├── config/               # Shared TypeScript config
    ├── eslint-config/        # Shared ESLint rules
    └── prettier-config/      # Shared Prettier config

scripts/
├── setup.ts                  # Automated setup script
└── tsconfig.json             # Scripts TypeScript config
```

## Quick Start

### Clone Repository

```bash
git clone https://github.com/anvara-project/take-home.git
cd take-home
```

### Automated Setup (Recommended)

```bash
pnpm setup-project
```

This runs the **complete setup** including dependency installation, Docker initialization, database setup, and seeding.

---

### Manual Setup

See the [Setup Guide](docs/setup.md) for detailed manual setup instructions.

## Development

```bash
# Start all services
pnpm dev

# Run tests
pnpm test

# Lint code
pnpm lint

# Format code with Prettier
pnpm format

# Open Prisma Studio
pnpm --filter @anvara/backend db:studio
```

## Database

PostgreSQL runs in Docker on port 5498:

```bash
# Start database
docker-compose up -d

# Stop database
docker-compose down

# View Prisma Studio
pnpm --filter @anvara/backend db:studio
```

## Authentication

Better Auth is configured for role-based access:

- **Sponsors**: View campaigns, create placements
- **Publishers**: View ad slots, manage availability

**Demo accounts:**

- `sponsor@example.com` / `password`
- `publisher@example.com` / `password`

See the [setup guide](docs/setup.md) for configuration details.

## Documentation

| Document                                         | Description                     |
| ------------------------------------------------ | ------------------------------- |
| [Setup Guide](docs/setup.md)                     | Installation and configuration  |
| [Challenges Overview](docs/challenges/README.md) | All challenges and requirements |
| [Submission Guide](docs/submission.md)           | How to submit your work         |

### Individual Challenges

- [Challenge 1: Fix TypeScript Errors](docs/challenges/01-typescript.md)
- [Challenge 2: Server-Side Data Fetching](docs/challenges/02-server-components.md)
- [Challenge 3: Secure API Endpoints](docs/challenges/03-api-security.md)
- [Challenge 4: Complete CRUD Operations](docs/challenges/04-crud-operations.md)
- [Challenge 5: Dashboards with Server Actions](docs/challenges/05-server-actions.md)

### Bonus Challenges

Explore [all bonus challenges](docs/bonus-challenges/README.md) organized by category:

**🛒 Product & Business**

- [Improve Marketplace Conversions](docs/bonus-challenges/business/01-marketplace-conversions.md)
- [Newsletter Signup Form](docs/bonus-challenges/business/02-newsletter-signup.md)
- [Request a Quote Feature](docs/bonus-challenges/business/03-request-quote.md)

**🎨 Design & UX**

- [Marketing Landing Page](docs/bonus-challenges/design/01-landing-page.md)
- [Dashboard Redesign](docs/bonus-challenges/design/02-dashboard.md)
- [Campaign Builder Flow](docs/bonus-challenges/design/03-campaign-builder.md)
- [Mobile-First Experience](docs/bonus-challenges/design/04-mobile-responsive.md)
- [Dark Mode Support](docs/bonus-challenges/design/05-dark-mode.md)
- [Component Library](docs/bonus-challenges/design/06-component-library.md)
- [Data Table Pagination](docs/bonus-challenges/design/07-pagination.md)

**📊 Analytics & Testing**

- [Google Analytics Setup](docs/bonus-challenges/analytics/01-google-analytics.md)
- [Conversion Tracking](docs/bonus-challenges/analytics/02-conversion-tracking.md)
- [A/B Testing Framework](docs/bonus-challenges/analytics/03-ab-testing.md)

## Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs/)
- [Express.js Guide](https://expressjs.com/)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Better Auth Documentation](https://www.better-auth.com/docs)

## Need Help?

- **Setup issues?** Check the [Setup Guide](docs/setup.md)
- **Challenge questions?** Review the [individual challenge pages](docs/challenges/README.md)
- **Submission questions?** See the [Submission Guide](docs/submission.md)
