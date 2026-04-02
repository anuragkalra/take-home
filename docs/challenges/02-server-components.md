# Challenge 2: Server-Side Data Fetching

**Difficulty:** ⭐⭐ Medium

## Overview

The sponsor dashboard currently fetches data client-side using `useEffect`, which is inefficient and exposes the API structure to the browser. Next.js App Router provides a better way with Server Components.

## Your Task

Convert the sponsor dashboard to use Next.js Server Components with proper server-side data fetching.

## Current Problem

The sponsor dashboard fetches data client-side which causes:

- ❌ Extra client-side bundle size
- ❌ Network waterfall (HTML → JS → API)
- ❌ Exposes API URLs to browser
- ❌ No server-side caching benefits
- ❌ Slower initial page load

Find the component using `useEffect` for data fetching and refactor it to a Server Component that fetches data on the server using a Server Action.

## Requirements

Your solution should:

1. Fetch data on the server before the page renders
2. Pass data to components that need it
3. Handle loading and error states appropriately
4. Minimize client-side JavaScript

## Hints

- Look for FIXME comments in the dashboard components
- Think about which parts need to run on the server vs. client
- Consider when you actually need interactivity vs. static rendering
- Check the Next.js docs if you're unsure about Server vs Client Components

## Testing

1. **Test the page loads:**

   ```bash
   # Visit http://localhost:3847/dashboard/sponsor
   ```

2. **Verify data is fetched on server:**
   - View page source (Ctrl+U)
   - Campaign data should appear in the initial HTML

3. **Test error handling:**
   - Stop the backend server
   - Refresh the page
   - Verify graceful error handling

## Verification

- [ ] Campaigns load without `useEffect`
- [ ] Data appears in View Source (server-rendered)
- [ ] Loading states work properly
- [ ] No unnecessary client-side JavaScript

## Resources

- [Next.js Server Components](https://nextjs.org/docs/app/building-your-application/rendering/server-components)
- [Data Fetching Patterns](https://nextjs.org/docs/app/building-your-application/data-fetching/patterns)

## Concepts Tested

- ✅ Next.js App Router Server vs Client Components
- ✅ When to use `'use client'` directive
- ✅ Avoiding unnecessary client-side data fetching
- ✅ Proper async/await patterns in React Server Components
- ✅ Loading and error states

## Resources

- [Next.js Server Components](https://nextjs.org/docs/app/building-your-application/rendering/server-components)
- [Data Fetching Patterns](https://nextjs.org/docs/app/building-your-application/data-fetching/patterns)

## Next Steps

→ **[Challenge 3: Secure API Endpoints](03-api-security.md)**

---

[← Back to Challenges](README.md)
