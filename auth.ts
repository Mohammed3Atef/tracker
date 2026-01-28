import { NextAuthOptions } from "next-auth";
import { getServerSession } from "next-auth/next";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "./lib/prisma";
import * as bcrypt from "bcrypt";

// Debug logging helper
const isDebugEnabled = () => {
  return process.env.DEBUG_AUTH === "true" || process.env.NODE_ENV !== "production";
};

// Custom NextAuth logger
const createNextAuthLogger = () => {
  if (!isDebugEnabled()) {
    return {
      error: () => {},
      warn: () => {},
      debug: () => {},
    };
  }

  return {
    error: (message: string, ...args: any[]) => {
      console.error(`[NextAuth:ERROR] ${message}`, ...args);
    },
    warn: (message: string, ...args: any[]) => {
      console.warn(`[NextAuth:WARN] ${message}`, ...args);
    },
    debug: (message: string, ...args: any[]) => {
      console.log(`[NextAuth:DEBUG] ${message}`, ...args);
    },
  };
};

export const authOptions: NextAuthOptions = {
  debug: isDebugEnabled(),
  logger: createNextAuthLogger(),
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          if (isDebugEnabled()) {
            console.log("[Auth:authorize] Missing credentials - email or password not provided");
          }
          return null;
        }

        const email = credentials.email as string;
        if (isDebugEnabled()) {
          console.log(`[Auth:authorize] 🔐 Starting authentication for email: ${email}`);
        }

        try {
          const user = await prisma.user.findUnique({
            where: { email },
            include: { role: true },
          });

          if (!user) {
            if (isDebugEnabled()) {
              console.warn(`[Auth:authorize] ❌ User NOT FOUND for email: ${email}`);
            }
            return null;
          }

          if (isDebugEnabled()) {
            console.log(`[Auth:authorize] ✅ User found: ${user.id} (${user.email})`);
          }

          const isPasswordValid = await bcrypt.compare(
            credentials.password as string,
            user.password
          );

          if (!isPasswordValid) {
            if (isDebugEnabled()) {
              console.warn(`[Auth:authorize] ❌ Password comparison FAILED for email: ${email}`);
              console.warn(`[Auth:authorize] User exists but password is incorrect`);
            }
            return null;
          }

          if (isDebugEnabled()) {
            console.log(`[Auth:authorize] ✅ Password comparison SUCCEEDED for email: ${email}`);
          }

          const roleName = user.role.name;
          if (isDebugEnabled()) {
            console.log(`[Auth:authorize] ✅ Role loaded: ${roleName} for user: ${email}`);
            console.log(`[Auth:authorize] 🎉 Authentication SUCCESSFUL for: ${email} (role: ${roleName})`);
          }

          return {
            id: user.id,
            email: user.email,
            role: roleName,
          };
        } catch (error) {
          console.error("[Auth:authorize] Error during authentication:", error);
          if (error instanceof Error && isDebugEnabled()) {
            console.error("[Auth:authorize] Error stack:", error.stack);
          }
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        session.user.role = token.role as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
};

/**
 * Get the current session for use in API route handlers
 * Returns session or null if not authenticated
 */
export async function auth() {
  return await getServerSession(authOptions);
}
