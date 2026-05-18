// Export the whole IDB as a portable JSON payload, validate one before
// import, and wipe + reload from a payload. Used both for the manual JSON
// export (Pierre-only) and for the GitHub Gist sync.
import type { SessionKind, TextSegment } from "../types/domain";
import { nowUtcIso } from "../utils/dateTimeFormat";
import { getDatabase } from "./connection";

export interface ExportText {
  id: number;
  title: string;
  // Stored as a JSON-serialized string for parity with the historical
  // SQLite-backed format that lives in the existing GitHub Gist.
  segments: string;
  raw_input: string;
  created_at: string;
  modified_at: string | null;
  // SQLite stored locked as INTEGER 0/1. Keep that on the wire to stay
  // compatible with the existing Gist payload.
  locked: number;
}

export interface ExportTag {
  id: number;
  label: string;
  color: string;
}

export interface ExportTextTag {
  text_id: number;
  tag_id: number;
}

export interface ExportSession {
  id: number;
  date: string;
  start_time: string;
  end_time: string;
  kind: string;
  done: boolean;
  notes: string | null;
  author: string | null;
  created_at: string;
  modified_at: string | null;
}

export interface ExportSessionText {
  session_id: number;
  text_id: number;
}

export interface ExportPayload {
  version: number;
  exported_at: string;
  texts: ExportText[];
  tags: ExportTag[];
  text_tags: ExportTextTag[];
  sessions: ExportSession[];
  session_texts: ExportSessionText[];
  sync_author: string | null;
  sync_timestamp: string | null;
}

export interface ImportResult {
  textCount: number;
  tagCount: number;
}

const KNOWN_KINDS: SessionKind[] = ["live_lesson", "study_session"];

export async function exportAll(): Promise<ExportPayload> {
  const db = await getDatabase();
  const tx = db.transaction(
    ["texts", "tags", "text_tags", "sessions", "session_texts"],
    "readonly",
  );
  const textRows = await tx.objectStore("texts").getAll();
  const tagRows = await tx.objectStore("tags").getAll();
  const ttRows = await tx.objectStore("text_tags").getAll();
  const sessionRows = await tx.objectStore("sessions").getAll();
  const stRows = await tx.objectStore("session_texts").getAll();
  await tx.done;

  return {
    version: 1,
    exported_at: nowUtcIso(),
    texts: textRows.map((t) => ({
      id: t.id,
      title: t.title,
      segments: JSON.stringify(t.segments),
      raw_input: t.rawInput,
      created_at: t.createdAt,
      modified_at: t.modifiedAt,
      locked: t.locked ? 1 : 0,
    })),
    tags: tagRows.map((t) => ({ id: t.id, label: t.label, color: t.color })),
    text_tags: ttRows.map((r) => ({ text_id: r.textId, tag_id: r.tagId })),
    sessions: sessionRows
      .slice()
      .sort((a, b) => a.id - b.id)
      .map((s) => ({
        id: s.id,
        date: s.date,
        start_time: s.startTime,
        end_time: s.endTime,
        kind: s.kind,
        done: s.done,
        notes: s.notes,
        author: s.author,
        created_at: s.createdAt,
        modified_at: s.modifiedAt,
      })),
    session_texts: stRows
      .slice()
      .sort((a, b) =>
        a.sessionId !== b.sessionId
          ? a.sessionId - b.sessionId
          : a.textId - b.textId,
      )
      .map((r) => ({ session_id: r.sessionId, text_id: r.textId })),
    sync_author: null,
    sync_timestamp: null,
  };
}

export function validateExportPayload(payload: ExportPayload): void {
  if (payload.version !== 1) {
    throw new Error(
      `Unsupported export version: ${payload.version}. Expected version 1.`,
    );
  }
  const textIds = new Set<number>();
  for (const t of payload.texts) {
    if (textIds.has(t.id)) throw new Error("Duplicate text IDs in export file");
    textIds.add(t.id);
  }
  const tagIds = new Set<number>();
  for (const t of payload.tags) {
    if (tagIds.has(t.id)) throw new Error("Duplicate tag IDs in export file");
    tagIds.add(t.id);
  }
  for (const tt of payload.text_tags) {
    if (!textIds.has(tt.text_id))
      throw new Error(
        `text_tags references non-existent text_id: ${tt.text_id}`,
      );
    if (!tagIds.has(tt.tag_id))
      throw new Error(`text_tags references non-existent tag_id: ${tt.tag_id}`);
  }
  const sessionIds = new Set<number>();
  for (const s of payload.sessions) {
    if (sessionIds.has(s.id))
      throw new Error("Duplicate session IDs in export file");
    sessionIds.add(s.id);
    if (!KNOWN_KINDS.includes(s.kind as SessionKind))
      throw new Error(
        `Unknown session kind "${s.kind}" for session id ${s.id}`,
      );
  }
  for (const st of payload.session_texts) {
    if (!sessionIds.has(st.session_id))
      throw new Error(
        `session_texts references non-existent session_id: ${st.session_id}`,
      );
    if (!textIds.has(st.text_id))
      throw new Error(
        `session_texts references non-existent text_id: ${st.text_id}`,
      );
  }
}

export async function importAll(payload: ExportPayload): Promise<ImportResult> {
  validateExportPayload(payload);
  const db = await getDatabase();
  const tx = db.transaction(
    ["texts", "tags", "text_tags", "sessions", "session_texts"],
    "readwrite",
  );
  // Wipe.
  await tx.objectStore("session_texts").clear();
  await tx.objectStore("sessions").clear();
  await tx.objectStore("text_tags").clear();
  await tx.objectStore("tags").clear();
  await tx.objectStore("texts").clear();
  // Reload.
  for (const t of payload.texts) {
    let segments: TextSegment[];
    try {
      segments = JSON.parse(t.segments) as TextSegment[];
    } catch {
      segments = [];
    }
    await tx.objectStore("texts").add({
      id: t.id,
      title: t.title,
      createdAt: t.created_at,
      modifiedAt: t.modified_at,
      rawInput: t.raw_input,
      segments,
      locked: !!t.locked,
    });
  }
  for (const tg of payload.tags) {
    await tx.objectStore("tags").add({
      id: tg.id,
      label: tg.label,
      labelLower: tg.label.toLowerCase(),
      color: tg.color,
    });
  }
  for (const tt of payload.text_tags) {
    await tx
      .objectStore("text_tags")
      .add({ textId: tt.text_id, tagId: tt.tag_id });
  }
  for (const s of payload.sessions) {
    await tx.objectStore("sessions").add({
      id: s.id,
      date: s.date,
      startTime: s.start_time,
      endTime: s.end_time,
      kind: s.kind as SessionKind,
      done: s.done,
      notes: s.notes,
      author: s.author,
      createdAt: s.created_at,
      modifiedAt: s.modified_at,
    });
  }
  for (const st of payload.session_texts) {
    await tx
      .objectStore("session_texts")
      .add({ sessionId: st.session_id, textId: st.text_id });
  }
  await tx.done;
  return { textCount: payload.texts.length, tagCount: payload.tags.length };
}

export async function resetAll(): Promise<void> {
  const db = await getDatabase();
  const tx = db.transaction(
    ["texts", "tags", "text_tags", "sessions", "session_texts"],
    "readwrite",
  );
  await tx.objectStore("session_texts").clear();
  await tx.objectStore("sessions").clear();
  await tx.objectStore("text_tags").clear();
  await tx.objectStore("tags").clear();
  await tx.objectStore("texts").clear();
  await tx.done;
}
