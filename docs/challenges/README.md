# Challenges Overview

Complete these 5 challenges to demonstrate your full-stack development skills.

## How You'll Be Evaluated

| Criteria                        | Weight |
| ------------------------------- | ------ |
| Code Quality & TypeScript Usage | 25%    |
| React/Next.js Best Practices    | 25%    |
| Backend API Design & Security   | 25%    |
| Problem Solving & Debugging     | 15%    |
| Bonus Challenges                | 10%    |

## Core Challenges (Required)

Complete all 5 challenges in order:

### [Challenge 1: Fix TypeScript Errors](01-typescript.md) ⭐

**Difficulty:** Easy

Fix TypeScript errors to get a clean build.

- Replace `any` types with proper types
- Remove unused variables
- Fix schema mismatches

[→ Start Challenge 1](01-typescript.md)

---

### [Challenge 2: Server-Side Data Fetching](02-server-components.md) ⭐⭐

**Difficulty:** Medium

Convert client-side data fetching to Next.js Server Components.

- Move data fetching to server
- Pass data as props
- Handle loading/error states

[→ Start Challenge 2](02-server-components.md)

---

### [Challenge 3: Secure API Endpoints](03-api-security.md) ⭐⭐⭐

**Difficulty:** Hard

Implement authentication middleware to protect API routes.

- Create auth middleware
- Validate sessions
- Enforce user ownership
- Return proper status codes

[→ Start Challenge 3](03-api-security.md)

---

### [Challenge 4: CRUD Operations](04-crud-operations.md) ⭐⭐

**Difficulty:** Medium

Complete the missing API endpoints for campaigns and ad slots.

- Implement PUT/DELETE endpoints
- Add proper validation
- Include authorization checks

[→ Start Challenge 4](04-crud-operations.md)

---

### [Challenge 5: Dashboards with Server Actions](05-server-actions.md) ⭐⭐⭐

**Difficulty:** Hard

Build fully functional dashboards for both publishers and sponsors using Next.js Server Actions.

- Create Server Actions for mutations
- Use `useFormState` and `useFormStatus`
- Implement cache revalidation

[→ Start Challenge 5](05-server-actions.md)

---

## Bonus Challenges (Optional)

Earn extra points by completing these optional challenges:

### [Bonus Challenges →](../bonus-challenges/README.md)

**🛒 Business Challenges:**

- Improve Marketplace Conversions

**🎨 Design Challenges:**

- Marketing Landing Page
- Dashboard UI/UX Improvements
- Animations & Polish
- Mobile Experience
- Error & Empty States

**📊 Analytics Challenges:**

- Google Analytics Setup
- Client-Side Conversion Tracking
- A/B Testing Implementation

**🔧 Technical Challenges:**

- Fix All ESLint Warnings
- Add Pagination

---

## Submission Checklist

Before submitting, ensure:

- [ ] `pnpm typecheck` passes with no errors
- [ ] `pnpm dev` starts both frontend and backend
- [ ] `pnpm lint` passes with no errors
- [ ] All 5 core challenges are complete
- [ ] Code is clean and well-organized
- [ ] Git history shows clear, descriptive commits
- [ ] No sensitive data committed

## Tips for Success

### 1. Start Simple

Get basic functionality working before adding complexity. Don't try to be perfect on the first attempt.

### 2. Read Error Messages

TypeScript and runtime errors often point directly to the solution. Take time to understand what they're telling you.

### 3. Use Your Tools

- **TypeScript hover** - `Ctrl+K Ctrl+I` in VS Code
- **Network tab** - Debug API calls in DevTools
- **Prisma Studio** - Inspect database visually (`pnpm --filter @anvara/backend db:studio`)
- **Console logs** - Add strategic logging

### 4. Commit Frequently

Make small, focused commits with clear messages:

```bash
✅ "Fix: Replace any types with proper interfaces in helpers.ts"
✅ "Add: Campaign update endpoint with authorization"
❌ "fix stuff"
❌ "changes"
```

### 5. Test As You Go

Don't wait until the end to test. Verify each challenge works before moving to the next.

## Time Management

This take-home test is designed to take at your own pace.

**Recommended approach:**

1. Start with **Challenge 1** - Get TypeScript errors fixed first
2. Work through challenges **2-5 in order** - Each builds on previous concepts
3. If running short on time, prioritize completing all 5 core challenges over bonus challenges

Take your time and focus on quality over speed. We're more interested in your problem-solving approach than how fast you finish.

## Getting Help

### Stuck on a Challenge?

1. Re-read the challenge requirements
2. Check the hints and example code
3. Look at similar existing code in the project
4. Review the official documentation links
5. Debug step-by-step with console logs

### Common Issues

- **TypeScript errors** - Hover over the error in VS Code
- **API not working** - Check Network tab, verify backend is running
- **Database issues** - Use Prisma Studio to inspect data
- **Build failures** - Read the error output carefully

## Next Steps

Ready to begin? Start with:

### [→ Challenge 1: Fix TypeScript Errors](01-typescript.md)

Good luck! 🚀
