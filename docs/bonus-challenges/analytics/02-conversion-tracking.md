# 📊 Analytics Challenge 2: Client-Side Conversion Tracking

**Difficulty:** Medium-Hard ⭐⭐

---

## The Challenge

Implement **conversion tracking** for key user actions in the marketplace. This goes beyond basic analytics - we want to track the user journey and measure what matters.

---

## The Problem

With client-side routing in Next.js, traditional page-load-based analytics miss important interactions:

- Users browsing multiple listings without full page reloads
- Modal interactions
- Form completions
- Multi-step flows

---

## Requirements

### Define Conversions

Identify and track meaningful conversion events:

- **Micro-conversions**: Viewing a listing detail, clicking CTA buttons
- **Macro-conversions**: Submitting a placement request, completing signup

### Implementation

- Create a reusable analytics utility/hook
- Fire events at the right moments (not too early, not too late)
- Include relevant data with each event (listing ID, user type, etc.)
- Handle client-side navigation properly

---

## What We're Looking For

✅ Understanding of conversion funnel concepts  
✅ Clean, reusable tracking implementation  
✅ Proper event naming and data structure  
✅ Handling of SPA navigation  
✅ Not blocking user interactions

---

## Hints

- Create a utility like `lib/analytics.ts`
- Consider using `useEffect` for view events
- Think about what data would help analyze user behavior
- Don't track everything - track what matters

---

[← Back to Bonus Challenges](../README.md)
