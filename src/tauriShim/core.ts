// Drop-in replacement for `@tauri-apps/api/core`. Aliased via vite.config.ts
// so every existing `import { invoke } from "@tauri-apps/api/core"` keeps
// compiling, but the dispatch happens against the in-browser IndexedDB,
// NLP and sync modules instead of a Rust backend.
//
// This shim is the transitional bridge for Phase 6. The intent is that
// Phase 8 deletes both the shim AND every `invoke()` call, replacing them
// with direct module calls.
import {
  insertText,
  listTexts,
  loadText,
  updatePinyin,
  splitSegment,
  mergeSegments,
  updateWordComment,
  toggleLock,
  deleteText,
  listTags,
  createTag,
  updateTag,
  deleteTag,
  assignTag,
  removeTag,
  listSessionsInRange,
  createSession,
  updateSession,
  deleteSession,
  exportAll,
  importAll,
  resetAll,
} from "../db";
import { processText, containsChineseChar, tokenizePinyin } from "../nlp";

type Handler = (args: Record<string, unknown>) => Promise<unknown>;

const handlers: Record<string, Handler> = {
  // ── Texts ─────────────────────────────────────────────────────────────────
  create_text: async (args) => {
    const title = String(args.title ?? "");
    const rawInput = String(args.rawInput ?? "");
    if (!title.trim()) throw new Error("Title must not be empty");
    if (!containsChineseChar(rawInput)) {
      throw new Error("Content must contain at least one Chinese character");
    }
    const segments = await processText(rawInput);
    return insertText(title, rawInput, segments);
  },
  list_texts: (args) =>
    listTexts(
      (args.tagIds as number[]) ?? [],
      (args.sortAsc as boolean) ?? false,
    ),
  load_text: (args) => loadText(args.textId as number),
  update_pinyin: async (args) => {
    if (!String(args.newPinyin ?? "").trim()) {
      throw new Error("Pinyin must not be empty");
    }
    await updatePinyin(
      args.textId as number,
      args.segmentIndex as number,
      args.newPinyin as string,
    );
  },
  split_segment: async (args) => {
    await splitSegment(
      args.textId as number,
      args.segmentIndex as number,
      args.splitAfterCharIndex as number,
      tokenizePinyin,
    );
  },
  merge_segments: async (args) => {
    await mergeSegments(args.textId as number, args.segmentIndex as number);
  },
  update_word_comment: async (args) => {
    await updateWordComment(
      args.textId as number,
      args.segmentIndex as number,
      (args.comment as string | null) ?? null,
      (args.author as string | null) ?? null,
    );
  },
  toggle_lock: (args) => toggleLock(args.textId as number),
  delete_text: async (args) => {
    await deleteText(args.textId as number);
  },

  // ── Tags ──────────────────────────────────────────────────────────────────
  list_all_tags: () => listTags(),
  create_tag: (args) =>
    createTag(args.label as string, args.color as string),
  update_tag: (args) =>
    updateTag(args.tagId as number, args.label as string, args.color as string),
  delete_tag: async (args) => {
    await deleteTag(args.tagId as number);
  },
  assign_tag: async (args) => {
    await assignTag(args.textIds as number[], args.tagId as number);
  },
  remove_tag: async (args) => {
    await removeTag(args.textIds as number[], args.tagId as number);
  },

  // ── Sessions ──────────────────────────────────────────────────────────────
  list_sessions: (args) =>
    listSessionsInRange(args.from as string, args.to as string),
  create_session: (args) =>
    createSession({
      date: args.date as string,
      startTime: args.startTime as string,
      endTime: args.endTime as string,
      kind: args.kind as "live_lesson" | "study_session",
      done: args.done as boolean,
      notes: (args.notes as string | null) ?? null,
      author: (args.author as string | null) ?? null,
      textIds: (args.textIds as number[]) ?? [],
    }),
  update_session: (args) =>
    updateSession(args.id as number, {
      date: args.date as string,
      startTime: args.startTime as string,
      endTime: args.endTime as string,
      kind: args.kind as "live_lesson" | "study_session",
      done: args.done as boolean,
      notes: (args.notes as string | null) ?? null,
      textIds: (args.textIds as number[]) ?? [],
    }),
  delete_session: async (args) => {
    await deleteSession(args.id as number);
  },

  // ── Data management ───────────────────────────────────────────────────────
  export_database: async (args) => {
    // The previous Tauri command wrote directly to a user-chosen file path.
    // In the browser we trigger a download instead; the `filePath` arg is
    // taken as the suggested filename.
    const payload = await exportAll();
    const text = JSON.stringify(payload, null, 2);
    const filename = String(args.filePath ?? "hanzi-ruby-lens-export.json")
      .split(/[\\/]/)
      .pop() ?? "hanzi-ruby-lens-export.json";
    const blob = new Blob([text], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    return { textCount: payload.texts.length, tagCount: payload.tags.length };
  },
  import_database: async (args) => {
    // The Tauri command received a file path from a native dialog. In the
    // browser the file content is passed in via the new `fileContent` arg
    // (callers must read the file before invoking).
    const text = String(args.fileContent ?? "");
    const payload = JSON.parse(text);
    return importAll(payload);
  },
  reset_database: async () => {
    await resetAll();
  },

  // ── Sync / auth (handled outside the shim in Phase 6) ─────────────────────
  is_authorized_device: () => Promise.resolve(false),
  sync_is_configured: () => Promise.resolve(true),
  sync_save: () =>
    Promise.reject(
      new Error(
        "sync_save must not be invoked via the Tauri shim; use the AuthProvider + gistClient directly.",
      ),
    ),
  sync_pull: () =>
    Promise.reject(
      new Error(
        "sync_pull must not be invoked via the Tauri shim; use the AuthProvider + gistClient directly.",
      ),
    ),
};

/**
 * Drop-in replacement for `invoke(cmd, args)`. Throws if the command isn't
 * mapped — that's a Phase-6 bug and surfaces early.
 */
export async function invoke<T>(
  cmd: string,
  args: Record<string, unknown> = {},
): Promise<T> {
  const handler = handlers[cmd];
  if (!handler) {
    throw new Error(`Tauri shim: unknown command "${cmd}"`);
  }
  return handler(args) as Promise<T>;
}
