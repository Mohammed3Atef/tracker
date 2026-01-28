import { NextRequest, NextResponse } from "next/server";
import { ok } from "@/lib/api-response";
import { requireAuthApi } from "@/lib/api-auth";
import { handleApiError } from "@/lib/api-errors";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuthApi();
    
    if (user instanceof NextResponse) {
      return user; // Return error response
    }

    // Query leave requests for the authenticated user
    const leaveRequests = await prisma.leaveRequest.findMany({
      where: {
        userId: user.id,
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
        createdAt: "desc",
      },
    });

    return ok(leaveRequests);
  } catch (error) {
    return handleApiError(error);
  }
}
