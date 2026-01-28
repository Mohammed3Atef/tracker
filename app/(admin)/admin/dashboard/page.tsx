"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Bug, Activity, Users, Clock, Calendar, TrendingUp } from "lucide-react";
import { useUsers } from "@/hooks/use-users";
import { useAllUsersStatus } from "@/hooks/use-user-time-status";
import { usePendingLeaves } from "@/hooks/use-pending-leaves";
import { useApiToast } from "@/hooks/use-api-toast";
import { formatDuration } from "@/lib/time-helpers";

export default function AdminDashboard() {
  const { data: users, isLoading: usersLoading, error: usersError } = useUsers();
  const { data: usersStatus, isLoading: statusLoading } = useAllUsersStatus();
  const { data: pendingLeaves, isLoading: leavesLoading } = usePendingLeaves();
  const { toastApiError } = useApiToast();

  useEffect(() => {
    if (usersError) {
      toastApiError(usersError as Error);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [usersError]);

  // Calculate stats
  const totalUsers = users?.length || 0;
  const activeSessions = usersStatus?.filter((s) => s.hasActiveSession).length || 0;
  const pendingLeavesCount = pendingLeaves?.length || 0;
  const totalWorkedToday = usersStatus?.reduce((sum, s) => sum + s.totalWorkedToday, 0) || 0;

  // Create user status map
  const statusMap = new Map();
  usersStatus?.forEach((status) => {
    statusMap.set(status.userId, status);
  });

  // Get users with status
  const usersWithStatus = users?.map((user) => {
    const status = statusMap.get(user.id);
    const name = user.profile
      ? `${user.profile.firstName} ${user.profile.lastName}`
      : user.email;
    return {
      ...user,
      name,
      status,
    };
  }) || [];

  return (
    <div className="space-y-6 ">
      <div>
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground">Overview of system activity and user status</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {usersLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-2xl font-bold">{totalUsers}</div>
                <p className="text-xs text-muted-foreground">Registered users</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Sessions</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statusLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-2xl font-bold">{activeSessions}</div>
                <p className="text-xs text-muted-foreground">Currently clocked in</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Leaves</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {leavesLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-2xl font-bold">{pendingLeavesCount}</div>
                <p className="text-xs text-muted-foreground">Awaiting approval</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Worked Today</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statusLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-2xl font-bold">{formatDuration(totalWorkedToday)}</div>
                <p className="text-xs text-muted-foreground">All users combined</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* User Activity Table */}
      <Card>
        <CardHeader>
          <CardTitle>User Activity</CardTitle>
          <CardDescription>Current status and activity for all users</CardDescription>
        </CardHeader>
        <CardContent>
          {usersLoading || statusLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : !usersWithStatus || usersWithStatus.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No users found</p>
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
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Worked Today</TableHead>
                      <TableHead className="text-right">Overtime</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {usersWithStatus.map((user) => {
                      const hasOvertime = user.status && user.status.totalWorkedToday > 480; // 8 hours
                      return (
                        <TableRow key={user.id}>
                          <TableCell className="font-medium">{user.name}</TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>
                            <Badge variant="secondary">{user.role.name}</Badge>
                          </TableCell>
                          <TableCell>
                            {user.status ? (
                              user.status.hasActiveSession ? (
                                user.status.hasActiveBreak ? (
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
                          </TableCell>
                          <TableCell className="text-right">
                            {user.status ? formatDuration(user.status.totalWorkedToday) : "-"}
                          </TableCell>
                          <TableCell className="text-right">
                            {hasOvertime ? (
                              <Badge variant="destructive">
                                {formatDuration(user.status!.totalWorkedToday - 480)}
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile Card View */}
              <div className="md:hidden space-y-4">
                {usersWithStatus.map((user) => {
                  const hasOvertime = user.status && user.status.totalWorkedToday > 480;
                  return (
                    <Card key={user.id}>
                      <CardContent className="pt-6">
                        <div className="space-y-3">
                          <div>
                            <p className="font-medium">{user.name}</p>
                            <p className="text-sm text-muted-foreground">{user.email}</p>
                          </div>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <p className="text-muted-foreground">Role</p>
                              <Badge variant="secondary">{user.role.name}</Badge>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Status</p>
                              {user.status ? (
                                user.status.hasActiveSession ? (
                                  user.status.hasActiveBreak ? (
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
                                {user.status ? formatDuration(user.status.totalWorkedToday) : "-"}
                              </p>
                            </div>
                            {hasOvertime && (
                              <div>
                                <p className="text-muted-foreground">Overtime</p>
                                <Badge variant="destructive">
                                  {formatDuration(user.status!.totalWorkedToday - 480)}
                                </Badge>
                              </div>
                            )}
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

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common admin tasks</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button asChild variant="outline" className="w-full justify-start">
              <Link href="/admin/users">
                <Users className="mr-2 h-4 w-4" />
                Manage Users
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-start">
              <Link href="/admin/leaves">
                <Calendar className="mr-2 h-4 w-4" />
                Manage Leaves
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-start">
              <Link href="/admin/payroll">
                <TrendingUp className="mr-2 h-4 w-4" />
                Payroll Preview
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-start">
              <Link href="/app/debug">
                <Bug className="mr-2 h-4 w-4" />
                API Debug
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>System Health</CardTitle>
            <CardDescription>Monitor API health and system status</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Check the health endpoint to verify API connectivity and response format.
            </p>
            <Button asChild variant="outline" className="w-full">
              <Link href="/api/health" target="_blank">
                <Activity className="mr-2 h-4 w-4" />
                View Health Endpoint
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
