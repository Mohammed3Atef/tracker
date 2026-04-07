"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Users,
  Clock,
  Calendar,
  TrendingUp,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Coffee,
  UserX,
} from "lucide-react";
import { useUsers } from "@/hooks/use-users";
import { useAllUsersStatus } from "@/hooks/use-user-time-status";
import { usePendingLeaves } from "@/hooks/use-pending-leaves";
import { useApiToast } from "@/hooks/use-api-toast";
import { formatDuration } from "@/lib/time-helpers";

export default function AdminDashboard() {
  const router = useRouter();
  const { data: users, isLoading: usersLoading, error: usersError } = useUsers();
  const { data: usersStatus, isLoading: statusLoading } = useAllUsersStatus();
  const { data: pendingLeaves, isLoading: leavesLoading } = usePendingLeaves();
  const { toastApiError } = useApiToast();

  useEffect(() => {
    if (usersError) toastApiError(usersError as Error);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [usersError]);

  const totalUsers = users?.length || 0;
  const activeSessions = usersStatus?.filter((s) => s.hasActiveSession && !s.hasActiveBreak).length || 0;
  const onBreak = usersStatus?.filter((s) => s.hasActiveBreak).length || 0;
  const totalWorkedToday = usersStatus?.reduce((sum, s) => sum + s.totalWorkedToday, 0) || 0;
  const pendingLeavesCount = pendingLeaves?.length || 0;

  // Merge users with status
  const statusMap = new Map(usersStatus?.map((s) => [s.userId, s]) ?? []);
  const usersWithStatus = (users ?? []).map((user) => {
    const status = statusMap.get(user.id);
    const name = user.profile
      ? `${user.profile.firstName} ${user.profile.lastName}`
      : user.email;
    return { ...user, name, status };
  });

  // Sort: active first, then on break, then clocked out
  const sortedUsers = [...usersWithStatus].sort((a, b) => {
    const scoreA = a.status?.hasActiveSession && !a.status?.hasActiveBreak ? 2 : a.status?.hasActiveBreak ? 1 : 0;
    const scoreB = b.status?.hasActiveSession && !b.status?.hasActiveBreak ? 2 : b.status?.hasActiveBreak ? 1 : 0;
    return scoreB - scoreA;
  });

  return (
    <div className="p-6 space-y-6 max-w-6xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Admin Overview</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
        </p>
      </div>

      {/* Pending leaves alert */}
      {!leavesLoading && pendingLeavesCount > 0 && (
        <div className="flex items-center gap-3 p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg">
          <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
              {pendingLeavesCount} leave {pendingLeavesCount === 1 ? "request" : "requests"} awaiting approval
            </p>
          </div>
          <Button asChild size="sm" variant="outline" className="border-amber-300 text-amber-800 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/40">
            <Link href="/admin/leaves">Review</Link>
          </Button>
        </div>
      )}

      {/* Stats row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Staff</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            {usersLoading ? <Skeleton className="h-8 w-16" /> : (
              <>
                <p className="text-2xl font-bold">{totalUsers}</p>
                <p className="text-xs text-muted-foreground mt-0.5">Registered users</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">Active Now</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            </div>
          </CardHeader>
          <CardContent>
            {statusLoading ? <Skeleton className="h-8 w-16" /> : (
              <>
                <p className="text-2xl font-bold">{activeSessions}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {onBreak > 0 && `${onBreak} on break · `}clocked in
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">Hours Today</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            {statusLoading ? <Skeleton className="h-8 w-16" /> : (
              <>
                <p className="text-2xl font-bold">{formatDuration(totalWorkedToday)}</p>
                <p className="text-xs text-muted-foreground mt-0.5">All staff combined</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">Pending Leaves</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            {leavesLoading ? <Skeleton className="h-8 w-16" /> : (
              <>
                <p className="text-2xl font-bold">{pendingLeavesCount}</p>
                <p className="text-xs text-muted-foreground mt-0.5">Awaiting review</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Team live status */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold">Team Status</CardTitle>
            <Button asChild variant="ghost" size="sm" className="h-7 text-xs">
              <Link href="/admin/team">
                View all <ArrowRight className="ml-1 h-3 w-3" />
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {usersLoading || statusLoading ? (
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : sortedUsers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No users found</p>
            </div>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {sortedUsers.slice(0, 12).map((user) => {
                const isActive = user.status?.hasActiveSession && !user.status?.hasActiveBreak;
                const isOnBreak = user.status?.hasActiveBreak;
                const isOut = !user.status?.hasActiveSession;

                const dotColor = isActive
                  ? "bg-green-500"
                  : isOnBreak
                  ? "bg-orange-400"
                  : "bg-gray-300 dark:bg-gray-600";

                const StatusIcon = isOnBreak ? Coffee : isOut ? UserX : CheckCircle2;

                return (
                  <button
                    key={user.id}
                    onClick={() => router.push(`/admin/users?highlight=${user.id}`)}
                    className="flex items-center gap-3 p-3 rounded-lg border border-border hover:border-primary/40 hover:bg-accent transition-colors text-left w-full"
                  >
                    <div className="relative flex-shrink-0">
                      <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-sm font-semibold text-primary">
                          {user.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <span className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-card ${dotColor}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{user.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {isActive
                          ? `Working · ${formatDuration(user.status?.totalWorkedToday || 0)}`
                          : isOnBreak
                          ? "On break"
                          : "Clocked out"}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick actions */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Manage Users", href: "/admin/users", icon: Users },
          { label: "Time Entries", href: "/admin/time/entries", icon: Clock },
          { label: "Leave Requests", href: "/admin/leaves", icon: Calendar },
          { label: "Reports", href: "/admin/reports", icon: TrendingUp },
        ].map(({ label, href, icon: Icon }) => (
          <Link key={href} href={href} className="group">
            <Card className="hover:border-primary/50 transition-colors cursor-pointer">
              <CardContent className="flex items-center gap-3 p-4">
                <div className="h-8 w-8 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Icon className="h-4 w-4 text-primary" />
                </div>
                <span className="text-sm font-medium flex-1">{label}</span>
                <ArrowRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
