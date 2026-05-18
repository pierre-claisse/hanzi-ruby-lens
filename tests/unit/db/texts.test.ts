import { describe, it, expect, beforeEach } from "vitest";
import type { TextSegment } from "../../../src/types/domain";
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
  createTag,
  assignTag,
} from "../../../src/db";
import { resetDb } from "./helpers";

const sampleSegments = (): TextSegment[] => [
  { type: "word", word: { characters: "你好", pinyin: "nǐhǎo" } },
  { type: "plain", text: "，" },
  { type: "word", word: { characters: "世界", pinyin: "shìjiè" } },
];

describe("textsRepo", () => {
  beforeEach(async () => {
    await resetDb();
  });

  it("inserts and loads a text", async () => {
    const text = await insertText("Hello", "你好世界", sampleSegments());
    expect(text.id).toBeGreaterThan(0);
    expect(text.title).toBe("Hello");
    expect(text.segments).toHaveLength(3);
    const loaded = await loadText(text.id);
    expect(loaded).toBeTruthy();
    expect(loaded?.rawInput).toBe("你好世界");
    expect(loaded?.locked).toBe(false);
  });

  it("returns null when loading a non-existent text", async () => {
    expect(await loadText(9999)).toBeNull();
  });

  it("lists previews ordered by createdAt (desc by default)", async () => {
    const older = await insertText("Older", "旧", []);
    await new Promise((r) => setTimeout(r, 5));
    const newer = await insertText("Newer", "新", []);
    const list = await listTexts([], false);
    expect(list.map((p) => p.id)).toEqual([newer.id, older.id]);
  });

  it("lists previews ascending when requested", async () => {
    const older = await insertText("Older", "旧", []);
    await new Promise((r) => setTimeout(r, 5));
    const newer = await insertText("Newer", "新", []);
    const list = await listTexts([], true);
    expect(list.map((p) => p.id)).toEqual([older.id, newer.id]);
  });

  it("filters listed previews by tag", async () => {
    const t1 = await insertText("Tagged", "甲", []);
    const t2 = await insertText("Untagged", "乙", []);
    const tag = await createTag("Grammar", "blue");
    await assignTag([t1.id], tag.id);
    const filtered = await listTexts([tag.id], false);
    expect(filtered).toHaveLength(1);
    expect(filtered[0].id).toBe(t1.id);
    const all = await listTexts([], false);
    expect(all.map((p) => p.id).sort()).toEqual([t1.id, t2.id].sort());
  });

  it("updates pinyin on a word segment", async () => {
    const text = await insertText("X", "你好世界", sampleSegments());
    await updatePinyin(text.id, 0, "nihao");
    const loaded = await loadText(text.id);
    const seg = loaded!.segments[0];
    expect(seg.type).toBe("word");
    if (seg.type === "word") expect(seg.word.pinyin).toBe("nihao");
  });

  it("rejects updatePinyin on a plain segment", async () => {
    const text = await insertText("X", "你好世界", sampleSegments());
    await expect(updatePinyin(text.id, 1, "x")).rejects.toThrow(/not a word/);
  });

  it("rejects updatePinyin out of bounds", async () => {
    const text = await insertText("X", "你好世界", sampleSegments());
    await expect(updatePinyin(text.id, 99, "x")).rejects.toThrow(/out of bounds/);
  });

  it("splits a 2-char word at index 0", async () => {
    const text = await insertText("X", "你好", [
      { type: "word", word: { characters: "你好", pinyin: "nǐhǎo" } },
    ]);
    const tokenize = (_p: string, _n: number) => ["nǐ", "hǎo"];
    await splitSegment(text.id, 0, 0, tokenize);
    const loaded = await loadText(text.id);
    expect(loaded!.segments).toHaveLength(2);
    expect(loaded!.segments[0]).toEqual({
      type: "word",
      word: { characters: "你", pinyin: "nǐ" },
    });
    expect(loaded!.segments[1]).toEqual({
      type: "word",
      word: { characters: "好", pinyin: "hǎo" },
    });
  });

  it("rejects split when split point is out of range", async () => {
    const text = await insertText("X", "你好", [
      { type: "word", word: { characters: "你好", pinyin: "nǐhǎo" } },
    ]);
    const tokenize = () => ["nǐ", "hǎo"];
    await expect(splitSegment(text.id, 0, 1, tokenize)).rejects.toThrow(/out of range/);
  });

  it("rejects split on a plain segment", async () => {
    const text = await insertText("X", "，", [
      { type: "plain", text: "，" },
    ]);
    await expect(
      splitSegment(text.id, 0, 0, () => ["x"]),
    ).rejects.toThrow(/not a word/);
  });

  it("rejects split on a commented word", async () => {
    const text = await insertText("X", "你好", [
      {
        type: "word",
        word: { characters: "你好", pinyin: "nǐhǎo", comment: "note" },
      },
    ]);
    await expect(
      splitSegment(text.id, 0, 0, () => ["nǐ", "hǎo"]),
    ).rejects.toThrow(/comment/);
  });

  it("merges two adjacent word segments", async () => {
    const text = await insertText("X", "你好", [
      { type: "word", word: { characters: "你", pinyin: "nǐ" } },
      { type: "word", word: { characters: "好", pinyin: "hǎo" } },
    ]);
    await mergeSegments(text.id, 0);
    const loaded = await loadText(text.id);
    expect(loaded!.segments).toHaveLength(1);
    expect(loaded!.segments[0]).toEqual({
      type: "word",
      word: { characters: "你好", pinyin: "nǐhǎo" },
    });
  });

  it("rejects merge if it would exceed 12 characters", async () => {
    const text = await insertText("X", "一二三四五六七八九十甲乙丙", [
      { type: "word", word: { characters: "一二三四五六七八九十", pinyin: "a" } },
      { type: "word", word: { characters: "甲乙丙", pinyin: "b" } },
    ]);
    await expect(mergeSegments(text.id, 0)).rejects.toThrow(/12-character/);
  });

  it("rejects merge with plain on either side", async () => {
    const text = await insertText("X", "，好", [
      { type: "plain", text: "，" },
      { type: "word", word: { characters: "好", pinyin: "hǎo" } },
    ]);
    await expect(mergeSegments(text.id, 0)).rejects.toThrow(/not a word/);
  });

  it("rejects merge with no right segment", async () => {
    const text = await insertText("X", "好", [
      { type: "word", word: { characters: "好", pinyin: "hǎo" } },
    ]);
    await expect(mergeSegments(text.id, 0)).rejects.toThrow(/No segment after/);
  });

  it("writes a comment with author and timestamp, clears them on delete", async () => {
    const text = await insertText("X", "你好世界", sampleSegments());
    await updateWordComment(text.id, 0, "this means hello", "Pierre Claisse");
    const after = await loadText(text.id);
    const seg = after!.segments[0];
    if (seg.type !== "word") throw new Error("expected word");
    expect(seg.word.comment).toBe("this means hello");
    expect(seg.word.commentAuthor).toBe("Pierre Claisse");
    expect(seg.word.commentAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);

    await updateWordComment(text.id, 0, null, "Pierre Claisse");
    const cleared = await loadText(text.id);
    const segCleared = cleared!.segments[0];
    if (segCleared.type !== "word") throw new Error("expected word");
    expect(segCleared.word.comment).toBeUndefined();
    expect(segCleared.word.commentAuthor).toBeUndefined();
    expect(segCleared.word.commentAt).toBeUndefined();
  });

  it("rejects comment write on a locked text", async () => {
    const text = await insertText("X", "你好世界", sampleSegments());
    await toggleLock(text.id);
    await expect(
      updateWordComment(text.id, 0, "x", null),
    ).rejects.toThrow(/locked/);
  });

  it("toggleLock flips the flag and returns the new value", async () => {
    const text = await insertText("X", "你好世界", sampleSegments());
    expect(await toggleLock(text.id)).toBe(true);
    expect(await toggleLock(text.id)).toBe(false);
  });

  it("delete cascades through text_tags and session_texts", async () => {
    const text = await insertText("X", "你好世界", sampleSegments());
    const tag = await createTag("G", "blue");
    await assignTag([text.id], tag.id);
    await deleteText(text.id);
    const all = await listTexts([], false);
    expect(all).toHaveLength(0);
    // The tag still exists but text_tags is empty.
    const filtered = await listTexts([tag.id], false);
    expect(filtered).toHaveLength(0);
  });

  it("rejects delete of a non-existent text", async () => {
    await expect(deleteText(9999)).rejects.toThrow(/not found/);
  });

  it("extracts comment refs into the preview", async () => {
    const text = await insertText("X", "你好世界", sampleSegments());
    await updateWordComment(text.id, 0, "x", "Pierre");
    const previews = await listTexts([], false);
    expect(previews[0].comments).toHaveLength(1);
    expect(previews[0].comments[0].segmentIndex).toBe(0);
  });
});
