"use client";

import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api-client";

export interface LeaveRequestUser {
  id: string;
  email: string;
  profile?: {
    firstName: string;
    lastName: string;
  } | null;
}

export interface LeaveRequest {
  id: string;
  userId: string;
  startDate: string;
  endDate: string;
  type: string;
  status: string;
  reason: string | null;
  rejectionReason: string | null;
  approvedBy: string | null;
  approvedAt: string | null;
  createdAt: string;
  updatedAt: string;
  user: LeaveRequestUser;
}

export function useMyLeaves() {
  return useQuery<LeaveRequest[]>({
    queryKey: ["leaves", "my"],
    queryFn: () => apiGet<LeaveRequest[]>("/api/leaves/my"),
  });
}
