/**
 * Payroll calculation utility functions
 */

import { getAppTimezone } from "./timezone-helpers";
import { calculateDuration } from "./time-helpers";

/**
 * TimeSession type for payroll calculations
 */
export interface PayrollTimeSession {
  id: string;
  userId: string;
  startTime: Date;
  endTime: Date | null;
  duration: number | null; // Duration in minutes
  status: string;
  breakSessions: Array<{
    id: string;
    duration: number | null; // Duration in minutes
    startTime: Date;
    endTime: Date | null;
  }>;
}

/**
 * LeaveRequest type for payroll calculations
 */
export interface PayrollLeaveRequest {
  startDate: Date;
  endDate: Date;
  type: string;
  status: string;
}

/**
 * Get month boundaries in UTC for a given month string (YYYY-MM) and timezone
 * @param month - Month string in YYYY-MM format
 * @param timezone - Timezone string (e.g., "America/New_York") - used for reference, dates are in UTC
 * @returns Object with start and end Date objects in UTC
 */
export function getMonthBounds(month: string, timezone: string): { start: Date; end: Date } {
  // Parse YYYY-MM format
  const [year, monthNum] = month.split("-").map(Number);
  
  if (isNaN(year) || isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
    throw new Error(`Invalid month format: ${month}. Expected YYYY-MM`);
  }

  // Create start date: first day of month at 00:00:00 UTC
  // The timezone parameter is kept for future use if more precise timezone handling is needed
  const start = new Date(Date.UTC(year, monthNum - 1, 1, 0, 0, 0, 0));
  
  // Calculate end date: last day of month at 23:59:59.999 UTC
  const lastDay = new Date(year, monthNum, 0).getDate(); // Get last day of month
  const end = new Date(Date.UTC(year, monthNum - 1, lastDay, 23, 59, 59, 999));

  return { start, end };
}

/**
 * Calculate worked minutes for a specific date from time sessions
 * @param sessions - Array of time sessions
 * @param date - Date to calculate for
 * @returns Total worked minutes for the date (excluding breaks)
 */
export function calculateDailyWorkedMinutes(
  sessions: PayrollTimeSession[],
  date: Date
): number {
  // Normalize date to start of day for comparison
  const targetDate = new Date(date);
  targetDate.setHours(0, 0, 0, 0);
  const nextDay = new Date(targetDate);
  nextDay.setDate(nextDay.getDate() + 1);

  let totalMinutes = 0;

  for (const session of sessions) {
    const sessionStart = new Date(session.startTime);
    
    // Check if session overlaps with the target date
    if (sessionStart >= targetDate && sessionStart < nextDay) {
      let sessionMinutes = 0;

      if (session.duration !== null) {
        // Use stored duration if available
        sessionMinutes = session.duration;
      } else if (session.endTime) {
        // Calculate from start/end times
        sessionMinutes = calculateDuration(session.startTime, session.endTime);
      } else {
        // Active session - skip for monthly totals (only COMPLETED sessions)
        continue;
      }

      // Subtract break time
      const breakMinutes = session.breakSessions.reduce((sum, breakSession) => {
        if (breakSession.duration !== null) {
          return sum + breakSession.duration;
        } else if (breakSession.endTime) {
          return sum + calculateDuration(breakSession.startTime, breakSession.endTime);
        }
        return sum;
      }, 0);

      sessionMinutes -= breakMinutes;
      totalMinutes += Math.max(0, sessionMinutes); // Ensure non-negative
    }
  }

  return totalMinutes;
}

/**
 * Calculate overtime minutes for a day (minutes beyond 8 hours)
 * @param dailyMinutes - Total worked minutes for the day
 * @returns Overtime minutes (0 if less than 8 hours)
 */
export function calculateOvertimeMinutes(dailyMinutes: number): number {
  const standardHours = 8;
  const standardMinutes = standardHours * 60; // 480 minutes
  
  if (dailyMinutes <= standardMinutes) {
    return 0;
  }
  
  return dailyMinutes - standardMinutes;
}

/**
 * Count paid and unpaid leave days for a date range
 * @param leaves - Array of leave requests
 * @param startDate - Start date of the period
 * @param endDate - End date of the period
 * @returns Object with paid and unpaid leave day counts
 */
export function countLeaveDays(
  leaves: PayrollLeaveRequest[],
  startDate: Date,
  endDate: Date
): { paid: number; unpaid: number } {
  const paidTypes = ["VACATION", "SICK"];
  const unpaidTypes = ["UNPAID", "PERSONAL", "MATERNITY", "PATERNITY", "OTHER"];
  
  let paidDays = 0;
  let unpaidDays = 0;

  // Normalize dates
  const periodStart = new Date(startDate);
  periodStart.setHours(0, 0, 0, 0);
  const periodEnd = new Date(endDate);
  periodEnd.setHours(23, 59, 59, 999);

  for (const leave of leaves) {
    // Only count APPROVED leaves
    if (leave.status !== "APPROVED") {
      continue;
    }

    const leaveStart = new Date(leave.startDate);
    leaveStart.setHours(0, 0, 0, 0);
    const leaveEnd = new Date(leave.endDate);
    leaveEnd.setHours(23, 59, 59, 999);

    // Check if leave overlaps with the period
    if (leaveEnd < periodStart || leaveStart > periodEnd) {
      continue;
    }

    // Calculate overlap
    const overlapStart = leaveStart > periodStart ? leaveStart : periodStart;
    const overlapEnd = leaveEnd < periodEnd ? leaveEnd : periodEnd;

    // Count days in overlap (inclusive)
    const daysDiff = Math.ceil((overlapEnd.getTime() - overlapStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    if (paidTypes.includes(leave.type)) {
      paidDays += daysDiff;
    } else if (unpaidTypes.includes(leave.type)) {
      unpaidDays += daysDiff;
    }
  }

  return { paid: paidDays, unpaid: unpaidDays };
}

/**
 * Get all days in a month as Date objects
 * @param month - Month string in YYYY-MM format
 * @param timezone - Timezone string
 * @returns Array of Date objects for each day of the month
 */
export function getDaysInMonth(month: string, timezone: string): Date[] {
  const [year, monthNum] = month.split("-").map(Number);
  const days: Date[] = [];
  const lastDay = new Date(year, monthNum, 0).getDate();

  for (let day = 1; day <= lastDay; day++) {
    const dateStr = `${year}-${String(monthNum).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    // Create date in the timezone, then convert to UTC
    const date = new Date(`${dateStr}T00:00:00`);
    days.push(date);
  }

  return days;
}
