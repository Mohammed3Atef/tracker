"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDuration, calculateDuration } from "@/lib/time-helpers";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { TimeEntry } from "@/hooks/use-time-entries";

interface CalendarViewProps {
  entries: TimeEntry[];
  onDateClick?: (date: Date) => void;
  onEntryClick?: (entry: TimeEntry) => void;
  viewMode?: "month" | "week" | "day";
  allowEdit?: boolean;
}

export function CalendarView({
  entries,
  onDateClick,
  onEntryClick,
  viewMode = "month",
  allowEdit = false,
}: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedView, setSelectedView] = useState<"month" | "week" | "day">(viewMode);

  // Group entries by date
  const entriesByDate = useMemo(() => {
    const grouped: Record<string, TimeEntry[]> = {};
    entries.forEach((entry) => {
      const date = new Date(entry.startTime);
      const dateKey = date.toISOString().split("T")[0];
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(entry);
    });
    return grouped;
  }, [entries]);

  // Get calendar days for month view
  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - startDate.getDay()); // Start from Sunday

    const days: Date[] = [];
    const current = new Date(startDate);
    const endDate = new Date(lastDay);
    endDate.setDate(endDate.getDate() + (6 - endDate.getDay())); // End on Saturday

    while (current <= endDate) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }

    return days;
  }, [currentDate]);

  // Navigate months
  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Calculate total time for a date
  const getDateTotal = (date: Date): number => {
    const dateKey = date.toISOString().split("T")[0];
    const dayEntries = entriesByDate[dateKey] || [];
    return dayEntries.reduce((total, entry) => {
      if (entry.duration !== null) {
        return total + entry.duration;
      }
      return total;
    }, 0);
  };

  // Check if date has entries
  const hasEntries = (date: Date): boolean => {
    const dateKey = date.toISOString().split("T")[0];
    return !!entriesByDate[dateKey] && entriesByDate[dateKey].length > 0;
  };

  // Check if date is today
  const isToday = (date: Date): boolean => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  // Check if date is in current month
  const isCurrentMonth = (date: Date): boolean => {
    return (
      date.getMonth() === currentDate.getMonth() &&
      date.getFullYear() === currentDate.getFullYear()
    );
  };

  const monthName = currentDate.toLocaleDateString("en-US", { month: "long", year: "numeric" });

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              Calendar View
            </CardTitle>
            <CardDescription>View and manage your time entries</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex gap-1 border rounded-md">
              <Button
                variant={selectedView === "month" ? "default" : "ghost"}
                size="sm"
                onClick={() => setSelectedView("month")}
              >
                Month
              </Button>
              <Button
                variant={selectedView === "week" ? "default" : "ghost"}
                size="sm"
                onClick={() => setSelectedView("week")}
              >
                Week
              </Button>
              <Button
                variant={selectedView === "day" ? "default" : "ghost"}
                size="sm"
                onClick={() => setSelectedView("day")}
              >
                Day
              </Button>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {selectedView === "month" && (
          <div className="space-y-4">
            {/* Month Navigation */}
            <div className="flex items-center justify-between">
              <Button variant="outline" size="sm" onClick={previousMonth}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold">{monthName}</h3>
                <Button variant="outline" size="sm" onClick={goToToday}>
                  Today
                </Button>
              </div>
              <Button variant="outline" size="sm" onClick={nextMonth}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1">
              {/* Day headers */}
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                <div key={day} className="p-2 text-center text-sm font-medium text-muted-foreground">
                  {day}
                </div>
              ))}

              {/* Calendar days */}
              {calendarDays.map((date, idx) => {
                const dateKey = date.toISOString().split("T")[0];
                const dayEntries = entriesByDate[dateKey] || [];
                const totalMinutes = getDateTotal(date);
                const today = isToday(date);
                const inMonth = isCurrentMonth(date);

                return (
                  <div
                    key={idx}
                    className={cn(
                      "min-h-[80px] p-1 border rounded-md cursor-pointer hover:bg-muted transition-colors",
                      !inMonth && "opacity-40",
                      today && "border-primary border-2",
                      hasEntries(date) && "bg-primary/5"
                    )}
                    onClick={() => onDateClick?.(date)}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span
                        className={cn(
                          "text-xs font-medium",
                          today && "bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center"
                        )}
                      >
                        {date.getDate()}
                      </span>
                      {totalMinutes > 0 && (
                        <Badge variant="outline" className="text-xs">
                          {formatDuration(totalMinutes)}
                        </Badge>
                      )}
                    </div>
                    {dayEntries.length > 0 && (
                      <div className="space-y-0.5">
                        {dayEntries.slice(0, 2).map((entry) => {
                          const startTime = new Date(entry.startTime);
                          const isActive = entry.status === "ACTIVE" || entry.status === "PAUSED";
                          return (
                            <div
                              key={entry.id}
                              className={cn(
                                "text-xs p-1 rounded bg-primary/10 text-primary cursor-pointer hover:bg-primary/20",
                                isActive && "bg-green-500/20 text-green-700"
                              )}
                              onClick={(e) => {
                                e.stopPropagation();
                                onEntryClick?.(entry);
                              }}
                            >
                              {startTime.toLocaleTimeString("en-US", {
                                hour: "numeric",
                                minute: "2-digit",
                              })}
                              {entry.endTime
                                ? ` - ${new Date(entry.endTime).toLocaleTimeString("en-US", {
                                    hour: "numeric",
                                    minute: "2-digit",
                                  })}`
                                : " (Active)"}
                            </div>
                          );
                        })}
                        {dayEntries.length > 2 && (
                          <div className="text-xs text-muted-foreground px-1">
                            +{dayEntries.length - 2} more
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {selectedView === "week" && (
          <div className="text-center py-8 text-muted-foreground">
            <p>Week view coming soon</p>
          </div>
        )}

        {selectedView === "day" && (
          <div className="text-center py-8 text-muted-foreground">
            <p>Day view coming soon</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
