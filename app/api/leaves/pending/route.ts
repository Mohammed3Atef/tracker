import { NextRequest, NextResponse } from "next/server";
import { ok } from "@/lib/api-response";
import { requireRoleApi } from "@/lib/api-auth";
import { handleApiError } from "@/lib/api-errors";
import { prisma } from "@/lib/prisma";
import { LeaveRequestStatus } from "@prisma/client";

export async function GET(req: NextRequest) {
  try {
    const user = await requireRoleApi("admin", "manager");
    
    if (user instanceof NextResponse) {
      return user; // Return error response
    }

    // Query pending leave requests
    const pendingRequests = await prisma.leaveRequest.findMany({
      where: {
        status: LeaveRequestStatus.PENDING,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: "asc", // Oldest first
      },
    });

    return ok(pendingRequests);
  } catch (error) {
    return handleApiError(error);
  }
}
