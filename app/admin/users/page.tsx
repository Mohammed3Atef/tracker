"use client";

import React, { useEffect, useState } from "react";
import { useUsers, useUpdateUser, useUpdateUserProfile, useRoles, useCreateUser, type User, type CreateUserData } from "@/hooks/use-users";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAllUsersStatus } from "@/hooks/use-user-time-status";
import { useUserTimeStatus } from "@/hooks/use-user-time-status";
import { useApiToast } from "@/hooks/use-api-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Edit, Clock, Users as UsersIcon, Search, Plus, Calendar } from "lucide-react";
import { formatDuration } from "@/lib/time-helpers";
import { SessionDetails } from "@/components/time/session-details";
import { SessionTimeline } from "@/components/time/session-timeline";
import { useSession } from "next-auth/react";

export default function UsersPage() {
  const { data: session } = useSession();
  const { data: users, isLoading, error } = useUsers();
  const { data: roles } = useRoles();
  const { data: usersStatus } = useAllUsersStatus();
  const { toastApiError } = useApiToast();
  const updateUser = useUpdateUser();
  const updateProfile = useUpdateUserProfile();
  const createUser = useCreateUser();

  const [editUserDialogOpen, setEditUserDialogOpen] = useState(false);
  const [editProfileDialogOpen, setEditProfileDialogOpen] = useState(false);
  const [createUserDialogOpen, setCreateUserDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [viewStatusUserId, setViewStatusUserId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [departmentFilter, setDepartmentFilter] = useState<string>("all");

  // Form state for user edit
  const [userFormData, setUserFormData] = useState({
    email: "",
    roleId: "",
  });

  // Form state for profile edit
  const [profileFormData, setProfileFormData] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    country: "",
    department: "",
    position: "",
    salary: "",
  });

  // Form state for user creation
  const [createUserFormData, setCreateUserFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    roleId: "",
    createProfile: false,
    profile: {
      firstName: "",
      lastName: "",
      employeeId: "",
      phone: "",
      address: "",
      city: "",
      state: "",
      zipCode: "",
      country: "",
      hireDate: new Date().toISOString().split("T")[0],
      department: "",
      position: "",
      salary: "",
    },
  });

  // Get available roles
  const availableRoles = roles || [];

  // Get available departments
  const availableDepartments = React.useMemo(() => {
    if (!users) return [];
    const departments = new Set<string>();
    users.forEach((user) => {
      if (user.profile?.department) {
        departments.add(user.profile.department);
      }
    });
    return Array.from(departments).sort();
  }, [users]);

  // Get user status map
  const statusMap = React.useMemo(() => {
    if (!usersStatus) return new Map();
    const map = new Map();
    usersStatus.forEach((status) => {
      map.set(status.userId, status);
    });
    return map;
  }, [usersStatus]);

  useEffect(() => {
    if (error) {
      toastApiError(error as Error);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [error]);

  useEffect(() => {
    if (updateUser.error) {
      toastApiError(updateUser.error as Error);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [updateUser.error]);

  useEffect(() => {
    if (updateProfile.error) {
      toastApiError(updateProfile.error as Error);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [updateProfile.error]);

  useEffect(() => {
    if (createUser.error) {
      toastApiError(createUser.error as Error);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [createUser.error]);

  const openEditUserDialog = (user: User) => {
    setSelectedUser(user);
    setUserFormData({
      email: user.email,
      roleId: user.roleId,
    });
    setEditUserDialogOpen(true);
  };

  const openEditProfileDialog = (user: User) => {
    setSelectedUser(user);
    if (user.profile) {
      setProfileFormData({
        firstName: user.profile.firstName || "",
        lastName: user.profile.lastName || "",
        phone: user.profile.phone || "",
        address: user.profile.address || "",
        city: user.profile.city || "",
        state: user.profile.state || "",
        zipCode: user.profile.zipCode || "",
        country: user.profile.country || "",
        department: user.profile.department || "",
        position: user.profile.position || "",
        salary: user.profile.salary?.toString() || "",
      });
    } else {
      setProfileFormData({
        firstName: "",
        lastName: "",
        phone: "",
        address: "",
        city: "",
        state: "",
        zipCode: "",
        country: "",
        department: "",
        position: "",
        salary: "",
      });
    }
    setEditProfileDialogOpen(true);
  };

  const handleUpdateUser = async () => {
    if (!selectedUser) return;

    try {
      await updateUser.mutateAsync({
        userId: selectedUser.id,
        data: {
          email: userFormData.email !== selectedUser.email ? userFormData.email : undefined,
          roleId: userFormData.roleId !== selectedUser.roleId ? userFormData.roleId : undefined,
        },
      });
      setEditUserDialogOpen(false);
      setSelectedUser(null);
    } catch (error) {
      // Error handled by useEffect
    }
  };

  const handleUpdateProfile = async () => {
    if (!selectedUser) return;

    try {
      await updateProfile.mutateAsync({
        userId: selectedUser.id,
        data: {
          firstName: profileFormData.firstName || undefined,
          lastName: profileFormData.lastName || undefined,
          phone: profileFormData.phone || null,
          address: profileFormData.address || null,
          city: profileFormData.city || null,
          state: profileFormData.state || null,
          zipCode: profileFormData.zipCode || null,
          country: profileFormData.country || null,
          department: profileFormData.department || null,
          position: profileFormData.position || null,
          salary: profileFormData.salary ? parseFloat(profileFormData.salary) : null,
        },
      });
      setEditProfileDialogOpen(false);
      setSelectedUser(null);
    } catch (error) {
      // Error handled by useEffect
    }
  };

  const handleCreateUser = async () => {
    // Validation
    if (!createUserFormData.email || !createUserFormData.password || !createUserFormData.roleId) {
      toastApiError(new Error("Email, password, and role are required"));
      return;
    }

    if (createUserFormData.password !== createUserFormData.confirmPassword) {
      toastApiError(new Error("Passwords do not match"));
      return;
    }

    if (createUserFormData.password.length < 8) {
      toastApiError(new Error("Password must be at least 8 characters long"));
      return;
    }

    if (createUserFormData.createProfile) {
      if (
        !createUserFormData.profile.firstName ||
        !createUserFormData.profile.lastName ||
        !createUserFormData.profile.employeeId ||
        !createUserFormData.profile.hireDate
      ) {
        toastApiError(
          new Error("Profile requires firstName, lastName, employeeId, and hireDate")
        );
        return;
      }
    }

    try {
      const userData: CreateUserData = {
        email: createUserFormData.email,
        password: createUserFormData.password,
        roleId: createUserFormData.roleId,
        ...(createUserFormData.createProfile && {
          profile: {
            firstName: createUserFormData.profile.firstName,
            lastName: createUserFormData.profile.lastName,
            employeeId: createUserFormData.profile.employeeId,
            phone: createUserFormData.profile.phone || undefined,
            address: createUserFormData.profile.address || undefined,
            city: createUserFormData.profile.city || undefined,
            state: createUserFormData.profile.state || undefined,
            zipCode: createUserFormData.profile.zipCode || undefined,
            country: createUserFormData.profile.country || undefined,
            hireDate: createUserFormData.profile.hireDate,
            department: createUserFormData.profile.department || undefined,
            position: createUserFormData.profile.position || undefined,
            salary: createUserFormData.profile.salary
              ? parseFloat(createUserFormData.profile.salary)
              : undefined,
          },
        }),
      };

      await createUser.mutateAsync(userData);
      setCreateUserDialogOpen(false);
      // Reset form
      setCreateUserFormData({
        email: "",
        password: "",
        confirmPassword: "",
        roleId: "",
        createProfile: false,
        profile: {
          firstName: "",
          lastName: "",
          employeeId: "",
          phone: "",
          address: "",
          city: "",
          state: "",
          zipCode: "",
          country: "",
          hireDate: new Date().toISOString().split("T")[0],
          department: "",
          position: "",
          salary: "",
        },
      });
    } catch (error) {
      // Error handled by useEffect
    }
  };

  // Filter users
  const filteredUsers = React.useMemo(() => {
    if (!users) return [];

    return users.filter((user) => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const name = user.profile
          ? `${user.profile.firstName} ${user.profile.lastName}`.toLowerCase()
          : "";
        const email = user.email.toLowerCase();
        if (!name.includes(query) && !email.includes(query)) {
          return false;
        }
      }

      // Role filter
      if (roleFilter !== "all" && user.roleId !== roleFilter) {
        return false;
      }

      // Department filter
      if (departmentFilter !== "all") {
        if (!user.profile?.department || user.profile.department !== departmentFilter) {
          return false;
        }
      }

      return true;
    });
  }, [users, searchQuery, roleFilter, departmentFilter]);

  const isAdmin = session?.user?.role === "admin";

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Users Management</h1>
          <p className="text-muted-foreground">Manage users, profiles, and view activity</p>
        </div>
        {isAdmin && (
          <Button onClick={() => setCreateUserDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create User
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Users</CardTitle>
          <CardDescription>View and manage all system users</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="mb-6 space-y-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <Label htmlFor="search">Search</Label>
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="search"
                    placeholder="Search by name or email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="role-filter">Role</Label>
                <select
                  id="role-filter"
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <option value="all">All Roles</option>
                  {availableRoles.map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="department-filter">Department</Label>
                <select
                  id="department-filter"
                  value={departmentFilter}
                  onChange={(e) => setDepartmentFilter(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <option value="all">All Departments</option>
                  {availableDepartments.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : !filteredUsers || filteredUsers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <UsersIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No users found</p>
              <p className="text-sm">
                {searchQuery || roleFilter !== "all" || departmentFilter !== "all"
                  ? "Try adjusting your filters"
                  : "No users in the system"}
              </p>
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Position</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Worked Today</TableHead>
                      {isAdmin && <TableHead className="text-right">Salary</TableHead>}
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((user) => {
                      const status = statusMap.get(user.id);
                      const name = user.profile
                        ? `${user.profile.firstName} ${user.profile.lastName}`
                        : user.email;

                      return (
                        <TableRow key={user.id}>
                          <TableCell className="font-medium">{name}</TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>
                            <Badge variant="secondary">{user.role.name}</Badge>
                          </TableCell>
                          <TableCell>{user.profile?.department || "-"}</TableCell>
                          <TableCell>{user.profile?.position || "-"}</TableCell>
                          <TableCell>
                            {status ? (
                              <div className="flex flex-col gap-1">
                                {status.hasActiveSession ? (
                                  status.hasActiveBreak ? (
                                    <Badge variant="default" className="w-fit">
                                      On Break
                                    </Badge>
                                  ) : (
                                    <Badge variant="default" className="w-fit">
                                      Clocked In
                                    </Badge>
                                  )
                                ) : (
                                  <Badge variant="secondary" className="w-fit">
                                    Clocked Out
                                  </Badge>
                                )}
                              </div>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            {status ? formatDuration(status.totalWorkedToday) : "-"}
                          </TableCell>
                          {isAdmin && (
                            <TableCell className="text-right">
                              {user.profile?.salary
                                ? `$${user.profile.salary.toLocaleString()}`
                                : "-"}
                            </TableCell>
                          )}
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => openEditUserDialog(user)}
                              >
                                <Edit className="h-3 w-3 mr-1" />
                                Edit User
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => openEditProfileDialog(user)}
                              >
                                <Edit className="h-3 w-3 mr-1" />
                                Edit Profile
                              </Button>
                              {status && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() =>
                                    setViewStatusUserId(
                                      viewStatusUserId === user.id ? null : user.id
                                    )
                                  }
                                >
                                  <Clock className="h-3 w-3 mr-1" />
                                  Status
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile Card View */}
              <div className="md:hidden space-y-4">
                {filteredUsers.map((user) => {
                  const status = statusMap.get(user.id);
                  const name = user.profile
                    ? `${user.profile.firstName} ${user.profile.lastName}`
                    : user.email;

                  return (
                    <Card key={user.id}>
                      <CardContent className="pt-6">
                        <div className="space-y-4">
                          <div>
                            <p className="font-medium">{name}</p>
                            <p className="text-sm text-muted-foreground">{user.email}</p>
                          </div>

                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <p className="text-muted-foreground">Role</p>
                              <Badge variant="secondary">{user.role.name}</Badge>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Department</p>
                              <p className="font-medium">{user.profile?.department || "-"}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Position</p>
                              <p className="font-medium">{user.profile?.position || "-"}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Status</p>
                              {status ? (
                                status.hasActiveSession ? (
                                  status.hasActiveBreak ? (
                                    <Badge variant="default">On Break</Badge>
                                  ) : (
                                    <Badge variant="default">Clocked In</Badge>
                                  )
                                ) : (
                                  <Badge variant="secondary">Clocked Out</Badge>
                                )
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </div>
                            <div>
                              <p className="text-muted-foreground">Worked Today</p>
                              <p className="font-medium">
                                {status ? formatDuration(status.totalWorkedToday) : "-"}
                              </p>
                            </div>
                            {isAdmin && (
                              <div>
                                <p className="text-muted-foreground">Salary</p>
                                <p className="font-medium">
                                  {user.profile?.salary
                                    ? `$${user.profile.salary.toLocaleString()}`
                                    : "-"}
                                </p>
                              </div>
                            )}
                          </div>

                          <div className="flex gap-2 pt-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="flex-1"
                              onClick={() => openEditUserDialog(user)}
                            >
                              <Edit className="h-3 w-3 mr-1" />
                              Edit User
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="flex-1"
                              onClick={() => openEditProfileDialog(user)}
                            >
                              <Edit className="h-3 w-3 mr-1" />
                              Profile
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Edit User Dialog */}
      <Dialog open={editUserDialogOpen} onOpenChange={setEditUserDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update user email and role. Only admins can change roles.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={userFormData.email}
                onChange={(e) =>
                  setUserFormData({ ...userFormData, email: e.target.value })
                }
              />
            </div>
            {isAdmin && (
              <div>
                <Label htmlFor="role">Role</Label>
                <select
                  id="role"
                  value={userFormData.roleId}
                  onChange={(e) =>
                    setUserFormData({ ...userFormData, roleId: e.target.value })
                  }
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  {availableRoles.map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditUserDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleUpdateUser}
              disabled={updateUser.isPending}
            >
              {updateUser.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Profile Dialog */}
      <Dialog open={editProfileDialogOpen} onOpenChange={setEditProfileDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Employee Profile</DialogTitle>
            <DialogDescription>
              Update employee profile information. {!isAdmin && "Salary changes require admin access."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  value={profileFormData.firstName}
                  onChange={(e) =>
                    setProfileFormData({ ...profileFormData, firstName: e.target.value })
                  }
                />
              </div>
              <div>
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  value={profileFormData.lastName}
                  onChange={(e) =>
                    setProfileFormData({ ...profileFormData, lastName: e.target.value })
                  }
                />
              </div>
            </div>
            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={profileFormData.phone}
                onChange={(e) =>
                  setProfileFormData({ ...profileFormData, phone: e.target.value })
                }
              />
            </div>
            <div>
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                value={profileFormData.address}
                onChange={(e) =>
                  setProfileFormData({ ...profileFormData, address: e.target.value })
                }
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={profileFormData.city}
                  onChange={(e) =>
                    setProfileFormData({ ...profileFormData, city: e.target.value })
                  }
                />
              </div>
              <div>
                <Label htmlFor="state">State</Label>
                <Input
                  id="state"
                  value={profileFormData.state}
                  onChange={(e) =>
                    setProfileFormData({ ...profileFormData, state: e.target.value })
                  }
                />
              </div>
              <div>
                <Label htmlFor="zipCode">Zip Code</Label>
                <Input
                  id="zipCode"
                  value={profileFormData.zipCode}
                  onChange={(e) =>
                    setProfileFormData({ ...profileFormData, zipCode: e.target.value })
                  }
                />
              </div>
            </div>
            <div>
              <Label htmlFor="country">Country</Label>
              <Input
                id="country"
                value={profileFormData.country}
                onChange={(e) =>
                  setProfileFormData({ ...profileFormData, country: e.target.value })
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="department">Department</Label>
                <Input
                  id="department"
                  value={profileFormData.department}
                  onChange={(e) =>
                    setProfileFormData({ ...profileFormData, department: e.target.value })
                  }
                />
              </div>
              <div>
                <Label htmlFor="position">Position</Label>
                <Input
                  id="position"
                  value={profileFormData.position}
                  onChange={(e) =>
                    setProfileFormData({ ...profileFormData, position: e.target.value })
                  }
                />
              </div>
            </div>
            {isAdmin && (
              <div>
                <Label htmlFor="salary">Salary</Label>
                <Input
                  id="salary"
                  type="number"
                  step="0.01"
                  value={profileFormData.salary}
                  onChange={(e) =>
                    setProfileFormData({ ...profileFormData, salary: e.target.value })
                  }
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditProfileDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleUpdateProfile}
              disabled={updateProfile.isPending}
            >
              {updateProfile.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* User Time Status Dialog */}
      {viewStatusUserId && (
        <UserTimeStatusDialog
          userId={viewStatusUserId}
          onClose={() => setViewStatusUserId(null)}
          allowEdit={isAdmin}
        />
      )}

      {/* Create User Dialog */}
      <Dialog open={createUserDialogOpen} onOpenChange={setCreateUserDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New User</DialogTitle>
            <DialogDescription>
              Create a new user account. You can optionally create a profile at the same time.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="create-email">Email *</Label>
              <Input
                id="create-email"
                type="email"
                value={createUserFormData.email}
                onChange={(e) =>
                  setCreateUserFormData({
                    ...createUserFormData,
                    email: e.target.value,
                  })
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="create-password">Password *</Label>
                <Input
                  id="create-password"
                  type="password"
                  value={createUserFormData.password}
                  onChange={(e) =>
                    setCreateUserFormData({
                      ...createUserFormData,
                      password: e.target.value,
                    })
                  }
                />
              </div>
              <div>
                <Label htmlFor="create-confirm-password">Confirm Password *</Label>
                <Input
                  id="create-confirm-password"
                  type="password"
                  value={createUserFormData.confirmPassword}
                  onChange={(e) =>
                    setCreateUserFormData({
                      ...createUserFormData,
                      confirmPassword: e.target.value,
                    })
                  }
                />
              </div>
            </div>
            <div>
              <Label htmlFor="create-role">Role *</Label>
              <select
                id="create-role"
                value={createUserFormData.roleId}
                onChange={(e) =>
                  setCreateUserFormData({
                    ...createUserFormData,
                    roleId: e.target.value,
                  })
                }
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="">Select a role</option>
                {availableRoles.map((role) => (
                  <option key={role.id} value={role.id}>
                    {role.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center space-x-2 pt-2">
              <input
                type="checkbox"
                id="create-profile"
                checked={createUserFormData.createProfile}
                onChange={(e) =>
                  setCreateUserFormData({
                    ...createUserFormData,
                    createProfile: e.target.checked,
                  })
                }
                className="h-4 w-4 rounded border-gray-300"
              />
              <Label htmlFor="create-profile" className="cursor-pointer">
                Create employee profile
              </Label>
            </div>
            {createUserFormData.createProfile && (
              <div className="space-y-4 pt-4 border-t">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="create-firstName">First Name *</Label>
                    <Input
                      id="create-firstName"
                      value={createUserFormData.profile.firstName}
                      onChange={(e) =>
                        setCreateUserFormData({
                          ...createUserFormData,
                          profile: {
                            ...createUserFormData.profile,
                            firstName: e.target.value,
                          },
                        })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="create-lastName">Last Name *</Label>
                    <Input
                      id="create-lastName"
                      value={createUserFormData.profile.lastName}
                      onChange={(e) =>
                        setCreateUserFormData({
                          ...createUserFormData,
                          profile: {
                            ...createUserFormData.profile,
                            lastName: e.target.value,
                          },
                        })
                      }
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="create-employeeId">Employee ID *</Label>
                    <Input
                      id="create-employeeId"
                      value={createUserFormData.profile.employeeId}
                      onChange={(e) =>
                        setCreateUserFormData({
                          ...createUserFormData,
                          profile: {
                            ...createUserFormData.profile,
                            employeeId: e.target.value,
                          },
                        })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="create-hireDate">Hire Date *</Label>
                    <Input
                      id="create-hireDate"
                      type="date"
                      value={createUserFormData.profile.hireDate}
                      onChange={(e) =>
                        setCreateUserFormData({
                          ...createUserFormData,
                          profile: {
                            ...createUserFormData.profile,
                            hireDate: e.target.value,
                          },
                        })
                      }
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="create-phone">Phone</Label>
                  <Input
                    id="create-phone"
                    value={createUserFormData.profile.phone}
                    onChange={(e) =>
                      setCreateUserFormData({
                        ...createUserFormData,
                        profile: {
                          ...createUserFormData.profile,
                          phone: e.target.value,
                        },
                      })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="create-address">Address</Label>
                  <Input
                    id="create-address"
                    value={createUserFormData.profile.address}
                    onChange={(e) =>
                      setCreateUserFormData({
                        ...createUserFormData,
                        profile: {
                          ...createUserFormData.profile,
                          address: e.target.value,
                        },
                      })
                    }
                  />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="create-city">City</Label>
                    <Input
                      id="create-city"
                      value={createUserFormData.profile.city}
                      onChange={(e) =>
                        setCreateUserFormData({
                          ...createUserFormData,
                          profile: {
                            ...createUserFormData.profile,
                            city: e.target.value,
                          },
                        })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="create-state">State</Label>
                    <Input
                      id="create-state"
                      value={createUserFormData.profile.state}
                      onChange={(e) =>
                        setCreateUserFormData({
                          ...createUserFormData,
                          profile: {
                            ...createUserFormData.profile,
                            state: e.target.value,
                          },
                        })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="create-zipCode">Zip Code</Label>
                    <Input
                      id="create-zipCode"
                      value={createUserFormData.profile.zipCode}
                      onChange={(e) =>
                        setCreateUserFormData({
                          ...createUserFormData,
                          profile: {
                            ...createUserFormData.profile,
                            zipCode: e.target.value,
                          },
                        })
                      }
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="create-country">Country</Label>
                  <Input
                    id="create-country"
                    value={createUserFormData.profile.country}
                    onChange={(e) =>
                      setCreateUserFormData({
                        ...createUserFormData,
                        profile: {
                          ...createUserFormData.profile,
                          country: e.target.value,
                        },
                      })
                    }
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="create-department">Department</Label>
                    <Input
                      id="create-department"
                      value={createUserFormData.profile.department}
                      onChange={(e) =>
                        setCreateUserFormData({
                          ...createUserFormData,
                          profile: {
                            ...createUserFormData.profile,
                            department: e.target.value,
                          },
                        })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="create-position">Position</Label>
                    <Input
                      id="create-position"
                      value={createUserFormData.profile.position}
                      onChange={(e) =>
                        setCreateUserFormData({
                          ...createUserFormData,
                          profile: {
                            ...createUserFormData.profile,
                            position: e.target.value,
                          },
                        })
                      }
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="create-salary">Salary</Label>
                  <Input
                    id="create-salary"
                    type="number"
                    step="0.01"
                    value={createUserFormData.profile.salary}
                    onChange={(e) =>
                      setCreateUserFormData({
                        ...createUserFormData,
                        profile: {
                          ...createUserFormData.profile,
                          salary: e.target.value,
                        },
                      })
                    }
                  />
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateUserDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateUser} disabled={createUser.isPending}>
              {createUser.isPending ? "Creating..." : "Create User"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function UserTimeStatusDialog({
  userId,
  onClose,
  allowEdit = false,
}: {
  userId: string;
  onClose: () => void;
  allowEdit?: boolean;
}) {
  const { data: status, isLoading: statusLoading } = useUserTimeStatus(userId);
  const [viewMode, setViewMode] = useState<"status" | "sessions" | "timeline">("status");
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const queryClient = useQueryClient();

  // Fetch user sessions
  const { data: sessions, isLoading: sessionsLoading } = useQuery({
    queryKey: ["user-time-sessions", userId, selectedDate],
    queryFn: async () => {
      const date = new Date(selectedDate);
      const start = new Date(date);
      start.setHours(0, 0, 0, 0);
      const end = new Date(date);
      end.setHours(23, 59, 59, 999);
      
      const response = await fetch(
        `/api/users/${userId}/time-sessions?from=${start.toISOString()}&to=${end.toISOString()}`
      );
      if (!response.ok) throw new Error("Failed to fetch sessions");
      return response.json().then((data) => data.data);
    },
    enabled: viewMode !== "status",
  });

  // Filter sessions for selected date
  const daySessions = sessions?.filter((session: any) => {
    const sessionDate = new Date(session.startTime).toISOString().split("T")[0];
    return sessionDate === selectedDate;
  }) || [];

  return (
    <Dialog open={!!userId} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>User Time Tracking</DialogTitle>
          <DialogDescription>View and manage time tracking for this user</DialogDescription>
        </DialogHeader>

        {/* Tabs */}
        <div className="flex gap-2 border-b">
          <Button
            variant={viewMode === "status" ? "default" : "ghost"}
            size="sm"
            onClick={() => setViewMode("status")}
          >
            <Clock className="h-4 w-4 mr-2" />
            Status
          </Button>
          <Button
            variant={viewMode === "sessions" ? "default" : "ghost"}
            size="sm"
            onClick={() => setViewMode("sessions")}
          >
            <Calendar className="h-4 w-4 mr-2" />
            Sessions
          </Button>
          <Button
            variant={viewMode === "timeline" ? "default" : "ghost"}
            size="sm"
            onClick={() => setViewMode("timeline")}
          >
            Timeline
          </Button>
        </div>

        {/* Date selector for sessions/timeline */}
        {(viewMode === "sessions" || viewMode === "timeline") && (
          <div className="pt-4">
            <Label htmlFor="session-date">Date</Label>
            <Input
              id="session-date"
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full"
            />
          </div>
        )}

        {/* Content */}
        {viewMode === "status" && (
          <div className="space-y-4">
            {statusLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
              </div>
            ) : status ? (
              <>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <p className="font-medium">
                    {status.hasActiveSession ? (
                      status.activeBreak ? (
                        <Badge variant="default">On Break</Badge>
                      ) : (
                        <Badge variant="default">Clocked In</Badge>
                      )
                    ) : (
                      <Badge variant="secondary">Clocked Out</Badge>
                    )}
                  </p>
                </div>
                {status.session && (
                  <div>
                    <p className="text-sm text-muted-foreground">Session Started</p>
                    <p className="font-medium">
                      {new Date(status.session.startTime).toLocaleString()}
                    </p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-muted-foreground">Total Worked Today</p>
                  <p className="font-medium text-lg">{formatDuration(status.totalWorkedToday)}</p>
                </div>
                {status.session && (
                  <SessionDetails
                    session={status.session as any}
                    showDate={false}
                    allowEdit={allowEdit}
                    onUpdate={() => {
                      queryClient.invalidateQueries({ queryKey: ["user-time-status", userId] });
                    }}
                  />
                )}
              </>
            ) : (
              <p className="text-muted-foreground">No status data available</p>
            )}
          </div>
        )}

        {viewMode === "sessions" && (
          <div className="space-y-4">
            {sessionsLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-32 w-full" />
              </div>
            ) : daySessions.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No sessions found for this date
              </p>
            ) : (
              <div className="space-y-4">
                {daySessions.map((session: any) => (
                  <SessionDetails
                    key={session.id}
                    session={session}
                    showDate={false}
                    allowEdit={allowEdit}
                    onUpdate={() => {
                      queryClient.invalidateQueries({ queryKey: ["user-time-sessions", userId] });
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {viewMode === "timeline" && (
          <div>
            {sessionsLoading ? (
              <Skeleton className="h-64 w-full" />
            ) : (
              <SessionTimeline sessions={daySessions || []} date={new Date(selectedDate)} />
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
