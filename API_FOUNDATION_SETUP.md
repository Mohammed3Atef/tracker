# API Foundation Layer - Implementation Complete

## Overview

A complete API foundation layer has been implemented with standardized response formats, helper functions, typed client wrapper, React Query integration, and error handling.

## Files Created

### Backend Files
- `lib/api-response.ts` - Standardized API response types and helpers (`ok()`, `fail()`)
- `lib/api-auth.ts` - API authentication helpers (`requireAuthApi()`, `requireRoleApi()`)
- `lib/api-errors.ts` - Centralized error mapping (Zod, auth, permissions)
- `app/api/health/route.ts` - Example health endpoint

### Frontend Files
- `lib/api-client.ts` - Typed API client wrapper (`apiGet`, `apiPost`, `apiPatch`, `apiDelete`)
- `hooks/use-api-toast.ts` - Client-side hook for API error toasts
- `hooks/use-health.ts` - Example React Query hook
- `app/app/debug/page.tsx` - Debug page demonstrating the API foundation
- `app/providers/query-provider.tsx` - React Query provider

### Updated Files
- `auth.ts` - Added `auth()` helper function
- `app/layout.tsx` - Added QueryProvider

## Packages Installed

```bash
npm install @tanstack/react-query @tanstack/react-query-devtools
```

## API Response Format

### Success Response
```typescript
{
  success: true,
  data: T
}
```

### Error Response
```typescript
{
  success: false,
  error: {
    code: string,
    message: string,
    details?: any
  }
}
```

## Error Codes

- `VALIDATION_ERROR` - 422 (Zod validation errors)
- `UNAUTHORIZED` - 401 (Not authenticated)
- `FORBIDDEN` - 403 (Wrong role/permission)
- `NOT_FOUND` - 404
- `INTERNAL_ERROR` - 500

## Usage Examples

### Backend Route Handler

```typescript
import { ok, fail } from "@/lib/api-response";
import { requireAuthApi, requireRoleApi } from "@/lib/api-auth";
import { handleApiError } from "@/lib/api-errors";

export async function GET() {
  try {
    const user = await requireRoleApi("admin", "manager");
    // Your logic here
    return ok({ message: "Success" });
  } catch (error) {
    return handleApiError(error);
  }
}
```

### Frontend API Call

```typescript
import { apiGet, apiPost } from "@/lib/api-client";

// GET request
const data = await apiGet<MyType>("/api/endpoint");

// POST request
const result = await apiPost<MyType>("/api/endpoint", { key: "value" });
```

### React Query Hook

```typescript
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api-client";

export function useMyData() {
  return useQuery({
    queryKey: ["myData"],
    queryFn: () => apiGet<MyType>("/api/endpoint"),
  });
}
```

### Error Handling in Client Components

```typescript
"use client";

import { useApiToast } from "@/hooks/use-api-toast";
import { useEffect } from "react";

export function MyComponent() {
  const { toastApiError } = useApiToast();
  const { data, error } = useMyData();

  useEffect(() => {
    if (error) {
      toastApiError(error);
    }
  }, [error, toastApiError]);

  // Component JSX...
}
```

## Testing

1. **Health Endpoint**: Visit `/api/health` directly or use `/app/debug` page
2. **Debug Page**: Navigate to `/app/debug` to see React Query in action
3. **Error Handling**: Test with invalid requests to see error toasts

## React Query Configuration

- **Retry**: 2 attempts
- **Stale Time**: 60 seconds
- **Refetch on Window Focus**: Disabled
- **DevTools**: Enabled in development mode

## Type Safety

All API functions are fully typed:
- Request/response types are inferred
- Error types are properly handled
- TypeScript compilation verified
- Production build successful

## Next Steps

1. Use `requireAuthApi()` or `requireRoleApi()` in your API route handlers
2. Use `apiGet`, `apiPost`, etc. in your React Query hooks
3. Use `useApiToast()` hook in client components for error handling
4. Follow the pattern established in `/app/debug` for new features
