import { useMemo } from "react";
import {
  Plus,
  GraduationCap,
  BookOpen,
  CheckSquare,
  Square,
} from "lucide-react";
import type { Session, TextPreview } from "../types/domain";
import { formatDateLong, compareDates } from "../utils/calendarGrid";
import { formatInZone, todayInZone, resolveSessionLocal } from "../utils/dateTimeFormat";

interface DateSessionsPanelProps {
  date: string;
  sessions: Session[];
  texts: TextPreview[];
  onAddSession: () => void;
  onEditSession: (id: number) => void;
  onToggleDone: (id: number) => void;
  timeZone: string;
}

export function DateSessionsPanel({
  date,
  sessions,
  texts,
  onAddSession,
  onEditSession,
  onToggleDone,
  timeZone,
}: DateSessionsPanelProps) {
  const textsById = useMemo(() => {
    const m = new Map<number, TextPreview>();
    for (const t of texts) m.set(t.id, t);
    return m;
  }, [texts]);

  // Sessions store UTC wall-clock; resolve each to the viewer's local
  // wall-clock so we can filter and sort by what the user actually sees.
  // Sessions whose local-time end falls past UTC midnight are handled by
  // `resolveSessionLocal` (end on next UTC day).
  const dateSessions = useMemo(() => {
    const enriched = sessions.map((s) => {
      const r = resolveSessionLocal(s.date, s.startTime, s.endTime, timeZone);
      return {
        ...s,
        localDate: r.localStartDate,
        localStartTime: r.localStartTime,
        localEndTime: r.localEndTime,
      };
    });
    return enriched
      .filter((s) => s.localDate === date)
      .sort((a, b) =>
        a.localStartTime < b.localStartTime
          ? -1
          : a.localStartTime > b.localStartTime
          ? 1
          : a.id - b.id,
      );
  }, [sessions, date, timeZone]);

  const isFuture = compareDates(date, todayInZone(timeZone)) > 0;

  return (
    <div className="flex-shrink-0 w-80 h-full border-l border-content/10 flex flex-col">
      <div className="flex-shrink-0 px-4 pt-4 pb-3 border-b border-content/10">
        <p className="text-sm font-semibold text-content">{formatDateLong(date)}</p>
        <button
          type="button"
          onClick={onAddSession}
          className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg bg-accent text-white hover:opacity-90 transition-opacity"
        >
          <Plus className="w-4 h-4" />
          Add session
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3">
        {dateSessions.length === 0 ? (
          <p className="text-sm text-content/30 text-center py-8">No sessions yet</p>
        ) : (
          <div className="space-y-2">
            {dateSessions.map((s) => {
              const Icon = s.kind === "live_lesson" ? GraduationCap : BookOpen;
              const label = s.kind === "live_lesson" ? "Lesson" : "Study";
              const colorClass =
                s.kind === "live_lesson" ? "text-blue-500" : "text-amber-500";
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => onEditSession(s.id)}
                  className="w-full text-left p-2.5 rounded-lg border border-content/10 hover:border-accent/30 hover:bg-accent/5 transition-colors cursor-pointer"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className={`flex items-center gap-1.5 text-xs font-semibold ${colorClass}`}>
                      <Icon className="w-3.5 h-3.5" />
                      <span>{label}</span>
                      <span className="text-content/60 font-normal">
                        · {s.localStartTime} – {s.localEndTime}
                      </span>
                    </div>
                    <span
                      role="button"
                      tabIndex={0}
                      aria-label={s.done ? "Mark as not done" : "Mark as done"}
                      title={
                        isFuture
                          ? "Can't mark a future session as done"
                          : s.done
                          ? "Mark as not done"
                          : "Mark as done"
                      }
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!isFuture) onToggleDone(s.id);
                      }}
                      onKeyDown={(e) => {
                        if (isFuture) return;
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          e.stopPropagation();
                          onToggleDone(s.id);
                        }
                      }}
                      className={`flex-shrink-0 ${
                        isFuture
                          ? "text-content/20 cursor-not-allowed"
                          : "text-content/60 hover:text-accent cursor-pointer"
                      }`}
                    >
                      {s.done ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                    </span>
                  </div>
                  {s.notes && (
                    <p className="text-xs text-content/70 mt-1.5 line-clamp-2">{s.notes}</p>
                  )}
                  {s.textIds.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {s.textIds.map((tid) => {
                        const t = textsById.get(tid);
                        if (!t) return null;
                        return (
                          <span
                            key={tid}
                            className="inline-block px-1.5 py-0.5 rounded text-[10px] bg-content/10 text-content/80"
                          >
                            {t.title}
                          </span>
                        );
                      })}
                    </div>
                  )}
                  {(s.author || s.createdAt) && (
                    <p className="text-[10px] text-content/40 mt-1">
                      {s.author ?? "—"}
                      {s.createdAt && ` · ${formatInZone(s.createdAt, timeZone)}`}
                    </p>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
