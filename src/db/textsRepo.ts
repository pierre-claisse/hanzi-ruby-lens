// CRUD for texts (formerly the `texts` SQLite table) plus cascade clean-up
// of `text_tags` and `session_texts` on delete.
import type {
  CommentRef,
  Text,
  TextPreview,
  TextSegment,
  Word,
} from "../types/domain";
import { nowUtcIso } from "../utils/dateTimeFormat";
import { getDatabase } from "./connection";
import type { TextRecord } from "./schema";

const MAX_COMMENT_LEN = 5_000;
const MAX_MERGED_CHARS = 12;

function extractCommentRefs(segments: TextSegment[]): CommentRef[] {
  const refs: CommentRef[] = [];
  segments.forEach((seg, idx) => {
    if (seg.type === "word" && seg.word.comment && seg.word.commentAt) {
      refs.push({ segmentIndex: idx, commentAt: seg.word.commentAt });
    }
  });
  return refs;
}

export async function insertText(
  title: string,
  rawInput: string,
  segments: TextSegment[],
): Promise<Text> {
  const db = await getDatabase();
  const createdAt = nowUtcIso();
  // `id` is autoIncrement — pass an id-less record and let IDB assign one.
  // Cast bypasses the strict `TextRecord` typing (which requires `id`).
  const id = (await db.add("texts", {
    title,
    rawInput,
    segments,
    createdAt,
    modifiedAt: null,
    locked: false,
  } as unknown as TextRecord)) as number;
  return {
    id,
    title,
    createdAt,
    modifiedAt: null,
    rawInput,
    segments,
    locked: false,
  };
}

export async function listTexts(
  tagIds: number[],
  sortAsc: boolean,
): Promise<TextPreview[]> {
  const db = await getDatabase();
  const tx = db.transaction(["texts", "text_tags", "tags"], "readonly");

  let allTexts = await tx.objectStore("texts").getAll();

  if (tagIds.length > 0) {
    const allowed = new Set<number>();
    const ttIndex = tx.objectStore("text_tags").index("by-tag");
    for (const tagId of tagIds) {
      const links = await ttIndex.getAll(tagId);
      for (const l of links) allowed.add(l.textId);
    }
    allTexts = allTexts.filter((t) => allowed.has(t.id));
  }

  allTexts.sort((a, b) => {
    if (a.createdAt !== b.createdAt) {
      const cmp = a.createdAt < b.createdAt ? -1 : 1;
      return sortAsc ? cmp : -cmp;
    }
    // Tie-break by id so the ordering is deterministic when two inserts
    // land in the same UTC second.
    return sortAsc ? a.id - b.id : b.id - a.id;
  });

  // Build textId → tag summaries map.
  const tagStore = tx.objectStore("tags");
  const ttByText = tx.objectStore("text_tags").index("by-text");
  const previews: TextPreview[] = [];
  for (const t of allTexts) {
    const links = await ttByText.getAll(t.id);
    const tags = (await Promise.all(links.map((l) => tagStore.get(l.tagId))))
      .filter((tg): tg is NonNullable<typeof tg> => tg !== undefined)
      .map((tg) => ({ id: tg.id, label: tg.label, color: tg.color }));
    previews.push({
      id: t.id,
      title: t.title,
      createdAt: t.createdAt,
      modifiedAt: t.modifiedAt,
      tags,
      locked: t.locked,
      comments: extractCommentRefs(t.segments),
    });
  }
  await tx.done;
  return previews;
}

export async function loadText(id: number): Promise<Text | null> {
  const db = await getDatabase();
  const row = await db.get("texts", id);
  if (!row) return null;
  return {
    id: row.id,
    title: row.title,
    createdAt: row.createdAt,
    modifiedAt: row.modifiedAt,
    rawInput: row.rawInput,
    segments: row.segments,
    locked: row.locked,
  };
}

async function readSegmentsOrThrow(id: number): Promise<TextSegment[]> {
  const text = await loadText(id);
  if (!text) throw new Error(`Text with id ${id} not found`);
  return text.segments;
}

async function writeSegments(id: number, segments: TextSegment[]): Promise<void> {
  const db = await getDatabase();
  const tx = db.transaction("texts", "readwrite");
  const store = tx.objectStore("texts");
  const row = await store.get(id);
  if (!row) {
    await tx.done;
    throw new Error(`Text with id ${id} not found`);
  }
  row.segments = segments;
  row.modifiedAt = nowUtcIso();
  await store.put(row);
  await tx.done;
}

export async function updatePinyin(
  id: number,
  segmentIndex: number,
  newPinyin: string,
): Promise<void> {
  const segments = await readSegmentsOrThrow(id);
  if (segmentIndex >= segments.length) {
    throw new Error(
      `Segment index ${segmentIndex} out of bounds (length ${segments.length})`,
    );
  }
  const seg = segments[segmentIndex];
  if (seg.type !== "word") {
    throw new Error(`Segment at index ${segmentIndex} is not a word`);
  }
  const updated: TextSegment[] = segments.map((s, i) =>
    i === segmentIndex && s.type === "word"
      ? { type: "word", word: { ...s.word, pinyin: newPinyin } }
      : s,
  );
  await writeSegments(id, updated);
}

/**
 * Tokenize a pinyin string into per-character syllables. Injected by the
 * caller (the NLP module owns the implementation) to keep this layer free
 * of NLP concerns.
 */
export type TokenizePinyin = (pinyin: string, expectedCount: number) => string[];

export async function splitSegment(
  id: number,
  segmentIndex: number,
  splitAfterCharIndex: number,
  tokenizePinyin: TokenizePinyin,
): Promise<void> {
  const segments = await readSegmentsOrThrow(id);
  if (segmentIndex >= segments.length) {
    throw new Error(
      `Segment index ${segmentIndex} out of bounds (length ${segments.length})`,
    );
  }
  const seg = segments[segmentIndex];
  if (seg.type !== "word") {
    throw new Error(`Segment at index ${segmentIndex} is not a word`);
  }
  if (seg.word.comment) {
    throw new Error(
      "Cannot split a word that has a comment. Delete the comment first.",
    );
  }
  const chars = [...seg.word.characters];
  const charCount = chars.length;
  if (charCount < 2 || splitAfterCharIndex >= charCount - 1) {
    throw new Error(
      `Split point ${splitAfterCharIndex} out of range for word with ${charCount} characters`,
    );
  }
  const syllables = tokenizePinyin(seg.word.pinyin, charCount);

  const leftChars = chars.slice(0, splitAfterCharIndex + 1).join("");
  const rightChars = chars.slice(splitAfterCharIndex + 1).join("");
  const leftPinyin = syllables.slice(0, splitAfterCharIndex + 1).join("");
  const rightPinyin = syllables.slice(splitAfterCharIndex + 1).join("");

  const makeWord = (characters: string, pinyin: string): TextSegment => ({
    type: "word",
    word: { characters, pinyin },
  });

  const updated = [
    ...segments.slice(0, segmentIndex),
    makeWord(leftChars, leftPinyin),
    makeWord(rightChars, rightPinyin),
    ...segments.slice(segmentIndex + 1),
  ];
  await writeSegments(id, updated);
}

export async function mergeSegments(
  id: number,
  segmentIndex: number,
): Promise<void> {
  const segments = await readSegmentsOrThrow(id);
  if (segmentIndex >= segments.length) {
    throw new Error(
      `Segment index ${segmentIndex} out of bounds (length ${segments.length})`,
    );
  }
  const left = segments[segmentIndex];
  if (left.type !== "word") {
    throw new Error(`Segment at index ${segmentIndex} is not a word`);
  }
  if (left.word.comment) {
    throw new Error("Cannot merge words that have comments. Delete the comment(s) first.");
  }
  if (segmentIndex + 1 >= segments.length) {
    throw new Error(`No segment after index ${segmentIndex} to merge with`);
  }
  const right = segments[segmentIndex + 1];
  if (right.type !== "word") {
    throw new Error(`Segment at index ${segmentIndex + 1} is not a word`);
  }
  if (right.word.comment) {
    throw new Error("Cannot merge words that have comments. Delete the comment(s) first.");
  }
  const mergedChars = left.word.characters + right.word.characters;
  if ([...mergedChars].length > MAX_MERGED_CHARS) {
    throw new Error(
      `Merged word would have ${[...mergedChars].length} characters, exceeding the ${MAX_MERGED_CHARS}-character limit`,
    );
  }
  const merged: TextSegment = {
    type: "word",
    word: {
      characters: mergedChars,
      pinyin: left.word.pinyin + right.word.pinyin,
    },
  };
  const updated = [
    ...segments.slice(0, segmentIndex),
    merged,
    ...segments.slice(segmentIndex + 2),
  ];
  await writeSegments(id, updated);
}

export async function updateWordComment(
  id: number,
  segmentIndex: number,
  comment: string | null,
  author: string | null,
): Promise<void> {
  const db = await getDatabase();
  const tx = db.transaction("texts", "readwrite");
  const store = tx.objectStore("texts");
  const row = await store.get(id);
  if (!row) {
    await tx.done;
    throw new Error(`Text with id ${id} not found`);
  }
  if (row.locked) {
    await tx.done;
    throw new Error("Cannot modify comments on a locked text");
  }
  if (segmentIndex >= row.segments.length) {
    await tx.done;
    throw new Error(
      `Segment index ${segmentIndex} out of bounds (length ${row.segments.length})`,
    );
  }
  const seg = row.segments[segmentIndex];
  if (seg.type !== "word") {
    await tx.done;
    throw new Error(`Segment at index ${segmentIndex} is not a word`);
  }
  const trimmedAuthor = author?.trim();
  const word: Word = comment && comment.length > 0
    ? (() => {
        if (comment.length > MAX_COMMENT_LEN) {
          throw new Error(`Comment must not exceed ${MAX_COMMENT_LEN} characters`);
        }
        return {
          ...seg.word,
          comment,
          commentAuthor: trimmedAuthor ? trimmedAuthor : undefined,
          commentAt: nowUtcIso(),
        };
      })()
    : { ...seg.word, comment: undefined, commentAuthor: undefined, commentAt: undefined };

  row.segments = row.segments.map((s, i) =>
    i === segmentIndex && s.type === "word" ? { type: "word", word } : s,
  );
  row.modifiedAt = nowUtcIso();
  await store.put(row);
  await tx.done;
}

export async function toggleLock(id: number): Promise<boolean> {
  const db = await getDatabase();
  const tx = db.transaction("texts", "readwrite");
  const store = tx.objectStore("texts");
  const row = await store.get(id);
  if (!row) {
    await tx.done;
    throw new Error(`Text with id ${id} not found`);
  }
  row.locked = !row.locked;
  await store.put(row);
  await tx.done;
  return row.locked;
}

export async function deleteText(id: number): Promise<void> {
  const db = await getDatabase();
  const tx = db.transaction(
    ["texts", "text_tags", "session_texts"],
    "readwrite",
  );
  const exists = await tx.objectStore("texts").get(id);
  if (!exists) {
    await tx.done;
    throw new Error(`Text with id ${id} not found`);
  }
  // Manual cascade: drop all text_tags and session_texts that reference this text.
  const ttIndex = tx.objectStore("text_tags").index("by-text");
  const ttKeys = await ttIndex.getAllKeys(id);
  for (const k of ttKeys) await tx.objectStore("text_tags").delete(k);

  const stIndex = tx.objectStore("session_texts").index("by-text");
  const stKeys = await stIndex.getAllKeys(id);
  for (const k of stKeys) await tx.objectStore("session_texts").delete(k);

  await tx.objectStore("texts").delete(id);
  await tx.done;
}
