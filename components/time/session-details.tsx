"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatDuration, calculateDuration } from "@/lib/time-helpers";
import { Clock, Coffee, Play, Square, Edit } from "lucide-react";
import { useUpdateTimeSession } from "@/hooks/use-time-actions";

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
  notes?: string | null;
  breakSessions: BreakSession[];
}

interface SessionDetailsProps {
  session: TimeSession;
  showDate?: boolean;
  allowEdit?: boolean;
  onUpdate?: () => void;
}

export function SessionDetails({ session, showDate = true, allowEdit = false, onUpdate }: SessionDetailsProps) {
  const startTime = new Date(session.startTime);
  const endTime = session.endTime ? new Date(session.endTime) : null;
  const isActive = session.status === "ACTIVE" || session.status === "PAUSED";
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({
    startTime: startTime.toISOString().slice(0, 16), // Format for datetime-local input
    endTime: endTime ? endTime.toISOString().slice(0, 16) : "",
    notes: session.notes || "",
  });
  const updateSession = useUpdateTimeSession();

  const handleEdit = () => {
    setEditFormData({
      startTime: startTime.toISOString().slice(0, 16),
      endTime: endTime ? endTime.toISOString().slice(0, 16) : "",
      notes: session.notes || "",
    });
    setEditDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      await updateSession.mutateAsync({
        sessionId: session.id,
        data: {
          startTime: new Date(editFormData.startTime).toISOString(),
          endTime: editFormData.endTime ? new Date(editFormData.endTime).toISOString() : null,
          notes: editFormData.notes || undefined,
        },
      });
      setEditDialogOpen(false);
      if (onUpdate) {
        onUpdate();
      }
    } catch {
      // Error handled by mutation's onError
    }
  };

  // Calculate work time and break time
  let workDuration = 0;
  let totalBreakDuration = 0;

  if (session.duration !== null) {
    // Use stored duration (already excludes breaks)
    workDuration = session.duration;
  } else if (endTime) {
    // Calculate from start/end times
    const totalDuration = calculateDuration(startTime, endTime);
    totalBreakDuration = session.breakSessions.reduce((sum, breakSession) => {
      if (breakSession.duration !== null) {
        return sum + breakSession.duration;
      } else if (breakSession.endTime) {
        return sum + calculateDuration(
          new Date(breakSession.startTime),
          new Date(breakSession.endTime)
        );
      }
      return sum;
    }, 0);
    workDuration = totalDuration - totalBreakDuration;
  } else if (isActive) {
    // Active session - calculate current duration
    const now = new Date();
    const totalDuration = calculateDuration(startTime, now);
    totalBreakDuration = session.breakSessions.reduce((sum, breakSession) => {
      if (breakSession.duration !== null) {
        return sum + breakSession.duration;
      } else if (breakSession.endTime === null) {
        // Active break
        return sum + calculateDuration(new Date(breakSession.startTime), now);
      } else {
        return sum + calculateDuration(
          new Date(breakSession.startTime),
          new Date(breakSession.endTime)
        );
      }
    }, 0);
    workDuration = totalDuration - totalBreakDuration;
  }

  // Calculate total break duration if not already calculated
  if (totalBreakDuration === 0 && session.breakSessions.length > 0) {
    totalBreakDuration = session.breakSessions.reduce((sum, breakSession) => {
      if (breakSession.duration !== null) {
        return sum + breakSession.duration;
      } else if (breakSession.endTime) {
        return sum + calculateDuration(
          new Date(breakSession.startTime),
          new Date(breakSession.endTime)
        );
      }
      return sum;
    }, 0);
  }

  const statusBadge = isActive ? (
    <Badge variant="default">Active</Badge>
  ) : session.status === "COMPLETED" ? (
    <Badge variant="outline">Completed</Badge>
  ) : (
    <Badge variant="secondary">{session.status}</Badge>
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Session Details
            </CardTitle>
            <CardDescription>
              {showDate && startTime.toLocaleDateString()}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {statusBadge}
            {allowEdit && !isActive && (
              <Button size="sm" variant="outline" onClick={handleEdit}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Session Times */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Start Time</p>
            <p className="text-lg font-semibold flex items-center gap-2">
              <Play className="h-4 w-4 text-green-500" />
              {startTime.toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">End Time</p>
            <p className="text-lg font-semibold flex items-center gap-2">
              <Square className="h-4 w-4 text-red-500" />
              {endTime ? endTime.toLocaleString() : isActive ? "In Progress" : "-"}
            </p>
          </div>
        </div>

        {/* Duration Breakdown */}
        <div className="grid grid-cols-3 gap-4 pt-4 border-t">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Work Time</p>
            <p className="text-xl font-bold text-primary">
              {formatDuration(Math.max(0, workDuration))}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Break Time</p>
            <p className="text-xl font-bold text-orange-500">
              {formatDuration(totalBreakDuration)}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Total Duration</p>
            <p className="text-xl font-bold">
              {formatDuration(workDuration + totalBreakDuration)}
            </p>
          </div>
        </div>

        {/* Breaks List */}
        {session.breakSessions.length > 0 && (
          <div className="pt-4 border-t">
            <p className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
              <Coffee className="h-4 w-4" />
              Breaks ({session.breakSessions.length})
            </p>
            <div className="space-y-2">
              {session.breakSessions.map((breakSession, index) => {
                const breakStart = new Date(breakSession.startTime);
                const breakEnd = breakSession.endTime ? new Date(breakSession.endTime) : null;
                const isActiveBreak = breakSession.endTime === null;
                const breakDuration = breakSession.duration !== null
                  ? breakSession.duration
                  : breakEnd
                  ? calculateDuration(breakStart, breakEnd)
                  : 0;

                return (
                  <div
                    key={breakSession.id}
                    className="flex items-center justify-between p-3 bg-muted rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">Break #{index + 1}</span>
                        <Badge variant={isActiveBreak ? "default" : "outline"} className="text-xs">
                          {breakSession.type}
                        </Badge>
                        {isActiveBreak && (
                          <Badge variant="secondary" className="text-xs">Active</Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {breakStart.toLocaleTimeString()}
                        {breakEnd ? ` - ${breakEnd.toLocaleTimeString()}` : " - In Progress"}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-orange-500">
                        {formatDuration(breakDuration)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {session.breakSessions.length === 0 && (
          <div className="pt-4 border-t text-center text-sm text-muted-foreground">
            No breaks taken during this session
          </div>
        )}

        {session.notes && (
          <div className="pt-4 border-t">
            <p className="text-sm font-medium text-muted-foreground mb-2">Notes</p>
            <p className="text-sm">{session.notes}</p>
          </div>
        )}
      </CardContent>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Time Session</DialogTitle>
            <DialogDescription>
              Update the start time, end time, and notes for this session
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-start-time">Start Time *</Label>
              <Input
                id="edit-start-time"
                type="datetime-local"
                value={editFormData.startTime}
                onChange={(e) =>
                  setEditFormData({ ...editFormData, startTime: e.target.value })
                }
              />
            </div>
            <div>
              <Label htmlFor="edit-end-time">End Time</Label>
              <Input
                id="edit-end-time"
                type="datetime-local"
                value={editFormData.endTime}
                onChange={(e) =>
                  setEditFormData({ ...editFormData, endTime: e.target.value })
                }
              />
              <p className="text-xs text-muted-foreground mt-1">
                Leave empty for active sessions
              </p>
            </div>
            <div>
              <Label htmlFor="edit-notes">Notes</Label>
              <Input
                id="edit-notes"
                value={editFormData.notes}
                onChange={(e) =>
                  setEditFormData({ ...editFormData, notes: e.target.value })
                }
                placeholder="Optional notes about this session"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={updateSession.isPending}>
              {updateSession.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
