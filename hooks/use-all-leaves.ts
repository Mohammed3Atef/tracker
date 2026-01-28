"use client";

import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api-client";
import { LeaveRequest } from "./use-my-leaves";

export interface LeaveFilters {
  status?: string;
  userId?: string;
  type?: string;
  from?: string;
  to?: string;
}

export function useAllLeaves(filters?: LeaveFilters) {
  const params = new URLSearchParams();
  
  if (filters?.status) params.append("status", filters.status);
  if (filters?.userId) params.append("userId", filters.userId);
  if (filters?.type) params.append("type", filters.type);
  if (filters?.from) params.append("from", filters.from);
  if (filters?.to) params.append("to", filters.to);

  const queryString = params.toString();

  return useQuery<LeaveRequest[]>({
    queryKey: ["leaves", "all", filters],
    queryFn: () =>
      apiGet<LeaveRequest[]>(`/api/leaves/all${queryString ? `?${queryString}` : ""}`),
    enabled: true, // Always enabled
  });
}
