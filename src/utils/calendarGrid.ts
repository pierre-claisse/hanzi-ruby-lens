export interface CalendarCell {
  date: string;       // YYYY-MM-DD
  day: number;        // 1-31
  inMonth: boolean;
}

export function pad2(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

function isLeap(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

function daysInMonth(year: number, month: number): number {
  const lengths = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  if (month === 2 && isLeap(year)) return 29;
  return lengths[month - 1];
}

// Day of week for the 1st of `month`, returning 0..6 where 0 = Monday.
function weekdayMondayFirst(year: number, month: number): number {
  // UTC-based to avoid host timezone drift.
  const sundayFirst = new Date(Date.UTC(year, month - 1, 1)).getUTCDay(); // 0..6, 0=Sunday
  return (sundayFirst + 6) % 7;
}

/**
 * Build a 6x7 calendar grid (42 cells) for the given month, starting on Monday.
 * Pre-month and post-month cells use the adjacent months' dates, with
 * `inMonth: false`.
 */
export function buildCalendarGrid(year: number, month: number): CalendarCell[] {
  const cells: CalendarCell[] = [];
  const firstWeekday = weekdayMondayFirst(year, month);
  const inMonthDays = daysInMonth(year, month);

  const prevMonth = month === 1 ? 12 : month - 1;
  const prevYear = month === 1 ? year - 1 : year;
  const prevMonthDays = daysInMonth(prevYear, prevMonth);

  for (let i = firstWeekday - 1; i >= 0; i--) {
    const day = prevMonthDays - i;
    cells.push({
      date: `${prevYear}-${pad2(prevMonth)}-${pad2(day)}`,
      day,
      inMonth: false,
    });
  }

  for (let day = 1; day <= inMonthDays; day++) {
    cells.push({
      date: `${year}-${pad2(month)}-${pad2(day)}`,
      day,
      inMonth: true,
    });
  }

  const nextMonth = month === 12 ? 1 : month + 1;
  const nextYear = month === 12 ? year + 1 : year;
  let nextDay = 1;
  while (cells.length < 42) {
    cells.push({
      date: `${nextYear}-${pad2(nextMonth)}-${pad2(nextDay)}`,
      day: nextDay,
      inMonth: false,
    });
    nextDay++;
  }

  return cells;
}

export function shiftMonth(year: number, month: number, delta: number): { year: number; month: number } {
  const totalIdx = year * 12 + (month - 1) + delta;
  const newYear = Math.floor(totalIdx / 12);
  const newMonth = (totalIdx % 12 + 12) % 12 + 1;
  return { year: newYear, month: newMonth };
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export function monthName(month: number): string {
  return MONTH_NAMES[month - 1];
}

export function formatDateLong(date: string): string {
  const [y, m, d] = date.split("-").map(Number);
  // UTC noon to dodge DST edge cases when formatting weekday.
  const dt = new Date(Date.UTC(y, m - 1, d, 12));
  const weekdays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  return `${weekdays[dt.getUTCDay()]}, ${d} ${monthName(m)} ${y}`;
}

/**
 * Returns -1 if a < b, 0 if equal, 1 if a > b. Pure lexicographic compare on
 * 'YYYY-MM-DD'.
 */
export function compareDates(a: string, b: string): number {
  if (a < b) return -1;
  if (a > b) return 1;
  return 0;
}
