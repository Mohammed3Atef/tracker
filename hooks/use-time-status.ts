"use client";

import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api-client";

export interface BreakSession {
  id: string;
  timeSessionId: string;
  startTime: string;
  endTime: string | null;
  duration: number | null;
  type: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TimeSession {
  id: string;
  userId: string;
  startTime: string;
  endTime: string | null;
  duration: number | null;
  status: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  breakSessions: BreakSession[];
}

export interface TimeStatusResponse {
  hasActiveSession: boolean;
  session: TimeSession | null;
  activeBreak: BreakSession | null;
  totalWorkedToday: number;
}

export function useTimeStatus() {
  return useQuery<TimeStatusResponse>({
    queryKey: ["time", "status"],
    queryFn: () => apiGet<TimeStatusResponse>("/api/time/status"),
  });
}
