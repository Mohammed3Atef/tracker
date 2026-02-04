"use client";

import React, { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPost, apiDelete } from "@/lib/api-client";
import { useApiToast } from "@/hooks/use-api-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Shield, Plus, X, Search } from "lucide-react";

interface Permission {
  id: string;
  name: string;
  resource: string;
  action: string;
  description: string | null;
}

interface Role {
  id: string;
  name: string;
  description: string | null;
  permissions: Permission[];
}

export default function RolesPage() {
  const { toastApiError } = useApiToast();
  const queryClient = useQueryClient();
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [addPermissionDialogOpen, setAddPermissionDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch roles
  const { data: roles, isLoading, error } = useQuery<Role[]>({
    queryKey: ["roles"],
    queryFn: () => apiGet<Role[]>("/api/roles"),
  });

  // Fetch all permissions
  const { data: allPermissions } = useQuery<Permission[]>({
    queryKey: ["permissions"],
    queryFn: () => apiGet<Permission[]>("/api/permissions"),
  });

  useEffect(() => {
    if (error) {
      toastApiError(error as Error);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [error]);

  // Add permission mutation
  const addPermission = useMutation({
    mutationFn: ({ roleId, permissionId }: { roleId: string; permissionId: string }) =>
      apiPost<Permission[]>(`/api/roles/${roleId}/permissions`, { permissionId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roles"] });
      setAddPermissionDialogOpen(false);
      setSelectedRole(null);
    },
    onError: (error) => {
      toastApiError(error as Error);
    },
  });

  // Remove permission mutation
  const removePermission = useMutation({
    mutationFn: ({ roleId, permissionId }: { roleId: string; permissionId: string }) =>
      apiDelete(`/api/roles/${roleId}/permissions/${permissionId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roles"] });
    },
    onError: (error) => {
      toastApiError(error as Error);
    },
  });

  const handleAddPermission = (role: Role) => {
    setSelectedRole(role);
    setAddPermissionDialogOpen(true);
  };

  const handleRemovePermission = (roleId: string, permissionId: string) => {
    if (confirm("Are you sure you want to remove this permission from the role?")) {
      removePermission.mutate({ roleId, permissionId });
    }
  };

  const handleSubmitAddPermission = (permissionId: string) => {
    if (!selectedRole) return;
    addPermission.mutate({ roleId: selectedRole.id, permissionId });
  };

  // Get available permissions (not already assigned)
  const availablePermissions = selectedRole && allPermissions
    ? allPermissions.filter(
        (perm) => !selectedRole.permissions.some((p) => p.id === perm.id)
      )
    : [];

  // Filter roles by search
  const filteredRoles = roles?.filter((role) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      role.name.toLowerCase().includes(query) ||
      role.description?.toLowerCase().includes(query) ||
      role.permissions.some((p) => p.name.toLowerCase().includes(query))
    );
  });

  // Group permissions by resource
  const groupPermissionsByResource = (permissions: Permission[]) => {
    const grouped: Record<string, Permission[]> = {};
    permissions.forEach((perm) => {
      if (!grouped[perm.resource]) {
        grouped[perm.resource] = [];
      }
      grouped[perm.resource].push(perm);
    });
    return grouped;
  };

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold">Role Management</h1>
        <p className="text-muted-foreground">Manage roles and their permissions</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Roles</CardTitle>
          <CardDescription>View and manage system roles and permissions</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Search */}
          <div className="mb-6">
            <Label htmlFor="search">Search</Label>
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="search"
                placeholder="Search roles or permissions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>

          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
          ) : !filteredRoles || filteredRoles.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No roles found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredRoles.map((role) => {
                const groupedPermissions = groupPermissionsByResource(role.permissions);

                return (
                  <Card key={role.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="flex items-center gap-2">
                            <Shield className="h-5 w-5" />
                            {role.name}
                          </CardTitle>
                          <CardDescription>{role.description || "No description"}</CardDescription>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleAddPermission(role)}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add Permission
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {role.permissions.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No permissions assigned</p>
                      ) : (
                        <div className="space-y-4">
                          {Object.entries(groupedPermissions).map(([resource, perms]) => (
                            <div key={resource}>
                              <h4 className="text-sm font-semibold mb-2 capitalize">{resource}</h4>
                              <div className="flex flex-wrap gap-2">
                                {perms.map((permission) => (
                                  <Badge
                                    key={permission.id}
                                    variant="secondary"
                                    className="flex items-center gap-1"
                                  >
                                    {permission.name}
                                    <button
                                      onClick={() =>
                                        handleRemovePermission(role.id, permission.id)
                                      }
                                      className="ml-1 hover:text-destructive"
                                      disabled={removePermission.isPending}
                                    >
                                      <X className="h-3 w-3" />
                                    </button>
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Permission Dialog */}
      <Dialog open={addPermissionDialogOpen} onOpenChange={setAddPermissionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Permission to {selectedRole?.name}</DialogTitle>
            <DialogDescription>
              Select a permission to add to this role
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 max-h-[60vh] overflow-y-auto">
            {availablePermissions.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                All available permissions are already assigned to this role
              </p>
            ) : (
              <div className="space-y-2">
                {availablePermissions.map((permission) => (
                  <div
                    key={permission.id}
                    className="p-3 border rounded-lg hover:bg-muted cursor-pointer"
                    onClick={() => handleSubmitAddPermission(permission.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{permission.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {permission.description || `${permission.resource}.${permission.action}`}
                        </p>
                      </div>
                      <Badge variant="outline" className="capitalize">
                        {permission.resource}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddPermissionDialogOpen(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
