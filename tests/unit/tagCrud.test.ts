import { describe, it, expect, vi, beforeEach } from "vitest";
import { invoke } from "@tauri-apps/api/core";
import type { Tag } from "../../src/types/domain";

const mockInvoke = vi.fn();
vi.mock("@tauri-apps/api/core", () => ({
  invoke: (...args: unknown[]) => mockInvoke(...args),
}));

beforeEach(() => {
  mockInvoke.mockReset();
});

describe("Tag CRUD commands", () => {
  const sampleTag: Tag = { id: 1, label: "Fiction", color: "blue" };

  describe("create_tag", () => {
    it("calls invoke with label and color", async () => {
      mockInvoke.mockResolvedValue(sampleTag);
      const result = await invoke<Tag>("create_tag", { label: "Fiction", color: "blue" });
      expect(mockInvoke).toHaveBeenCalledWith("create_tag", { label: "Fiction", color: "blue" });
      expect(result).toEqual(sampleTag);
    });

    it("rejects on duplicate label", async () => {
      mockInvoke.mockRejectedValue("A tag with label \"Fiction\" already exists");
      await expect(invoke("create_tag", { label: "Fiction", color: "red" })).rejects.toContain(
        "already exists"
      );
    });

    it("rejects on empty label", async () => {
      mockInvoke.mockRejectedValue("Tag label must not be empty");
      await expect(invoke("create_tag", { label: "", color: "red" })).rejects.toContain(
        "must not be empty"
      );
    });
  });

  describe("update_tag", () => {
    it("calls invoke with tag_id, label, and color", async () => {
      const updated = { ...sampleTag, label: "Non-Fiction" };
      mockInvoke.mockResolvedValue(updated);
      const result = await invoke<Tag>("update_tag", {
        tagId: 1,
        label: "Non-Fiction",
        color: "blue",
      });
      expect(mockInvoke).toHaveBeenCalledWith("update_tag", {
        tagId: 1,
        label: "Non-Fiction",
        color: "blue",
      });
      expect(result).toEqual(updated);
    });

    it("rejects on duplicate label", async () => {
      mockInvoke.mockRejectedValue("A tag with label \"Fiction\" already exists");
      await expect(
        invoke("update_tag", { tagId: 2, label: "Fiction", color: "red" })
      ).rejects.toContain("already exists");
    });

    it("rejects on empty label", async () => {
      mockInvoke.mockRejectedValue("Tag label must not be empty");
      await expect(
        invoke("update_tag", { tagId: 1, label: "", color: "red" })
      ).rejects.toContain("must not be empty");
    });
  });

  describe("delete_tag", () => {
    it("calls invoke with tag_id", async () => {
      mockInvoke.mockResolvedValue(undefined);
      await invoke("delete_tag", { tagId: 1 });
      expect(mockInvoke).toHaveBeenCalledWith("delete_tag", { tagId: 1 });
    });
  });

  describe("list_all_tags", () => {
    it("returns all tags ordered by label", async () => {
      const tags: Tag[] = [
        { id: 2, label: "Fiction", color: "blue" },
        { id: 1, label: "HSK4", color: "green" },
      ];
      mockInvoke.mockResolvedValue(tags);
      const result = await invoke<Tag[]>("list_all_tags");
      expect(mockInvoke).toHaveBeenCalledWith("list_all_tags");
      expect(result).toEqual(tags);
    });
  });
});
