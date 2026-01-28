import { auth } from "@/auth";
import { fail, type ApiResponse } from "./api-response";
import type { UserRole } from "./auth";
import { NextResponse } from "next/server";

// Debug logging helper
const isDebugEnabled = () => {
  return process.env.DEBUG_AUTH === "true" || process.env.NODE_ENV !== "production";
};

export interface CurrentUser {
  id: string;
  email: string;
  role: string;
}

/**
 * Require authentication for API route handlers
 * Returns the current user or an API error response (401)
 */
export async function requireAuthApi(): Promise<
  CurrentUser | NextResponse<ApiResponse<never>>
> {
  if (isDebugEnabled()) {
    console.log("[API:Auth] Checking authentication...");
  }

  const session = await auth();

  if (!session?.user) {
    if (isDebugEnabled()) {
      console.log("[API:Auth] Authentication failed - no session or user");
    }
    return fail("UNAUTHORIZED", "Authentication required", undefined, 401);
  }

  if (isDebugEnabled()) {
    console.log(`[API:Auth] Authentication successful - user: ${session.user.email} (role: ${session.user.role})`);
  }

  return {
    id: session.user.id,
    email: session.user.email,
    role: session.user.role,
  };
}

/**
 * Require specific role(s) for API route handlers
 * Returns the current user or an API error response (403)
 */
export async function requireRoleApi(
  ...allowedRoles: UserRole[]
): Promise<CurrentUser | NextResponse<ApiResponse<never>>> {
  if (isDebugEnabled()) {
    console.log(`[API:Auth] Checking role authorization - required roles: ${allowedRoles.join(", ")}`);
  }

  const result = await requireAuthApi();

  // If requireAuthApi returned an error response, return it
  if (result instanceof NextResponse) {
    return result;
  }

  const user = result;

  if (!allowedRoles.includes(user.role as UserRole)) {
    if (isDebugEnabled()) {
      console.log(`[API:Auth] Role authorization failed - user role: ${user.role}, required: ${allowedRoles.join(", ")}`);
    }
    return fail(
      "FORBIDDEN",
      "You do not have permission to access this resource",
      { requiredRoles: allowedRoles, userRole: user.role },
      403
    );
  }

  if (isDebugEnabled()) {
    console.log(`[API:Auth] Role authorization successful - user: ${user.email} (role: ${user.role})`);
  }

  return user;
}
