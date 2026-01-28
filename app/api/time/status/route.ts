import { NextRequest, NextResponse } from "next/server";
import { ok } from "@/lib/api-response";
import { requireAuthApi } from "@/lib/api-auth";
import { handleApiError } from "@/lib/api-errors";
import { prisma } from "@/lib/prisma";
import { TimeSessionStatus } from "@prisma/client";
import { calculateDuration } from "@/lib/time-helpers";

export async function GET(req: NextRequest) {
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

    let activeBreak = null;
    if (session) {
      // Find active break if session exists
      activeBreak = session.breakSessions.find(
        (breakSession) => breakSession.endTime === null
      ) || null;
    }

    // Calculate total worked today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todaySessions = await prisma.timeSession.findMany({
      where: {
        userId: user.id,
        startTime: {
          gte: today,
          lt: tomorrow,
        },
        status: TimeSessionStatus.COMPLETED,
      },
      include: {
        breakSessions: true,
      },
    });

    // Sum up durations from completed sessions today
    let totalWorkedToday = todaySessions.reduce((total, session) => {
      return total + (session.duration || 0);
    }, 0);

    // If there's an active session, add its current duration (excluding breaks)
    if (session) {
      const now = new Date();
      const totalBreakDuration = session.breakSessions.reduce((total, breakSession) => {
        if (breakSession.duration !== null) {
          return total + breakSession.duration;
        } else if (breakSession.endTime === null) {
          // Active break - calculate current duration
          return total + calculateDuration(breakSession.startTime, now);
        }
        return total;
      }, 0);

      const totalDuration = calculateDuration(session.startTime, now);
      const workDuration = totalDuration - totalBreakDuration;
      totalWorkedToday += workDuration;
    }

    return ok({
      hasActiveSession: !!session,
      session: session,
      activeBreak: activeBreak,
      totalWorkedToday: totalWorkedToday,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
