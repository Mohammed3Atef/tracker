import { NextRequest, NextResponse } from "next/server";
import { ok, fail } from "@/lib/api-response";
import { requireRoleApi } from "@/lib/api-auth";
import { handleApiError } from "@/lib/api-errors";
import { prisma } from "@/lib/prisma";
import { LeaveRequestStatus } from "@prisma/client";
import { dateRangesOverlap } from "@/lib/leave-validation";

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
        "Only pending requests can be approved",
        { currentStatus: leaveRequest.status },
        422
      );
    }

    // Check for overlapping APPROVED leaves for the same user (excluding current request)
    const overlappingLeaves = await prisma.leaveRequest.findMany({
      where: {
        userId: leaveRequest.userId,
        status: LeaveRequestStatus.APPROVED,
        id: { not: id },
        OR: [
          {
            AND: [
              { startDate: { lte: leaveRequest.endDate } },
              { endDate: { gte: leaveRequest.startDate } },
            ],
          },
        ],
      },
    });

    if (overlappingLeaves.length > 0) {
      return fail(
        "VALIDATION_ERROR",
        "This leave request overlaps with an existing approved leave",
        { overlappingLeaves: overlappingLeaves.map((l) => ({ id: l.id, startDate: l.startDate, endDate: l.endDate })) },
        422
      );
    }

    // Approve the leave request
    const approvedRequest = await prisma.leaveRequest.update({
      where: { id },
      data: {
        status: LeaveRequestStatus.APPROVED,
        approvedBy: user.id,
        approvedAt: new Date(),
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

    return ok(approvedRequest);
  } catch (error) {
    return handleApiError(error);
  }
}
