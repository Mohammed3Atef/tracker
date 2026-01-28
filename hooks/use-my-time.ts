"use client";

import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api-client";
import { TimeSession } from "./use-time-status";

export function useMyTime(from?: Date, to?: Date) {
  const fromStr = from?.toISOString();
  const toStr = to?.toISOString();

  return useQuery<TimeSession[]>({
    queryKey: ["time", "my", fromStr, toStr],
    queryFn: () => {
      const params = new URLSearchParams();
      if (fromStr) params.append("from", fromStr);
      if (toStr) params.append("to", toStr);
      
      const url = `/api/time/my${params.toString() ? `?${params.toString()}` : ""}`;
      return apiGet<TimeSession[]>(url);
    },
    enabled: true, // Always enabled, will use defaults if params not provided
  });
}
