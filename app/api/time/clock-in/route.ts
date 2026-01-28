import { NextRequest, NextResponse } from "next/server";
import { ok, fail } from "@/lib/api-response";
import { requireAuthApi } from "@/lib/api-auth";
import { handleApiError } from "@/lib/api-errors";
import { prisma } from "@/lib/prisma";
import { TimeSessionStatus } from "@prisma/client";

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuthApi();
    
    if (user instanceof NextResponse) {
      return user; // Return error response
    }

    // Check if user already has an active or paused session
    const existingSession = await prisma.timeSession.findFirst({
      where: {
        userId: user.id,
        status: {
          in: [TimeSessionStatus.ACTIVE, TimeSessionStatus.PAUSED],
        },
      },
    });

    if (existingSession) {
      return fail(
        "VALIDATION_ERROR",
        "You already have an active time session",
        { existingSessionId: existingSession.id },
        422
      );
    }

    // Create new time session
    const session = await prisma.timeSession.create({
      data: {
        userId: user.id,
        startTime: new Date(),
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
