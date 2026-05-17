import { useState, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import type { Session, SessionKind } from "../types/domain";
import { markLocalDirty } from "../utils/syncDirty";

export interface SessionMutation {
  date: string;
  startTime: string;
  endTime: string;
  kind: SessionKind;
  done: boolean;
  notes: string | null;
  textIds: number[];
}

export interface UseSessionsReturn {
  sessions: Session[];
  loadRange: (from: string, to: string) => Promise<void>;
  createSession: (input: SessionMutation, author: string | null) => Promise<Session>;
  updateSession: (id: number, input: SessionMutation) => Promise<Session>;
  deleteSession: (id: number) => Promise<void>;
  refresh: () => Promise<void>;
}

export function useSessions(): UseSessionsReturn {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [range, setRange] = useState<{ from: string; to: string } | null>(null);

  const loadRange = useCallback(async (from: string, to: string) => {
    const list = await invoke<Session[]>("list_sessions", { from, to });
    setSessions(list);
    setRange({ from, to });
  }, []);

  const refresh = useCallback(async () => {
    if (!range) return;
    const list = await invoke<Session[]>("list_sessions", { from: range.from, to: range.to });
    setSessions(list);
  }, [range]);

  const createSession = useCallback(
    async (input: SessionMutation, author: string | null) => {
      const created = await invoke<Session>("create_session", {
        date: input.date,
        startTime: input.startTime,
        endTime: input.endTime,
        kind: input.kind,
        done: input.done,
        notes: input.notes,
        author,
        textIds: input.textIds,
      });
      markLocalDirty();
      // If created in range, append; otherwise the caller should reload.
      if (range && created.date >= range.from && created.date <= range.to) {
        setSessions((prev) => [...prev, created]);
      }
      return created;
    },
    [range],
  );

  const updateSession = useCallback(
    async (id: number, input: SessionMutation) => {
      const updated = await invoke<Session>("update_session", {
        sessionId: id,
        date: input.date,
        startTime: input.startTime,
        endTime: input.endTime,
        kind: input.kind,
        done: input.done,
        notes: input.notes,
        textIds: input.textIds,
      });
      markLocalDirty();
      setSessions((prev) => {
        // Remove old, insert if still in range.
        const without = prev.filter((s) => s.id !== id);
        if (range && updated.date >= range.from && updated.date <= range.to) {
          return [...without, updated];
        }
        return without;
      });
      return updated;
    },
    [range],
  );

  const deleteSession = useCallback(async (id: number) => {
    await invoke("delete_session", { sessionId: id });
    markLocalDirty();
    setSessions((prev) => prev.filter((s) => s.id !== id));
  }, []);

  return {
    sessions,
    loadRange,
    createSession,
    updateSession,
    deleteSession,
    refresh,
  };
}
