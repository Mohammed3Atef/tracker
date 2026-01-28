import { NextRequest, NextResponse } from "next/server";
import { ok, fail } from "@/lib/api-response";
import { requireAuthApi } from "@/lib/api-auth";
import { handleApiError } from "@/lib/api-errors";
import { prisma } from "@/lib/prisma";
import { LeaveRequestStatus } from "@prisma/client";
import { leaveRequestSchema, parseLeaveDates, dateRangesOverlap } from "@/lib/leave-validation";

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuthApi();
    
    if (user instanceof NextResponse) {
      return user; // Return error response
    }

    // Parse and validate request body
    const body = await req.json();
    const validationResult = leaveRequestSchema.safeParse(body);

    if (!validationResult.success) {
      return fail(
        "VALIDATION_ERROR",
        "Invalid leave request data",
        { errors: validationResult.error.flatten().fieldErrors },
        422
      );
    }

    const { startDate: startDateStr, endDate: endDateStr, type, reason } = validationResult.data;
    const { startDate, endDate } = parseLeaveDates(startDateStr, endDateStr);

    // Check for overlapping APPROVED leaves for the same user
    const overlappingLeaves = await prisma.leaveRequest.findMany({
      where: {
        userId: user.id,
        status: LeaveRequestStatus.APPROVED,
        OR: [
          {
            AND: [
              { startDate: { lte: endDate } },
              { endDate: { gte: startDate } },
            ],
          },
        ],
      },
    });

    if (overlappingLeaves.length > 0) {
      return fail(
        "VALIDATION_ERROR",
        "You have an approved leave request that overlaps with this date range",
        { overlappingLeaves: overlappingLeaves.map((l) => ({ id: l.id, startDate: l.startDate, endDate: l.endDate })) },
        422
      );
    }

    // Create leave request
    const leaveRequest = await prisma.leaveRequest.create({
      data: {
        userId: user.id,
        startDate,
        endDate,
        type,
        reason: reason || null,
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
    });

    return ok(leaveRequest, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
