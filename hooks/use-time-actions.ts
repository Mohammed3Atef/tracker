"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiPost, apiPatch } from "@/lib/api-client";
import { useApiToast } from "@/hooks/use-api-toast";
import { TimeSession, BreakSession } from "./use-time-status";

export function useClockIn() {
  const queryClient = useQueryClient();
  const { toastApiError } = useApiToast();

  return useMutation({
    mutationFn: () => apiPost<TimeSession>("/api/time/clock-in"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["time", "status"] });
      queryClient.invalidateQueries({ queryKey: ["time", "my"] });
    },
    onError: (error) => {
      toastApiError(error as Error);
    },
  });
}

export function useClockOut() {
  const queryClient = useQueryClient();
  const { toastApiError } = useApiToast();

  return useMutation({
    mutationFn: () => apiPost<TimeSession>("/api/time/clock-out"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["time", "status"] });
      queryClient.invalidateQueries({ queryKey: ["time", "my"] });
    },
    onError: (error) => {
      toastApiError(error as Error);
    },
  });
}

export function useStartBreak() {
  const queryClient = useQueryClient();
  const { toastApiError } = useApiToast();

  return useMutation({
    mutationFn: () => apiPost<BreakSession>("/api/time/break/start"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["time", "status"] });
      queryClient.invalidateQueries({ queryKey: ["time", "my"] });
    },
    onError: (error) => {
      toastApiError(error as Error);
    },
  });
}

export function useEndBreak() {
  const queryClient = useQueryClient();
  const { toastApiError } = useApiToast();

  return useMutation({
    mutationFn: () => apiPost<BreakSession>("/api/time/break/end"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["time", "status"] });
      queryClient.invalidateQueries({ queryKey: ["time", "my"] });
    },
    onError: (error) => {
      toastApiError(error as Error);
    },
  });
}

export function useUpdateTimeSession() {
  const queryClient = useQueryClient();
  const { toastApiError } = useApiToast();

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
      queryClient.invalidateQueries({ queryKey: ["time", "status"] });
      queryClient.invalidateQueries({ queryKey: ["time", "my"] });
      queryClient.invalidateQueries({ queryKey: ["user-time-sessions"] });
    },
    onError: (error) => {
      toastApiError(error as Error);
    },
  });
}
