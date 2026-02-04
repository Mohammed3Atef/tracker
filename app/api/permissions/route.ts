import { NextRequest, NextResponse } from "next/server";
import { ok } from "@/lib/api-response";
import { requireRoleApi } from "@/lib/api-auth";
import { handleApiError } from "@/lib/api-errors";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const user = await requireRoleApi("admin", "manager");

    if (user instanceof NextResponse) {
      return user;
    }

    // Get all permissions
    const permissions = await prisma.permission.findMany({
      orderBy: [
        { resource: "asc" },
        { action: "asc" },
      ],
    });

    return ok(permissions);
  } catch (error) {
    return handleApiError(error);
  }
}
