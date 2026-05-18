// CRUD for tags (formerly the `tags` SQLite table) plus `text_tags`
// many-to-many helpers. Case-insensitive label uniqueness is enforced via
// an IDB unique index on the lowercased label.
import type { Tag } from "../types/domain";
import { getDatabase } from "./connection";
import type { TagRecord } from "./schema";

export async function listTags(): Promise<Tag[]> {
  const db = await getDatabase();
  const rows = await db.getAll("tags");
  return rows
    .map((r) => ({ id: r.id, label: r.label, color: r.color }))
    .sort((a, b) => a.label.localeCompare(b.label));
}

export async function createTag(label: string, color: string): Promise<Tag> {
  const trimmed = label.trim();
  if (!trimmed) throw new Error("Tag label must not be empty");
  const db = await getDatabase();
  const tx = db.transaction("tags", "readwrite");
  const store = tx.objectStore("tags");
  const dup = await store.index("by-label-lower").get(trimmed.toLowerCase());
  if (dup) {
    await tx.done;
    throw new Error(`A tag with label "${trimmed}" already exists`);
  }
  const id = (await store.add({
    label: trimmed,
    labelLower: trimmed.toLowerCase(),
    color,
  } as unknown as TagRecord)) as number;
  await tx.done;
  return { id, label: trimmed, color };
}

export async function updateTag(
  tagId: number,
  label: string,
  color: string,
): Promise<Tag> {
  const trimmed = label.trim();
  if (!trimmed) throw new Error("Tag label must not be empty");
  const db = await getDatabase();
  const tx = db.transaction("tags", "readwrite");
  const store = tx.objectStore("tags");
  const row = await store.get(tagId);
  if (!row) {
    await tx.done;
    throw new Error(`Tag with id ${tagId} not found`);
  }
  const lower = trimmed.toLowerCase();
  if (lower !== row.labelLower) {
    const dup = await store.index("by-label-lower").get(lower);
    if (dup) {
      await tx.done;
      throw new Error(`A tag with label "${trimmed}" already exists`);
    }
  }
  row.label = trimmed;
  row.labelLower = lower;
  row.color = color;
  await store.put(row);
  await tx.done;
  return { id: tagId, label: trimmed, color };
}

export async function deleteTag(tagId: number): Promise<void> {
  const db = await getDatabase();
  const tx = db.transaction(["tags", "text_tags"], "readwrite");
  const exists = await tx.objectStore("tags").get(tagId);
  if (!exists) {
    await tx.done;
    throw new Error(`Tag with id ${tagId} not found`);
  }
  // Cascade: drop all text_tags referencing this tag.
  const ttIndex = tx.objectStore("text_tags").index("by-tag");
  const keys = await ttIndex.getAllKeys(tagId);
  for (const k of keys) await tx.objectStore("text_tags").delete(k);

  await tx.objectStore("tags").delete(tagId);
  await tx.done;
}

export async function assignTag(textIds: number[], tagId: number): Promise<void> {
  const db = await getDatabase();
  const tx = db.transaction("text_tags", "readwrite");
  const store = tx.objectStore("text_tags");
  for (const textId of textIds) {
    // INSERT OR IGNORE: put() would overwrite (no extra effect since the
    // record has no other fields), but a duplicate check matches the SQL
    // semantics more directly.
    const existing = await store.get([textId, tagId]);
    if (!existing) {
      await store.add({ textId, tagId });
    }
  }
  await tx.done;
}

export async function removeTag(textIds: number[], tagId: number): Promise<void> {
  const db = await getDatabase();
  const tx = db.transaction("text_tags", "readwrite");
  const store = tx.objectStore("text_tags");
  for (const textId of textIds) {
    await store.delete([textId, tagId]);
  }
  await tx.done;
}
