import { ok } from "@/lib/api-response";
import { handleApiError } from "@/lib/api-errors";

export async function GET() {
  try {
    return ok({ status: "ok" });
  } catch (error) {
    return handleApiError(error);
  }
}
