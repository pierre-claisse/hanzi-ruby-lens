import { describe, it, expect, beforeEach } from "vitest";
import {
  insertText,
  listTexts,
  createTag,
  assignTag,
  createSession,
  listSessionsInRange,
  exportAll,
  importAll,
  validateExportPayload,
  resetAll,
  listTags,
  type ExportPayload,
} from "../../../src/db";
import { resetDb } from "./helpers";

describe("export / import / reset", () => {
  beforeEach(async () => {
    await resetDb();
  });

  it("round-trips an empty database", async () => {
    const payload = await exportAll();
    expect(payload.version).toBe(1);
    expect(payload.texts).toHaveLength(0);
    expect(payload.tags).toHaveLength(0);
    expect(payload.sessions).toHaveLength(0);
    await importAll(payload);
    expect(await listTexts([], false)).toHaveLength(0);
  });

  it("round-trips texts, tags, links, sessions and session_texts", async () => {
    const text = await insertText("Hello", "你好", [
      { type: "word", word: { characters: "你好", pinyin: "nǐhǎo" } },
    ]);
    const tag = await createTag("Grammar", "blue");
    await assignTag([text.id], tag.id);
    const session = await createSession({
      date: "2026-05-18",
      startTime: "10:00",
      endTime: "11:00",
      kind: "live_lesson",
      done: true,
      notes: "reviewed",
      author: "Pierre Claisse",
      textIds: [text.id],
    });

    const payload = await exportAll();
    expect(payload.texts).toHaveLength(1);
    expect(payload.tags).toHaveLength(1);
    expect(payload.text_tags).toHaveLength(1);
    expect(payload.sessions).toHaveLength(1);
    expect(payload.session_texts).toHaveLength(1);

    // Round-trip via JSON to validate serialization stability.
    const json = JSON.stringify(payload);
    const parsed = JSON.parse(json) as ExportPayload;
    const result = await importAll(parsed);
    expect(result.textCount).toBe(1);
    expect(result.tagCount).toBe(1);

    const previews = await listTexts([], false);
    expect(previews).toHaveLength(1);
    expect(previews[0].title).toBe("Hello");

    const tags = await listTags();
    expect(tags).toEqual([{ id: tag.id, label: "Grammar", color: "blue" }]);

    const sessions = await listSessionsInRange("2026-05-18", "2026-05-18");
    expect(sessions).toHaveLength(1);
    expect(sessions[0].id).toBe(session.id);
    expect(sessions[0].textIds).toEqual([text.id]);
  });

  it("validateExportPayload rejects an unknown version", () => {
    const payload = baseEmptyPayload();
    payload.version = 99;
    expect(() => validateExportPayload(payload)).toThrow(/Unsupported export version/);
  });

  it("validateExportPayload rejects duplicate text IDs", () => {
    const payload = baseEmptyPayload();
    payload.texts.push(makeExportText(1));
    payload.texts.push(makeExportText(1));
    expect(() => validateExportPayload(payload)).toThrow(/Duplicate text/);
  });

  it("validateExportPayload rejects duplicate tag IDs", () => {
    const payload = baseEmptyPayload();
    payload.tags.push({ id: 1, label: "A", color: "red" });
    payload.tags.push({ id: 1, label: "B", color: "blue" });
    expect(() => validateExportPayload(payload)).toThrow(/Duplicate tag/);
  });

  it("validateExportPayload rejects dangling text_tags references", () => {
    const payload = baseEmptyPayload();
    payload.texts.push(makeExportText(1));
    payload.tags.push({ id: 1, label: "A", color: "red" });
    payload.text_tags.push({ text_id: 99, tag_id: 1 });
    expect(() => validateExportPayload(payload)).toThrow(/non-existent text_id/);
  });

  it("validateExportPayload rejects an unknown session kind", () => {
    const payload = baseEmptyPayload();
    payload.sessions.push({
      id: 1,
      date: "2026-05-18",
      start_time: "10:00",
      end_time: "11:00",
      kind: "weird",
      done: false,
      notes: null,
      author: null,
      created_at: "2026-05-18T10:00:00Z",
      modified_at: null,
    });
    expect(() => validateExportPayload(payload)).toThrow(/Unknown session kind/);
  });

  it("resetAll wipes everything", async () => {
    const text = await insertText("X", "你", []);
    await createSession({
      date: "2026-05-18",
      startTime: "10:00",
      endTime: "11:00",
      kind: "live_lesson",
      done: false,
      notes: null,
      author: null,
      textIds: [text.id],
    });
    await resetAll();
    expect(await listTexts([], false)).toHaveLength(0);
    expect(await listSessionsInRange("2026-01-01", "2026-12-31")).toHaveLength(0);
  });
});

function baseEmptyPayload(): ExportPayload {
  return {
    version: 1,
    exported_at: "2026-05-18T00:00:00Z",
    texts: [],
    tags: [],
    text_tags: [],
    sessions: [],
    session_texts: [],
    sync_author: null,
    sync_timestamp: null,
  };
}

function makeExportText(id: number) {
  return {
    id,
    title: `Text ${id}`,
    segments: "[]",
    raw_input: "你",
    created_at: "2026-05-18T00:00:00Z",
    modified_at: null,
    locked: 0,
  };
}
