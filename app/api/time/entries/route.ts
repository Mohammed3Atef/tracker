import { NextRequest, NextResponse } from "next/server";
import { ok, fail } from "@/lib/api-response";
import { requireAuthApi, requireRoleApi } from "@/lib/api-auth";
import { handleApiError } from "@/lib/api-errors";
import { prisma } from "@/lib/prisma";
import { TimeSessionStatus } from "@prisma/client";
import { calculateDuration } from "@/lib/time-helpers";

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuthApi();

    if (user instanceof NextResponse) {
      return user;
    }

    const searchParams = req.nextUrl.searchParams;
    const fromParam = searchParams.get("from");
    const toParam = searchParams.get("to");
    const userIdParam = searchParams.get("userId"); // Admin only

    // Check if requesting another user's entries (admin only)
    const targetUserId = userIdParam && userIdParam !== user.id ? userIdParam : user.id;
    
    if (targetUserId !== user.id) {
      const adminCheck = await requireRoleApi("admin", "manager");
      if (adminCheck instanceof NextResponse) {
        return adminCheck;
      }
    }

    let from: Date | undefined;
    let to: Date | undefined;

    if (fromParam && toParam) {
      from = new Date(fromParam);
      to = new Date(toParam);
    }

    // Build query
    const where: any = {
      userId: targetUserId,
    };

    if (from && to) {
      where.startTime = {
        gte: from,
        lte: to,
      };
    }

    // Get time sessions (entries)
    const entries = await prisma.timeSession.findMany({
      where,
      include: {
        breakSessions: {
          orderBy: {
            startTime: "asc",
          },
        },
        user: {
          select: {
            id: true,
            email: true,
            profile: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
      orderBy: {
        startTime: "desc",
      },
    });

    return ok(entries);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuthApi();

    if (user instanceof NextResponse) {
      return user;
    }

    const body = await req.json();
    const {
      startTime,
      endTime,
      notes,
      userId, // Admin can create for other users
    }: {
      startTime: string;
      endTime?: string | null;
      notes?: string;
      userId?: string;
    } = body;

    if (!startTime) {
      return fail("VALIDATION_ERROR", "startTime is required", undefined, 422);
    }

    // Check if creating for another user (admin only)
    const targetUserId = userId && userId !== user.id ? userId : user.id;
    
    if (targetUserId !== user.id) {
      const adminCheck = await requireRoleApi("admin");
      if (adminCheck instanceof NextResponse) {
        return adminCheck;
      }
    }

    const start = new Date(startTime);
    const end = endTime ? new Date(endTime) : null;

    // Validate dates
    if (isNaN(start.getTime())) {
      return fail("VALIDATION_ERROR", "Invalid startTime", undefined, 422);
    }

    if (end && isNaN(end.getTime())) {
      return fail("VALIDATION_ERROR", "Invalid endTime", undefined, 422);
    }

    if (end && end <= start) {
      return fail("VALIDATION_ERROR", "endTime must be after startTime", undefined, 422);
    }

    // Check for overlapping sessions on the same day
    const startOfDay = new Date(start);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(start);
    endOfDay.setHours(23, 59, 59, 999);

    const overlappingSessions = await prisma.timeSession.findMany({
      where: {
        userId: targetUserId,
        startTime: {
          gte: startOfDay,
          lte: endOfDay,
        },
        status: {
          not: TimeSessionStatus.CANCELLED,
        },
      },
    });

    // Check for overlaps (simplified - just warn if same day has other sessions)
    // In production, you might want more sophisticated overlap detection

    // Calculate duration if end time provided
    let duration: number | null = null;
    if (end) {
      duration = calculateDuration(start, end);
    }

    // Create time session
    const session = await prisma.timeSession.create({
      data: {
        userId: targetUserId,
        startTime: start,
        endTime: end,
        duration: duration,
        status: end ? TimeSessionStatus.COMPLETED : TimeSessionStatus.ACTIVE,
        notes: notes || null,
      },
      include: {
        breakSessions: true,
        user: {
          select: {
            id: true,
            email: true,
            profile: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });

    return ok(session, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
