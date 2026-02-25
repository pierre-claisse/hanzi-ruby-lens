/**
 * Converts an ISO 8601 date-time string to "YYYY-MM-DD HH:mm" display format.
 * Handles legacy date-only strings by appending "00:00".
 */
export function formatDateTime(iso: string): string {
  if (!iso) return "";

  // Match YYYY-MM-DDTHH:MM pattern (with optional seconds and timezone)
  const match = iso.match(/^(\d{4}-\d{2}-\d{2})(?:T(\d{2}:\d{2}))?/);
  if (!match) return iso;

  const date = match[1];
  const time = match[2] ?? "00:00";
  return `${date} ${time}`;
}
