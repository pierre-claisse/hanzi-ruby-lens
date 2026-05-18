import { useMemo, useState, useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Session } from "../types/domain";
import {
  buildCalendarGrid,
  shiftMonth,
  monthName,
} from "../utils/calendarGrid";
import { todayInZone, utcWallToLocal } from "../utils/dateTimeFormat";

interface CalendarScreenProps {
  year: number;
  month: number;
  onChangeYearMonth: (year: number, month: number) => void;
  sessions: Session[];
  selectedDate: string | null;
  onSelectDate: (date: string) => void;
  timeZone: string;
}

const WEEKDAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const YEAR_MIN = 1900;
const YEAR_MAX = 2100;

export function CalendarScreen({
  year,
  month,
  onChangeYearMonth,
  sessions,
  selectedDate,
  onSelectDate,
  timeZone,
}: CalendarScreenProps) {
  const [yearPickerOpen, setYearPickerOpen] = useState(false);
  const yearPickerRef = useRef<HTMLDivElement>(null);
  const yearListRef = useRef<HTMLDivElement>(null);

  const grid = useMemo(() => buildCalendarGrid(year, month), [year, month]);
  const today = useMemo(() => todayInZone(timeZone), [timeZone]);

  // Sessions are stored as UTC wall-clock. Group them by their *local* date
  // (the date the user sees in their time zone), which may differ from the
  // stored UTC date by ±1 day.
  const sessionsByDate = useMemo(() => {
    const m = new Map<string, { lessons: number; studies: number }>();
    for (const s of sessions) {
      const local = utcWallToLocal(s.date, s.startTime, timeZone);
      const entry = m.get(local.date) ?? { lessons: 0, studies: 0 };
      if (s.kind === "live_lesson") entry.lessons++;
      else entry.studies++;
      m.set(local.date, entry);
    }
    return m;
  }, [sessions, timeZone]);

  const goPrev = () => {
    const { year: y, month: mo } = shiftMonth(year, month, -1);
    onChangeYearMonth(y, mo);
  };
  const goNext = () => {
    const { year: y, month: mo } = shiftMonth(year, month, 1);
    onChangeYearMonth(y, mo);
  };
  const goToday = () => {
    const [y, mo] = today.split("-").map(Number);
    onChangeYearMonth(y, mo);
  };

  // Close year picker when clicking outside.
  useEffect(() => {
    if (!yearPickerOpen) return;
    const handler = (e: MouseEvent) => {
      if (yearPickerRef.current && !yearPickerRef.current.contains(e.target as Node)) {
        setYearPickerOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [yearPickerOpen]);

  // Scroll the current year into view when the picker opens.
  useEffect(() => {
    if (!yearPickerOpen || !yearListRef.current) return;
    const el = yearListRef.current.querySelector<HTMLElement>(`[data-year="${year}"]`);
    if (el) el.scrollIntoView({ block: "center" });
  }, [yearPickerOpen, year]);

  return (
    <div className="bg-surface text-content pt-4 pb-12 px-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="p-1.5 rounded-lg border border-content/20 hover:bg-content/5 transition-colors"
              onClick={goPrev}
              aria-label="Previous month"
              title="Previous month"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div ref={yearPickerRef} className="relative">
              <button
                type="button"
                onClick={() => setYearPickerOpen((v) => !v)}
                className="px-3 py-1.5 text-lg font-semibold text-content hover:bg-content/5 rounded-lg transition-colors"
              >
                {monthName(month)} {year}
              </button>
              {yearPickerOpen && (
                <div
                  ref={yearListRef}
                  className="absolute left-0 top-full mt-1 w-32 max-h-80 overflow-y-auto rounded-lg border border-content/20 bg-surface shadow-lg z-50"
                >
                  {Array.from({ length: YEAR_MAX - YEAR_MIN + 1 }, (_, i) => YEAR_MAX - i).map((y) => (
                    <button
                      key={y}
                      data-year={y}
                      type="button"
                      onClick={() => {
                        onChangeYearMonth(y, month);
                        setYearPickerOpen(false);
                      }}
                      className={`block w-full text-left px-3 py-1.5 text-sm hover:bg-content/5 transition-colors ${
                        y === year ? "text-accent font-semibold" : "text-content"
                      }`}
                    >
                      {y}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button
              type="button"
              className="p-1.5 rounded-lg border border-content/20 hover:bg-content/5 transition-colors"
              onClick={goNext}
              aria-label="Next month"
              title="Next month"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
          <button
            type="button"
            className="px-3 py-1.5 text-sm rounded-lg border border-content/20 hover:bg-content/5 transition-colors"
            onClick={goToday}
          >
            Today
          </button>
        </div>

        {/* Weekday header */}
        <div className="grid grid-cols-7 gap-1 mb-1">
          {WEEKDAY_LABELS.map((w) => (
            <div key={w} className="text-xs font-medium text-content/50 text-center py-1">
              {w}
            </div>
          ))}
        </div>

        {/* Grid */}
        <div className="grid grid-cols-7 gap-1">
          {grid.map((cell) => {
            const isToday = cell.date === today;
            const isSelected = cell.date === selectedDate;
            const counts = sessionsByDate.get(cell.date);
            return (
              <button
                key={cell.date}
                type="button"
                onClick={() => onSelectDate(cell.date)}
                className={`flex flex-col p-1.5 min-h-[5.5rem] text-left rounded-md border transition-colors ${
                  cell.inMonth ? "bg-surface" : "bg-content/[0.02]"
                } ${
                  isSelected ? "border-accent ring-2 ring-accent" : "border-content/10"
                } hover:bg-content/5 cursor-pointer`}
              >
                <span
                  className={`inline-flex items-center justify-center w-6 h-6 text-sm rounded-full ${
                    isToday
                      ? "bg-accent text-white font-semibold"
                      : cell.inMonth
                      ? "text-content"
                      : "text-content/30"
                  }`}
                >
                  {cell.day}
                </span>
                <div className="mt-auto flex flex-wrap gap-1">
                  {counts && counts.lessons > 0 && (
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-500/15 text-blue-600 dark:text-blue-300">
                      {counts.lessons === 1 ? "1 lesson" : `${counts.lessons} lessons`}
                    </span>
                  )}
                  {counts && counts.studies > 0 && (
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-500/15 text-amber-600 dark:text-amber-300">
                      {counts.studies === 1 ? "1 study" : `${counts.studies} studies`}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// Visible range used to fetch sessions. The grid covers the visible local
// dates; sessions are stored in UTC wall-clock that can shift by ±1 day from
// the viewer's local date, so we pad the range by one day on each side.
function shiftIsoDate(isoDate: string, deltaDays: number): string {
  const [y, m, d] = isoDate.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + deltaDays);
  const pad = (n: number) => (n < 10 ? `0${n}` : String(n));
  return `${dt.getUTCFullYear()}-${pad(dt.getUTCMonth() + 1)}-${pad(dt.getUTCDate())}`;
}

export function visibleMonthRange(year: number, month: number): { from: string; to: string } {
  const grid = buildCalendarGrid(year, month);
  return {
    from: shiftIsoDate(grid[0].date, -1),
    to: shiftIsoDate(grid[grid.length - 1].date, 1),
  };
}
