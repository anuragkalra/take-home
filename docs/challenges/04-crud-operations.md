# Challenge 4: Complete CRUD Operations

**Difficulty:** ⭐⭐ Medium

## Overview

The backend API has incomplete CRUD (Create, Read, Update, Delete) operations. Several important endpoints are missing or incomplete.

## Your Task

Implement the missing API endpoints following RESTful conventions and proper security practices.

## Missing Endpoints

| Method | Endpoint             | Description         | Status     |
| ------ | -------------------- | ------------------- | ---------- |
| GET    | `/api/campaigns`     | List campaigns      | ✅ Exists  |
| POST   | `/api/campaigns`     | Create campaign     | ✅ Exists  |
| GET    | `/api/campaigns/:id` | Get single campaign | ✅ Exists  |
| PUT    | `/api/campaigns/:id` | Update campaign     | ❌ Missing |
| DELETE | `/api/campaigns/:id` | Delete campaign     | ❌ Missing |
| GET    | `/api/ad-slots`      | List ad slots       | ✅ Exists  |
| POST   | `/api/ad-slots`      | Create ad slot      | ⚠️ Broken  |
| GET    | `/api/ad-slots/:id`  | Get single ad slot  | ✅ Exists  |
| PUT    | `/api/ad-slots/:id`  | Update ad slot      | ❌ Missing |
| DELETE | `/api/ad-slots/:id`  | Delete ad slot      | ❌ Missing |

## Requirements

All endpoints must:

1. ✅ **Use authentication middleware** from Challenge 3
2. ✅ **Validate request data** before processing
3. ✅ **Verify ownership** for all operations
4. ✅ **Return appropriate HTTP status codes**:
   - `200 OK` - Successful GET/PUT
   - `201 Created` - Successful POST
   - `204 No Content` - Successful DELETE
   - `400 Bad Request` - Invalid input
   - `401 Unauthorized` - Not authenticated
   - `403 Forbidden` - Not authorized
   - `404 Not Found` - Resource doesn't exist
   - `500 Internal Server Error` - Server error
5. ✅ **Include proper error handling** with try/catch
6. ✅ **Use Prisma** for all database operations

## Implementation Hints

### RESTful Patterns

**GET /api/resource/:id** - Fetch single resource

- Use `req.params.id` to get the resource ID
- Verify ownership using Prisma where clause
- Return 404 if not found

**PUT /api/resource/:id** - Update resource

- Validate request body fields
- Check resource exists and user owns it
- Use `prisma.resource.update()` to modify
- Return updated resource

**DELETE /api/resource/:id** - Delete resource

- Verify ownership first
- Use `prisma.resource.delete()`
- Return 204 No Content on success

### Tips

- Look for TODO comments in the backend routes
- Follow the pattern of existing GET endpoints
- Study the Prisma schema in `apps/backend/prisma/schema.prisma` to understand model fields and relationships
- Use the authentication middleware from Challenge 3
- Think about what could go wrong (missing resources, unauthorized access, invalid data)
- Test with your browser's Network tab or Prisma Studio (`pnpm --filter @anvara/backend db:studio`)

## Testing

### Testing Approaches

You can test your endpoints using:

- **Browser DevTools**: Use the Console to run `fetch()` requests with `credentials: 'include'`
- **curl**: Copy your session cookie from DevTools and include it in curl commands
- **Prisma Studio**: Run `pnpm --filter @anvara/backend db:studio` to visually inspect database changes

Example test flow:

1. Log in as a sponsor or publisher
2. Try creating a new resource (campaign or ad slot)
3. Verify it appears in Prisma Studio
4. Try updating the resource
5. Try deleting the resource
6. Try accessing/deleting someone else's resource (should fail with 403)

### Using Browser Console

```javascript
// Get campaign
const response = await fetch('http://localhost:4291/api/campaigns/<id>');
const campaign = await response.json();
console.log(campaign);

// Update campaign
await fetch('http://localhost:4291/api/campaigns/<id>', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ name: 'Updated', budget: 5000 }),
});

// Delete campaign
await fetch('http://localhost:4291/api/campaigns/<id>', {
  method: 'DELETE',
});
```

### Using Prisma Studio

Open Prisma Studio to visually verify your CRUD operations:

```bash
pnpm --filter @anvara/backend db:studio
```

After creating/updating/deleting records, refresh Prisma Studio to see the changes in real-time!

## Verification Checklist

### Campaign Endpoints

- [ ] `GET /api/campaigns/:id` returns single campaign
- [ ] `PUT /api/campaigns/:id` updates campaign
- [ ] `DELETE /api/campaigns/:id` deletes campaign
- [ ] Only owner can access/modify their campaigns
- [ ] Proper status codes returned

### Ad Slot Endpoints

- [ ] `POST /api/ad-slots` creates ad slot (fixed from broken state)
- [ ] `GET /api/ad-slots/:id` returns single ad slot
- [ ] `PUT /api/ad-slots/:id` updates ad slot
- [ ] `DELETE /api/ad-slots/:id` deletes ad slot
- [ ] Only owner can access/modify their ad slots

### Error Handling

- [ ] `400` for invalid input
- [ ] `401` for unauthenticated requests
- [ ] `403` for unauthorized access
- [ ] `404` for non-existent resources
- [ ] `500` for server errors with proper logging

## Resources

```typescript
// Good - checks ownership in the query
const campaign = await prisma.campaign.findFirst({
  where: {
    id,
    sponsor: { userId: req.user!.id }, // Ownership check
  },
});

if (!campaign) {
  // Returns 404 for both "not found" and "not owned"
  // This is correct - don't reveal if resource exists
  return res.status(404).json({ error: 'Campaign not found' });
}
```

## Best Practices

1. **Validate input** - Always check required fields
2. **Check ownership** - Verify user owns the resource
3. **Use transactions** - For operations affecting multiple tables
4. **Log errors** - Use `console.error()` for debugging
5. **Return proper status codes** - Follow HTTP standards
6. **Use TypeScript types** - Leverage Prisma types

## Concepts Tested

- ✅ RESTful API design
- ✅ CRUD operations with Prisma
- ✅ Input validation
- ✅ Authorization and ownership
- ✅ HTTP status codes
- ✅ Error handling
- ✅ TypeScript with Express

## Resources

- [REST API Tutorial](https://restfulapi.net/)
- [Prisma CRUD Guide](https://www.prisma.io/docs/concepts/components/prisma-client/crud)
- [HTTP Status Codes](https://httpstatuses.com/)
- [Express Error Handling](https://expressjs.com/en/guide/error-handling.html)

## Next Steps

→ **[Challenge 5: Server Actions Dashboard](05-server-actions.md)**

---

[← Back to Challenges](README.md)
