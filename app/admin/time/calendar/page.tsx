"use client";

import { useState } from "react";
import { CalendarView, TimeEntry } from "@/components/time/calendar-view";
import { useTimeEntries } from "@/hooks/use-time-entries";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { TimeEntryForm } from "@/components/time/time-entry-form";
import { useUsers } from "@/hooks/use-users";

export default function AdminTimeCalendarPage() {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedEntry, setSelectedEntry] = useState<TimeEntry | null>(null);
  const [addEntryDialogOpen, setAddEntryDialogOpen] = useState(false);
  const [editEntryDialogOpen, setEditEntryDialogOpen] = useState(false);
  const [userFilter, setUserFilter] = useState<string>("");

  const { data: users } = useUsers();

  // Get entries for current month
  const currentDate = new Date();
  const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
  monthEnd.setHours(23, 59, 59, 999);

  const { data: entries, isLoading } = useTimeEntries({
    from: monthStart,
    to: monthEnd,
    userId: userFilter || undefined,
  });

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    setAddEntryDialogOpen(true);
  };

  const handleEntryClick = (entry: TimeEntry) => {
    setSelectedEntry(entry);
    setEditEntryDialogOpen(true);
  };

  const handleAddSuccess = () => {
    setAddEntryDialogOpen(false);
    setSelectedDate(null);
  };

  const handleEditSuccess = () => {
    setEditEntryDialogOpen(false);
    setSelectedEntry(null);
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Time Calendar - Admin</h1>
          <p className="text-muted-foreground">View and manage all team time entries in calendar format</p>
        </div>
        <div className="flex gap-2">
          <select
            className="h-10 px-3 rounded-md border border-input bg-background text-sm"
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
          <Button onClick={() => setAddEntryDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Time Entry
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          <div className="h-96 bg-muted animate-pulse rounded-lg" />
        </div>
      ) : (
        <CalendarView
          entries={entries || []}
          onDateClick={handleDateClick}
          onEntryClick={handleEntryClick}
          allowEdit={true}
        />
      )}

      {/* Add Entry Dialog */}
      <Dialog open={addEntryDialogOpen} onOpenChange={setAddEntryDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Time Entry</DialogTitle>
            <DialogDescription>
              {selectedDate
                ? `Add time entry for ${selectedDate.toLocaleDateString()}`
                : "Add a new time entry"}
            </DialogDescription>
          </DialogHeader>
          <TimeEntryForm
            defaultDate={selectedDate || new Date()}
            onSuccess={handleAddSuccess}
            onCancel={() => setAddEntryDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Entry Dialog */}
      <Dialog open={editEntryDialogOpen} onOpenChange={setEditEntryDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Time Entry</DialogTitle>
            <DialogDescription>Update time entry details</DialogDescription>
          </DialogHeader>
          {selectedEntry && (
            <TimeEntryForm
              entry={selectedEntry}
              onSuccess={handleEditSuccess}
              onCancel={() => setEditEntryDialogOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
