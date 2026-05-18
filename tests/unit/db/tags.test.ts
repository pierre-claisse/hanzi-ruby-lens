import { describe, it, expect, beforeEach } from "vitest";
import {
  createTag,
  deleteTag,
  listTags,
  updateTag,
  assignTag,
  removeTag,
  insertText,
  listTexts,
} from "../../../src/db";
import { resetDb } from "./helpers";

describe("tagsRepo", () => {
  beforeEach(async () => {
    await resetDb();
  });

  it("creates and lists tags alphabetically", async () => {
    await createTag("Zeta", "red");
    await createTag("Alpha", "blue");
    const tags = await listTags();
    expect(tags.map((t) => t.label)).toEqual(["Alpha", "Zeta"]);
  });

  it("rejects empty labels", async () => {
    await expect(createTag("  ", "red")).rejects.toThrow(/empty/);
  });

  it("rejects duplicate labels case-insensitively", async () => {
    await createTag("Grammar", "blue");
    await expect(createTag("grammar", "red")).rejects.toThrow(/already exists/);
  });

  it("updates a tag", async () => {
    const t = await createTag("Old", "blue");
    const updated = await updateTag(t.id, "New", "red");
    expect(updated.label).toBe("New");
    expect(updated.color).toBe("red");
  });

  it("rejects updating to a duplicate label", async () => {
    await createTag("A", "blue");
    const b = await createTag("B", "red");
    await expect(updateTag(b.id, "a", "blue")).rejects.toThrow(/already exists/);
  });

  it("rejects updating an unknown tag", async () => {
    await expect(updateTag(9999, "X", "blue")).rejects.toThrow(/not found/);
  });

  it("deletes a tag and cascades through text_tags", async () => {
    const text = await insertText("T", "你", []);
    const tag = await createTag("G", "blue");
    await assignTag([text.id], tag.id);
    await deleteTag(tag.id);
    expect(await listTags()).toHaveLength(0);
    const filtered = await listTexts([tag.id], false);
    expect(filtered).toHaveLength(0);
  });

  it("rejects deletion of an unknown tag", async () => {
    await expect(deleteTag(9999)).rejects.toThrow(/not found/);
  });

  it("assignTag is idempotent", async () => {
    const text = await insertText("T", "你", []);
    const tag = await createTag("G", "blue");
    await assignTag([text.id], tag.id);
    await assignTag([text.id], tag.id);
    const previews = await listTexts([tag.id], false);
    expect(previews).toHaveLength(1);
  });

  it("removeTag detaches a text from a tag", async () => {
    const text = await insertText("T", "你", []);
    const tag = await createTag("G", "blue");
    await assignTag([text.id], tag.id);
    await removeTag([text.id], tag.id);
    expect(await listTexts([tag.id], false)).toHaveLength(0);
  });
});
