import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Text } from "../../src/types/domain";

// Mock @tauri-apps/api/core
const mockInvoke = vi.fn();
vi.mock("@tauri-apps/api/core", () => ({
  invoke: (...args: unknown[]) => mockInvoke(...args),
}));

describe("Tauri Command Contract: process_text", () => {
  beforeEach(() => {
    mockInvoke.mockReset();
  });

  it("invokes 'process_text' with rawInput parameter", async () => {
    const processedText: Text = {
      rawInput: "今天天氣很好",
      segments: [
        { type: "word", word: { characters: "今天", pinyin: "jīntiān" } },
        { type: "word", word: { characters: "天氣", pinyin: "tiānqì" } },
        { type: "word", word: { characters: "很好", pinyin: "hěnhǎo" } },
      ],
    };
    mockInvoke.mockResolvedValue(processedText);

    const { invoke } = await import("@tauri-apps/api/core");
    const result = await invoke<Text>("process_text", { rawInput: "今天天氣很好" });

    expect(mockInvoke).toHaveBeenCalledWith("process_text", { rawInput: "今天天氣很好" });
    expect(mockInvoke).toHaveBeenCalledTimes(1);
    expect(result.rawInput).toBe("今天天氣很好");
    expect(result.segments).toHaveLength(3);
  });

  it("returns Text with word and plain segments", async () => {
    const processedText: Text = {
      rawInput: "你好，世界",
      segments: [
        { type: "word", word: { characters: "你好", pinyin: "nǐhǎo" } },
        { type: "plain", text: "，" },
        { type: "word", word: { characters: "世界", pinyin: "shìjiè" } },
      ],
    };
    mockInvoke.mockResolvedValue(processedText);

    const { invoke } = await import("@tauri-apps/api/core");
    const result = await invoke<Text>("process_text", { rawInput: "你好，世界" });

    expect(result.segments[0]).toEqual({
      type: "word",
      word: { characters: "你好", pinyin: "nǐhǎo" },
    });
    expect(result.segments[1]).toEqual({ type: "plain", text: "，" });
    expect(result.segments[2]).toEqual({
      type: "word",
      word: { characters: "世界", pinyin: "shìjiè" },
    });
  });

  it("returns empty Text for empty input", async () => {
    const emptyText: Text = { rawInput: "", segments: [] };
    mockInvoke.mockResolvedValue(emptyText);

    const { invoke } = await import("@tauri-apps/api/core");
    const result = await invoke<Text>("process_text", { rawInput: "" });

    expect(result).toEqual({ rawInput: "", segments: [] });
  });

  it("rejects with error string on processing failure", async () => {
    mockInvoke.mockRejectedValue("Processing error: Text processing failed.");

    const { invoke } = await import("@tauri-apps/api/core");

    await expect(
      invoke("process_text", { rawInput: "test" }),
    ).rejects.toContain("Processing error");
  });

  it("rejects with error string on database failure", async () => {
    mockInvoke.mockRejectedValue("Database error: Failed to save text.");

    const { invoke } = await import("@tauri-apps/api/core");

    await expect(
      invoke("process_text", { rawInput: "test" }),
    ).rejects.toContain("Database error");
  });
});
