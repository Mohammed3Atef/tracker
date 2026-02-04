"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPost, apiPatch, apiDelete } from "@/lib/api-client";
import { useApiToast } from "./use-api-toast";

export interface TimeEntry {
  id: string;
  userId: string;
  startTime: string;
  endTime: string | null;
  duration: number | null;
  status: string;
  notes: string | null;
  breakSessions: Array<{
    id: string;
    startTime: string;
    endTime: string | null;
    duration: number | null;
  }>;
  user?: {
    id: string;
    email: string;
    profile?: {
      firstName: string | null;
      lastName: string | null;
    } | null;
  };
}

interface TimeEntriesParams {
  from?: Date;
  to?: Date;
  userId?: string;
}

export function useTimeEntries(params?: TimeEntriesParams) {
  const fromStr = params?.from?.toISOString();
  const toStr = params?.to?.toISOString();
  const userId = params?.userId;

  return useQuery<TimeEntry[]>({
    queryKey: ["time", "entries", fromStr, toStr, userId],
    queryFn: () => {
      const searchParams = new URLSearchParams();
      if (fromStr) searchParams.append("from", fromStr);
      if (toStr) searchParams.append("to", toStr);
      if (userId) searchParams.append("userId", userId);

      const url = `/api/time/entries${searchParams.toString() ? `?${searchParams.toString()}` : ""}`;
      return apiGet<TimeEntry[]>(url);
    },
    staleTime: 30000, // Consider data fresh for 30 seconds
    refetchOnWindowFocus: false, // Don't refetch on window focus
    refetchOnMount: false, // Don't refetch on component mount if data exists
    refetchOnReconnect: true, // Only refetch on reconnect
  });
}

export function useCreateTimeEntry() {
  const queryClient = useQueryClient();
  const { toastApiError, toastSuccess } = useApiToast();

  return useMutation({
    mutationFn: async (data: {
      startTime: string;
      endTime?: string | null;
      notes?: string;
      userId?: string;
    }) => {
      return apiPost<TimeEntry>("/api/time/entries", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["time"] });
      toastSuccess("Time entry created successfully");
    },
    onError: (error) => {
      toastApiError(error as Error);
    },
  });
}

export function useUpdateTimeEntry() {
  const queryClient = useQueryClient();
  const { toastApiError, toastSuccess } = useApiToast();

  return useMutation({
    mutationFn: async ({
      entryId,
      data,
    }: {
      entryId: string;
      data: {
        startTime?: string;
        endTime?: string | null;
        notes?: string;
      };
    }) => {
      return apiPatch<TimeEntry>(`/api/time/entries/${entryId}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["time"] });
      toastSuccess("Time entry updated successfully");
    },
    onError: (error) => {
      toastApiError(error as Error);
    },
  });
}

export function useDeleteTimeEntry() {
  const queryClient = useQueryClient();
  const { toastApiError, toastSuccess } = useApiToast();

  return useMutation({
    mutationFn: async (entryId: string) => {
      return apiDelete(`/api/time/entries/${entryId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["time"] });
      toastSuccess("Time entry deleted successfully");
    },
    onError: (error) => {
      toastApiError(error as Error);
    },
  });
}
