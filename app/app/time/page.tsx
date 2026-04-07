"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useTimeStatus } from "@/hooks/use-time-status";
import { useMyTime } from "@/hooks/use-my-time";
import { useClockIn, useClockOut, useStartBreak, useEndBreak } from "@/hooks/use-time-actions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Clock, Play, Pause, Square, Coffee, Loader2, ChevronDown, ChevronUp, AlertTriangle } from "lucide-react";
import { formatDuration, formatDurationWithSeconds, getWeekBounds, calculateDuration, calculateDurationInSeconds } from "@/lib/time-helpers";
import { SessionDetails } from "@/components/time/session-details";

export default function TimePage() {
  const { data: status, isLoading: statusLoading } = useTimeStatus();

  // Memoized to prevent query key changes on every render
  const weekBounds = useMemo(() => getWeekBounds(new Date()), []);
  const { data: sessions, isLoading: sessionsLoading } = useMyTime(weekBounds.start, weekBounds.end);

  // Mutations — errors are handled internally via useApiToast
  const clockIn = useClockIn();
  const clockOut = useClockOut();
  const startBreak = useStartBreak();
  const endBreak = useEndBreak();

  // Clock-out confirmation dialog when user is on an active break
  const [showClockOutDialog, setShowClockOutDialog] = useState(false);

  const handleClockOutClick = () => {
    if (status?.activeBreak) {
      setShowClockOutDialog(true);
    } else {
      clockOut.mutate();
    }
  };

  const confirmClockOut = () => {
    setShowClockOutDialog(false);
    clockOut.mutate();
  };

  // Live timer state for current session
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    if (!status?.hasActiveSession) return;
    const interval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, [status?.hasActiveSession]);

  // Calculate current session duration in seconds (live timer)
  const currentSessionDurationSeconds = useMemo(() => {
    if (!status?.session) return 0;
    const start = new Date(status.session.startTime);
    const totalBreakSeconds = status.session.breakSessions.reduce((sum, b) => {
      if (b.duration !== null) return sum + b.duration * 60;
      if (b.endTime === null) return sum + calculateDurationInSeconds(new Date(b.startTime), currentTime);
      return sum;
    }, 0);
    return calculateDurationInSeconds(start, currentTime) - totalBreakSeconds;
  }, [status?.session, currentTime]);

  const activeBreakDurationSeconds = useMemo(() => {
    if (!status?.activeBreak) return 0;
    return calculateDurationInSeconds(new Date(status.activeBreak.startTime), currentTime);
  }, [status?.activeBreak, currentTime]);

  // Group sessions by date
  const sessionsByDate = useMemo(() => {
    return sessions?.reduce((acc, session) => {
      const date = new Date(session.startTime).toDateString();
      if (!acc[date]) acc[date] = [];
      acc[date].push(session);
      return acc;
    }, {} as Record<string, typeof sessions>) ?? {};
  }, [sessions]);

  // Daily totals sorted descending
  const dailyTotals = useMemo(() => {
    return Object.entries(sessionsByDate)
      .map(([date, daySessions]) => {
        const totalMinutes = daySessions.reduce((sum, session) => {
          if (session.duration !== null) return sum + session.duration;
          if (session.status === "ACTIVE" || session.status === "PAUSED") {
            const now = new Date();
            const start = new Date(session.startTime);
            const breakMins = session.breakSessions.reduce((bs, b) => {
              if (b.duration !== null) return bs + b.duration;
              if (b.endTime === null) return bs + calculateDuration(new Date(b.startTime), now);
              return bs;
            }, 0);
            return sum + calculateDuration(start, now) - breakMins;
          }
          return sum;
        }, 0);
        return {
          date: new Date(date),
          totalMinutes,
          sessionCount: daySessions.length,
          hasIncomplete: daySessions.some((s) => s.status === "ACTIVE" || s.status === "PAUSED"),
        };
      })
      .sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [sessionsByDate]);

  const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set());
  const toggleDay = (date: string) => {
    setExpandedDays((prev) => {
      const next = new Set(prev);
      next.has(date) ? next.delete(date) : next.add(date);
      return next;
    });
  };

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold">Time Tracking</h1>
        <p className="text-muted-foreground">Track your work hours and breaks</p>
      </div>

      {/* Clock-out confirmation dialog */}
      <Dialog open={showClockOutDialog} onOpenChange={setShowClockOutDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              You're currently on a break
            </DialogTitle>
            <DialogDescription>
              Clocking out will automatically end your active break and complete your session.
              Are you sure you want to clock out?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowClockOutDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmClockOut} disabled={clockOut.isPending}>
              {clockOut.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Square className="h-4 w-4 mr-2" />
              )}
              Clock Out
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Today Status Card */}
      <Card>
        <CardHeader>
          <CardTitle>Today's Status</CardTitle>
          <CardDescription>Your current time tracking status</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {statusLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          ) : (
            <>
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-muted-foreground" />
                  <span className="text-sm font-medium">
                    {status?.hasActiveSession ? "Clocked In" : "Clocked Out"}
                  </span>
                  {status?.hasActiveSession && (
                    <Badge variant={status.activeBreak ? "secondary" : "default"}>
                      {status.activeBreak ? "On Break" : "Working"}
                    </Badge>
                  )}
                </div>

                {status?.hasActiveSession && (
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Work Time
                    </p>
                    <p className="text-3xl font-bold text-primary font-mono">
                      {formatDurationWithSeconds(currentSessionDurationSeconds)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {status.activeBreak ? "Paused (on break)" : "Active"}
                    </p>
                  </div>
                )}

                {status?.activeBreak && (
                  <div className="space-y-1 pt-3 border-t border-dashed">
                    <p className="text-xs font-medium text-orange-600 uppercase tracking-wide">
                      Break Time
                    </p>
                    <p className="text-2xl font-bold text-orange-500 font-mono">
                      {formatDurationWithSeconds(activeBreakDurationSeconds)}
                    </p>
                    <p className="text-sm text-muted-foreground">Currently on break</p>
                  </div>
                )}

                <div className="space-y-1 pt-3 border-t">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Total Work Time Today
                  </p>
                  <p className="text-2xl font-bold">
                    {formatDuration(status?.totalWorkedToday || 0)}
                  </p>
                  <p className="text-sm text-muted-foreground">Work time only (breaks excluded)</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 pt-4">
                <Button
                  onClick={() => clockIn.mutate()}
                  disabled={status?.hasActiveSession || clockIn.isPending}
                  variant="default"
                >
                  {clockIn.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Play className="h-4 w-4 mr-2" />
                  )}
                  Clock In
                </Button>

                <Button
                  onClick={() => startBreak.mutate()}
                  disabled={!status?.hasActiveSession || !!status?.activeBreak || startBreak.isPending}
                  variant="outline"
                >
                  {startBreak.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Coffee className="h-4 w-4 mr-2" />
                  )}
                  Start Break
                </Button>

                <Button
                  onClick={() => endBreak.mutate()}
                  disabled={!status?.activeBreak || endBreak.isPending}
                  variant="outline"
                >
                  {endBreak.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Pause className="h-4 w-4 mr-2" />
                  )}
                  End Break
                </Button>

                <Button
                  onClick={handleClockOutClick}
                  disabled={!status?.hasActiveSession || clockOut.isPending}
                  variant="destructive"
                >
                  {clockOut.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Square className="h-4 w-4 mr-2" />
                  )}
                  Clock Out
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* This Week Section */}
      <Card>
        <CardHeader>
          <CardTitle>This Week</CardTitle>
          <CardDescription>Your time tracking for the current week</CardDescription>
        </CardHeader>
        <CardContent>
          {sessionsLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : dailyTotals.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Clock className="h-12 w-12 mx-auto mb-4 opacity-30" />
              <p>No time entries this week</p>
              <p className="text-sm mt-1">Clock in to start tracking</p>
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Total Time</TableHead>
                      <TableHead>Sessions</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dailyTotals.map((day) => {
                      const dayKey = day.date.toISOString();
                      const daySessions = sessionsByDate[day.date.toDateString()] || [];
                      const isExpanded = expandedDays.has(dayKey);

                      return (
                        <React.Fragment key={dayKey}>
                          <TableRow
                            className="cursor-pointer hover:bg-muted/50"
                            onClick={() => toggleDay(dayKey)}
                          >
                            <TableCell>
                              <div className="flex items-center gap-2">
                                {isExpanded ? (
                                  <ChevronUp className="h-4 w-4" />
                                ) : (
                                  <ChevronDown className="h-4 w-4" />
                                )}
                                {day.date.toLocaleDateString("en-US", {
                                  weekday: "short",
                                  month: "short",
                                  day: "numeric",
                                })}
                              </div>
                            </TableCell>
                            <TableCell className="font-medium">
                              {formatDuration(day.totalMinutes)}
                            </TableCell>
                            <TableCell>{day.sessionCount}</TableCell>
                            <TableCell>
                              {day.hasIncomplete ? (
                                <Badge variant="secondary">In Progress</Badge>
                              ) : (
                                <Badge variant="outline">Completed</Badge>
                              )}
                            </TableCell>
                          </TableRow>
                          {isExpanded && (
                            <TableRow>
                              <TableCell colSpan={4} className="p-4 bg-muted/30">
                                <div className="space-y-4">
                                  {daySessions.map((session) => (
                                    <SessionDetails
                                      key={session.id}
                                      session={session}
                                      showDate={false}
                                    />
                                  ))}
                                </div>
                              </TableCell>
                            </TableRow>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile Card View */}
              <div className="md:hidden space-y-4">
                {dailyTotals.map((day) => {
                  const dayKey = day.date.toISOString();
                  const daySessions = sessionsByDate[day.date.toDateString()] || [];
                  const isExpanded = expandedDays.has(dayKey);

                  return (
                    <Card key={dayKey}>
                      <CardContent className="pt-6">
                        <div
                          className="flex items-center justify-between mb-2 cursor-pointer"
                          onClick={() => toggleDay(dayKey)}
                        >
                          <div className="flex items-center gap-2">
                            {isExpanded ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                            <span className="font-medium">
                              {day.date.toLocaleDateString("en-US", {
                                weekday: "short",
                                month: "short",
                                day: "numeric",
                              })}
                            </span>
                          </div>
                          {day.hasIncomplete ? (
                            <Badge variant="secondary">In Progress</Badge>
                          ) : (
                            <Badge variant="outline">Completed</Badge>
                          )}
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-2xl font-bold">
                            {formatDuration(day.totalMinutes)}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            {day.sessionCount} {day.sessionCount === 1 ? "session" : "sessions"}
                          </span>
                        </div>
                        {isExpanded && (
                          <div className="mt-4 pt-4 border-t space-y-4">
                            {daySessions.map((session) => (
                              <SessionDetails
                                key={session.id}
                                session={session}
                                showDate={false}
                              />
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
