"use client";

import React from "react";
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
import { Clock, Calendar, TrendingUp, Activity, Plus, Play, Square, Coffee, ArrowRight } from "lucide-react";
import { useTimeStatus } from "@/hooks/use-time-status";
import { useMyTime } from "@/hooks/use-my-time";
import { useMyLeaves } from "@/hooks/use-my-leaves";
import { useClockIn, useClockOut, useStartBreak, useEndBreak } from "@/hooks/use-time-actions";
import { formatDuration, getWeekBounds, calculateDuration } from "@/lib/time-helpers";
import { useRouter } from "next/navigation";
import { SummaryCard } from "@/components/dashboard/summary-card";

export default function AppDashboard() {
  const router = useRouter();
  const { data: timeStatus, isLoading: statusLoading } = useTimeStatus();
  
  // Memoize date calculations to prevent query key changes
  const weekBounds = React.useMemo(() => getWeekBounds(new Date()), []);
  const { data: weekSessions, isLoading: weekLoading } = useMyTime(
    weekBounds.start,
    weekBounds.end
  );
  const { data: myLeaves, isLoading: leavesLoading } = useMyLeaves();
  const clockIn = useClockIn();
  const clockOut = useClockOut();
  const startBreak = useStartBreak();
  const endBreak = useEndBreak();
  
  // Get recent time entries (last 7 days) - memoized to prevent re-querying
  const recentDateRange = React.useMemo(() => {
    const today = new Date();
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);
    return { from: weekAgo, to: today };
  }, []);
  
  const { data: recentSessions } = useMyTime(recentDateRange.from, recentDateRange.to);
  
  // Get recent sessions sorted by date
  const recentTimeEntries = React.useMemo(() => {
    if (!recentSessions) return [];
    return [...recentSessions]
      .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())
      .slice(0, 5);
  }, [recentSessions]);

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
        <SummaryCard
          title="Today's Status"
          value={
            timeStatus?.hasActiveSession ? (
              timeStatus.activeBreak ? (
                <Badge variant="default" className="bg-orange-500">On Break</Badge>
              ) : (
                <Badge variant="default" className="bg-green-500">Clocked In</Badge>
              )
            ) : (
              <Badge variant="secondary">Clocked Out</Badge>
            )
          }
          description={
            timeStatus
              ? `Worked: ${formatDuration(timeStatus.totalWorkedToday)}`
              : "No activity today"
          }
          icon={Clock}
          isLoading={statusLoading}
        />

        <SummaryCard
          title="This Week"
          value={formatDuration(weekTotal)}
          description="Total hours worked"
          icon={TrendingUp}
          isLoading={weekLoading}
        />

        <SummaryCard
          title="Leave Balance"
          value={`${leaveBalance.total - leaveBalance.used} / ${leaveBalance.total}`}
          description="Days remaining"
          icon={Calendar}
          isLoading={leavesLoading}
        />

        <SummaryCard
          title="Recent Activity"
          value={
            timeStatus?.session ? (
              <span className="text-sm">
                {new Date(timeStatus.session.startTime).toLocaleTimeString()}
              </span>
            ) : (
              <span className="text-sm text-muted-foreground">No activity</span>
            )
          }
          description={
            timeStatus?.session?.endTime
              ? `Ended: ${new Date(timeStatus.session.endTime).toLocaleTimeString()}`
              : timeStatus?.session
              ? "Currently active"
              : ""
          }
          icon={Activity}
          isLoading={statusLoading}
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks and shortcuts</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3">
              {timeStatus?.hasActiveSession ? (
                <>
                  <Button
                    onClick={handleClockOut}
                    disabled={clockOut.isPending}
                    variant="destructive"
                    className="w-full"
                    size="lg"
                  >
                    {clockOut.isPending ? (
                      <>
                        <Square className="mr-2 h-4 w-4 animate-spin" />
                        Clocking Out...
                      </>
                    ) : (
                      <>
                        <Square className="mr-2 h-4 w-4" />
                        Clock Out
                      </>
                    )}
                  </Button>
                  {timeStatus.activeBreak ? (
                    <Button
                      onClick={() => endBreak.mutate()}
                      disabled={endBreak.isPending}
                      variant="outline"
                      className="w-full"
                    >
                      {endBreak.isPending ? (
                        <>
                          <Coffee className="mr-2 h-4 w-4 animate-spin" />
                          Ending Break...
                        </>
                      ) : (
                        <>
                          <Coffee className="mr-2 h-4 w-4" />
                          End Break
                        </>
                      )}
                    </Button>
                  ) : (
                    <Button
                      onClick={() => startBreak.mutate()}
                      disabled={startBreak.isPending}
                      variant="outline"
                      className="w-full"
                    >
                      {startBreak.isPending ? (
                        <>
                          <Coffee className="mr-2 h-4 w-4 animate-spin" />
                          Starting Break...
                        </>
                      ) : (
                        <>
                          <Coffee className="mr-2 h-4 w-4" />
                          Start Break
                        </>
                      )}
                    </Button>
                  )}
                </>
              ) : (
                <Button
                  onClick={handleClockIn}
                  disabled={clockIn.isPending}
                  className="w-full"
                  size="lg"
                >
                  {clockIn.isPending ? (
                    <>
                      <Play className="mr-2 h-4 w-4 animate-spin" />
                      Clocking In...
                    </>
                  ) : (
                    <>
                      <Play className="mr-2 h-4 w-4" />
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
                <Link href="/app/time/calendar">
                  <Calendar className="mr-2 h-4 w-4" />
                  Calendar View
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

        {/* Today's Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Today's Summary</CardTitle>
            <CardDescription>Your time tracking for today</CardDescription>
          </CardHeader>
          <CardContent>
            {statusLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
              </div>
            ) : timeStatus ? (
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Work Time</span>
                  <span className="text-lg font-bold">
                    {formatDuration(timeStatus.totalWorkedToday)}
                  </span>
                </div>
                {timeStatus.session && (
                  <div className="space-y-2 pt-2 border-t">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground flex items-center gap-1">
                        <Play className="h-3 w-3 text-green-500" />
                        Started
                      </span>
                      <span>
                        {new Date(timeStatus.session.startTime).toLocaleTimeString()}
                      </span>
                    </div>
                    {timeStatus.session.endTime && (
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground flex items-center gap-1">
                          <Square className="h-3 w-3 text-red-500" />
                          Ended
                        </span>
                        <span>
                          {new Date(timeStatus.session.endTime).toLocaleTimeString()}
                        </span>
                      </div>
                    )}
                    {timeStatus.session.breakSessions.length > 0 && (
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground flex items-center gap-1">
                          <Coffee className="h-3 w-3 text-orange-500" />
                          Breaks
                        </span>
                        <span>
                          {timeStatus.session.breakSessions.length} break
                          {timeStatus.session.breakSessions.length !== 1 ? "s" : ""}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No activity today</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Time Entries */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Recent Time Entries</CardTitle>
              <CardDescription>Your latest time tracking sessions</CardDescription>
            </div>
            <Button asChild variant="ghost" size="sm">
              <Link href="/app/time/entries">
                View All
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {!recentTimeEntries || recentTimeEntries.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No time entries yet</p>
              <p className="text-sm mt-2">Start tracking your time to see entries here</p>
            </div>
          ) : (
            <div className="hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Start Time</TableHead>
                    <TableHead>End Time</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Breaks</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentTimeEntries.map((session) => {
                    const startTime = new Date(session.startTime);
                    const endTime = session.endTime ? new Date(session.endTime) : null;
                    const isActive = session.status === "ACTIVE" || session.status === "PAUSED";
                    const duration = session.duration !== null
                      ? session.duration
                      : endTime
                      ? calculateDuration(startTime, endTime)
                      : 0;

                    return (
                      <TableRow key={session.id}>
                        <TableCell>
                          {startTime.toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Play className="h-3 w-3 text-green-500" />
                            {startTime.toLocaleTimeString("en-US", {
                              hour: "numeric",
                              minute: "2-digit",
                            })}
                          </div>
                        </TableCell>
                        <TableCell>
                          {endTime ? (
                            <div className="flex items-center gap-1">
                              <Square className="h-3 w-3 text-red-500" />
                              {endTime.toLocaleTimeString("en-US", {
                                hour: "numeric",
                                minute: "2-digit",
                              })}
                            </div>
                          ) : isActive ? (
                            <Badge variant="default">In Progress</Badge>
                          ) : (
                            "-"
                          )}
                        </TableCell>
                        <TableCell className="font-medium">
                          {formatDuration(duration)}
                        </TableCell>
                        <TableCell>
                          {session.breakSessions.length > 0 ? (
                            <div className="flex items-center gap-1">
                              <Coffee className="h-3 w-3 text-orange-500" />
                              {session.breakSessions.length}
                            </div>
                          ) : (
                            "-"
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              isActive
                                ? "default"
                                : session.status === "COMPLETED"
                                ? "outline"
                                : "secondary"
                            }
                          >
                            {session.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
          {/* Mobile view */}
          <div className="md:hidden space-y-3">
            {recentTimeEntries.map((session) => {
              const startTime = new Date(session.startTime);
              const endTime = session.endTime ? new Date(session.endTime) : null;
              const isActive = session.status === "ACTIVE" || session.status === "PAUSED";
              const duration = session.duration !== null
                ? session.duration
                : endTime
                ? calculateDuration(startTime, endTime)
                : 0;

              return (
                <Card key={session.id}>
                  <CardContent className="pt-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-sm">
                          {startTime.toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                        <Badge
                          variant={
                            isActive
                              ? "default"
                              : session.status === "COMPLETED"
                              ? "outline"
                              : "secondary"
                          }
                        >
                          {session.status}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-muted-foreground">Start: </span>
                          {startTime.toLocaleTimeString("en-US", {
                            hour: "numeric",
                            minute: "2-digit",
                          })}
                        </div>
                        <div>
                          <span className="text-muted-foreground">Duration: </span>
                          <span className="font-medium">{formatDuration(duration)}</span>
                        </div>
                        {endTime && (
                          <div>
                            <span className="text-muted-foreground">End: </span>
                            {endTime.toLocaleTimeString("en-US", {
                              hour: "numeric",
                              minute: "2-digit",
                            })}
                          </div>
                        )}
                        {session.breakSessions.length > 0 && (
                          <div>
                            <span className="text-muted-foreground">Breaks: </span>
                            {session.breakSessions.length}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Weekly Summary */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Weekly Summary</CardTitle>
              <CardDescription>Your time tracking overview for this week</CardDescription>
            </div>
            <Button asChild variant="ghost" size="sm">
              <Link href="/app/reports">
                View Reports
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <h3 className="text-sm font-medium mb-3">Time Tracking</h3>
              {statusLoading || weekLoading ? (
                <Skeleton className="h-24 w-full" />
              ) : (
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Today:</span>
                    <span className="font-semibold text-lg">
                      {timeStatus ? formatDuration(timeStatus.totalWorkedToday) : "0m"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">This Week:</span>
                    <span className="font-semibold text-lg">{formatDuration(weekTotal)}</span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t">
                    <span className="text-muted-foreground">Status:</span>
                    {timeStatus?.hasActiveSession ? (
                      timeStatus.activeBreak ? (
                        <Badge variant="default" className="bg-orange-500">On Break</Badge>
                      ) : (
                        <Badge variant="default" className="bg-green-500">Clocked In</Badge>
                      )
                    ) : (
                      <Badge variant="secondary">Clocked Out</Badge>
                    )}
                  </div>
                </div>
              )}
            </div>
            <div>
              <h3 className="text-sm font-medium mb-3">Leave Requests</h3>
              {leavesLoading ? (
                <Skeleton className="h-24 w-full" />
              ) : (
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Total Requests:</span>
                    <span className="font-semibold text-lg">{myLeaves?.length || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Pending:</span>
                    <span className="font-semibold text-lg">
                      {myLeaves?.filter((l) => l.status === "PENDING").length || 0}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Approved:</span>
                    <span className="font-semibold text-lg">
                      {myLeaves?.filter((l) => l.status === "APPROVED").length || 0}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t">
                    <span className="text-muted-foreground">Remaining:</span>
                    <span className="font-semibold text-lg">
                      {leaveBalance.total - leaveBalance.used} days
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
