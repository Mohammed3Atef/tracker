/**
 * Time tracking utility functions
 */

/**
 * Calculate duration in minutes between two dates
 */
export function calculateDuration(startTime: Date, endTime: Date): number {
  const diffMs = endTime.getTime() - startTime.getTime();
  return Math.floor(diffMs / (1000 * 60)); // Convert to minutes
}

/**
 * Get Monday-Sunday bounds for a given date
 * Returns start of Monday (00:00:00) and end of Sunday (23:59:59.999)
 */
export function getWeekBounds(date: Date): { start: Date; end: Date } {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);

  // Get day of week (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
  const dayOfWeek = d.getDay();
  
  // Calculate days to subtract to get to Monday
  // If Sunday (0), subtract 6 days; otherwise subtract (dayOfWeek - 1)
  const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  
  // Start of week (Monday 00:00:00)
  const start = new Date(d);
  start.setDate(d.getDate() - daysToMonday);
  
  // End of week (Sunday 23:59:59.999)
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);

  return { start, end };
}

/**
 * Format duration in minutes as a human-readable string
 * Examples: "2h 30m", "45m", "0m"
 */
export function formatDuration(minutes: number): string {
  if (minutes < 0) return "0m";
  
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  
  if (hours > 0 && mins > 0) {
    return `${hours}h ${mins}m`;
  } else if (hours > 0) {
    return `${hours}h`;
  } else {
    return `${mins}m`;
  }
}

/**
 * Format duration in seconds as a human-readable string with hours, minutes, and seconds
 * Examples: "2h 30m 45s", "30m 45s", "45s"
 */
export function formatDurationWithSeconds(totalSeconds: number): string {
  if (totalSeconds < 0) return "0s";
  
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  
  const parts: string[] = [];
  
  if (hours > 0) {
    parts.push(`${hours}h`);
  }
  if (minutes > 0 || hours > 0) {
    parts.push(`${minutes}m`);
  }
  parts.push(`${seconds}s`);
  
  return parts.join(" ");
}

/**
 * Calculate duration in seconds between two dates
 */
export function calculateDurationInSeconds(startTime: Date, endTime: Date): number {
  const diffMs = endTime.getTime() - startTime.getTime();
  return Math.floor(diffMs / 1000); // Convert to seconds
}
