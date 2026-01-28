"use client";

import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api-client";
import { LeaveRequest } from "./use-my-leaves";

export function usePendingLeaves() {
  return useQuery<LeaveRequest[]>({
    queryKey: ["leaves", "pending"],
    queryFn: () => apiGet<LeaveRequest[]>("/api/leaves/pending"),
  });
}
