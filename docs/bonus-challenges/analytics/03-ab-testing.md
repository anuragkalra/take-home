# 📊 Analytics Challenge 3: A/B Testing Implementation

**Difficulty:** Hard ⭐⭐⭐

---

## The Challenge

Implement a simple A/B testing framework that allows testing different variations of UI elements without requiring external service accounts.

---

## Requirements

### Core Functionality

- Split users into test groups (A/B or A/B/C)
- Persist group assignment (user sees same variant consistently)
- Track which variant users see
- Measure outcomes per variant

### Implementation Options

Choose one approach:

**Option A: Simple Cookie-Based**

- Assign variant on first visit
- Store in cookie/localStorage
- Track variant with analytics events

**Option B: Edge-Based (Advanced)**

- Use Next.js middleware
- Assign at the edge for faster decisions
- Consider Vercel Edge Config or similar

**Option C: Feature Flag System**

- Build a simple feature flag system
- Support percentage-based rollouts
- Allow targeting by user attributes

---

## Example Use Case

Test two versions of the marketplace CTA button:

```jsx
// Variant A: "Request This Placement"
// Variant B: "Get Started Now"

// Your implementation should make this easy:
const variant = useABTest('cta-button-text');

return <button>{variant === 'A' ? 'Request This Placement' : 'Get Started Now'}</button>;
```

---

## What We're Looking For

✅ Clean, reusable A/B testing utility  
✅ Consistent user experience (same user = same variant)  
✅ Integration with analytics tracking  
✅ Easy to add new tests  
✅ No external account required for verification

---

## Verification

Your implementation should be verifiable by:

1. Opening the app in two different browsers (or incognito)
2. Seeing that each gets a consistent variant
3. Checking that variant assignment is tracked
4. Clearing cookies to get re-randomized

---

## Hints

- Start simple - a cookie + Math.random() can work
- Consider a `useABTest` hook or `<ABTest>` component
- Track the variant assignment as an analytics event
- Think about how you'd analyze results later

---

## Bonus Points

- Support for multiple concurrent tests
- Percentage-based splits (not just 50/50)
- Server-side variant assignment for SEO
- Debug mode to force specific variants

---

[← Back to Bonus Challenges](../README.md)
