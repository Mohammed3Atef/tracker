"use client";

import React from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Clock, Calendar, TrendingUp, Activity, Plus } from "lucide-react";
import { useTimeStatus } from "@/hooks/use-time-status";
import { useMyTime } from "@/hooks/use-my-time";
import { useMyLeaves } from "@/hooks/use-my-leaves";
import { useClockIn, useClockOut } from "@/hooks/use-time-actions";
import { formatDuration, getWeekBounds } from "@/lib/time-helpers";
import { useRouter } from "next/navigation";

export default function AppDashboard() {
  const router = useRouter();
  const { data: timeStatus, isLoading: statusLoading } = useTimeStatus();
  const weekBounds = getWeekBounds(new Date());
  const { data: weekSessions, isLoading: weekLoading } = useMyTime(
    weekBounds.start,
    weekBounds.end
  );
  const { data: myLeaves, isLoading: leavesLoading } = useMyLeaves();
  const clockIn = useClockIn();
  const clockOut = useClockOut();

  // Calculate this week's total
  const weekTotal = React.useMemo(() => {
    if (!weekSessions) return 0;
    return weekSessions.reduce((total, session) => {
      return total + (session.duration || 0);
    }, 0);
  }, [weekSessions]);

  // Calculate leave balance (count approved VACATION and SICK leaves)
  const leaveBalance = React.useMemo(() => {
    if (!myLeaves) return { used: 0, total: 0 };
    const approvedLeaves = myLeaves.filter(
      (leave) => leave.status === "APPROVED" && (leave.type === "VACATION" || leave.type === "SICK")
    );
    // Count days (simplified - assumes each leave is counted as days)
    const used = approvedLeaves.reduce((total, leave) => {
      const start = new Date(leave.startDate);
      const end = new Date(leave.endDate);
      const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      return total + days;
    }, 0);
    // Assume 20 days total per year (can be made configurable)
    return { used, total: 20 };
  }, [myLeaves]);

  const handleClockIn = async () => {
    try {
      await clockIn.mutateAsync();
    } catch (error) {
      // Error handled by mutation
    }
  };

  const handleClockOut = async () => {
    try {
      await clockOut.mutateAsync();
    } catch (error) {
      // Error handled by mutation
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Your activity overview and quick actions</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Status</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statusLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {timeStatus?.hasActiveSession ? (
                    timeStatus.hasActiveBreak ? (
                      <Badge variant="default">On Break</Badge>
                    ) : (
                      <Badge variant="default">Clocked In</Badge>
                    )
                  ) : (
                    <Badge variant="secondary">Clocked Out</Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {timeStatus
                    ? `Worked: ${formatDuration(timeStatus.totalWorkedToday)}`
                    : "No activity today"}
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Week</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {weekLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <>
                <div className="text-2xl font-bold">{formatDuration(weekTotal)}</div>
                <p className="text-xs text-muted-foreground">Total hours worked</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Leave Balance</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {leavesLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {leaveBalance.total - leaveBalance.used} / {leaveBalance.total}
                </div>
                <p className="text-xs text-muted-foreground">Days remaining</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recent Activity</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statusLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : timeStatus?.session ? (
              <>
                <div className="text-sm font-medium">
                  Started: {new Date(timeStatus.session.startTime).toLocaleTimeString()}
                </div>
                <p className="text-xs text-muted-foreground">
                  {timeStatus.session.endTime
                    ? `Ended: ${new Date(timeStatus.session.endTime).toLocaleTimeString()}`
                    : "Currently active"}
                </p>
              </>
            ) : (
              <p className="text-xs text-muted-foreground">No recent activity</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common tasks and shortcuts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {timeStatus?.hasActiveSession ? (
              <Button
                onClick={handleClockOut}
                disabled={clockOut.isPending}
                variant="destructive"
                className="w-full"
              >
                {clockOut.isPending ? (
                  <>
                    <Clock className="mr-2 h-4 w-4 animate-spin" />
                    Clocking Out...
                  </>
                ) : (
                  <>
                    <Clock className="mr-2 h-4 w-4" />
                    Clock Out
                  </>
                )}
              </Button>
            ) : (
              <Button
                onClick={handleClockIn}
                disabled={clockIn.isPending}
                className="w-full"
              >
                {clockIn.isPending ? (
                  <>
                    <Clock className="mr-2 h-4 w-4 animate-spin" />
                    Clocking In...
                  </>
                ) : (
                  <>
                    <Clock className="mr-2 h-4 w-4" />
                    Clock In
                  </>
                )}
              </Button>
            )}
            <Button asChild variant="outline" className="w-full">
              <Link href="/app/time">
                <Activity className="mr-2 h-4 w-4" />
                View Time Tracking
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link href="/app/leaves">
                <Calendar className="mr-2 h-4 w-4" />
                My Leaves
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link href="/app/leaves">
                <Plus className="mr-2 h-4 w-4" />
                Request Leave
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Activity Summary</CardTitle>
          <CardDescription>Your time tracking and leave overview</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <h3 className="text-sm font-medium mb-2">Time Tracking</h3>
              {statusLoading ? (
                <Skeleton className="h-20 w-full" />
              ) : (
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Today:</span>
                    <span className="font-medium">
                      {timeStatus ? formatDuration(timeStatus.totalWorkedToday) : "0m"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">This Week:</span>
                    <span className="font-medium">{formatDuration(weekTotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Status:</span>
                    <span>
                      {timeStatus?.hasActiveSession ? (
                        timeStatus.hasActiveBreak ? (
                          <Badge variant="default">On Break</Badge>
                        ) : (
                          <Badge variant="default">Clocked In</Badge>
                        )
                      ) : (
                        <Badge variant="secondary">Clocked Out</Badge>
                      )}
                    </span>
                  </div>
                </div>
              )}
            </div>
            <div>
              <h3 className="text-sm font-medium mb-2">Leave Requests</h3>
              {leavesLoading ? (
                <Skeleton className="h-20 w-full" />
              ) : (
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Requests:</span>
                    <span className="font-medium">{myLeaves?.length || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Pending:</span>
                    <span className="font-medium">
                      {myLeaves?.filter((l) => l.status === "PENDING").length || 0}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Approved:</span>
                    <span className="font-medium">
                      {myLeaves?.filter((l) => l.status === "APPROVED").length || 0}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
