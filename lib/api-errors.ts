import { ZodError } from "zod";
import { fail } from "./api-response";
import { NextResponse } from "next/server";
import type { ApiResponse } from "./api-response";

// Debug logging helper
const isDebugEnabled = () => {
  return process.env.DEBUG_AUTH === "true" || process.env.NODE_ENV !== "production";
};

/**
 * Handle and map various error types to standardized API errors
 * Includes detailed logging in development mode
 */
export function handleApiError(error: unknown): NextResponse<ApiResponse<never>> {
  const debug = isDebugEnabled();

  // Zod validation errors
  if (error instanceof ZodError) {
    const formattedErrors = error.issues.map((err) => ({
      path: err.path.join("."),
      message: err.message,
    }));

    if (debug) {
      console.error("[API:Error] Validation error:", {
        type: "ZodError",
        message: "Validation failed",
        errors: formattedErrors,
      });
    }

    return fail(
      "VALIDATION_ERROR",
      "Validation failed",
      { errors: formattedErrors },
      422
    );
  }

  // NextResponse errors (already formatted)
  if (error instanceof NextResponse) {
    if (debug) {
      console.log("[API:Error] NextResponse error (already formatted)");
    }
    return error;
  }

  // Standard Error objects
  if (error instanceof Error) {
    const errorType = error.constructor.name;
    const errorMessage = error.message || "An unknown error occurred";
    const errorStack = debug ? error.stack : undefined;

    if (debug) {
      console.error("[API:Error] Error caught:", {
        type: errorType,
        message: errorMessage,
        stack: errorStack,
      });
    }

    // Check for known error codes in message
    if (error.message.includes("UNAUTHORIZED") || error.message.includes("401")) {
      return fail("UNAUTHORIZED", errorMessage, undefined, 401);
    }
    if (error.message.includes("FORBIDDEN") || error.message.includes("403")) {
      return fail("FORBIDDEN", errorMessage, undefined, 403);
    }
    if (error.message.includes("NOT_FOUND") || error.message.includes("404")) {
      return fail("NOT_FOUND", errorMessage, undefined, 404);
    }

    // Generic error
    return fail("INTERNAL_ERROR", errorMessage, undefined, 500);
  }

  // Unknown error type
  if (debug) {
    console.error("[API:Error] Unknown error type:", {
      type: typeof error,
      value: String(error),
    });
  }

  return fail(
    "INTERNAL_ERROR",
    "An unexpected error occurred",
    { originalError: String(error) },
    500
  );
}
