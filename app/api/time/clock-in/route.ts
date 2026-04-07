import { NextRequest, NextResponse } from "next/server";
import { ok, fail } from "@/lib/api-response";
import { requireAuthApi } from "@/lib/api-auth";
import { handleApiError } from "@/lib/api-errors";
import { prisma } from "@/lib/prisma";
import { TimeSessionStatus } from "@prisma/client";
import { calculateDuration } from "@/lib/time-helpers";

export async function POST(_req: NextRequest) {
  try {
    const user = await requireAuthApi();

    if (user instanceof NextResponse) {
      return user;
    }

    const now = new Date();

    // Find any active or paused sessions
    const activeSessions = await prisma.timeSession.findMany({
      where: {
        userId: user.id,
        status: {
          in: [TimeSessionStatus.ACTIVE, TimeSessionStatus.PAUSED],
        },
      },
      include: { breakSessions: true },
    });

    if (activeSessions.length > 0) {
      // Check if any are from today
      const todayStart = new Date(now);
      todayStart.setHours(0, 0, 0, 0);

      const todaySessions = activeSessions.filter(
        (s) => new Date(s.startTime) >= todayStart
      );
      const staleSessions = activeSessions.filter(
        (s) => new Date(s.startTime) < todayStart
      );

      // Auto-complete orphaned sessions from previous days
      if (staleSessions.length > 0) {
        await Promise.all(
          staleSessions.map(async (session) => {
            // End any open breaks first
            const openBreak = session.breakSessions.find((b) => !b.endTime);
            if (openBreak) {
              const breakEnd = session.endTime
                ? new Date(session.endTime)
                : new Date(openBreak.startTime);
              const breakDuration = calculateDuration(
                new Date(openBreak.startTime),
                breakEnd
              );
              await prisma.breakSession.update({
                where: { id: openBreak.id },
                data: { endTime: breakEnd, duration: breakDuration },
              });
            }

            // Complete the stale session — set endTime to end of that day
            const sessionDate = new Date(session.startTime);
            const endOfDay = new Date(sessionDate);
            endOfDay.setHours(23, 59, 59, 0);

            const totalBreakMins = session.breakSessions.reduce(
              (sum, b) => sum + (b.duration ?? 0),
              0
            );
            const rawDuration = calculateDuration(
              new Date(session.startTime),
              endOfDay
            );
            const workDuration = Math.max(0, rawDuration - totalBreakMins);

            return prisma.timeSession.update({
              where: { id: session.id },
              data: {
                endTime: endOfDay,
                duration: workDuration,
                status: TimeSessionStatus.COMPLETED,
              },
            });
          })
        );
      }

      // If there's still an active session from today, reject
      if (todaySessions.length > 0) {
        return fail(
          "VALIDATION_ERROR",
          "You already have an active time session",
          { existingSessionId: todaySessions[0].id },
          422
        );
      }
    }

    // Create new time session
    const session = await prisma.timeSession.create({
      data: {
        userId: user.id,
        startTime: now,
        status: TimeSessionStatus.ACTIVE,
      },
      include: {
        breakSessions: true,
      },
    });

    return ok(session, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
