import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Text } from "../../src/types/domain";

// Mock @tauri-apps/api/core
const mockInvoke = vi.fn();
vi.mock("@tauri-apps/api/core", () => ({
  invoke: (...args: unknown[]) => mockInvoke(...args),
}));

describe("Tauri Command Contract: text-commands", () => {
  beforeEach(() => {
    mockInvoke.mockReset();
  });

  describe("save_text", () => {
    it("invokes 'save_text' with a Text object containing segments and rawInput", async () => {
      mockInvoke.mockResolvedValue(undefined);

      const text: Text = {
        rawInput: "你好世界",
        segments: [
          { type: "word", word: { characters: "你好", pinyin: "nǐhǎo" } },
          { type: "plain", text: "，" },
          { type: "word", word: { characters: "世界", pinyin: "shìjiè" } },
        ],
      };

      const { invoke } = await import("@tauri-apps/api/core");
      await invoke("save_text", { text });

      expect(mockInvoke).toHaveBeenCalledWith("save_text", { text });
      expect(mockInvoke).toHaveBeenCalledTimes(1);
    });

    it("accepts the command name 'save_text' (snake_case)", async () => {
      mockInvoke.mockResolvedValue(undefined);

      const { invoke } = await import("@tauri-apps/api/core");
      await invoke("save_text", {
        text: { rawInput: "", segments: [] },
      });

      expect(mockInvoke.mock.calls[0][0]).toBe("save_text");
    });

    it("accepts empty segments array", async () => {
      mockInvoke.mockResolvedValue(undefined);

      const text: Text = { rawInput: "", segments: [] };

      const { invoke } = await import("@tauri-apps/api/core");
      await invoke("save_text", { text });

      expect(mockInvoke).toHaveBeenCalledWith("save_text", {
        text: { rawInput: "", segments: [] },
      });
    });

    it("returns void on success (no return value)", async () => {
      mockInvoke.mockResolvedValue(undefined);

      const { invoke } = await import("@tauri-apps/api/core");
      const result = await invoke("save_text", {
        text: { rawInput: "", segments: [] },
      });

      expect(result).toBeUndefined();
    });

    it("rejects with error string on failure", async () => {
      mockInvoke.mockRejectedValue("Database error: disk full");

      const { invoke } = await import("@tauri-apps/api/core");

      await expect(
        invoke("save_text", { text: { rawInput: "", segments: [] } }),
      ).rejects.toBe("Database error: disk full");
    });
  });

  describe("load_text", () => {
    it("invokes 'load_text' with no arguments", async () => {
      mockInvoke.mockResolvedValue(null);

      const { invoke } = await import("@tauri-apps/api/core");
      await invoke("load_text");

      expect(mockInvoke).toHaveBeenCalledWith("load_text");
      expect(mockInvoke).toHaveBeenCalledTimes(1);
    });

    it("returns Text object when data exists", async () => {
      const savedText: Text = {
        rawInput: "你好",
        segments: [
          { type: "word", word: { characters: "你好", pinyin: "nǐhǎo" } },
        ],
      };
      mockInvoke.mockResolvedValue(savedText);

      const { invoke } = await import("@tauri-apps/api/core");
      const result = await invoke<Text | null>("load_text");

      expect(result).toEqual(savedText);
      expect(result!.rawInput).toBe("你好");
      expect(result!.segments).toHaveLength(1);
      expect(result!.segments[0].type).toBe("word");
    });

    it("returns null when no text is saved (first launch)", async () => {
      mockInvoke.mockResolvedValue(null);

      const { invoke } = await import("@tauri-apps/api/core");
      const result = await invoke<Text | null>("load_text");

      expect(result).toBeNull();
    });

    it("rejects with error string on database error", async () => {
      mockInvoke.mockRejectedValue("Database error: corrupted");

      const { invoke } = await import("@tauri-apps/api/core");

      await expect(invoke("load_text")).rejects.toBe(
        "Database error: corrupted",
      );
    });
  });
});
