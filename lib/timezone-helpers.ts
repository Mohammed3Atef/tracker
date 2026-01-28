/**
 * Timezone handling utilities for leave management
 */

/**
 * Get the application timezone from environment variable
 * Defaults to UTC if not set
 */
export function getAppTimezone(): string {
  return process.env.APP_TIMEZONE || "UTC";
}

/**
 * Format a date for display in the application timezone
 * @param date - Date to format
 * @returns Formatted date string in app timezone
 */
export function formatDateForDisplay(date: Date): string {
  const timezone = getAppTimezone();
  
  if (timezone === "UTC") {
    return date.toISOString().split("T")[0];
  }
  
  // Use Intl.DateTimeFormat for timezone-aware formatting
  return new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

/**
 * Parse a date string from input to UTC Date
 * Assumes input is in local timezone or ISO format
 * @param dateString - Date string to parse
 * @returns Date object in UTC
 */
export function parseDateFromInput(dateString: string): Date {
  // Parse as local date and convert to UTC
  const date = new Date(dateString);
  
  // Ensure we're working with date only (no time component)
  const utcDate = new Date(Date.UTC(
    date.getFullYear(),
    date.getMonth(),
    date.getDate()
  ));
  
  return utcDate;
}

/**
 * Format date range for display
 * @param startDate - Start date
 * @param endDate - End date
 * @returns Formatted date range string
 */
export function formatDateRange(startDate: Date, endDate: Date): string {
  const start = formatDateForDisplay(startDate);
  const end = formatDateForDisplay(endDate);
  
  if (start === end) {
    return start;
  }
  
  return `${start} - ${end}`;
}
