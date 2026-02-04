import { NextRequest, NextResponse } from "next/server";
import { ok } from "@/lib/api-response";
import { requireRoleApi } from "@/lib/api-auth";
import { handleApiError } from "@/lib/api-errors";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireRoleApi("admin", "manager");

    if (user instanceof NextResponse) {
      return user;
    }

    const { id } = await params;
    const searchParams = req.nextUrl.searchParams;
    const fromParam = searchParams.get("from");
    const toParam = searchParams.get("to");

    // Check if target user exists
    const targetUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!targetUser) {
      return ok([]);
    }

    let from: Date | undefined;
    let to: Date | undefined;

    if (fromParam && toParam) {
      from = new Date(fromParam);
      to = new Date(toParam);
    }

    // Build query
    const where: any = {
      userId: id,
    };

    if (from && to) {
      where.startTime = {
        gte: from,
        lte: to,
      };
    }

    // Get all time sessions for the user
    const sessions = await prisma.timeSession.findMany({
      where,
      include: {
        breakSessions: {
          orderBy: {
            startTime: "asc",
          },
        },
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
