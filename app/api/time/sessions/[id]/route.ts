import { NextRequest, NextResponse } from "next/server";
import { ok, fail } from "@/lib/api-response";
import { requireRoleApi } from "@/lib/api-auth";
import { handleApiError } from "@/lib/api-errors";
import { prisma } from "@/lib/prisma";
import { TimeSessionStatus } from "@prisma/client";
import { calculateDuration } from "@/lib/time-helpers";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireRoleApi("admin");

    if (user instanceof NextResponse) {
      return user;
    }

    const { id } = await params;
    const body = await req.json();
    const {
      startTime,
      endTime,
      notes,
    }: {
      startTime?: string;
      endTime?: string | null;
      notes?: string;
    } = body;

    // Check if session exists
    const session = await prisma.timeSession.findUnique({
      where: { id },
      include: {
        breakSessions: true,
      },
    });

    if (!session) {
      return fail("NOT_FOUND", "Time session not found", undefined, 404);
    }

    // Prepare update data
    const updateData: any = {};

    if (startTime !== undefined) {
      updateData.startTime = new Date(startTime);
    }

    if (endTime !== undefined) {
      updateData.endTime = endTime ? new Date(endTime) : null;
      // If endTime is set, mark as completed
      if (endTime) {
        updateData.status = TimeSessionStatus.COMPLETED;
      }
    }

    if (notes !== undefined) {
      updateData.notes = notes;
    }

    // Recalculate duration if startTime or endTime changed
    if (startTime !== undefined || endTime !== undefined) {
      const finalStartTime = startTime ? new Date(startTime) : session.startTime;
      const finalEndTime = endTime !== undefined
        ? (endTime ? new Date(endTime) : null)
        : session.endTime;

      if (finalEndTime) {
        // Calculate total break duration
        const totalBreakDuration = session.breakSessions.reduce((total, breakSession) => {
          if (breakSession.duration !== null) {
            return total + breakSession.duration;
          } else if (breakSession.endTime) {
            return (
              total +
              calculateDuration(
                new Date(breakSession.startTime),
                new Date(breakSession.endTime)
              )
            );
          }
          return total;
        }, 0);

        // Calculate work duration
        const totalDuration = calculateDuration(finalStartTime, finalEndTime);
        const workDuration = totalDuration - totalBreakDuration;
        updateData.duration = Math.max(0, workDuration);
      } else {
        // Active session - clear duration
        updateData.duration = null;
      }
    }

    // Update session
    const updatedSession = await prisma.timeSession.update({
      where: { id },
      data: updateData,
      include: {
        breakSessions: {
          orderBy: {
            startTime: "asc",
          },
        },
      },
    });

    return ok(updatedSession);
  } catch (error) {
    return handleApiError(error);
  }
}
