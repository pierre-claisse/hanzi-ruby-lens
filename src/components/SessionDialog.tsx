import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { X, Trash2, BookOpen, GraduationCap } from "lucide-react";
import type { Session, SessionKind, TextPreview } from "../types/domain";
import type { SessionMutation } from "../hooks/useSessions";
import { fuzzyFilterTexts } from "../utils/textSearch";
import { compareDates } from "../utils/calendarGrid";
import { todayInZone, localWallToUtc, resolveSessionLocal } from "../utils/dateTimeFormat";

interface SessionDialogProps {
  open: boolean;
  session: Session | null;
  defaultDate: string;
  texts: TextPreview[];
  onSave: (id: number | null, input: SessionMutation) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
  onClose: () => void;
  timeZone: string;
}

const MAX_NOTES_LEN = 5000;

export function SessionDialog({
  open,
  session,
  defaultDate,
  texts,
  onSave,
  onDelete,
  onClose,
  timeZone,
}: SessionDialogProps) {
  const [date, setDate] = useState<string>("");
  const [startTime, setStartTime] = useState<string>("");
  const [endTime, setEndTime] = useState<string>("");
  const [kind, setKind] = useState<SessionKind>("live_lesson");
  const [done, setDone] = useState<boolean>(false);
  const [notes, setNotes] = useState<string>("");
  const [textIds, setTextIds] = useState<number[]>([]);
  const [textQuery, setTextQuery] = useState<string>("");
  const [textPickerOpen, setTextPickerOpen] = useState<boolean>(false);
  const pickerRef = useRef<HTMLDivElement>(null);

  // Init from props when dialog opens. Sessions are stored in UTC wall-clock;
  // the form always shows the viewer's local wall-clock. `resolveSessionLocal`
  // handles the UTC midnight wrap (endTime < startTime).
  useEffect(() => {
    if (!open) return;
    if (session) {
      const r = resolveSessionLocal(session.date, session.startTime, session.endTime, timeZone);
      setDate(r.localStartDate);
      setStartTime(r.localStartTime);
      setEndTime(r.localEndTime);
      setKind(session.kind);
      setDone(session.done);
      setNotes(session.notes ?? "");
      setTextIds(session.textIds);
    } else {
      setDate(defaultDate);
      setStartTime("");
      setEndTime("");
      setKind("live_lesson");
      setDone(false);
      setNotes("");
      setTextIds([]);
    }
    setTextQuery("");
    setTextPickerOpen(false);
  }, [open, session, defaultDate, timeZone]);

  // Click outside picker closes it. Use the capture phase so this fires even
  // when the surrounding dialog calls `stopPropagation()` on mousedown (the
  // dialog body does, to prevent backdrop dismissal).
  useEffect(() => {
    if (!textPickerOpen) return;
    const handler = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setTextPickerOpen(false);
      }
    };
    document.addEventListener("mousedown", handler, true);
    return () => document.removeEventListener("mousedown", handler, true);
  }, [textPickerOpen]);

  const isFuture: boolean = open && !!date && compareDates(date, todayInZone(timeZone)) > 0;

  // If user moves date into the future, auto-uncheck Done.
  useEffect(() => {
    if (isFuture && done) setDone(false);
  }, [isFuture, done]);

  const validTimes = startTime !== "" && endTime !== "" && endTime > startTime;
  const validDate = /^\d{4}-\d{2}-\d{2}$/.test(date);

  const textsById = useMemo(() => {
    const m = new Map<number, TextPreview>();
    for (const t of texts) m.set(t.id, t);
    return m;
  }, [texts]);

  const availableForPicker = useMemo(() => {
    const filtered = fuzzyFilterTexts(textQuery, texts);
    return filtered.filter((t) => !textIds.includes(t.id));
  }, [textQuery, texts, textIds]);

  // Compare in local wall-clock space (what the user sees). Convert the
  // session's stored UTC to the viewer's local on the fly.
  const hasChanged = useMemo(() => {
    if (!session) return true; // create mode: any save is a change
    const r = resolveSessionLocal(session.date, session.startTime, session.endTime, timeZone);
    const sameTextIds =
      textIds.length === session.textIds.length &&
      textIds.every((id, i) => id === session.textIds[i]);
    return (
      date !== r.localStartDate ||
      startTime !== r.localStartTime ||
      endTime !== r.localEndTime ||
      kind !== session.kind ||
      done !== session.done ||
      (notes.trim() || null) !== (session.notes ?? null) ||
      !sameTextIds
    );
  }, [session, date, startTime, endTime, kind, done, notes, textIds, timeZone]);

  const canSave = validDate && validTimes && hasChanged;

  const handleSave = useCallback(async () => {
    if (!canSave) return;
    // Convert local wall-clock (form values) back to UTC wall-clock for storage.
    const utcStart = localWallToUtc(date, startTime, timeZone);
    const utcEnd = localWallToUtc(date, endTime, timeZone);
    const mutation: SessionMutation = {
      date: utcStart.date,
      startTime: utcStart.time,
      endTime: utcEnd.time,
      kind,
      done,
      notes: notes.trim() ? notes.trim() : null,
      textIds: [...new Set(textIds)],
    };
    await onSave(session?.id ?? null, mutation);
  }, [canSave, date, startTime, endTime, kind, done, notes, textIds, session, onSave]);

  const handleDelete = useCallback(async () => {
    if (!session) return;
    await onDelete(session.id);
  }, [session, onDelete]);

  const handleAddText = useCallback((id: number) => {
    setTextIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
    setTextQuery("");
  }, []);

  const handleRemoveText = useCallback((id: number) => {
    setTextIds((prev) => prev.filter((x) => x !== id));
  }, []);

  if (!open) return null;

  const isEditing = !!session;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-surface border border-content/20 rounded-xl shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-content/10">
          <h2 className="text-lg font-semibold text-content">
            {isEditing ? "Edit session" : "Add session"}
          </h2>
          <button
            type="button"
            className="p-1 rounded-lg text-content/40 hover:text-content hover:bg-content/5 transition-colors"
            onClick={onClose}
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-4 overflow-y-auto space-y-4">
          {/* Date / Start / End row */}
          <div className="grid grid-cols-3 gap-3">
            <label className="block">
              <span className="block text-xs text-content/60 mb-1">Date</span>
              <input
                type="date"
                className="w-full px-2 py-1.5 text-sm bg-content/5 border border-content/20 rounded text-content focus:outline-none focus:ring-2 focus:ring-accent"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </label>
            <label className="block">
              <span className="block text-xs text-content/60 mb-1">Start</span>
              <input
                type="time"
                step={900}
                className="w-full px-2 py-1.5 text-sm bg-content/5 border border-content/20 rounded text-content focus:outline-none focus:ring-2 focus:ring-accent"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </label>
            <label className="block">
              <span className="block text-xs text-content/60 mb-1">End</span>
              <input
                type="time"
                step={900}
                className="w-full px-2 py-1.5 text-sm bg-content/5 border border-content/20 rounded text-content focus:outline-none focus:ring-2 focus:ring-accent"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />
            </label>
          </div>
          {!validTimes && startTime !== "" && endTime !== "" && (
            <p className="text-xs text-red-500">End time must be after start time.</p>
          )}

          {/* Type radios */}
          <div>
            <span className="block text-xs text-content/60 mb-2">Type</span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setKind("live_lesson")}
                className={`flex items-center gap-2 px-3 py-2 text-sm rounded-lg border transition-colors ${
                  kind === "live_lesson"
                    ? "border-accent bg-accent/10 text-content"
                    : "border-content/20 text-content/60 hover:bg-content/5"
                }`}
              >
                <GraduationCap className="w-4 h-4" />
                Live lesson
              </button>
              <button
                type="button"
                onClick={() => setKind("study_session")}
                className={`flex items-center gap-2 px-3 py-2 text-sm rounded-lg border transition-colors ${
                  kind === "study_session"
                    ? "border-accent bg-accent/10 text-content"
                    : "border-content/20 text-content/60 hover:bg-content/5"
                }`}
              >
                <BookOpen className="w-4 h-4" />
                Study session
              </button>
            </div>
          </div>

          {/* Done checkbox */}
          <label
            className={`inline-flex items-center gap-2 ${
              isFuture ? "opacity-40 cursor-not-allowed" : "cursor-pointer"
            }`}
            title={isFuture ? "Can't mark a future session as done" : undefined}
          >
            <input
              type="checkbox"
              checked={done}
              disabled={isFuture}
              onChange={(e) => setDone(e.target.checked)}
              className="w-4 h-4 accent-accent"
            />
            <span className="text-sm text-content">Done</span>
          </label>

          {/* Linked texts */}
          <div ref={pickerRef} className="relative">
            <span className="block text-xs text-content/60 mb-1">Linked texts</span>
            {textIds.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-2">
                {textIds.map((id) => {
                  const t = textsById.get(id);
                  if (!t) return null;
                  return (
                    <span
                      key={id}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-content/10 text-content"
                    >
                      {t.title}
                      <button
                        type="button"
                        onClick={() => handleRemoveText(id)}
                        className="text-content/60 hover:text-content"
                        aria-label={`Remove ${t.title}`}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  );
                })}
              </div>
            )}
            <input
              type="text"
              placeholder="Link a text..."
              value={textQuery}
              onChange={(e) => setTextQuery(e.target.value)}
              onFocus={() => setTextPickerOpen(true)}
              className="w-full px-2 py-1.5 text-sm bg-content/5 border border-content/20 rounded text-content placeholder:text-content/30 focus:outline-none focus:ring-2 focus:ring-accent"
            />
            {textPickerOpen && availableForPicker.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-1 max-h-48 overflow-y-auto rounded-lg border border-content/20 bg-surface shadow-lg z-10">
                {availableForPicker.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => handleAddText(t.id)}
                    className="w-full text-left px-3 py-1.5 text-sm text-content hover:bg-content/5 transition-colors"
                  >
                    {t.title}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Notes */}
          <label className="block">
            <span className="block text-xs text-content/60 mb-1">Notes</span>
            <textarea
              rows={4}
              maxLength={MAX_NOTES_LEN}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional notes..."
              className="w-full px-2 py-1.5 text-sm bg-content/5 border border-content/20 rounded text-content placeholder:text-content/30 focus:outline-none focus:ring-2 focus:ring-accent resize-none"
            />
            <div className="text-xs text-content/40 text-right mt-0.5">
              {notes.length}/{MAX_NOTES_LEN}
            </div>
          </label>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-content/10">
          <div>
            {isEditing && (
              <button
                type="button"
                className="flex items-center gap-1.5 px-3 py-2 text-sm text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                onClick={handleDelete}
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="px-4 py-2 text-sm text-content/60 hover:text-content transition-colors rounded-lg"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={!canSave}
              className="px-4 py-2 text-sm font-medium rounded-lg bg-accent text-white hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:opacity-40"
              onClick={handleSave}
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
