/**
 * Application configuration derived from environment variables.
 * NEXT_PUBLIC_ prefix makes these available on the client side.
 */

export const LEAVE_ALLOWANCE_DAYS = parseInt(
  process.env.NEXT_PUBLIC_LEAVE_ALLOWANCE_DAYS ?? "20",
  10
);
