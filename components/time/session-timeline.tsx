"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDuration, calculateDuration } from "@/lib/time-helpers";
import { Clock, Coffee } from "lucide-react";

export interface BreakSession {
  id: string;
  startTime: string;
  endTime: string | null;
  duration: number | null;
  type: string;
}

export interface TimeSession {
  id: string;
  startTime: string;
  endTime: string | null;
  duration: number | null;
  status: string;
  breakSessions: BreakSession[];
}

interface SessionTimelineProps {
  sessions: TimeSession[];
  date?: Date;
}

export function SessionTimeline({ sessions, date }: SessionTimelineProps) {
  if (sessions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Timeline
          </CardTitle>
          <CardDescription>No sessions for this day</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  // Sort sessions by start time
  const sortedSessions = [...sessions].sort(
    (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
  );

  // Get day boundaries
  const targetDate = date || new Date(sortedSessions[0].startTime);
  const dayStart = new Date(targetDate);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(dayStart);
  dayEnd.setHours(23, 59, 59, 999);
  const dayDuration = dayEnd.getTime() - dayStart.getTime();

  // Helper to calculate position percentage
  const getPosition = (time: Date): number => {
    const timeMs = time.getTime();
    const offset = timeMs - dayStart.getTime();
    return Math.max(0, Math.min(100, (offset / dayDuration) * 100));
  };

  // Helper to calculate width percentage
  const getWidth = (start: Date, end: Date): number => {
    const duration = end.getTime() - start.getTime();
    return Math.max(0.5, (duration / dayDuration) * 100);
  };

  // Format time for display
  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Timeline
        </CardTitle>
        <CardDescription>
          {targetDate.toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Timeline Bar */}
          <div className="relative">
            {/* Hour markers */}
            <div className="relative h-8 mb-4">
              {Array.from({ length: 24 }, (_, i) => {
                const hour = new Date(dayStart);
                hour.setHours(i, 0, 0, 0);
                const position = getPosition(hour);
                return (
                  <div
                    key={i}
                    className="absolute top-0 h-full border-l border-muted"
                    style={{ left: `${position}%` }}
                  >
                    {i % 4 === 0 && (
                      <span className="absolute -top-5 left-0 text-xs text-muted-foreground whitespace-nowrap">
                        {i === 0 ? "12 AM" : i < 12 ? `${i} AM` : i === 12 ? "12 PM" : `${i - 12} PM`}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Sessions and Breaks */}
            <div className="relative space-y-2">
              {sortedSessions.map((session) => {
                const sessionStart = new Date(session.startTime);
                const sessionEnd = session.endTime
                  ? new Date(session.endTime)
                  : new Date(); // Active session
                const isActive = session.status === "ACTIVE" || session.status === "PAUSED";

                // Sort breaks by start time
                const sortedBreaks = [...session.breakSessions].sort(
                  (a, b) =>
                    new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
                );

                // Calculate work periods (between breaks)
                const workPeriods: Array<{ start: Date; end: Date }> = [];
                let currentStart = sessionStart;

                for (const breakSession of sortedBreaks) {
                  const breakStart = new Date(breakSession.startTime);
                  if (breakStart > currentStart) {
                    workPeriods.push({ start: currentStart, end: breakStart });
                  }
                  const breakEnd = breakSession.endTime
                    ? new Date(breakSession.endTime)
                    : new Date(); // Active break
                  currentStart = breakEnd;
                }

                // Add final work period if session hasn't ended
                if (currentStart < sessionEnd) {
                  workPeriods.push({ start: currentStart, end: sessionEnd });
                }

                return (
                  <div key={session.id} className="space-y-1">
                    {/* Work Periods */}
                    {workPeriods.map((period, idx) => {
                      const left = getPosition(period.start);
                      const width = getWidth(period.start, period.end);
                      return (
                        <div
                          key={`work-${idx}`}
                          className="absolute h-8 bg-primary/80 rounded hover:bg-primary transition-colors"
                          style={{
                            left: `${left}%`,
                            width: `${width}%`,
                          }}
                          title={`Work: ${formatTime(period.start)} - ${formatTime(period.end)}`}
                        />
                      );
                    })}

                    {/* Break Periods */}
                    {sortedBreaks.map((breakSession) => {
                      const breakStart = new Date(breakSession.startTime);
                      const breakEnd = breakSession.endTime
                        ? new Date(breakSession.endTime)
                        : new Date(); // Active break
                      const isActiveBreak = breakSession.endTime === null;
                      const left = getPosition(breakStart);
                      const width = getWidth(breakStart, breakEnd);

                      return (
                        <div
                          key={breakSession.id}
                          className={`absolute h-8 rounded border-2 ${
                            isActiveBreak
                              ? "bg-orange-500/80 border-orange-600 animate-pulse"
                              : "bg-orange-400/60 border-orange-500"
                          }`}
                          style={{
                            left: `${left}%`,
                            width: `${width}%`,
                            top: "0.5rem",
                          }}
                          title={`Break: ${formatTime(breakStart)} - ${
                            isActiveBreak ? "In Progress" : formatTime(breakEnd)
                          }`}
                        />
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-4 pt-4 border-t">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-primary/80 rounded" />
              <span className="text-sm text-muted-foreground">Work Time</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-orange-400/60 border-2 border-orange-500 rounded" />
              <span className="text-sm text-muted-foreground">Break Time</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-orange-500/80 border-2 border-orange-600 rounded animate-pulse" />
              <span className="text-sm text-muted-foreground">Active Break</span>
            </div>
          </div>

          {/* Session List */}
          <div className="pt-4 border-t space-y-3">
            <h4 className="text-sm font-semibold">Session Details</h4>
            {sortedSessions.map((session, idx) => {
              const sessionStart = new Date(session.startTime);
              const sessionEnd = session.endTime ? new Date(session.endTime) : null;
              const isActive = session.status === "ACTIVE" || session.status === "PAUSED";

              // Calculate durations
              let workDuration = 0;
              let totalBreakDuration = 0;

              if (session.duration !== null) {
                workDuration = session.duration;
              } else if (sessionEnd) {
                const totalDuration = calculateDuration(sessionStart, sessionEnd);
                totalBreakDuration = session.breakSessions.reduce((sum, breakSession) => {
                  if (breakSession.duration !== null) {
                    return sum + breakSession.duration;
                  } else if (breakSession.endTime) {
                    return (
                      sum +
                      calculateDuration(
                        new Date(breakSession.startTime),
                        new Date(breakSession.endTime)
                      )
                    );
                  }
                  return sum;
                }, 0);
                workDuration = totalDuration - totalBreakDuration;
              }

              return (
                <div
                  key={session.id}
                  className="p-3 bg-muted rounded-lg space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant={isActive ? "default" : "outline"}>
                        Session {idx + 1}
                      </Badge>
                      {isActive && <Badge variant="secondary">Active</Badge>}
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold">
                        {formatTime(sessionStart)}
                        {sessionEnd ? ` - ${formatTime(sessionEnd)}` : " - In Progress"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Work:</span>
                    <span className="font-medium">{formatDuration(Math.max(0, workDuration))}</span>
                  </div>
                  {session.breakSessions.length > 0 && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground flex items-center gap-1">
                        <Coffee className="h-3 w-3" />
                        Breaks ({session.breakSessions.length}):
                      </span>
                      <span className="font-medium text-orange-500">
                        {formatDuration(totalBreakDuration)}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
