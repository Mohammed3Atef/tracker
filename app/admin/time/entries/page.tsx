"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useTimeEntries, useDeleteTimeEntry, TimeEntry } from "@/hooks/use-time-entries";
import { useUsers } from "@/hooks/use-users";
import { TimeEntryForm } from "@/components/time/time-entry-form";
import { formatDuration } from "@/lib/time-helpers";
import { Plus, Search, Edit, Trash2, Play, Square, Coffee } from "lucide-react";

export default function AdminTimeEntriesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFilter, setDateFilter] = useState<{ from?: Date; to?: Date }>({});
  const [userFilter, setUserFilter] = useState<string>("");
  const [selectedEntry, setSelectedEntry] = useState<TimeEntry | null>(null);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [entryToDelete, setEntryToDelete] = useState<TimeEntry | null>(null);

  const deleteEntry = useDeleteTimeEntry();
  const { data: users } = useUsers();

  // Get entries for last 30 days by default
  const defaultFrom = useMemo(() => {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return date;
  }, []);

  const from = dateFilter.from || defaultFrom;
  const to = dateFilter.to || new Date();

  const { data: entries, isLoading } = useTimeEntries({ from, to });

  // Filter entries
  const filteredEntries = useMemo(() => {
    if (!entries) return [];
    let filtered = [...entries];

    // User filter
    if (userFilter) {
      filtered = filtered.filter((entry) => entry.userId === userFilter);
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((entry) => {
        const userName = entry.user
          ? `${entry.user.profile?.firstName || ""} ${entry.user.profile?.lastName || ""}`.trim() ||
            entry.user.email
          : "";
        return (
          userName.toLowerCase().includes(query) ||
          entry.notes?.toLowerCase().includes(query) ||
          entry.id.toLowerCase().includes(query)
        );
      });
    }

    return filtered.sort((a, b) => {
      return new Date(b.startTime).getTime() - new Date(a.startTime).getTime();
    });
  }, [entries, searchQuery, userFilter]);

  const handleEdit = (entry: TimeEntry) => {
    setSelectedEntry(entry);
    setEditDialogOpen(true);
  };

  const handleDelete = (entry: TimeEntry) => {
    setEntryToDelete(entry);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (entryToDelete) {
      await deleteEntry.mutateAsync(entryToDelete.id);
      setDeleteDialogOpen(false);
      setEntryToDelete(null);
    }
  };

  const handleAddSuccess = () => {
    setAddDialogOpen(false);
  };

  const handleEditSuccess = () => {
    setEditDialogOpen(false);
    setSelectedEntry(null);
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Time Entries Management</h1>
          <p className="text-muted-foreground">View and manage all team time entries</p>
        </div>
        <Button onClick={() => setAddDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Entry
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, notes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>
            <div>
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
              <Input
                type="date"
                placeholder="From date"
                value={dateFilter.from?.toISOString().split("T")[0] || ""}
                onChange={(e) =>
                  setDateFilter({
                    ...dateFilter,
                    from: e.target.value ? new Date(e.target.value) : undefined,
                  })
                }
              />
            </div>
            <div>
              <Input
                type="date"
                placeholder="To date"
                value={dateFilter.to?.toISOString().split("T")[0] || ""}
                onChange={(e) =>
                  setDateFilter({
                    ...dateFilter,
                    to: e.target.value ? new Date(e.target.value) : undefined,
                  })
                }
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Entries Table */}
      <Card>
        <CardHeader>
          <CardTitle>Time Entries ({filteredEntries.length})</CardTitle>
          <CardDescription>All time tracking entries in the selected period</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : filteredEntries.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No time entries found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Start Time</TableHead>
                    <TableHead>End Time</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Breaks</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEntries.map((entry) => {
                    const startTime = new Date(entry.startTime);
                    const endTime = entry.endTime ? new Date(entry.endTime) : null;
                    const isActive = entry.status === "ACTIVE" || entry.status === "PAUSED";
                    const userName = entry.user
                      ? `${entry.user.profile?.firstName || ""} ${entry.user.profile?.lastName || ""}`.trim() ||
                        entry.user.email
                      : "Unknown";

                    return (
                      <TableRow key={entry.id}>
                        <TableCell>
                          {startTime.toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </TableCell>
                        <TableCell className="font-medium">{userName}</TableCell>
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
                          {entry.duration !== null ? formatDuration(entry.duration) : "-"}
                        </TableCell>
                        <TableCell>
                          {entry.breakSessions.length > 0 ? (
                            <div className="flex items-center gap-1">
                              <Coffee className="h-3 w-3 text-orange-500" />
                              {entry.breakSessions.length}
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
                                : entry.status === "COMPLETED"
                                ? "outline"
                                : "secondary"
                            }
                          >
                            {entry.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="sm" onClick={() => handleEdit(entry)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleDelete(entry)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Entry Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Time Entry</DialogTitle>
            <DialogDescription>Create a new time entry for a team member</DialogDescription>
          </DialogHeader>
          <TimeEntryForm onSuccess={handleAddSuccess} onCancel={() => setAddDialogOpen(false)} />
        </DialogContent>
      </Dialog>

      {/* Edit Entry Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Time Entry</DialogTitle>
            <DialogDescription>Update time entry details</DialogDescription>
          </DialogHeader>
          {selectedEntry && (
            <TimeEntryForm
              entry={selectedEntry}
              onSuccess={handleEditSuccess}
              onCancel={() => setEditDialogOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Time Entry</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this time entry? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete} disabled={deleteEntry.isPending}>
              {deleteEntry.isPending ? "Deleting..." : "Delete"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
