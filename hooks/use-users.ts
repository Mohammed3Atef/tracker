"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPatch } from "@/lib/api-client";

export interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  employeeId: string;
  phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zipCode: string | null;
  country: string | null;
  hireDate: string;
  department: string | null;
  position: string | null;
  salary: number | null;
}

export interface UserRole {
  id: string;
  name: string;
  description: string | null;
}

export interface User {
  id: string;
  email: string;
  roleId: string;
  createdAt: string;
  updatedAt: string;
  profile: UserProfile | null;
  role: UserRole;
}

export interface UpdateUserData {
  email?: string;
  roleId?: string;
}

export interface UpdateProfileData {
  firstName?: string;
  lastName?: string;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  zipCode?: string | null;
  country?: string | null;
  department?: string | null;
  position?: string | null;
  salary?: number | null;
}

export function useUsers() {
  return useQuery<User[]>({
    queryKey: ["users"],
    queryFn: () => apiGet<User[]>("/api/users"),
  });
}

export function useUser(userId: string) {
  return useQuery<User>({
    queryKey: ["users", userId],
    queryFn: () => apiGet<User>(`/api/users/${userId}`),
    enabled: !!userId,
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, data }: { userId: string; data: UpdateUserData }) =>
      apiPatch<User>(`/api/users/${userId}`, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["users", variables.userId] });
    },
  });
}

export function useUpdateUserProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      userId,
      data,
    }: {
      userId: string;
      data: UpdateProfileData;
    }) => apiPatch<UserProfile>(`/api/users/${userId}/profile`, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["users", variables.userId] });
      queryClient.invalidateQueries({
        queryKey: ["users", variables.userId, "profile"],
      });
    },
  });
}

export function useRoles() {
  return useQuery<UserRole[]>({
    queryKey: ["roles"],
    queryFn: () => apiGet<UserRole[]>("/api/roles"),
  });
}
