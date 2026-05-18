// CRUD for sessions (formerly the `sessions` + `session_texts` SQLite
// tables). Filtering is by `date` (UTC wall-clock); the frontend re-groups
// in the viewer's local TZ via `resolveSessionLocal`.
import type { Session, SessionKind } from "../types/domain";
import { nowUtcIso } from "../utils/dateTimeFormat";
import { getDatabase } from "./connection";
import type { SessionRecord } from "./schema";

function validateSessionFields(
  date: string,
  startTime: string,
  endTime: string,
): void {
  if (date.length !== 10 || date[4] !== "-" || date[7] !== "-") {
    throw new Error(`Invalid date format: ${date}`);
  }
  for (const t of [startTime, endTime]) {
    if (t.length !== 5 || t[2] !== ":") {
      throw new Error(`Invalid time format: ${t}`);
    }
  }
  // `endTime` < `startTime` is allowed: a local-time session straddling UTC
  // midnight (e.g. Paris 01:00→02:00 in summer) stores end on the next UTC
  // day. Equality is rejected (zero duration).
  if (endTime === startTime) {
    throw new Error("End time must differ from start time");
  }
}

async function loadSessionTextIds(sessionId: number): Promise<number[]> {
  const db = await getDatabase();
  const links = await db.getAllFromIndex("session_texts", "by-session", sessionId);
  const ids = links.map((l) => l.textId);
  ids.sort((a, b) => a - b);
  return ids;
}

async function replaceSessionTexts(
  sessionId: number,
  textIds: number[],
): Promise<void> {
  const db = await getDatabase();
  const tx = db.transaction(["session_texts", "texts"], "readwrite");
  const stStore = tx.objectStore("session_texts");
  const textStore = tx.objectStore("texts");
  const existingKeys = await stStore.index("by-session").getAllKeys(sessionId);
  for (const k of existingKeys) await stStore.delete(k);
  const seen = new Set<number>();
  for (const tid of textIds) {
    if (seen.has(tid)) continue;
    seen.add(tid);
    // FK check (SQLite did this implicitly via ON DELETE CASCADE).
    const exists = await textStore.get(tid);
    if (!exists) {
      await tx.done;
      throw new Error(`Text with id ${tid} not found`);
    }
    await stStore.add({ sessionId, textId: tid });
  }
  await tx.done;
}

export async function listSessionsInRange(
  from: string,
  to: string,
): Promise<Session[]> {
  const db = await getDatabase();
  const range = IDBKeyRange.bound(from, to);
  const rows = await db.getAllFromIndex("sessions", "by-date", range);
  rows.sort((a, b) => {
    if (a.date !== b.date) return a.date < b.date ? -1 : 1;
    if (a.startTime !== b.startTime)
      return a.startTime < b.startTime ? -1 : 1;
    return a.id - b.id;
  });
  const sessions: Session[] = [];
  for (const r of rows) {
    const textIds = await loadSessionTextIds(r.id);
    sessions.push({
      id: r.id,
      date: r.date,
      startTime: r.startTime,
      endTime: r.endTime,
      kind: r.kind,
      done: r.done,
      notes: r.notes,
      author: r.author,
      textIds,
      createdAt: r.createdAt,
      modifiedAt: r.modifiedAt,
    });
  }
  return sessions;
}

export interface CreateSessionInput {
  date: string;
  startTime: string;
  endTime: string;
  kind: SessionKind;
  done: boolean;
  notes: string | null;
  author: string | null;
  textIds: number[];
}

export async function createSession(input: CreateSessionInput): Promise<Session> {
  validateSessionFields(input.date, input.startTime, input.endTime);
  const db = await getDatabase();
  const createdAt = nowUtcIso();
  const id = (await db.add("sessions", {
    date: input.date,
    startTime: input.startTime,
    endTime: input.endTime,
    kind: input.kind,
    done: input.done,
    notes: input.notes,
    author: input.author,
    createdAt,
    modifiedAt: null,
  } as unknown as SessionRecord)) as number;
  await replaceSessionTexts(id, input.textIds);
  return {
    id,
    date: input.date,
    startTime: input.startTime,
    endTime: input.endTime,
    kind: input.kind,
    done: input.done,
    notes: input.notes,
    author: input.author,
    textIds: [...new Set(input.textIds)].sort((a, b) => a - b),
    createdAt,
    modifiedAt: null,
  };
}

export interface UpdateSessionInput {
  date: string;
  startTime: string;
  endTime: string;
  kind: SessionKind;
  done: boolean;
  notes: string | null;
  textIds: number[];
}

export async function updateSession(
  id: number,
  input: UpdateSessionInput,
): Promise<Session> {
  validateSessionFields(input.date, input.startTime, input.endTime);
  const db = await getDatabase();
  const tx = db.transaction("sessions", "readwrite");
  const store = tx.objectStore("sessions");
  const row = await store.get(id);
  if (!row) {
    await tx.done;
    throw new Error(`Session with id ${id} not found`);
  }
  const modifiedAt = nowUtcIso();
  row.date = input.date;
  row.startTime = input.startTime;
  row.endTime = input.endTime;
  row.kind = input.kind;
  row.done = input.done;
  row.notes = input.notes;
  row.modifiedAt = modifiedAt;
  await store.put(row);
  await tx.done;
  await replaceSessionTexts(id, input.textIds);
  return {
    id,
    date: input.date,
    startTime: input.startTime,
    endTime: input.endTime,
    kind: input.kind,
    done: input.done,
    notes: input.notes,
    author: row.author,
    textIds: [...new Set(input.textIds)].sort((a, b) => a - b),
    createdAt: row.createdAt,
    modifiedAt,
  };
}

export async function deleteSession(id: number): Promise<void> {
  const db = await getDatabase();
  const tx = db.transaction(["sessions", "session_texts"], "readwrite");
  const exists = await tx.objectStore("sessions").get(id);
  if (!exists) {
    await tx.done;
    throw new Error(`Session with id ${id} not found`);
  }
  const stIndex = tx.objectStore("session_texts").index("by-session");
  const keys = await stIndex.getAllKeys(id);
  for (const k of keys) await tx.objectStore("session_texts").delete(k);
  await tx.objectStore("sessions").delete(id);
  await tx.done;
}
