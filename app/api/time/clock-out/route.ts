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

    const now = new Date();

    // Check for active break and auto-end it if exists
    const activeBreak = session.breakSessions.find(
      (breakSession) => breakSession.endTime === null
    );

    if (activeBreak) {
      // Auto-end the active break
      const breakDuration = calculateDuration(activeBreak.startTime, now);
      await prisma.breakSession.update({
        where: { id: activeBreak.id },
        data: {
          endTime: now,
          duration: breakDuration,
        },
      });
    }

    // Calculate total break duration
    const totalBreakDuration = session.breakSessions.reduce((total, breakSession) => {
      if (breakSession.duration !== null) {
        return total + breakSession.duration;
      }
      return total;
    }, 0);

    // Calculate total session duration (excluding breaks)
    const totalDuration = calculateDuration(session.startTime, now);
    const workDuration = totalDuration - totalBreakDuration;

    // Update session to completed
    const updatedSession = await prisma.timeSession.update({
      where: { id: session.id },
      data: {
        endTime: now,
        duration: workDuration,
        status: TimeSessionStatus.COMPLETED,
      },
      include: {
        breakSessions: true,
      },
    });

    return ok(updatedSession);
  } catch (error) {
    return handleApiError(error);
  }
}
