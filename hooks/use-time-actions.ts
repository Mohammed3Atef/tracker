"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiPost, apiPatch } from "@/lib/api-client";
import { TimeSession, BreakSession } from "./use-time-status";

export function useClockIn() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => apiPost<TimeSession>("/api/time/clock-in"),
    onSuccess: () => {
      // Invalidate and refetch time-related queries
      queryClient.invalidateQueries({ queryKey: ["time", "status"] });
      queryClient.invalidateQueries({ queryKey: ["time", "my"] });
    },
  });
}

export function useClockOut() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => apiPost<TimeSession>("/api/time/clock-out"),
    onSuccess: () => {
      // Invalidate and refetch time-related queries
      queryClient.invalidateQueries({ queryKey: ["time", "status"] });
      queryClient.invalidateQueries({ queryKey: ["time", "my"] });
    },
  });
}

export function useStartBreak() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => apiPost<BreakSession>("/api/time/break/start"),
    onSuccess: () => {
      // Invalidate and refetch time-related queries
      queryClient.invalidateQueries({ queryKey: ["time", "status"] });
      queryClient.invalidateQueries({ queryKey: ["time", "my"] });
    },
  });
}

export function useEndBreak() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => apiPost<BreakSession>("/api/time/break/end"),
    onSuccess: () => {
      // Invalidate and refetch time-related queries
      queryClient.invalidateQueries({ queryKey: ["time", "status"] });
      queryClient.invalidateQueries({ queryKey: ["time", "my"] });
    },
  });
}

export function useUpdateTimeSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      sessionId,
      data,
    }: {
      sessionId: string;
      data: {
        startTime?: string;
        endTime?: string | null;
        notes?: string;
      };
    }) => apiPatch<TimeSession>(`/api/time/sessions/${sessionId}`, data),
    onSuccess: () => {
      // Invalidate all time-related queries
      queryClient.invalidateQueries({ queryKey: ["time", "status"] });
      queryClient.invalidateQueries({ queryKey: ["time", "my"] });
      queryClient.invalidateQueries({ queryKey: ["user-time-sessions"] });
    },
  });
}