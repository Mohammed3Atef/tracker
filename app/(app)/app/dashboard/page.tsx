"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Clock,
  Calendar,
  TrendingUp,
  Play,
  Square,
  Coffee,
  ArrowRight,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { useTimeStatus } from "@/hooks/use-time-status";
import { useMyTime } from "@/hooks/use-my-time";
import { useMyLeaves } from "@/hooks/use-my-leaves";
import { useClockIn, useClockOut, useStartBreak, useEndBreak } from "@/hooks/use-time-actions";
import {
  formatDuration,
  formatDurationWithSeconds,
  getWeekBounds,
  calculateDurationInSeconds,
} from "@/lib/time-helpers";
import { LEAVE_ALLOWANCE_DAYS } from "@/lib/config";

export default function AppDashboard() {
  const { data: timeStatus, isLoading: statusLoading } = useTimeStatus();

  const weekBounds = useMemo(() => getWeekBounds(new Date()), []);
  const { data: weekSessions, isLoading: weekLoading } = useMyTime(weekBounds.start, weekBounds.end);
  const { data: myLeaves, isLoading: leavesLoading } = useMyLeaves();

  const clockIn = useClockIn();
  const clockOut = useClockOut();
  const startBreak = useStartBreak();
  const endBreak = useEndBreak();

  const [showClockOutDialog, setShowClockOutDialog] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Live timer — only ticks when clocked in
  useEffect(() => {
    if (!timeStatus?.hasActiveSession) return;
    const id = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(id);
  }, [timeStatus?.hasActiveSession]);

  const handleClockOutClick = () => {
    if (timeStatus?.activeBreak) {
      setShowClockOutDialog(true);
    } else {
      clockOut.mutate();
    }
  };

  // Live work duration (excludes breaks)
  const liveDurationSeconds = useMemo(() => {
    if (!timeStatus?.session) return 0;
    const start = new Date(timeStatus.session.startTime);
    const breakSeconds = timeStatus.session.breakSessions.reduce((sum, b) => {
      if (b.duration !== null) return sum + b.duration * 60;
      if (!b.endTime) return sum + calculateDurationInSeconds(new Date(b.startTime), currentTime);
      return sum;
    }, 0);
    return Math.max(0, calculateDurationInSeconds(start, currentTime) - breakSeconds);
  }, [timeStatus?.session, currentTime]);

  // Weekly total in minutes
  const weekTotal = useMemo(() => {
    if (!weekSessions) return 0;
    return weekSessions.reduce((sum, s) => sum + (s.duration || 0), 0);
  }, [weekSessions]);

  // Leave balance
  const leaveBalance = useMemo(() => {
    if (!myLeaves) return { used: 0, total: LEAVE_ALLOWANCE_DAYS };
    const used = myLeaves
      .filter((l) => l.status === "APPROVED" && (l.type === "VACATION" || l.type === "SICK"))
      .reduce((total, l) => {
        const days =
          Math.ceil(
            (new Date(l.endDate).getTime() - new Date(l.startDate).getTime()) /
              (1000 * 60 * 60 * 24)
          ) + 1;
        return total + days;
      }, 0);
    return { used, total: LEAVE_ALLOWANCE_DAYS };
  }, [myLeaves]);

  const leaveRemaining = leaveBalance.total - leaveBalance.used;
  const leavePercent = Math.min(100, (leaveBalance.used / leaveBalance.total) * 100);

  // Status indicator
  const statusColor = timeStatus?.hasActiveSession
    ? timeStatus.activeBreak
      ? "bg-orange-500"
      : "bg-green-500"
    : "bg-gray-400";

  const statusLabel = timeStatus?.hasActiveSession
    ? timeStatus.activeBreak
      ? "On Break"
      : "Clocked In"
    : "Clocked Out";

  return (
    <div className="p-6 space-y-6 max-w-5xl">
      {/* Clock-out confirmation dialog */}
      <Dialog open={showClockOutDialog} onOpenChange={setShowClockOutDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              You're on a break
            </DialogTitle>
            <DialogDescription>
              Clocking out will automatically end your break and complete your session.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowClockOutDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={() => { setShowClockOutDialog(false); clockOut.mutate(); }} disabled={clockOut.isPending}>
              {clockOut.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Square className="h-4 w-4 mr-2" />}
              Clock Out
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
        </p>
      </div>

      {/* Hero clock widget */}
      <Card className="border-2 border-border overflow-hidden">
        <CardContent className="p-6">
          {statusLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-16 w-56" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : (
            <div className="flex flex-col md:flex-row md:items-center gap-6">
              {/* Status + timer */}
              <div className="flex-1 space-y-3">
                <div className="flex items-center gap-2">
                  <span className={`h-2.5 w-2.5 rounded-full ${statusColor} animate-pulse`} />
                  <span className="text-sm font-medium text-muted-foreground">{statusLabel}</span>
                </div>

                {timeStatus?.hasActiveSession ? (
                  <div>
                    <p className="text-5xl font-bold font-mono tracking-tight text-primary">
                      {formatDurationWithSeconds(liveDurationSeconds)}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Started at {new Date(timeStatus.session!.startTime).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                      {timeStatus.activeBreak && (
                        <span className="ml-2 text-orange-500">· On break</span>
                      )}
                    </p>
                  </div>
                ) : (
                  <div>
                    <p className="text-5xl font-bold font-mono tracking-tight text-muted-foreground/40">
                      {formatDuration(timeStatus?.totalWorkedToday || 0)}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">Total worked today</p>
                  </div>
                )}
              </div>

              {/* Action buttons */}
              <div className="flex flex-wrap gap-2">
                {timeStatus?.hasActiveSession ? (
                  <>
                    {timeStatus.activeBreak ? (
                      <Button onClick={() => endBreak.mutate()} disabled={endBreak.isPending} variant="outline" size="lg">
                        {endBreak.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Coffee className="h-4 w-4 mr-2" />}
                        End Break
                      </Button>
                    ) : (
                      <Button onClick={() => startBreak.mutate()} disabled={startBreak.isPending} variant="outline" size="lg">
                        {startBreak.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Coffee className="h-4 w-4 mr-2" />}
                        Take Break
                      </Button>
                    )}
                    <Button onClick={handleClockOutClick} disabled={clockOut.isPending} variant="destructive" size="lg">
                      {clockOut.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Square className="h-4 w-4 mr-2" />}
                      Clock Out
                    </Button>
                  </>
                ) : (
                  <Button onClick={() => clockIn.mutate()} disabled={clockIn.isPending} size="lg" className="px-8">
                    {clockIn.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Play className="h-4 w-4 mr-2" />}
                    Clock In
                  </Button>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stats row */}
      <div className="grid gap-4 sm:grid-cols-3">
        {/* This week */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">This Week</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            {weekLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <>
                <p className="text-2xl font-bold">{formatDuration(weekTotal)}</p>
                <p className="text-xs text-muted-foreground mt-0.5">Total hours worked</p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Leave balance */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">Leave Balance</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            {leavesLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <>
                <p className="text-2xl font-bold">{leaveRemaining} <span className="text-sm font-normal text-muted-foreground">/ {leaveBalance.total} days</span></p>
                <div className="mt-2 h-1.5 w-full bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all"
                    style={{ width: `${leavePercent}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">{leaveBalance.used} days used</p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Leave requests quick view */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">Leave Requests</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            {leavesLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <>
                <p className="text-2xl font-bold">{myLeaves?.filter((l) => l.status === "PENDING").length || 0}</p>
                <p className="text-xs text-muted-foreground mt-0.5">Pending approval</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick links */}
      <div className="grid gap-3 sm:grid-cols-2">
        <Link href="/app/time" className="group">
          <Card className="hover:border-primary/50 transition-colors cursor-pointer">
            <CardContent className="flex items-center gap-3 p-4">
              <div className="h-9 w-9 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Clock className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">Time Tracking</p>
                <p className="text-xs text-muted-foreground">View your sessions & calendar</p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
            </CardContent>
          </Card>
        </Link>

        <Link href="/app/leaves" className="group">
          <Card className="hover:border-primary/50 transition-colors cursor-pointer">
            <CardContent className="flex items-center gap-3 p-4">
              <div className="h-9 w-9 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Calendar className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">Leave Requests</p>
                <p className="text-xs text-muted-foreground">Request and manage time off</p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
            </CardContent>
          </Card>
        </Link>

        <Link href="/app/reports" className="group">
          <Card className="hover:border-primary/50 transition-colors cursor-pointer">
            <CardContent className="flex items-center gap-3 p-4">
              <div className="h-9 w-9 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">Reports</p>
                <p className="text-xs text-muted-foreground">Weekly & monthly summaries</p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
            </CardContent>
          </Card>
        </Link>

        <Link href="/app/time/calendar" className="group">
          <Card className="hover:border-primary/50 transition-colors cursor-pointer">
            <CardContent className="flex items-center gap-3 p-4">
              <div className="h-9 w-9 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Calendar className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">Calendar</p>
                <p className="text-xs text-muted-foreground">View time entries on calendar</p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* This week sessions */}
      {!weekLoading && weekSessions && weekSessions.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold">Recent Sessions</CardTitle>
              <Button asChild variant="ghost" size="sm" className="h-7 text-xs">
                <Link href="/app/time/entries">
                  View all <ArrowRight className="ml-1 h-3 w-3" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2">
              {[...weekSessions]
                .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())
                .slice(0, 5)
                .map((session) => {
                  const start = new Date(session.startTime);
                  const isActive = session.status === "ACTIVE" || session.status === "PAUSED";
                  return (
                    <div key={session.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                      <div className="flex items-center gap-3">
                        <div className={`h-2 w-2 rounded-full flex-shrink-0 ${isActive ? "bg-green-500" : "bg-muted-foreground/30"}`} />
                        <div>
                          <p className="text-sm font-medium">
                            {start.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {start.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                            {session.endTime && ` – ${new Date(session.endTime).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}`}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold">{formatDuration(session.duration || 0)}</p>
                        {isActive && <Badge variant="secondary" className="text-xs">Active</Badge>}
                      </div>
                    </div>
                  );
                })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
