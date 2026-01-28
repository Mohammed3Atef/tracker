"use client";

import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api-client";

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

export function usePayrollPreview(month?: string) {
  // Default to current month if not provided
  const monthParam = month || (() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  })();

  return useQuery<PayrollPreviewResponse>({
    queryKey: ["payroll", "preview", monthParam],
    queryFn: () => {
      const params = new URLSearchParams();
      params.append("month", monthParam);
      return apiGet<PayrollPreviewResponse>(`/api/payroll/preview?${params.toString()}`);
    },
    enabled: !!monthParam,
  });
}
