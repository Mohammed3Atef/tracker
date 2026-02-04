"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useTimeStatus } from "@/hooks/use-time-status";
import { useClockIn, useClockOut, useStartBreak, useEndBreak } from "@/hooks/use-time-actions";
import { Clock, Coffee, Play, Square } from "lucide-react";
import { useRouter } from "next/navigation";

export function QuickActions() {
  const router = useRouter();
  const { data: timeStatus } = useTimeStatus();
  const clockIn = useClockIn();
  const clockOut = useClockOut();
  const startBreak = useStartBreak();
  const endBreak = useEndBreak();

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Only trigger if not typing in an input/textarea
      if (
        (e.target as HTMLElement).tagName === "INPUT" ||
        (e.target as HTMLElement).tagName === "TEXTAREA"
      ) {
        return;
      }

      // Ctrl/Cmd + C for clock in/out
      if ((e.ctrlKey || e.metaKey) && e.key === "c") {
        e.preventDefault();
        if (timeStatus?.hasActiveSession) {
          clockOut.mutate();
        } else {
          clockIn.mutate();
        }
      }

      // Ctrl/Cmd + B for break
      if ((e.ctrlKey || e.metaKey) && e.key === "b") {
        e.preventDefault();
        if (timeStatus?.activeBreak) {
          endBreak.mutate();
        } else if (timeStatus?.hasActiveSession) {
          startBreak.mutate();
        }
      }

      // Ctrl/Cmd + N for new time entry
      if ((e.ctrlKey || e.metaKey) && e.key === "n") {
        e.preventDefault();
        router.push("/app/time/entries");
      }

      // Ctrl/Cmd + K for calendar
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        router.push("/app/time/calendar");
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [timeStatus, clockIn, clockOut, startBreak, endBreak, router]);

  return null; // This component only handles keyboard shortcuts
}

export function FloatingQuickActions() {
  const router = useRouter();
  const { data: timeStatus } = useTimeStatus();
  const clockIn = useClockIn();
  const clockOut = useClockOut();
  const startBreak = useStartBreak();
  const endBreak = useEndBreak();

  const handleClockInOut = () => {
    if (timeStatus?.hasActiveSession) {
      clockOut.mutate();
    } else {
      clockIn.mutate();
    }
  };

  const handleBreak = () => {
    if (timeStatus?.activeBreak) {
      endBreak.mutate();
    } else if (timeStatus?.hasActiveSession) {
      startBreak.mutate();
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2">
      {/* Clock In/Out Button */}
      <Button
        onClick={handleClockInOut}
        size="lg"
        className="rounded-full shadow-lg h-14 w-14"
        variant={timeStatus?.hasActiveSession ? "destructive" : "default"}
        disabled={clockIn.isPending || clockOut.isPending}
      >
        {timeStatus?.hasActiveSession ? (
          <Square className="h-5 w-5" />
        ) : (
          <Play className="h-5 w-5" />
        )}
      </Button>

      {/* Break Button */}
      {timeStatus?.hasActiveSession && (
        <Button
          onClick={handleBreak}
          size="lg"
          className="rounded-full shadow-lg h-14 w-14"
          variant="outline"
          disabled={startBreak.isPending || endBreak.isPending}
        >
          <Coffee className="h-5 w-5" />
        </Button>
      )}

      {/* Add Time Entry Button */}
      <Button
        onClick={() => router.push("/app/time/entries")}
        size="lg"
        className="rounded-full shadow-lg h-14 w-14"
        variant="outline"
      >
        <Clock className="h-5 w-5" />
      </Button>
    </div>
  );
}
