import { getServerSession } from "next-auth/next";
import { authOptions } from "@/auth";
import { redirect } from "next/navigation";

export type UserRole = "admin" | "manager" | "employee";

export interface CurrentUser {
  id: string;
  email: string;
  role: string;
}

/**
 * Get the current authenticated user from the session
 * Returns null if not authenticated
 */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return null;
  }
  return {
    id: session.user.id,
    email: session.user.email,
    role: session.user.role,
  };
}

/**
 * Require authentication - throws redirect if not authenticated
 * Returns the current user if authenticated
 */
export async function requireAuth(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }
  return user;
}

/**
 * Require specific role(s) - throws redirect if not authenticated or unauthorized
 * Returns the current user if authorized
 */
export async function requireRole(...allowedRoles: UserRole[]): Promise<CurrentUser> {
  const user = await requireAuth();

  if (!allowedRoles.includes(user.role as UserRole)) {
    redirect("/403");
  }

  return user;
}
