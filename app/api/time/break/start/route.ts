import { NextRequest, NextResponse } from "next/server";
import { ok, fail } from "@/lib/api-response";
import { requireAuthApi } from "@/lib/api-auth";
import { handleApiError } from "@/lib/api-errors";
import { prisma } from "@/lib/prisma";
import { TimeSessionStatus, BreakType } from "@prisma/client";

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
        "No active time session found. Please clock in first.",
        undefined,
        422
      );
    }

    // Check for active break
    const activeBreak = session.breakSessions.find(
      (breakSession) => breakSession.endTime === null
    );

    if (activeBreak) {
      return fail(
        "VALIDATION_ERROR",
        "You already have an active break",
        { activeBreakId: activeBreak.id },
        422
      );
    }

    // Create new break session
    const breakSession = await prisma.breakSession.create({
      data: {
        timeSessionId: session.id,
        startTime: new Date(),
        type: BreakType.REST,
      },
    });

    return ok(breakSession, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
