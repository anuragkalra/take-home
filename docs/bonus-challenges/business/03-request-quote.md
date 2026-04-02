# 💬 Business Challenge: Request a Quote

**Difficulty:** Medium ⭐⭐

---

## The Challenge

Not every sponsor wants to book immediately through the standard flow. Some want to negotiate pricing, discuss custom packages, or ask questions first. Add a "Request a Quote" feature as an alternative to direct booking.

---

## The Problem

Right now the marketplace detail page has one CTA: "Book This Placement" (for logged-in sponsors). But what about:

- Sponsors who want custom pricing?
- Users browsing before they have a budget?
- Publishers who prefer to negotiate directly?
- Enterprise buyers who need a quote for approval?

A "Request a Quote" option reduces friction and captures leads that might otherwise bounce.

---

## Requirements

### UI/UX

Add a quote request option to the marketplace detail page. Consider:

- Should it be a separate button or secondary CTA?
- Modal vs. separate page?
- What information do you need to collect?
- How does it differ from direct booking?

### Form Fields (Suggested)

- Company name
- Contact email
- Phone (optional)
- Campaign details (budget, goals, timeline)
- Special requirements (textarea)

### Backend

Create an API endpoint:

```
POST /api/quotes/request
Body: { email, companyName, message, adSlotId, ... }
Response: { success: true, quoteId: "abc123" }
```

Like the newsletter challenge, this doesn't need to persist to a database or send real emails. Focus on the form UX and data structure.

---

## What We're Looking For

✅ Thoughtful UX (when/how to show this option)  
✅ Well-designed form with appropriate fields  
✅ Proper validation and error handling  
✅ Clear messaging and expectations  
✅ Good integration with existing booking flow  
✅ Mobile-friendly implementation

---

## Things to Consider

### Business Logic

- Should this be available for already-booked listings?
- Who can request quotes - anyone or just logged-in users?
- What happens after they submit?
- How do you set expectations about response time?

### UX Questions

- How do users discover this option?
- Does it compete with or complement direct booking?
- What messaging makes users feel comfortable requesting a quote?
- Should you show any pricing hints in the form?

### Implementation

- Form validation (client vs server)
- Multi-step form or single page?
- How to handle form state?
- Success confirmation and next steps

---

## Bonus Points

- Show confirmation page with what happens next
- Include estimated response time
- Pre-fill user data if logged in
- Track quote requests in analytics
- Allow file attachments (media kit, etc.)

---

[← Back to Bonus Challenges](../README.md)
