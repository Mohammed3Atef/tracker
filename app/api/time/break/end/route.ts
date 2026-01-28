import { NextRequest, NextResponse } from "next/server";
import { ok, fail } from "@/lib/api-response";
import { requireAuthApi } from "@/lib/api-auth";
import { handleApiError } from "@/lib/api-errors";
import { prisma } from "@/lib/prisma";
import { TimeSessionStatus } from "@prisma/client";
import { calculateDuration } from "@/lib/time-helpers";

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuthApi();
    
    if (user instanceof NextResponse) {
      return user; // Return error response
    }

    // Find open time session
    const session = await prisma.timeSession.findFirst({
      where: {
        userId: user.id,
        status: {
          in: [TimeSessionStatus.ACTIVE, TimeSessionStatus.PAUSED],
        },
      },
      include: {
        breakSessions: true,
      },
    });

    if (!session) {
      return fail(
        "VALIDATION_ERROR",
        "No active time session found",
        undefined,
        422
      );
    }

    // Find active break
    const activeBreak = session.breakSessions.find(
      (breakSession) => breakSession.endTime === null
    );

    if (!activeBreak) {
      return fail(
        "VALIDATION_ERROR",
        "No active break found",
        undefined,
        422
      );
    }

    // End the break
    const now = new Date();
    const breakDuration = calculateDuration(activeBreak.startTime, now);

    const updatedBreak = await prisma.breakSession.update({
      where: { id: activeBreak.id },
      data: {
        endTime: now,
        duration: breakDuration,
      },
    });

    return ok(updatedBreak);
  } catch (error) {
    return handleApiError(error);
  }
}
