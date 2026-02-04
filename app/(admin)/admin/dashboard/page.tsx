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
import { Bug, Activity, Users, Clock, Calendar, TrendingUp, ArrowRight, Plus } from "lucide-react";
import { useUsers } from "@/hooks/use-users";
import { useAllUsersStatus } from "@/hooks/use-user-time-status";
import { usePendingLeaves } from "@/hooks/use-pending-leaves";
import { useApiToast } from "@/hooks/use-api-toast";
import { formatDuration } from "@/lib/time-helpers";
import { SummaryCard } from "@/components/dashboard/summary-card";
import { TeamGrid } from "@/components/dashboard/team-grid";

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
        <SummaryCard
          title="Total Users"
          value={totalUsers}
          description="Registered users"
          icon={Users}
          isLoading={usersLoading}
        />

        <SummaryCard
          title="Active Sessions"
          value={activeSessions}
          description="Currently clocked in"
          icon={Clock}
          isLoading={statusLoading}
        />

        <SummaryCard
          title="Pending Leaves"
          value={pendingLeavesCount}
          description="Awaiting approval"
          icon={Calendar}
          isLoading={leavesLoading}
        />

        <SummaryCard
          title="Total Worked Today"
          value={formatDuration(totalWorkedToday)}
          description="All users combined"
          icon={TrendingUp}
          isLoading={statusLoading}
        />
      </div>

      {/* Team Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Team Overview</CardTitle>
              <CardDescription>Current status of all team members</CardDescription>
            </div>
            <Button asChild variant="ghost" size="sm">
              <Link href="/admin/team">
                View All
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {usersLoading || statusLoading ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
          ) : usersWithStatus && usersWithStatus.length > 0 ? (
            <TeamGrid
              members={usersWithStatus.map((user) => ({
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role.name,
                status: user.status,
              }))}
              onViewDetails={(memberId) => {
                // Navigate to user details or open dialog
                window.location.href = `/admin/users#${memberId}`;
              }}
            />
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No users found</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-3">
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
              <Link href="/admin/team">
                <Activity className="mr-2 h-4 w-4" />
                Team View
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-start">
              <Link href="/admin/time/entries">
                <Clock className="mr-2 h-4 w-4" />
                Time Entries
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-start">
              <Link href="/admin/leaves">
                <Calendar className="mr-2 h-4 w-4" />
                Manage Leaves
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-start">
              <Link href="/admin/reports">
                <TrendingUp className="mr-2 h-4 w-4" />
                Reports
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Today's Summary</CardTitle>
            <CardDescription>Team activity overview</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Active Employees:</span>
                <span className="font-semibold text-lg">{activeSessions}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Total Hours:</span>
                <span className="font-semibold text-lg">{formatDuration(totalWorkedToday)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Total Users:</span>
                <span className="font-semibold text-lg">{totalUsers}</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t">
                <span className="text-muted-foreground">Pending Leaves:</span>
                <Badge variant="default">{pendingLeavesCount}</Badge>
              </div>
            </div>
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
