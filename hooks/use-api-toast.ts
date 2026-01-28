"use client";

import { useToast } from "@/hooks/use-toast";
import { ApiError } from "@/lib/api-client";

/**
 * Client-side hook for displaying API errors as toast notifications
 * Must be used in client components only
 */
export function useApiToast() {
  const { toast } = useToast();

  const toastApiError = (error: ApiError | Error) => {
    let title = "Error";
    let description = error.message || "An unexpected error occurred";
    let variant: "default" | "destructive" = "destructive";

    // Handle ApiError with codes
    if (error instanceof ApiError) {
      switch (error.code) {
        case "VALIDATION_ERROR":
          title = "Validation Error";
          description = error.details?.errors
            ? `Please check the following: ${error.details.errors.map((e: any) => e.message).join(", ")}`
            : error.message;
          break;
        case "UNAUTHORIZED":
          title = "Authentication Required";
          description = "Please sign in to continue";
          break;
        case "FORBIDDEN":
          title = "Access Denied";
          description = "You don't have permission to perform this action";
          break;
        case "NOT_FOUND":
          title = "Not Found";
          description = "The requested resource was not found";
          break;
        case "INTERNAL_ERROR":
          title = "Server Error";
          description = "An error occurred on the server. Please try again later.";
          break;
        case "HTTP_ERROR":
          title = "Request Failed";
          description = error.message;
          break;
        default:
          title = "Error";
          description = error.message;
      }
    }

    toast({
      title,
      description,
      variant,
    });
  };

  return { toastApiError };
}
