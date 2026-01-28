import { NextRequest, NextResponse } from "next/server";
import { ok } from "@/lib/api-response";
import { requireAuthApi } from "@/lib/api-auth";
import { handleApiError } from "@/lib/api-errors";
import { prisma } from "@/lib/prisma";
import { getWeekBounds } from "@/lib/time-helpers";

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuthApi();
    
    if (user instanceof NextResponse) {
      return user; // Return error response
    }

    // Parse query parameters
    const searchParams = req.nextUrl.searchParams;
    const fromParam = searchParams.get("from");
    const toParam = searchParams.get("to");

    let from: Date;
    let to: Date;

    if (fromParam && toParam) {
      from = new Date(fromParam);
      to = new Date(toParam);
    } else {
      // Default to current week (Monday-Sunday)
      const bounds = getWeekBounds(new Date());
      from = bounds.start;
      to = bounds.end;
    }

    // Query time sessions for the user within the date range
    const sessions = await prisma.timeSession.findMany({
      where: {
        userId: user.id,
        startTime: {
          gte: from,
          lte: to,
        },
      },
      include: {
        breakSessions: true,
      },
      orderBy: {
        startTime: "desc",
      },
    });

    return ok(sessions);
  } catch (error) {
    return handleApiError(error);
  }
}
