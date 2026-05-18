import { openDB } from "idb";
import type { IDBPDatabase } from "idb";
import {
  DB_NAME,
  DB_VERSION,
  type HrlSchema,
} from "./schema";

let dbPromise: Promise<IDBPDatabase<HrlSchema>> | null = null;

/**
 * Open (or return the cached) hanzi-ruby-lens IndexedDB.
 *
 * Five object stores are created on first open:
 *   texts         — keyPath id (auto), index by-created-at
 *   tags          — keyPath id (auto), index by-label-lower (unique, lowercased label)
 *   text_tags     — composite key [textId, tagId], indexes by-text, by-tag
 *   sessions      — keyPath id (auto), index by-date
 *   session_texts — composite key [sessionId, textId], indexes by-session, by-text
 *
 * Cascade behaviour previously enforced by SQLite FKs is replicated in the
 * repository layer (e.g. `deleteText` also clears entries from `text_tags`
 * and `session_texts`).
 */
export function getDatabase(): Promise<IDBPDatabase<HrlSchema>> {
  if (!dbPromise) {
    dbPromise = openDB<HrlSchema>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains("texts")) {
          const texts = db.createObjectStore("texts", {
            keyPath: "id",
            autoIncrement: true,
          });
          texts.createIndex("by-created-at", "createdAt");
        }
        if (!db.objectStoreNames.contains("tags")) {
          const tags = db.createObjectStore("tags", {
            keyPath: "id",
            autoIncrement: true,
          });
          tags.createIndex("by-label-lower", "labelLower", { unique: true });
        }
        if (!db.objectStoreNames.contains("text_tags")) {
          const tt = db.createObjectStore("text_tags", {
            keyPath: ["textId", "tagId"],
          });
          tt.createIndex("by-text", "textId");
          tt.createIndex("by-tag", "tagId");
        }
        if (!db.objectStoreNames.contains("sessions")) {
          const sessions = db.createObjectStore("sessions", {
            keyPath: "id",
            autoIncrement: true,
          });
          sessions.createIndex("by-date", "date");
        }
        if (!db.objectStoreNames.contains("session_texts")) {
          const st = db.createObjectStore("session_texts", {
            keyPath: ["sessionId", "textId"],
          });
          st.createIndex("by-session", "sessionId");
          st.createIndex("by-text", "textId");
        }
      },
    });
  }
  return dbPromise;
}

/** Test helper: close the active connection so `deleteDatabase` isn't blocked. */
export async function __resetDatabaseForTests(): Promise<void> {
  if (dbPromise) {
    const db = await dbPromise;
    db.close();
  }
  dbPromise = null;
}
