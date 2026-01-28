# Debug Logging Setup - Complete

## Overview

Full debug logging has been enabled across the application for local development. All logs are conditional and only appear when `NODE_ENV !== "production"` or `DEBUG_AUTH="true"` is set.

## Environment Variable

Add this to your `.env` file to enable debug logging (optional):

```env
DEBUG_AUTH=true
```

**Note:** Debug logging is automatically enabled when `NODE_ENV !== "production"`, so this is only needed if you want to enable it in production-like environments.

## Log Locations

### Server-Side Logs (Terminal)
**Most important:** All authentication and API logs appear in your **terminal/console** where you run `npm run dev` or your Next.js server. This is where you'll see the detailed auth logs.

### Client-Side Logs (Browser Console)
Client-side login attempts are also logged in the browser's developer console (F12 → Console tab) for easier debugging.

## 1. NextAuth Debug Logging

### Location: `auth.ts`

### What Gets Logged:

#### Custom NextAuth Logger
- `[NextAuth:ERROR]` - NextAuth errors
- `[NextAuth:WARN]` - NextAuth warnings  
- `[NextAuth:DEBUG]` - NextAuth debug messages

#### Credentials Provider (`authorize()` function)
- `[Auth:authorize] Attempting authentication for email: <email>` - When login attempt starts
- `[Auth:authorize] User not found for email: <email>` - If user doesn't exist
- `[Auth:authorize] User found: <id> (<email>)` - When user is found in database
- `[Auth:authorize] Password comparison failed for email: <email>` - If password is incorrect
- `[Auth:authorize] Password comparison succeeded for email: <email>` - If password is correct
- `[Auth:authorize] Role loaded: <role> for user: <email>` - When role is successfully loaded
- `[Auth:authorize] Authentication successful for: <email> (role: <role>)` - Final success message
- `[Auth:authorize] Error during authentication:` - Any errors caught during the process
- `[Auth:authorize] Error stack:` - Stack trace (dev only)

**Security Note:** Passwords are **never** logged, only the email and authentication status.

### Example Login Flow Output (Terminal):

**Successful Login:**
```
[Auth:authorize] 🔐 Starting authentication for email: admin@demo.com
[Auth:authorize] ✅ User found: clx1234567890 (admin@demo.com)
[Auth:authorize] ✅ Password comparison SUCCEEDED for email: admin@demo.com
[Auth:authorize] ✅ Role loaded: admin for user: admin@demo.com
[Auth:authorize] 🎉 Authentication SUCCESSFUL for: admin@demo.com (role: admin)
```

**Failed Login (Invalid Password):**
```
[Auth:authorize] 🔐 Starting authentication for email: employee@demo.com
[Auth:authorize] ✅ User found: clx1234567891 (employee@demo.com)
[Auth:authorize] ❌ Password comparison FAILED for email: employee@demo.com
[Auth:authorize] User exists but password is incorrect
```

**Failed Login (User Not Found):**
```
[Auth:authorize] 🔐 Starting authentication for email: wrong@demo.com
[Auth:authorize] ❌ User NOT FOUND for email: wrong@demo.com
```

### Example Client-Side Logs (Browser Console):

**Failed Login:**
```
[Login:Client] Attempting login for: employee@demo.com
[Login:Client] ❌ Login failed: CredentialsSignin
[Login:Client] Check server terminal for detailed auth logs
```

**Successful Login:**
```
[Login:Client] Attempting login for: employee@demo.com
[Login:Client] ✅ Login successful, fetching session...
```

## 2. API Routes Debug Logging

### Location: `lib/api-errors.ts` (via `handleApiError()`)

### What Gets Logged:

- `[API:Error] Validation error:` - Zod validation errors with formatted field errors
- `[API:Error] Error caught:` - Standard errors with:
  - Error type (class name)
  - Error message
  - Stack trace (dev only)
- `[API:Error] Unknown error type:` - Non-Error objects

### Location: `lib/api-auth.ts`

### What Gets Logged:

- `[API:Auth] Checking authentication...` - When `requireAuthApi()` is called
- `[API:Auth] Authentication failed - no session or user` - If not authenticated
- `[API:Auth] Authentication successful - user: <email> (role: <role>)` - If authenticated
- `[API:Auth] Checking role authorization - required roles: <roles>` - When `requireRoleApi()` is called
- `[API:Auth] Role authorization failed - user role: <role>, required: <roles>` - If role doesn't match
- `[API:Auth] Role authorization successful - user: <email> (role: <role>)` - If role matches

### Example API Call Output:

```
[API:Auth] Checking authentication...
[API:Auth] Authentication successful - user: admin@demo.com (role: admin)
[API:Auth] Checking role authorization - required roles: admin, manager
[API:Auth] Role authorization successful - user: admin@demo.com (role: admin)
```

### Error Example:

```
[API:Error] Error caught: {
  type: 'TypeError',
  message: 'Cannot read property of undefined',
  stack: 'TypeError: Cannot read property...\n    at ...'
}
```

## 3. Prisma Debug Logging

### Location: `lib/prisma.ts`

### What Gets Logged:

In development mode, Prisma logs:
- **Query logs** - All database queries with parameters
- **Info logs** - General information
- **Warn logs** - Warnings
- **Error logs** - Errors

In production, only **error logs** are enabled.

### Example Prisma Query Output:

```
prisma:query SELECT "User"."id", "User"."email", "User"."password", "User"."roleId", "User"."createdAt", "User"."updatedAt" FROM "User" WHERE "User"."email" = $1 LIMIT $2 OFFSET $3
prisma:query SELECT "Role"."id", "Role"."name", "Role"."key", "Role"."description", "Role"."createdAt", "Role"."updatedAt" FROM "Role" WHERE "Role"."id" = $1 LIMIT $2 OFFSET $3
```

## 4. API Route Handlers

### Location: All API route handlers (e.g., `app/api/health/route.ts`)

All API route handlers should use this pattern:

```typescript
import { ok } from "@/lib/api-response";
import { handleApiError } from "@/lib/api-errors";

export async function GET() {
  try {
    // Your logic here
    return ok({ status: "ok" });
  } catch (error) {
    return handleApiError(error);
  }
}
```

This ensures all errors are:
1. Logged with detailed information
2. Returned in a standardized format
3. Include stack traces in development

## Key Log Lines to Watch During Login

### Where to Look:
1. **Server logs** → Your terminal where `npm run dev` is running (most detailed)
2. **Browser console** → Press F12, open Console tab (client-side logs)

### When testing login, watch for these log lines in order:

1. **Start of authentication (Terminal):**
   ```
   [Auth:authorize] 🔐 Starting authentication for email: <email>
   ```

2. **User lookup (Terminal):**
   ```
   [Auth:authorize] ✅ User found: <id> (<email>)
   ```
   OR
   ```
   [Auth:authorize] ❌ User NOT FOUND for email: <email>
   ```

3. **Password verification (Terminal):**
   ```
   [Auth:authorize] ✅ Password comparison SUCCEEDED for email: <email>
   ```
   OR
   ```
   [Auth:authorize] ❌ Password comparison FAILED for email: <email>
   [Auth:authorize] User exists but password is incorrect
   ```

4. **Role loading (Terminal):**
   ```
   [Auth:authorize] ✅ Role loaded: <role> for user: <email>
   ```

5. **Final success (Terminal):**
   ```
   [Auth:authorize] 🎉 Authentication SUCCESSFUL for: <email> (role: <role>)
   ```

6. **Client-side confirmation (Browser Console):**
   ```
   [Login:Client] ✅ Login successful, fetching session...
   ```
   OR
   ```
   [Login:Client] ❌ Login failed: CredentialsSignin
   [Login:Client] Check server terminal for detailed auth logs
   ```

## Troubleshooting

### No logs appearing?

1. **Check your terminal** - Server logs appear in the terminal where you run `npm run dev`, NOT in the browser console
2. Check that `NODE_ENV !== "production"` or `DEBUG_AUTH="true"` is set
3. Verify the logs aren't being filtered or hidden by your terminal
4. **For invalid password attempts**, look for:
   - `❌ Password comparison FAILED` in your terminal
   - `❌ Login failed` in browser console (F12 → Console tab)

### Can't find the terminal?

- If using VS Code: Check the "Terminal" panel at the bottom
- If using a separate terminal window: Look for the window running `npm run dev`
- Server logs will NOT appear in browser DevTools Network tab - they're server-side only

### Too many logs?

- Set `NODE_ENV=production` to disable most logging
- Prisma query logs can be verbose - this is normal in development
- Consider filtering logs in your terminal if needed

### Security Reminders

- ✅ **Email addresses** are logged (safe)
- ✅ **User IDs** are logged (safe)
- ✅ **Roles** are logged (safe)
- ❌ **Passwords** are NEVER logged
- ❌ **Session tokens** are NOT logged
- ❌ **Secrets** are NOT logged

## Files Modified

- `auth.ts` - Added NextAuth debug logging and detailed authorize() logs
- `lib/api-errors.ts` - Enhanced error logging with stack traces
- `lib/api-auth.ts` - Added authentication/authorization logging
- `lib/prisma.ts` - Enhanced Prisma query logging configuration
- `app/api/health/route.ts` - Added try/catch error handling

## Testing

To test the debug logging:

1. Start your dev server: `npm run dev`
2. Attempt to log in at `/login`
3. Watch your terminal for the authentication logs
4. Make an API call (e.g., visit `/app/debug`)
5. Check for API authentication and error logs
6. Review Prisma query logs for database operations

All logs should appear in your terminal where the Next.js server is running.
