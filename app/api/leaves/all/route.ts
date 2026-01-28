import { NextRequest, NextResponse } from "next/server";
import { ok } from "@/lib/api-response";
import { requireRoleApi } from "@/lib/api-auth";
import { handleApiError } from "@/lib/api-errors";
import { prisma } from "@/lib/prisma";
import { LeaveRequestStatus, LeaveRequestType } from "@prisma/client";

export async function GET(req: NextRequest) {
  try {
    const user = await requireRoleApi("admin", "manager");

    if (user instanceof NextResponse) {
      return user;
    }

    const searchParams = req.nextUrl.searchParams;
    const statusParam = searchParams.get("status");
    const userIdParam = searchParams.get("userId");
    const typeParam = searchParams.get("type");
    const fromParam = searchParams.get("from");
    const toParam = searchParams.get("to");

    // Build where clause
    const where: any = {};

    // Filter by status
    if (statusParam && Object.values(LeaveRequestStatus).includes(statusParam as LeaveRequestStatus)) {
      where.status = statusParam as LeaveRequestStatus;
    }

    // Filter by user
    if (userIdParam) {
      where.userId = userIdParam;
    }

    // Filter by type
    if (typeParam && Object.values(LeaveRequestType).includes(typeParam as LeaveRequestType)) {
      where.type = typeParam as LeaveRequestType;
    }

    // Filter by date range
    if (fromParam || toParam) {
      where.OR = [];
      
      if (fromParam && toParam) {
        const from = new Date(fromParam);
        const to = new Date(toParam);
        to.setHours(23, 59, 59, 999);
        
        where.OR.push(
          {
            startDate: {
              gte: from,
              lte: to,
            },
          },
          {
            endDate: {
              gte: from,
              lte: to,
            },
          },
          {
            AND: [
              {
                startDate: {
                  lte: from,
                },
              },
              {
                endDate: {
                  gte: to,
                },
              },
            ],
          }
        );
      } else if (fromParam) {
        const from = new Date(fromParam);
        where.OR.push({
          endDate: {
            gte: from,
          },
        });
      } else if (toParam) {
        const to = new Date(toParam);
        to.setHours(23, 59, 59, 999);
        where.OR.push({
          startDate: {
            lte: to,
          },
        });
      }
    }

    // Query leave requests
    const leaveRequests = await prisma.leaveRequest.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            profile: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return ok(leaveRequests);
  } catch (error) {
    return handleApiError(error);
  }
}
