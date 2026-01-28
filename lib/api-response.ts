import { NextResponse } from "next/server";

export type ApiResponse<T> =
  | { success: true; data: T }
  | { success: false; error: ApiError };

export interface ApiError {
  code: string;
  message: string;
  details?: any;
}

/**
 * Create a successful API response
 */
export function ok<T>(data: T, status: number = 200): NextResponse<ApiResponse<T>> {
  return NextResponse.json(
    { success: true, data },
    { status }
  );
}

/**
 * Create a failed API response
 */
export function fail(
  code: string,
  message: string,
  details?: any,
  status: number = 400
): NextResponse<ApiResponse<never>> {
  return NextResponse.json(
    { success: false, error: { code, message, details } },
    { status }
  );
}
