# Challenge 3: Secure API Endpoints

**Difficulty:** ⭐⭐⭐ Hard

## Overview

The backend API currently has **no authentication checks**. Anyone can access any data, and there's no authorization to prevent users from accessing other users' data.

This is a critical security flaw that needs to be fixed.

## Your Task

Implement authentication middleware to secure the API so users can only access their own data.

## Security Problems

The API currently has critical security flaws:

- ❌ No authentication check
- ❌ No user identification
- ❌ Returns data from all users
- ❌ No authorization validation

Find the TODO comments in the authentication file and implement proper middleware.

## Requirements

Implement the following security measures:

### 1. Authentication Middleware

Create middleware that:

- ✅ Extracts and validates the session from the request
- ✅ Returns `401 Unauthorized` if no valid session exists
- ✅ Attaches user information to the request object
- ✅ Passes control to the next handler if authenticated

### 2. User-Scoped Data Access

Ensure that:

- ✅ Sponsors can only see **their own** campaigns
- ✅ Publishers can only see **their own** ad slots
- ✅ Users cannot access other users' data

### 3. Authorization Checks

- ✅ Return `401 Unauthorized` for unauthenticated requests
- ✅ Return `403 Forbidden` when a user tries to access another user's data
- ✅ Return `404 Not Found` when a resource doesn't exist

## Implementation Hints

### Key Concepts

1. **Middleware Pattern**: Create an Express middleware function that validates sessions
2. **Better Auth Integration**: Use Better Auth's `getSession` API to validate requests
3. **Request Extension**: Extend the Express Request type to include user information
4. **Ownership Checks**: Filter queries by `userId` to ensure data isolation
5. **Status Codes**:
   - `401` - Not authenticated (no valid session)
   - `403` - Not authorized (authenticated but not allowed)
   - `404` - Resource not found

### Resources

- [Better Auth Session Docs](https://www.better-auth.com/docs/concepts/session)
- [Express Middleware Guide](https://expressjs.com/en/guide/using-middleware.html)

## Routes to Secure

Apply `requireAuth` middleware to these routes:

### Campaign Routes

- `GET /api/campaigns` - Filter by user's sponsorId
- `POST /api/campaigns` - Create for user's sponsor
- `GET /api/campaigns/:id` - Verify ownership
- `PUT /api/campaigns/:id` - Verify ownership
- `DELETE /api/campaigns/:id` - Verify ownership

### Ad Slot Routes

- `GET /api/ad-slots` - Filter by user's publisherId
- `POST /api/ad-slots` - Create for user's publisher
- `GET /api/ad-slots/:id` - Verify ownership
- `PUT /api/ad-slots/:id` - Verify ownership
- `DELETE /api/ad-slots/:id` - Verify ownership

## Testing

### 1. Test Authentication

```bash
# Without authentication - should return 401
curl http://localhost:4291/api/campaigns

# With authentication - should return user's campaigns
curl http://localhost:4291/api/campaigns \
  -H "Cookie: better-auth-session=<session-cookie>"
```

### 2. Test Authorization

```bash
# Try to access another user's campaign - should return 403
curl http://localhost:4291/api/campaigns/<other-user-campaign-id> \
  -H "Cookie: better-auth-session=<session-cookie>"
```

### 3. Browser Testing

1. Log in as `sponsor@example.com`
2. Open DevTools → Network tab
3. Navigate to sponsor dashboard
4. Verify you only see your own campaigns

## Verification Checklist

- [ ] Unauthenticated requests return `401`
- [ ] Users can only see their own data
- [ ] Attempting to access other users' data returns `403`
- [ ] Non-existent resources return `404`
- [ ] All campaign routes are protected
- [ ] All ad slot routes are protected

## Resources

- [Express Middleware Guide](https://expressjs.com/en/guide/using-middleware.html)
- [Better Auth API Reference](https://www.better-auth.com/docs/api-reference)
- [HTTP Status Codes](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status)

## Next Steps

→ **[Challenge 4: CRUD Operations](04-crud-operations.md)**

---

[← Back to Challenges](README.md)
