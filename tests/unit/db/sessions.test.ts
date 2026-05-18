import { describe, it, expect, beforeEach } from "vitest";
import {
  createSession,
  updateSession,
  deleteSession,
  listSessionsInRange,
  insertText,
} from "../../../src/db";
import { resetDb } from "./helpers";

describe("sessionsRepo", () => {
  beforeEach(async () => {
    await resetDb();
  });

  it("creates a session and reads it back", async () => {
    const s = await createSession({
      date: "2026-05-18",
      startTime: "10:00",
      endTime: "11:00",
      kind: "live_lesson",
      done: false,
      notes: null,
      author: "Pierre Claisse",
      textIds: [],
    });
    expect(s.id).toBeGreaterThan(0);
    expect(s.kind).toBe("live_lesson");
    const all = await listSessionsInRange("2026-05-18", "2026-05-18");
    expect(all).toHaveLength(1);
    expect(all[0].author).toBe("Pierre Claisse");
  });

  it("rejects equal start and end times", async () => {
    await expect(
      createSession({
        date: "2026-05-18",
        startTime: "10:00",
        endTime: "10:00",
        kind: "study_session",
        done: false,
        notes: null,
        author: null,
        textIds: [],
      }),
    ).rejects.toThrow(/differ/);
  });

  it("allows end < start (UTC midnight wrap)", async () => {
    const s = await createSession({
      date: "2026-05-17",
      startTime: "23:00",
      endTime: "00:00",
      kind: "live_lesson",
      done: false,
      notes: null,
      author: null,
      textIds: [],
    });
    expect(s.startTime).toBe("23:00");
    expect(s.endTime).toBe("00:00");
  });

  it("rejects invalid date format", async () => {
    await expect(
      createSession({
        date: "2026/05/17",
        startTime: "10:00",
        endTime: "11:00",
        kind: "live_lesson",
        done: false,
        notes: null,
        author: null,
        textIds: [],
      }),
    ).rejects.toThrow(/Invalid date/);
  });

  it("rejects invalid time format", async () => {
    await expect(
      createSession({
        date: "2026-05-17",
        startTime: "1000",
        endTime: "11:00",
        kind: "live_lesson",
        done: false,
        notes: null,
        author: null,
        textIds: [],
      }),
    ).rejects.toThrow(/Invalid time/);
  });

  it("links texts to a session", async () => {
    const t1 = await insertText("A", "你", []);
    const t2 = await insertText("B", "好", []);
    const s = await createSession({
      date: "2026-05-18",
      startTime: "10:00",
      endTime: "11:00",
      kind: "live_lesson",
      done: false,
      notes: null,
      author: null,
      textIds: [t2.id, t1.id, t1.id], // duplicates dropped, sorted
    });
    expect(s.textIds).toEqual([t1.id, t2.id]);
    const loaded = await listSessionsInRange("2026-05-18", "2026-05-18");
    expect(loaded[0].textIds).toEqual([t1.id, t2.id]);
  });

  it("rejects linking to a non-existent text", async () => {
    await expect(
      createSession({
        date: "2026-05-18",
        startTime: "10:00",
        endTime: "11:00",
        kind: "live_lesson",
        done: false,
        notes: null,
        author: null,
        textIds: [9999],
      }),
    ).rejects.toThrow(/not found/);
  });

  it("updates a session in place", async () => {
    const s = await createSession({
      date: "2026-05-18",
      startTime: "10:00",
      endTime: "11:00",
      kind: "live_lesson",
      done: false,
      notes: null,
      author: "Pierre Claisse",
      textIds: [],
    });
    const updated = await updateSession(s.id, {
      date: "2026-05-19",
      startTime: "14:00",
      endTime: "15:00",
      kind: "study_session",
      done: true,
      notes: "reviewed HSK4",
      textIds: [],
    });
    expect(updated.date).toBe("2026-05-19");
    expect(updated.kind).toBe("study_session");
    expect(updated.done).toBe(true);
    expect(updated.notes).toBe("reviewed HSK4");
    expect(updated.author).toBe("Pierre Claisse"); // preserved
    expect(updated.modifiedAt).not.toBeNull();
  });

  it("rejects update of an unknown session", async () => {
    await expect(
      updateSession(9999, {
        date: "2026-05-18",
        startTime: "10:00",
        endTime: "11:00",
        kind: "live_lesson",
        done: false,
        notes: null,
        textIds: [],
      }),
    ).rejects.toThrow(/not found/);
  });

  it("deletes a session and its text links", async () => {
    const t = await insertText("A", "你", []);
    const s = await createSession({
      date: "2026-05-18",
      startTime: "10:00",
      endTime: "11:00",
      kind: "live_lesson",
      done: false,
      notes: null,
      author: null,
      textIds: [t.id],
    });
    await deleteSession(s.id);
    const remaining = await listSessionsInRange("2026-05-18", "2026-05-18");
    expect(remaining).toHaveLength(0);
  });

  it("rejects delete of an unknown session", async () => {
    await expect(deleteSession(9999)).rejects.toThrow(/not found/);
  });

  it("lists sessions in a date range sorted", async () => {
    await createSession({
      date: "2026-05-18",
      startTime: "14:00",
      endTime: "15:00",
      kind: "live_lesson",
      done: false,
      notes: null,
      author: null,
      textIds: [],
    });
    await createSession({
      date: "2026-05-18",
      startTime: "10:00",
      endTime: "11:00",
      kind: "study_session",
      done: false,
      notes: null,
      author: null,
      textIds: [],
    });
    await createSession({
      date: "2026-05-19",
      startTime: "09:00",
      endTime: "10:00",
      kind: "live_lesson",
      done: false,
      notes: null,
      author: null,
      textIds: [],
    });
    await createSession({
      date: "2026-05-17", // outside range
      startTime: "09:00",
      endTime: "10:00",
      kind: "live_lesson",
      done: false,
      notes: null,
      author: null,
      textIds: [],
    });
    const list = await listSessionsInRange("2026-05-18", "2026-05-19");
    expect(list).toHaveLength(3);
    expect(list.map((s) => `${s.date} ${s.startTime}`)).toEqual([
      "2026-05-18 10:00",
      "2026-05-18 14:00",
      "2026-05-19 09:00",
    ]);
  });
});
