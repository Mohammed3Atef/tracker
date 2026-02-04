"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useTimeEntries } from "@/hooks/use-time-entries";
import { useUsers } from "@/hooks/use-users";
import { formatDuration } from "@/lib/time-helpers";
import { Calendar, Download, TrendingUp, Clock, Users } from "lucide-react";
import { getWeekBounds } from "@/lib/time-helpers";

export default function AdminReportsPage() {
  const [reportType, setReportType] = useState<"week" | "month">("week");
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [userFilter, setUserFilter] = useState<string>("");

  const { data: users } = useUsers();

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

  const { data: entries, isLoading } = useTimeEntries({
    from,
    to,
    userId: userFilter || undefined,
  });

  // Calculate statistics
  const stats = useMemo(() => {
    if (!entries) {
      return {
        totalMinutes: 0,
        totalSessions: 0,
        totalBreaks: 0,
        uniqueUsers: 0,
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

    // Count unique users
    const uniqueUsers = new Set(entries.map((entry) => entry.userId)).size;

    // Count unique days
    const uniqueDays = new Set(
      entries.map((entry) => new Date(entry.startTime).toDateString())
    ).size;

    const averagePerDay = uniqueDays > 0 ? totalMinutes / uniqueDays : 0;

    return {
      totalMinutes,
      totalSessions,
      totalBreaks,
      uniqueUsers,
      averagePerDay,
      days: uniqueDays,
    };
  }, [entries]);

  // Group by user
  const entriesByUser = useMemo(() => {
    if (!entries) return [];
    const grouped: Record<string, typeof entries> = {};
    entries.forEach((entry) => {
      if (!grouped[entry.userId]) {
        grouped[entry.userId] = [];
      }
      grouped[entry.userId].push(entry);
    });
    return Object.entries(grouped).map(([userId, userEntries]) => {
      const user = users?.find((u) => u.id === userId);
      const userName = user?.profile
        ? `${user.profile.firstName} ${user.profile.lastName}`
        : user?.email || "Unknown";
      const totalMinutes = userEntries.reduce((sum, entry) => sum + (entry.duration || 0), 0);
      return {
        userId,
        userName,
        entries: userEntries,
        totalMinutes,
      };
    });
  }, [entries, users]);

  const handleExport = () => {
    // Simple CSV export
    if (!entries || entries.length === 0) return;

    const headers = ["Date", "User", "Start Time", "End Time", "Duration", "Breaks", "Status"];
    const rows = entries.map((entry) => {
      const startTime = new Date(entry.startTime);
      const endTime = entry.endTime ? new Date(entry.endTime) : "";
      const userName = entry.user
        ? `${entry.user.profile?.firstName || ""} ${entry.user.profile?.lastName || ""}`.trim() ||
          entry.user.email
        : "Unknown";
      return [
        startTime.toLocaleDateString(),
        userName,
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
    a.download = `team-report-${reportType}-${selectedDate.toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Admin Reports</h1>
          <p className="text-muted-foreground">View team time tracking reports and analytics</p>
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
          <div className="grid gap-4 md:grid-cols-4">
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
              <label className="text-sm font-medium mb-2 block">User</label>
              <select
                className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                value={userFilter}
                onChange={(e) => setUserFilter(e.target.value)}
              >
                <option value="">All Users</option>
                {users?.map((user) => {
                  const name = user.profile
                    ? `${user.profile.firstName} ${user.profile.lastName}`
                    : user.email;
                  return (
                    <option key={user.id} value={user.id}>
                      {name}
                    </option>
                  );
                })}
              </select>
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
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
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
            <p className="text-xs text-muted-foreground">Total breaks</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.uniqueUsers}</div>
            <p className="text-xs text-muted-foreground">Active users</p>
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

      {/* User Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>User Breakdown</CardTitle>
          <CardDescription>Time worked by each team member</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : entriesByUser.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No time entries found for this period</p>
            </div>
          ) : (
            <div className="space-y-2">
              {entriesByUser
                .sort((a, b) => b.totalMinutes - a.totalMinutes)
                .map((userData) => (
                  <div
                    key={userData.userId}
                    className="flex items-center justify-between p-3 border rounded-md"
                  >
                    <div className="flex-1">
                      <div className="font-medium">{userData.userName}</div>
                      <div className="text-sm text-muted-foreground">
                        {userData.entries.length} session{userData.entries.length !== 1 ? "s" : ""}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-lg">
                        {formatDuration(userData.totalMinutes)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {userData.entries.reduce(
                          (sum, entry) => sum + entry.breakSessions.length,
                          0
                        )}{" "}
                        breaks
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
