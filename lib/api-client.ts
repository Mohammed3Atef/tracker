import type { ApiResponse } from "./api-response";

export class ApiError extends Error {
  constructor(
    public code: string,
    message: string,
    public details?: any,
    public status?: number
  ) {
    super(message);
    this.name = "ApiError";
  }
}

interface RequestOptions extends RequestInit {
  skipAuth?: boolean;
}

/**
 * Parse API response and throw typed error if unsuccessful
 */
async function parseResponse<T>(response: Response): Promise<T> {
  const data: ApiResponse<T> = await response.json();

  if (!data.success) {
    throw new ApiError(
      data.error.code,
      data.error.message,
      data.error.details,
      response.status
    );
  }

  return data.data;
}

/**
 * Get authentication headers
 */
function getAuthHeaders(): HeadersInit {
  // In a real app, you might get the token from cookies or session
  // For Next.js with NextAuth, cookies are automatically sent with fetch
  return {
    "Content-Type": "application/json",
  };
}

/**
 * GET request
 */
export async function apiGet<T>(
  url: string,
  options: RequestOptions = {}
): Promise<T> {
  const { skipAuth, ...fetchOptions } = options;

  const response = await fetch(url, {
    method: "GET",
    headers: skipAuth ? { "Content-Type": "application/json" } : getAuthHeaders(),
    ...fetchOptions,
  });

  if (!response.ok && response.status !== 200) {
    // Try to parse error response
    try {
      return await parseResponse<T>(response);
    } catch (error) {
      // If parsing fails, throw generic error
      throw new ApiError(
        "HTTP_ERROR",
        `Request failed with status ${response.status}`,
        undefined,
        response.status
      );
    }
  }

  return parseResponse<T>(response);
}

/**
 * POST request
 */
export async function apiPost<T>(
  url: string,
  body?: any,
  options: RequestOptions = {}
): Promise<T> {
  const { skipAuth, ...fetchOptions } = options;

  const response = await fetch(url, {
    method: "POST",
    headers: skipAuth ? { "Content-Type": "application/json" } : getAuthHeaders(),
    body: body ? JSON.stringify(body) : undefined,
    ...fetchOptions,
  });

  if (!response.ok && response.status !== 200 && response.status !== 201) {
    try {
      return await parseResponse<T>(response);
    } catch (error) {
      throw new ApiError(
        "HTTP_ERROR",
        `Request failed with status ${response.status}`,
        undefined,
        response.status
      );
    }
  }

  return parseResponse<T>(response);
}

/**
 * PATCH request
 */
export async function apiPatch<T>(
  url: string,
  body?: any,
  options: RequestOptions = {}
): Promise<T> {
  const { skipAuth, ...fetchOptions } = options;

  const response = await fetch(url, {
    method: "PATCH",
    headers: skipAuth ? { "Content-Type": "application/json" } : getAuthHeaders(),
    body: body ? JSON.stringify(body) : undefined,
    ...fetchOptions,
  });

  if (!response.ok && response.status !== 200) {
    try {
      return await parseResponse<T>(response);
    } catch (error) {
      throw new ApiError(
        "HTTP_ERROR",
        `Request failed with status ${response.status}`,
        undefined,
        response.status
      );
    }
  }

  return parseResponse<T>(response);
}

/**
 * DELETE request
 */
export async function apiDelete<T>(
  url: string,
  options: RequestOptions = {}
): Promise<T> {
  const { skipAuth, ...fetchOptions } = options;

  const response = await fetch(url, {
    method: "DELETE",
    headers: skipAuth ? { "Content-Type": "application/json" } : getAuthHeaders(),
    ...fetchOptions,
  });

  if (!response.ok && response.status !== 200 && response.status !== 204) {
    try {
      return await parseResponse<T>(response);
    } catch (error) {
      throw new ApiError(
        "HTTP_ERROR",
        `Request failed with status ${response.status}`,
        undefined,
        response.status
      );
    }
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return undefined as T;
  }

  return parseResponse<T>(response);
}
