import { NextRequest, NextResponse } from "next/server";
import { ok, fail } from "@/lib/api-response";
import { requireRoleApi } from "@/lib/api-auth";
import { handleApiError } from "@/lib/api-errors";
import { prisma } from "@/lib/prisma";
import { TimeSessionStatus, LeaveRequestStatus } from "@prisma/client";
import {
  getMonthBounds,
  calculateDailyWorkedMinutes,
  calculateOvertimeMinutes,
  countLeaveDays,
  getDaysInMonth,
  type PayrollTimeSession,
  type PayrollLeaveRequest,
} from "@/lib/payroll-helpers";
import { getAppTimezone } from "@/lib/timezone-helpers";

export interface DailyBreakdown {
  date: string; // YYYY-MM-DD
  workedMinutes: number;
  overtimeMinutes: number;
  hasPaidLeave: boolean;
  hasUnpaidLeave: boolean;
}

export interface EmployeePayrollSummary {
  userId: string;
  email: string;
  name?: string;
  totalWorkedMinutes: number;
  overtimeMinutes: number;
  paidLeaveDays: number;
  unpaidLeaveDays: number;
  dailyBreakdown: DailyBreakdown[];
}

export interface PayrollPreviewResponse {
  month: string; // YYYY-MM
  employees: EmployeePayrollSummary[];
}

export async function GET(req: NextRequest) {
  try {
    const user = await requireRoleApi("admin", "manager");

    if (user instanceof NextResponse) {
      return user; // Return error response
    }

    // Parse month parameter (YYYY-MM format)
    const searchParams = req.nextUrl.searchParams;
    const monthParam = searchParams.get("month");

    let month: string;
    if (monthParam) {
      // Validate format
      const monthRegex = /^\d{4}-\d{2}$/;
      if (!monthRegex.test(monthParam)) {
        return fail(
          "VALIDATION_ERROR",
          "Invalid month format. Expected YYYY-MM",
          { provided: monthParam },
          400
        );
      }
      month = monthParam;
    } else {
      // Default to current month
      const now = new Date();
      month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    }

    // Get timezone
    const timezone = getAppTimezone();

    // Calculate month boundaries
    const { start: monthStart, end: monthEnd } = getMonthBounds(month, timezone);

    // Get all users (employees)
    const users = await prisma.user.findMany({
      include: {
        profile: {
          select: {
            firstName: true,
            lastName: true,
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

    // Filter to employees only (exclude admin/manager roles if needed, or include all)
    // For now, include all users - can be filtered later if needed
    const employees = users.filter((u) => {
      const roleName = u.role.name.toLowerCase();
      return roleName === "employee" || roleName === "admin" || roleName === "manager";
    });

    const employeeSummaries: EmployeePayrollSummary[] = [];

    // Process each employee
    for (const employee of employees) {
      // Query time sessions for the month (only COMPLETED)
      const timeSessions = await prisma.timeSession.findMany({
        where: {
          userId: employee.id,
          startTime: {
            gte: monthStart,
            lte: monthEnd,
          },
          status: TimeSessionStatus.COMPLETED,
        },
        include: {
          breakSessions: {
            select: {
              id: true,
              startTime: true,
              endTime: true,
              duration: true,
            },
          },
        },
        orderBy: {
          startTime: "asc",
        },
      });

      // Query leave requests for the month (only APPROVED)
      const leaveRequests = await prisma.leaveRequest.findMany({
        where: {
          userId: employee.id,
          status: LeaveRequestStatus.APPROVED,
          OR: [
            {
              startDate: {
                gte: monthStart,
                lte: monthEnd,
              },
            },
            {
              endDate: {
                gte: monthStart,
                lte: monthEnd,
              },
            },
            {
              AND: [
                {
                  startDate: {
                    lte: monthStart,
                  },
                },
                {
                  endDate: {
                    gte: monthEnd,
                  },
                },
              ],
            },
          ],
        },
        select: {
          startDate: true,
          endDate: true,
          type: true,
          status: true,
        },
      });

      // Convert to PayrollTimeSession format
      const payrollSessions: PayrollTimeSession[] = timeSessions.map((session) => ({
        id: session.id,
        userId: session.userId,
        startTime: session.startTime,
        endTime: session.endTime,
        duration: session.duration,
        status: session.status,
        breakSessions: session.breakSessions.map((breakSession) => ({
          id: breakSession.id,
          duration: breakSession.duration,
          startTime: breakSession.startTime,
          endTime: breakSession.endTime,
        })),
      }));

      // Convert to PayrollLeaveRequest format
      const payrollLeaves: PayrollLeaveRequest[] = leaveRequests.map((leave) => ({
        startDate: leave.startDate,
        endDate: leave.endDate,
        type: leave.type,
        status: leave.status,
      }));

      // Calculate total worked minutes
      let totalWorkedMinutes = 0;
      for (const session of payrollSessions) {
        if (session.duration !== null) {
          // Subtract break time
          const breakMinutes = session.breakSessions.reduce((sum, breakSession) => {
            return sum + (breakSession.duration || 0);
          }, 0);
          totalWorkedMinutes += session.duration - breakMinutes;
        }
      }

      // Calculate leave days
      const { paid: paidLeaveDays, unpaid: unpaidLeaveDays } = countLeaveDays(
        payrollLeaves,
        monthStart,
        monthEnd
      );

      // Build daily breakdown
      const daysInMonth = getDaysInMonth(month, timezone);
      const dailyBreakdown: DailyBreakdown[] = [];

      let totalOvertimeMinutes = 0;

      for (const day of daysInMonth) {
        const dailyMinutes = calculateDailyWorkedMinutes(payrollSessions, day);
        const overtimeMinutes = calculateOvertimeMinutes(dailyMinutes);
        totalOvertimeMinutes += overtimeMinutes;

        // Check if this day has leave
        const dayStart = new Date(day);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(day);
        dayEnd.setHours(23, 59, 59, 999);

        let hasPaidLeave = false;
        let hasUnpaidLeave = false;

        for (const leave of payrollLeaves) {
          const leaveStart = new Date(leave.startDate);
          leaveStart.setHours(0, 0, 0, 0);
          const leaveEnd = new Date(leave.endDate);
          leaveEnd.setHours(23, 59, 59, 999);

          // Check if day overlaps with leave
          if (dayStart <= leaveEnd && dayEnd >= leaveStart) {
            if (leave.type === "VACATION" || leave.type === "SICK") {
              hasPaidLeave = true;
            } else {
              hasUnpaidLeave = true;
            }
          }
        }

        dailyBreakdown.push({
          date: day.toISOString().split("T")[0], // YYYY-MM-DD
          workedMinutes: dailyMinutes,
          overtimeMinutes,
          hasPaidLeave,
          hasUnpaidLeave,
        });
      }

      // Build employee name
      const name =
        employee.profile?.firstName && employee.profile?.lastName
          ? `${employee.profile.firstName} ${employee.profile.lastName}`
          : undefined;

      employeeSummaries.push({
        userId: employee.id,
        email: employee.email,
        name,
        totalWorkedMinutes,
        overtimeMinutes: totalOvertimeMinutes,
        paidLeaveDays,
        unpaidLeaveDays,
        dailyBreakdown,
      });
    }

    const response: PayrollPreviewResponse = {
      month,
      employees: employeeSummaries,
    };

    return ok(response);
  } catch (error) {
    return handleApiError(error);
  }
}
