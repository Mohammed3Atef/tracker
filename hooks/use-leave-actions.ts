"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiPost } from "@/lib/api-client";
import { LeaveRequest } from "./use-my-leaves";

export interface RequestLeaveInput {
  startDate: string;
  endDate: string;
  type: string;
  reason?: string;
}

export interface RejectLeaveInput {
  rejectionReason?: string;
}

export function useRequestLeave() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: RequestLeaveInput) =>
      apiPost<LeaveRequest>("/api/leaves/request", data),
    onSuccess: () => {
      // Invalidate and refetch leave-related queries
      queryClient.invalidateQueries({ queryKey: ["leaves"] });
    },
  });
}

export function useApproveLeave() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      apiPost<LeaveRequest>(`/api/leaves/${id}/approve`, {}),
    onSuccess: () => {
      // Invalidate and refetch leave-related queries
      queryClient.invalidateQueries({ queryKey: ["leaves"] });
    },
  });
}

export function useRejectLeave() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: RejectLeaveInput }) =>
      apiPost<LeaveRequest>(`/api/leaves/${id}/reject`, data),
    onSuccess: () => {
      // Invalidate and refetch leave-related queries
      queryClient.invalidateQueries({ queryKey: ["leaves"] });
    },
  });
}
