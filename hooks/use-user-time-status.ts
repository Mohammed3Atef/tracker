"use client";

import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api-client";
import { TimeSession, BreakSession } from "./use-time-status";

export interface UserTimeStatusResponse {
  hasActiveSession: boolean;
  session: TimeSession | null;
  activeBreak: BreakSession | null;
  totalWorkedToday: number;
}

export interface UserStatus {
  userId: string;
  email: string;
  name: string;
  role: string;
  department: string | null;
  position: string | null;
  hasActiveSession: boolean;
  hasActiveBreak: boolean;
  totalWorkedToday: number;
  lastActivity: {
    startTime: string;
    endTime: string | null;
    status: string;
  } | null;
}

export function useUserTimeStatus(userId: string) {
  return useQuery<UserTimeStatusResponse>({
    queryKey: ["users", userId, "time-status"],
    queryFn: () => apiGet<UserTimeStatusResponse>(`/api/users/${userId}/time-status`),
    enabled: !!userId,
  });
}

export function useAllUsersStatus() {
  return useQuery<UserStatus[]>({
    queryKey: ["users", "all", "status"],
    queryFn: () => apiGet<UserStatus[]>("/api/users/all/status"),
    refetchInterval: 30000, // Refetch every 30 seconds for live updates
  });
}
