"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useTimeEntries } from "@/hooks/use-time-entries";
import { formatDuration } from "@/lib/time-helpers";
import { Calendar, Download, TrendingUp, Clock } from "lucide-react";
import { getWeekBounds } from "@/lib/time-helpers";

export default function ReportsPage() {
  const [reportType, setReportType] = useState<"week" | "month">("week");
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Calculate date range based on report type
  const { from, to } = useMemo(() => {
    if (reportType === "week") {
      const bounds = getWeekBounds(selectedDate);
      return { from: bounds.start, to: bounds.end };
    } else {
      const year = selectedDate.getFullYear();
      const month = selectedDate.getMonth();
      const start = new Date(year, month, 1);
      const end = new Date(year, month + 1, 0);
      end.setHours(23, 59, 59, 999);
      return { from: start, to: end };
    }
  }, [reportType, selectedDate]);

  const { data: entries, isLoading } = useTimeEntries({ from, to });

  // Calculate statistics
  const stats = useMemo(() => {
    if (!entries) {
      return {
        totalMinutes: 0,
        totalSessions: 0,
        totalBreaks: 0,
        averagePerDay: 0,
        days: 0,
      };
    }

    const totalMinutes = entries.reduce((sum, entry) => {
      return sum + (entry.duration || 0);
    }, 0);

    const totalSessions = entries.length;
    const totalBreaks = entries.reduce((sum, entry) => {
      return sum + entry.breakSessions.length;
    }, 0);

    // Count unique days
    const uniqueDays = new Set(
      entries.map((entry) => new Date(entry.startTime).toDateString())
    ).size;

    const averagePerDay = uniqueDays > 0 ? totalMinutes / uniqueDays : 0;

    return {
      totalMinutes,
      totalSessions,
      totalBreaks,
      averagePerDay,
      days: uniqueDays,
    };
  }, [entries]);

  const handleExport = () => {
    // Simple CSV export
    if (!entries || entries.length === 0) return;

    const headers = ["Date", "Start Time", "End Time", "Duration", "Breaks", "Status"];
    const rows = entries.map((entry) => {
      const startTime = new Date(entry.startTime);
      const endTime = entry.endTime ? new Date(entry.endTime) : "";
      return [
        startTime.toLocaleDateString(),
        startTime.toLocaleTimeString(),
        endTime ? endTime.toLocaleTimeString() : "Active",
        entry.duration !== null ? formatDuration(entry.duration) : "-",
        entry.breakSessions.length.toString(),
        entry.status,
      ];
    });

    const csvContent = [headers, ...rows].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `time-report-${reportType}-${selectedDate.toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Reports</h1>
          <p className="text-muted-foreground">View your time tracking reports and analytics</p>
        </div>
        <Button onClick={handleExport} disabled={!entries || entries.length === 0}>
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Report Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Report Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label className="text-sm font-medium mb-2 block">Report Type</label>
              <div className="flex gap-2">
                <Button
                  variant={reportType === "week" ? "default" : "outline"}
                  onClick={() => setReportType("week")}
                >
                  Weekly
                </Button>
                <Button
                  variant={reportType === "month" ? "default" : "outline"}
                  onClick={() => setReportType("month")}
                >
                  Monthly
                </Button>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">
                {reportType === "week" ? "Week" : "Month"}
              </label>
              <Input
                type={reportType === "week" ? "week" : "month"}
                value={
                  reportType === "week"
                    ? `${selectedDate.getFullYear()}-W${Math.ceil(
                        (selectedDate.getDate() +
                          new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1).getDay()) /
                          7
                      )}`
                    : `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, "0")}`
                }
                onChange={(e) => {
                  const value = e.target.value;
                  if (reportType === "week") {
                    const [year, week] = value.split("-W");
                    // Simple week calculation
                    const date = new Date(parseInt(year), 0, 1);
                    date.setDate(date.getDate() + (parseInt(week) - 1) * 7);
                    setSelectedDate(date);
                  } else {
                    setSelectedDate(new Date(value + "-01"));
                  }
                }}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Date Range</label>
              <div className="text-sm text-muted-foreground">
                {from.toLocaleDateString()} - {to.toLocaleDateString()}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Hours</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatDuration(stats.totalMinutes)}</div>
            <p className="text-xs text-muted-foreground">Total time worked</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sessions</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalSessions}</div>
            <p className="text-xs text-muted-foreground">Total sessions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Breaks</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalBreaks}</div>
            <p className="text-xs text-muted-foreground">Total breaks taken</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average/Day</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatDuration(stats.averagePerDay)}</div>
            <p className="text-xs text-muted-foreground">Over {stats.days} days</p>
          </CardContent>
        </Card>
      </div>

      {/* Entries List */}
      <Card>
        <CardHeader>
          <CardTitle>Time Entries</CardTitle>
          <CardDescription>All entries in the selected period</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : !entries || entries.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No time entries found for this period</p>
            </div>
          ) : (
            <div className="space-y-2">
              {entries.map((entry) => {
                const startTime = new Date(entry.startTime);
                const endTime = entry.endTime ? new Date(entry.endTime) : null;
                return (
                  <div
                    key={entry.id}
                    className="flex items-center justify-between p-3 border rounded-md"
                  >
                    <div className="flex-1">
                      <div className="font-medium">
                        {startTime.toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {startTime.toLocaleTimeString()} -{" "}
                        {endTime ? endTime.toLocaleTimeString() : "Active"}
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="font-medium">
                          {entry.duration !== null ? formatDuration(entry.duration) : "-"}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {entry.breakSessions.length} breaks
                        </div>
                      </div>
                      <Badge
                        variant={
                          entry.status === "ACTIVE"
                            ? "default"
                            : entry.status === "COMPLETED"
                            ? "outline"
                            : "secondary"
                        }
                      >
                        {entry.status}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
