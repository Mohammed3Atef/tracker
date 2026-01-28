import { NextRequest, NextResponse } from "next/server";
import { ok, fail } from "@/lib/api-response";
import { requireRoleApi } from "@/lib/api-auth";
import { handleApiError } from "@/lib/api-errors";
import { prisma } from "@/lib/prisma";
import { LeaveRequestStatus } from "@prisma/client";
import { z } from "zod";

const rejectRequestSchema = z.object({
  rejectionReason: z.string().optional(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireRoleApi("admin", "manager");
    
    if (user instanceof NextResponse) {
      return user; // Return error response
    }

    const { id } = await params;

    // Parse request body
    const body = await req.json();
    const { rejectionReason } = rejectRequestSchema.parse(body);

    // Find the leave request
    const leaveRequest = await prisma.leaveRequest.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
          },
        },
      },
    });

    if (!leaveRequest) {
      return fail(
        "NOT_FOUND",
        "Leave request not found",
        undefined,
        404
      );
    }

    // Check if request is pending
    if (leaveRequest.status !== LeaveRequestStatus.PENDING) {
      return fail(
        "VALIDATION_ERROR",
        "Only pending requests can be rejected",
        { currentStatus: leaveRequest.status },
        422
      );
    }

    // Reject the leave request
    const rejectedRequest = await prisma.leaveRequest.update({
      where: { id },
      data: {
        status: LeaveRequestStatus.REJECTED,
        rejectionReason: rejectionReason || null,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
          },
        },
      },
    });

    return ok(rejectedRequest);
  } catch (error) {
    return handleApiError(error);
  }
}
