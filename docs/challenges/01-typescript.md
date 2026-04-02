# Challenge 1: Fix TypeScript Errors

**Difficulty:** ⭐ Easy

## Overview

The project has some TypeScript errors that prevent a clean build. Your first task is to fix these errors to establish a solid foundation.

## Your Task

Fix all TypeScript errors so `pnpm typecheck` passes with no errors.

## Getting Started

Run the type checker to see all errors:

```bash
pnpm typecheck
```

You'll see errors in several files. Work through them systematically.

## Common Issues to Fix

### 1. Implicit `any` Types

```typescript
// ❌ Bad - implicit any
function processData(data) {
  return data.value;
}

// ✅ Good - explicit types
function processData(data: { value: number }) {
  return data.value;
}
```

### 2. Unused Variables

```typescript
// ❌ Bad - unused variable
const unusedVariable = 'hello';
const result = calculateValue();

// ✅ Good - remove unused code
const result = calculateValue();
```

### 3. Type Mismatches

```typescript
// ❌ Bad - property doesn't exist in schema
await prisma.adSlot.create({
  data: {
    name: 'Banner',
    dimensions: '300x250', // This field doesn't exist!
  },
});

// ✅ Good - only use fields that exist
await prisma.adSlot.create({
  data: {
    name: 'Banner',
    price: 100,
  },
});
```

## Hints

1. **Read error messages carefully** - TypeScript errors are usually very descriptive
2. **Use VS Code IntelliSense** - Hover over variables to see their types (`Ctrl+K Ctrl+I`)
3. **Check the Prisma schema** - Make sure you're using correct field names
4. **Remove dead code** - If a variable is unused, delete it

## Verification

Run these commands to verify your fixes:

```bash
# Check TypeScript errors
pnpm typecheck

# Check linting
pnpm lint
```

Both should pass with no errors.

## Concepts Tested

- ✅ TypeScript strict mode
- ✅ Type safety and proper annotations
- ✅ Code quality and unused code removal
- ✅ Schema awareness (Prisma types)

## Next Steps

Once `pnpm typecheck` passes cleanly:

→ **[Challenge 2: Server-Side Data Fetching](02-server-components.md)**

---

[← Back to Challenges](README.md)
