import { z } from "zod";
import { LeaveRequestType } from "@prisma/client";
import { parseDateFromInput } from "./timezone-helpers";

/**
 * Zod schema for leave request validation
 */
export const leaveRequestSchema = z.object({
  startDate: z.string().refine(
    (date) => {
      const parsed = new Date(date);
      return !isNaN(parsed.getTime());
    },
    { message: "Invalid start date" }
  ),
  endDate: z.string().refine(
    (date) => {
      const parsed = new Date(date);
      return !isNaN(parsed.getTime());
    },
    { message: "Invalid end date" }
  ),
  type: z.nativeEnum(LeaveRequestType),
  reason: z.string().optional(),
}).refine(
  (data) => {
    const start = new Date(data.startDate);
    const end = new Date(data.endDate);
    return start <= end;
  },
  {
    message: "Start date must be before or equal to end date",
    path: ["endDate"],
  }
);

export type LeaveRequestInput = z.infer<typeof leaveRequestSchema>;

/**
 * Check if two date ranges overlap
 * @param start1 - Start date of first range
 * @param end1 - End date of first range
 * @param start2 - Start date of second range
 * @param end2 - End date of second range
 * @returns true if ranges overlap
 */
export function dateRangesOverlap(
  start1: Date,
  end1: Date,
  start2: Date,
  end2: Date
): boolean {
  // Two ranges overlap if: start1 <= end2 && end1 >= start2
  return start1 <= end2 && end1 >= start2;
}

/**
 * Parse and validate leave request dates
 * @param startDateString - Start date string
 * @param endDateString - End date string
 * @returns Parsed dates in UTC
 */
export function parseLeaveDates(
  startDateString: string,
  endDateString: string
): { startDate: Date; endDate: Date } {
  const startDate = parseDateFromInput(startDateString);
  const endDate = parseDateFromInput(endDateString);
  
  return { startDate, endDate };
}
