// IndexedDB schema typed for `idb`.
//
// One database (`hanzi-ruby-lens`) with five object stores that mirror the
// SQLite tables of the previous Tauri backend. The relational integrity that
// SQLite enforced via foreign keys is enforced manually in the repository
// layer here (IDB has no FK / cascade).
import type { DBSchema } from "idb";
import type { Session, SessionKind, TextSegment } from "../types/domain";

export const DB_NAME = "hanzi-ruby-lens";
export const DB_VERSION = 1;

export interface TextRecord {
  id: number;
  title: string;
  createdAt: string;      // UTC ISO 8601
  modifiedAt: string | null;
  rawInput: string;
  segments: TextSegment[];
  locked: boolean;
}

export interface TagRecord {
  id: number;
  label: string;
  labelLower: string;     // case-insensitive uniqueness key
  color: string;
}

export interface TextTagRecord {
  textId: number;
  tagId: number;
}

export interface SessionRecord {
  id: number;
  date: string;           // YYYY-MM-DD UTC wall-clock
  startTime: string;      // HH:MM UTC wall-clock
  endTime: string;        // HH:MM UTC wall-clock (may be < startTime → wraps to next UTC day)
  kind: SessionKind;
  done: boolean;
  notes: string | null;
  author: string | null;
  createdAt: string;
  modifiedAt: string | null;
}

export interface SessionTextRecord {
  sessionId: number;
  textId: number;
}

export interface HrlSchema extends DBSchema {
  texts: {
    key: number;
    value: TextRecord;
    indexes: { "by-created-at": string };
  };
  tags: {
    key: number;
    value: TagRecord;
    indexes: { "by-label-lower": string };
  };
  text_tags: {
    key: [number, number];
    value: TextTagRecord;
    indexes: { "by-text": number; "by-tag": number };
  };
  sessions: {
    key: number;
    value: SessionRecord;
    indexes: { "by-date": string };
  };
  session_texts: {
    key: [number, number];
    value: SessionTextRecord;
    indexes: { "by-session": number; "by-text": number };
  };
}

/** A bare session before its linked text ids are loaded from `session_texts`. */
export type SessionWithoutTexts = Omit<Session, "textIds">;
