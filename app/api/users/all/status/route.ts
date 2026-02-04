import { NextRequest, NextResponse } from "next/server";
import { ok } from "@/lib/api-response";
import { requireRoleApi } from "@/lib/api-auth";
import { handleApiError } from "@/lib/api-errors";
import { prisma } from "@/lib/prisma";
import { TimeSessionStatus } from "@prisma/client";
import { calculateDuration } from "@/lib/time-helpers";

export async function GET(req: NextRequest) {
  try {
    const user = await requireRoleApi("admin", "manager");

    if (user instanceof NextResponse) {
      return user;
    }

    // Get all users with their profiles
    const users = await prisma.user.findMany({
      include: {
        profile: {
          select: {
            firstName: true,
            lastName: true,
            department: true,
            position: true,
          },
        },
        role: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        email: "asc",
      },
    });

    // Calculate today's date range
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get all active sessions with ALL breaks (not just active ones)
    const activeSessions = await prisma.timeSession.findMany({
      where: {
        status: {
          in: [TimeSessionStatus.ACTIVE, TimeSessionStatus.PAUSED],
        },
      },
      include: {
        breakSessions: true, // Get all breaks, not just active ones
        user: {
          select: {
            id: true,
            email: true,
          },
        },
      },
    });

    // Get today's completed sessions for all users
    const todaySessions = await prisma.timeSession.findMany({
      where: {
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

    // Group today's sessions by user
    const todaySessionsByUser = todaySessions.reduce(
      (acc, session) => {
        if (!acc[session.userId]) {
          acc[session.userId] = [];
        }
        acc[session.userId].push(session);
        return acc;
      },
      {} as Record<string, typeof todaySessions>
    );

    // Get last sessions for all users in one query
    const userIds = users.map((u) => u.id);
    const lastSessions = await prisma.timeSession.findMany({
      where: {
        userId: {
          in: userIds,
        },
      },
      orderBy: {
        startTime: "desc",
      },
      select: {
        userId: true,
        startTime: true,
        endTime: true,
        status: true,
      },
      distinct: ["userId"],
    });

    const lastSessionsByUser = lastSessions.reduce(
      (acc, session) => {
        if (!acc[session.userId]) {
          acc[session.userId] = session;
        }
        return acc;
      },
      {} as Record<string, (typeof lastSessions)[0]>
    );

    // Build status array for each user
    const usersStatus = users.map((u) => {
      const activeSession = activeSessions.find((s) => s.userId === u.id);
      const hasActiveSession = !!activeSession;
      const hasActiveBreak =
        activeSession?.breakSessions && activeSession.breakSessions.length > 0;

      // Calculate total worked today
      const userTodaySessions = todaySessionsByUser[u.id] || [];
      let totalWorkedToday = userTodaySessions.reduce((total, session) => {
        return total + (session.duration || 0);
      }, 0);

      // Add active session duration if exists
      if (activeSession) {
        const now = new Date();
        const totalBreakDuration = activeSession.breakSessions.reduce(
          (total, breakSession) => {
            if (breakSession.duration !== null) {
              return total + breakSession.duration;
            } else if (breakSession.endTime === null) {
              return (
                total + calculateDuration(breakSession.startTime, now)
              );
            }
            return total;
          },
          0
        );

        const totalDuration = calculateDuration(
          activeSession.startTime,
          now
        );
        const workDuration = totalDuration - totalBreakDuration;
        totalWorkedToday += workDuration;
      }

      const lastSession = lastSessionsByUser[u.id];

      return {
        userId: u.id,
        email: u.email,
        name:
          u.profile?.firstName && u.profile?.lastName
            ? `${u.profile.firstName} ${u.profile.lastName}`
            : u.email,
        role: u.role.name,
        department: u.profile?.department || null,
        position: u.profile?.position || null,
        hasActiveSession,
        hasActiveBreak,
        totalWorkedToday,
        lastActivity: lastSession
          ? {
              startTime: lastSession.startTime,
              endTime: lastSession.endTime,
              status: lastSession.status,
            }
          : null,
      };
    });

    return ok(usersStatus);
  } catch (error) {
    return handleApiError(error);
  }
}
