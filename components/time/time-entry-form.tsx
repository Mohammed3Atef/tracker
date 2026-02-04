"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCreateTimeEntry, useUpdateTimeEntry, TimeEntry } from "@/hooks/use-time-entries";
import { useApiToast } from "@/hooks/use-api-toast";

interface TimeEntryFormProps {
  entry?: TimeEntry;
  defaultDate?: Date;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function TimeEntryForm({
  entry,
  defaultDate = new Date(),
  onSuccess,
  onCancel,
}: TimeEntryFormProps) {
  const { toastApiError } = useApiToast();
  const createEntry = useCreateTimeEntry();
  const updateEntry = useUpdateTimeEntry();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    date: entry
      ? new Date(entry.startTime).toISOString().split("T")[0]
      : defaultDate.toISOString().split("T")[0],
    startTime: entry
      ? new Date(entry.startTime).toISOString().slice(0, 16)
      : `${defaultDate.toISOString().split("T")[0]}T09:00`,
    endTime: entry?.endTime
      ? new Date(entry.endTime).toISOString().slice(0, 16)
      : `${defaultDate.toISOString().split("T")[0]}T17:00`,
    notes: entry?.notes || "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (entry) {
        // Update existing entry
        await updateEntry.mutateAsync({
          entryId: entry.id,
          data: {
            startTime: new Date(formData.startTime).toISOString(),
            endTime: formData.endTime ? new Date(formData.endTime).toISOString() : null,
            notes: formData.notes || undefined,
          },
        });
      } else {
        // Create new entry
        await createEntry.mutateAsync({
          startTime: new Date(formData.startTime).toISOString(),
          endTime: formData.endTime ? new Date(formData.endTime).toISOString() : null,
          notes: formData.notes || undefined,
        });
      }
      onSuccess?.();
    } catch (error) {
      toastApiError(error as Error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Quick time presets
  const quickPresets = [
    { label: "8 hours", hours: 8 },
    { label: "4 hours", hours: 4 },
    { label: "6 hours", hours: 6 },
  ];

  const applyPreset = (hours: number) => {
    const start = new Date(formData.startTime);
    const end = new Date(start);
    end.setHours(start.getHours() + hours);
    setFormData({
      ...formData,
      endTime: end.toISOString().slice(0, 16),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="date">Date</Label>
        <Input
          id="date"
          type="date"
          value={formData.date}
          onChange={(e) => {
            const newDate = e.target.value;
            setFormData({
              ...formData,
              date: newDate,
              startTime: `${newDate}T${formData.startTime.split("T")[1]}`,
              endTime: formData.endTime ? `${newDate}T${formData.endTime.split("T")[1]}` : "",
            });
          }}
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="startTime">Start Time</Label>
          <Input
            id="startTime"
            type="datetime-local"
            value={formData.startTime}
            onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
            required
          />
        </div>
        <div>
          <Label htmlFor="endTime">End Time</Label>
          <Input
            id="endTime"
            type="datetime-local"
            value={formData.endTime}
            onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
          />
          <p className="text-xs text-muted-foreground mt-1">
            Leave empty for active session
          </p>
        </div>
      </div>

      {/* Quick presets */}
      {!entry && (
        <div>
          <Label>Quick Presets</Label>
          <div className="flex gap-2 mt-1">
            {quickPresets.map((preset) => (
              <Button
                key={preset.label}
                type="button"
                variant="outline"
                size="sm"
                onClick={() => applyPreset(preset.hours)}
              >
                {preset.label}
              </Button>
            ))}
          </div>
        </div>
      )}

      <div>
        <Label htmlFor="notes">Notes (Optional)</Label>
        <Input
          id="notes"
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          placeholder="Add notes about this time entry"
        />
      </div>

      <div className="flex justify-end gap-2 pt-4">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : entry ? "Update Entry" : "Create Entry"}
        </Button>
      </div>
    </form>
  );
}
