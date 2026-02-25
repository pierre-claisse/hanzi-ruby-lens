import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Text } from "../../src/types/domain";

// Mock @tauri-apps/api/core
const mockInvoke = vi.fn();
vi.mock("@tauri-apps/api/core", () => ({
  invoke: (...args: unknown[]) => mockInvoke(...args),
}));

describe("Tauri Command Contract: create_text (atomic process + save)", () => {
  beforeEach(() => {
    mockInvoke.mockReset();
  });

  it("invokes 'create_text' with title and rawInput, returns full Text with segments", async () => {
    const createdText: Text = {
      id: 1,
      title: "今天天氣",
      createdAt: "2026-02-23T12:00:00",
      modifiedAt: null,
      rawInput: "今天天氣很好",
      segments: [
        { type: "word", word: { characters: "今天", pinyin: "jīntiān" } },
        { type: "word", word: { characters: "天氣", pinyin: "tiānqì" } },
        { type: "word", word: { characters: "很好", pinyin: "hěnhǎo" } },
      ],
      locked: false,
    };
    mockInvoke.mockResolvedValue(createdText);

    const { invoke } = await import("@tauri-apps/api/core");
    const result = await invoke<Text>("create_text", {
      title: "今天天氣",
      rawInput: "今天天氣很好",
    });

    expect(mockInvoke).toHaveBeenCalledWith("create_text", {
      title: "今天天氣",
      rawInput: "今天天氣很好",
    });
    expect(result.id).toBe(1);
    expect(result.title).toBe("今天天氣");
    expect(result.rawInput).toBe("今天天氣很好");
    expect(result.segments).toHaveLength(3);
  });

  it("returns Text with word and plain segments", async () => {
    const createdText: Text = {
      id: 2,
      title: "Test",
      createdAt: "2026-02-23T12:00:00",
      modifiedAt: null,
      rawInput: "你好，世界",
      segments: [
        { type: "word", word: { characters: "你好", pinyin: "nǐhǎo" } },
        { type: "plain", text: "，" },
        { type: "word", word: { characters: "世界", pinyin: "shìjiè" } },
      ],
      locked: false,
    };
    mockInvoke.mockResolvedValue(createdText);

    const { invoke } = await import("@tauri-apps/api/core");
    const result = await invoke<Text>("create_text", {
      title: "Test",
      rawInput: "你好，世界",
    });

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

  it("rejects with error on processing failure", async () => {
    mockInvoke.mockRejectedValue("Processing failed. Please try again.");

    const { invoke } = await import("@tauri-apps/api/core");

    await expect(
      invoke("create_text", { title: "Test", rawInput: "你好" }),
    ).rejects.toContain("Processing failed");
  });

  it("rejects with error on database failure", async () => {
    mockInvoke.mockRejectedValue("Database error: Failed to save text.");

    const { invoke } = await import("@tauri-apps/api/core");

    await expect(
      invoke("create_text", { title: "Test", rawInput: "你好" }),
    ).rejects.toContain("Database error");
  });
});
