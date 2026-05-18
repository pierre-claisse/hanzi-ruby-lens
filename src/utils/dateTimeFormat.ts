// Date/time helpers used app-wide.
//
// All backend-written timestamps are UTC ISO 8601 (e.g., "2026-05-18T08:30:00Z").
// All display happens in the viewer's local time zone (Europe/Paris for the
// authorized device, Asia/Taipei otherwise — see `useIdentity`).
//
// Sessions store `date`/`startTime`/`endTime` as UTC wall-clock; the
// `utcWallToLocal` / `localWallToUtc` helpers convert between the user's
// local wall-clock (what they enter and see) and the UTC wall-clock stored
// in the database.
//
// Legacy strings (pre-Calendar gist data in "YYYY-MM-DD HH:MM GMT+8" format)
// are not parseable as ISO 8601; the format helpers fall back to returning
// the input untouched so the legacy display remains readable.

function pad2(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

/**
 * Current instant as a UTC ISO 8601 string ("2026-05-18T08:30:00Z"). Matches
 * the format produced by the (deprecated) backend `sync::now_utc_iso`. All
 * write paths in the IDB layer call this for createdAt / modifiedAt /
 * commentAt / session timestamps.
 */
export function nowUtcIso(): string {
  const d = new Date();
  return `${d.getUTCFullYear()}-${pad2(d.getUTCMonth() + 1)}-${pad2(d.getUTCDate())}T${pad2(d.getUTCHours())}:${pad2(d.getUTCMinutes())}:${pad2(d.getUTCSeconds())}Z`;
}

function partsToObj(parts: Intl.DateTimeFormatPart[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (const p of parts) out[p.type] = p.value;
  return out;
}

/**
 * Format a UTC ISO 8601 instant as "YYYY-MM-DD HH:MM" in `timeZone`.
 * Returns the input unchanged when it cannot be parsed (legacy fallback).
 */
export function formatInZone(isoUtc: string, timeZone: string): string {
  const d = new Date(isoUtc);
  if (isNaN(d.getTime())) return isoUtc;
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(d);
  const p = partsToObj(parts);
  return `${p.year}-${p.month}-${p.day} ${p.hour}:${p.minute}`;
}

/** Today's date as "YYYY-MM-DD" in `timeZone`. */
export function todayInZone(timeZone: string): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const p = partsToObj(parts);
  return `${p.year}-${p.month}-${p.day}`;
}

/**
 * Compute the UTC offset (in minutes) that `timeZone` is from UTC at the
 * given instant. Positive east of UTC (e.g., +120 for Paris in summer, +480
 * for Taipei). DST-aware via `Intl.DateTimeFormat`.
 */
function tzOffsetMinutes(timeZone: string, atUtc: Date): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(atUtc);
  const p = partsToObj(parts);
  const asUtcOfTzWallClock = Date.UTC(
    parseInt(p.year, 10),
    parseInt(p.month, 10) - 1,
    parseInt(p.day, 10),
    parseInt(p.hour, 10),
    parseInt(p.minute, 10),
    parseInt(p.second, 10),
  );
  return Math.round((asUtcOfTzWallClock - atUtc.getTime()) / 60_000);
}

/**
 * Convert a UTC wall-clock (the way sessions are stored) into the viewer's
 * local wall-clock. Date may shift by ±1 day.
 */
export function utcWallToLocal(
  date: string,
  time: string,
  timeZone: string,
): { date: string; time: string } {
  const instant = new Date(`${date}T${time}:00Z`);
  if (isNaN(instant.getTime())) return { date, time };
  return formatInstantAsWall(instant, timeZone);
}

/**
 * Convert a viewer-local wall-clock (what the user enters) into a UTC
 * wall-clock for storage. DST-aware.
 */
export function localWallToUtc(
  date: string,
  time: string,
  timeZone: string,
): { date: string; time: string } {
  // Treat the local wall-clock as if it were UTC; then offset back by the
  // tz offset at that approximate instant. One pass is enough because the
  // offset variation across the ~24h DST shift is bounded.
  const naive = new Date(`${date}T${time}:00Z`);
  if (isNaN(naive.getTime())) return { date, time };
  const offsetMin = tzOffsetMinutes(timeZone, naive);
  const trueUtc = new Date(naive.getTime() - offsetMin * 60_000);
  return {
    date: `${trueUtc.getUTCFullYear()}-${pad2(trueUtc.getUTCMonth() + 1)}-${pad2(trueUtc.getUTCDate())}`,
    time: `${pad2(trueUtc.getUTCHours())}:${pad2(trueUtc.getUTCMinutes())}`,
  };
}

function formatInstantAsWall(
  instant: Date,
  timeZone: string,
): { date: string; time: string } {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(instant);
  const p = partsToObj(parts);
  return {
    date: `${p.year}-${p.month}-${p.day}`,
    time: `${p.hour}:${p.minute}`,
  };
}

function addOneDayUtc(date: string): string {
  const [y, m, d] = date.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + 1);
  return `${dt.getUTCFullYear()}-${pad2(dt.getUTCMonth() + 1)}-${pad2(dt.getUTCDate())}`;
}

/**
 * Resolve a stored session (UTC wall-clock on a single `date`) into the
 * viewer's local wall-clock. When the stored `endTime < startTime`, the end
 * is treated as falling on the next UTC day (set by `localWallToUtc` when
 * the user's local-time session straddles UTC midnight).
 */
export function resolveSessionLocal(
  date: string,
  startTime: string,
  endTime: string,
  timeZone: string,
): {
  localStartDate: string;
  localStartTime: string;
  localEndDate: string;
  localEndTime: string;
} {
  const start = utcWallToLocal(date, startTime, timeZone);
  const endUtcDate = endTime < startTime ? addOneDayUtc(date) : date;
  const end = utcWallToLocal(endUtcDate, endTime, timeZone);
  return {
    localStartDate: start.date,
    localStartTime: start.time,
    localEndDate: end.date,
    localEndTime: end.time,
  };
}
