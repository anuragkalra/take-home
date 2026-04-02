# 📧 Business Challenge: Newsletter Signup

**Difficulty:** Easy ⭐

---

## The Challenge

Add a newsletter signup form to capture interested users' emails. This is a common conversion tactic - even if users don't book immediately, you capture their interest for future marketing.

---

## Requirements

### Frontend

Create a simple email capture form somewhere on the site. Common placements:

- Footer (site-wide)
- Marketplace page sidebar
- Above/below listing grid
- End of detail page

Should include:

- Email input field
- Submit button
- Basic validation (valid email format)
- Success/error states
- User-friendly messaging

### Backend

Create a simple API endpoint:

```
POST /api/newsletter/subscribe
Body: { email: string }
Response: { success: true, message: "Thanks for subscribing!" }
```

**Note:** This is a dummy endpoint - it doesn't need to save to a database or integrate with a real service. Just validate the email format and return success. Focus on the UX and client-side implementation.

---

## What We're Looking For

✅ Clean, simple form UI  
✅ Basic email validation  
✅ Proper error handling  
✅ Good UX (loading states, success messages)  
✅ Thoughtful placement on the page  
✅ Working API endpoint

---

## Bonus Points

- Prevent duplicate submissions
- Loading state on submit button
- Form resets after success
- Nice animation/transition for success state
- Consider accessibility (labels, aria attributes)

---

## Things to Consider

- Where should this form live for maximum conversions?
- What messaging would make users want to sign up?
- How do you make it feel trustworthy?
- Should it be dismissible?
- Mobile experience?

---

[← Back to Bonus Challenges](../README.md)
