import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Text, TextPreview } from "../../src/types/domain";

// Mock @tauri-apps/api/core
const mockInvoke = vi.fn();
vi.mock("@tauri-apps/api/core", () => ({
  invoke: (...args: unknown[]) => mockInvoke(...args),
}));

describe("Tauri Command Contract: multi-text library", () => {
  beforeEach(() => {
    mockInvoke.mockReset();
  });

  describe("create_text", () => {
    it("invokes 'create_text' with title and rawInput", async () => {
      const createdText: Text = {
        id: 1,
        title: "Test Title",
        createdAt: "2026-02-23T12:00:00",
        modifiedAt: null,
        rawInput: "你好世界",
        segments: [
          { type: "word", word: { characters: "你好", pinyin: "nǐhǎo" } },
          { type: "word", word: { characters: "世界", pinyin: "shìjiè" } },
        ],
      };
      mockInvoke.mockResolvedValue(createdText);

      const { invoke } = await import("@tauri-apps/api/core");
      const result = await invoke<Text>("create_text", {
        title: "Test Title",
        rawInput: "你好世界",
      });

      expect(mockInvoke).toHaveBeenCalledWith("create_text", {
        title: "Test Title",
        rawInput: "你好世界",
      });
      expect(result.id).toBe(1);
      expect(result.title).toBe("Test Title");
      expect(result.segments).toHaveLength(2);
    });

    it("rejects with error on empty title", async () => {
      mockInvoke.mockRejectedValue("Title must not be empty");

      const { invoke } = await import("@tauri-apps/api/core");

      await expect(
        invoke("create_text", { title: "", rawInput: "你好" }),
      ).rejects.toContain("Title must not be empty");
    });

    it("rejects with error when no Chinese characters", async () => {
      mockInvoke.mockRejectedValue(
        "Content must contain at least one Chinese character",
      );

      const { invoke } = await import("@tauri-apps/api/core");

      await expect(
        invoke("create_text", { title: "Test", rawInput: "Hello" }),
      ).rejects.toContain("Chinese character");
    });
  });

  describe("list_texts", () => {
    it("invokes 'list_texts' with tagIds and sortAsc params and returns TextPreview[]", async () => {
      const previews: TextPreview[] = [
        { id: 2, title: "Newer", createdAt: "2026-02-02T00:00:00", modifiedAt: null, tags: [] },
        { id: 1, title: "Older", createdAt: "2026-01-01T00:00:00", modifiedAt: null, tags: [] },
      ];
      mockInvoke.mockResolvedValue(previews);

      const { invoke } = await import("@tauri-apps/api/core");
      const result = await invoke<TextPreview[]>("list_texts", {
        tagIds: [],
        sortAsc: false,
      });

      expect(mockInvoke).toHaveBeenCalledWith("list_texts", {
        tagIds: [],
        sortAsc: false,
      });
      expect(result).toHaveLength(2);
      expect(result[0].title).toBe("Newer");
    });

    it("returns empty array when no texts exist", async () => {
      mockInvoke.mockResolvedValue([]);

      const { invoke } = await import("@tauri-apps/api/core");
      const result = await invoke<TextPreview[]>("list_texts", {
        tagIds: [],
        sortAsc: false,
      });

      expect(result).toEqual([]);
    });
  });

  describe("load_text", () => {
    it("invokes 'load_text' with textId and returns full Text", async () => {
      const text: Text = {
        id: 1,
        title: "Test",
        createdAt: "2026-02-23T12:00:00",
        modifiedAt: null,
        rawInput: "你好",
        segments: [
          { type: "word", word: { characters: "你好", pinyin: "nǐhǎo" } },
        ],
      };
      mockInvoke.mockResolvedValue(text);

      const { invoke } = await import("@tauri-apps/api/core");
      const result = await invoke<Text | null>("load_text", { textId: 1 });

      expect(mockInvoke).toHaveBeenCalledWith("load_text", { textId: 1 });
      expect(result).toEqual(text);
    });

    it("returns null when text not found", async () => {
      mockInvoke.mockResolvedValue(null);

      const { invoke } = await import("@tauri-apps/api/core");
      const result = await invoke<Text | null>("load_text", { textId: 999 });

      expect(result).toBeNull();
    });
  });

  describe("update_pinyin", () => {
    it("invokes 'update_pinyin' with textId, segmentIndex, newPinyin", async () => {
      mockInvoke.mockResolvedValue(undefined);

      const { invoke } = await import("@tauri-apps/api/core");
      await invoke("update_pinyin", {
        textId: 1,
        segmentIndex: 0,
        newPinyin: "nihao",
      });

      expect(mockInvoke).toHaveBeenCalledWith("update_pinyin", {
        textId: 1,
        segmentIndex: 0,
        newPinyin: "nihao",
      });
    });

    it("rejects on invalid segment", async () => {
      mockInvoke.mockRejectedValue("Segment at index 1 is not a word");

      const { invoke } = await import("@tauri-apps/api/core");

      await expect(
        invoke("update_pinyin", {
          textId: 1,
          segmentIndex: 1,
          newPinyin: "test",
        }),
      ).rejects.toContain("not a word");
    });
  });

  describe("delete_text", () => {
    it("invokes 'delete_text' with textId", async () => {
      mockInvoke.mockResolvedValue(undefined);

      const { invoke } = await import("@tauri-apps/api/core");
      await invoke("delete_text", { textId: 1 });

      expect(mockInvoke).toHaveBeenCalledWith("delete_text", { textId: 1 });
    });

    it("rejects when text not found", async () => {
      mockInvoke.mockRejectedValue("Text with id 999 not found");

      const { invoke } = await import("@tauri-apps/api/core");

      await expect(
        invoke("delete_text", { textId: 999 }),
      ).rejects.toContain("not found");
    });
  });
});
