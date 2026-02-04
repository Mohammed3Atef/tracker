"use client";

import React, { useEffect, useState } from "react";
import { useTimeStatus } from "@/hooks/use-time-status";
import { useMyTime } from "@/hooks/use-my-time";
import { useClockIn, useClockOut, useStartBreak, useEndBreak } from "@/hooks/use-time-actions";
import { useApiToast } from "@/hooks/use-api-toast";
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
import { Clock, Play, Pause, Square, Coffee, Loader2, ChevronDown, ChevronUp } from "lucide-react";
import { formatDuration, formatDurationWithSeconds, getWeekBounds, calculateDuration, calculateDurationInSeconds } from "@/lib/time-helpers";
import { SessionDetails } from "@/components/time/session-details";

export default function TimePage() {
  const { data: status, isLoading: statusLoading, error: statusError } = useTimeStatus();
  const weekBounds = getWeekBounds(new Date());
  const { data: sessions, isLoading: sessionsLoading } = useMyTime(weekBounds.start, weekBounds.end);
  const { toastApiError } = useApiToast();

  const clockIn = useClockIn();
  const clockOut = useClockOut();
  const startBreak = useStartBreak();
  const endBreak = useEndBreak();

  // Handle errors
  useEffect(() => {
    if (statusError) {
      toastApiError(statusError as Error);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusError]);

  useEffect(() => {
    if (clockIn.error) {
      toastApiError(clockIn.error as Error);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clockIn.error]);

  useEffect(() => {
    if (clockOut.error) {
      toastApiError(clockOut.error as Error);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clockOut.error]);

  useEffect(() => {
    if (startBreak.error) {
      toastApiError(startBreak.error as Error);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startBreak.error]);

  useEffect(() => {
    if (endBreak.error) {
      toastApiError(endBreak.error as Error);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [endBreak.error]);

  const handleClockIn = () => {
    clockIn.mutate();
  };

  const handleClockOut = () => {
    clockOut.mutate();
  };

  const handleStartBreak = () => {
    startBreak.mutate();
  };

  const handleEndBreak = () => {
    endBreak.mutate();
  };

  // Live timer state for current session
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update current time every second for live timer
  useEffect(() => {
    if (status?.hasActiveSession) {
      const interval = setInterval(() => {
        setCurrentTime(new Date());
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [status?.hasActiveSession]);

  // Calculate current session duration in seconds (live timer)
  const currentSessionDurationSeconds = status?.session
    ? (() => {
        const now = currentTime;
        const start = new Date(status.session.startTime);
        // Calculate total break duration in seconds
        const totalBreakDurationSeconds = status.session.breakSessions.reduce((sum, breakSession) => {
          if (breakSession.duration !== null) {
            // Convert minutes to seconds
            return sum + (breakSession.duration * 60);
          } else if (breakSession.endTime === null) {
            // Active break - calculate current duration in seconds
            return sum + calculateDurationInSeconds(new Date(breakSession.startTime), now);
          }
          return sum;
        }, 0);
        const totalDurationSeconds = calculateDurationInSeconds(start, now);
        return totalDurationSeconds - totalBreakDurationSeconds;
      })()
    : 0;

  // Calculate break duration in seconds if active
  const activeBreakDurationSeconds = status?.activeBreak
    ? calculateDurationInSeconds(new Date(status.activeBreak.startTime), currentTime)
    : 0;

  // Group sessions by date
  const sessionsByDate = sessions?.reduce((acc, session) => {
    const date = new Date(session.startTime).toDateString();
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(session);
    return acc;
  }, {} as Record<string, typeof sessions>) || {};

  // Calculate daily totals
  const dailyTotals = Object.entries(sessionsByDate).map(([date, daySessions]) => {
    const totalMinutes = daySessions.reduce((sum, session) => {
      if (session.duration !== null) {
        return sum + session.duration;
      }
      // If session is active, calculate current duration
      if (session.status === "ACTIVE" || session.status === "PAUSED") {
        const now = new Date();
        const start = new Date(session.startTime);
        const totalBreakDuration = session.breakSessions.reduce((breakSum, breakSession) => {
          if (breakSession.duration !== null) {
            return breakSum + breakSession.duration;
          } else if (breakSession.endTime === null) {
            return breakSum + calculateDuration(new Date(breakSession.startTime), now);
          }
          return breakSum;
        }, 0);
        const totalDuration = calculateDuration(start, now);
        return sum + (totalDuration - totalBreakDuration);
      }
      return sum;
    }, 0);

    return {
      date: new Date(date),
      totalMinutes,
      sessionCount: daySessions.length,
      hasIncomplete: daySessions.some((s) => s.status === "ACTIVE" || s.status === "PAUSED"),
    };
  });

  // Sort by date descending
  dailyTotals.sort((a, b) => b.date.getTime() - a.date.getTime());

  // State for expanded days
  const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set());
  
  const toggleDay = (date: string) => {
    const newExpanded = new Set(expandedDays);
    if (newExpanded.has(date)) {
      newExpanded.delete(date);
    } else {
      newExpanded.add(date);
    }
    setExpandedDays(newExpanded);
  };

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold">Time Tracking</h1>
        <p className="text-muted-foreground">Track your work hours and breaks</p>
      </div>

      {/* Today Status Card */}
      <Card>
        <CardHeader>
          <CardTitle>Today Status</CardTitle>
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
              <div className="flex items-center justify-between">
                <div className="space-y-2">
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
                  
                  {/* Work Time - Always show when clocked in */}
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
                  
                  {/* Break Time - Show when on break */}
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
                  
                  {/* Total Worked Today - Clearly labeled as work time only */}
                  <div className="space-y-1 pt-3 border-t">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Total Work Time Today
                    </p>
                    <p className="text-2xl font-bold">
                      {formatDuration(status?.totalWorkedToday || 0)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Work time only (breaks excluded)
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 pt-4">
                <Button
                  onClick={handleClockIn}
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
                  onClick={handleStartBreak}
                  disabled={
                    !status?.hasActiveSession ||
                    !!status?.activeBreak ||
                    startBreak.isPending
                  }
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
                  onClick={handleEndBreak}
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
                  onClick={handleClockOut}
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
              <p>No time entries for this week</p>
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
