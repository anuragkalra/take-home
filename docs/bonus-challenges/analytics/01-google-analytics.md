# 📊 Analytics Challenge 1: Google Analytics Setup

**Difficulty:** Medium ⭐⭐

---

## The Challenge

Set up Google Analytics 4 (GA4) in the application with **proper client-side event tracking** - not just basic page views.

---

## Requirements

### Basic Setup

- Integrate Google Analytics 4 into the Next.js application
- Use Next.js's recommended approach (`@next/third-parties` or similar)
- Ensure it works in production builds

### Event Tracking (The Real Test)

Page views are automatic. We want to see you track **meaningful user actions**:

- Button clicks (e.g., "Request Placement" CTA)
- Form submissions
- Navigation between key pages
- User engagement events

---

## What We're Looking For

✅ Proper GA4 integration with Next.js  
✅ Custom event tracking beyond page views  
✅ Understanding of when/how to fire events  
✅ Clean implementation that doesn't impact performance

---

## Hints

- Check out `@next/third-parties` package
- GA4 uses `gtag('event', ...)` for custom events
- Think about what events would be valuable for a marketplace
- Consider where in the component lifecycle to fire events

---

## Verification

To verify your implementation:

1. Use browser DevTools → Network tab → filter by "google" or "analytics"
2. Check the GA4 DebugView (if you have access to a GA property)
3. Verify events fire on user interactions, not just page loads

---

## Resources

- [Next.js Third Party Libraries](https://nextjs.org/docs/app/building-your-application/optimizing/third-party-libraries)
- [GA4 Event Tracking](https://developers.google.com/analytics/devguides/collection/ga4/events)

---

[← Back to Bonus Challenges](../README.md)
