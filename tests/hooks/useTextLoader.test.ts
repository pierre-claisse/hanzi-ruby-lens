import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useTextLoader } from "../../src/hooks/useTextLoader";
import type { Text } from "../../src/types/domain";

// Mock Tauri core invoke
const mockInvoke = vi.fn();
vi.mock("@tauri-apps/api/core", () => ({
  invoke: (...args: unknown[]) => mockInvoke(...args),
}));

const sampleText: Text = {
  rawInput: "你好世界",
  segments: [
    { type: "word", word: { characters: "你好", pinyin: "nǐhǎo" } },
    { type: "plain", text: "，" },
    { type: "word", word: { characters: "世界", pinyin: "shìjiè" } },
  ],
};

describe("useTextLoader.updatePinyin", () => {
  beforeEach(() => {
    mockInvoke.mockReset();
  });

  it("updates pinyin for the target segment and saves", async () => {
    // Initial load returns sampleText
    mockInvoke.mockResolvedValueOnce(sampleText);

    const { result } = renderHook(() => useTextLoader());

    // Wait for initial load
    await waitFor(() => {
      expect(result.current.text).toEqual(sampleText);
    });

    // Mock save_text for the updatePinyin call
    mockInvoke.mockResolvedValueOnce(undefined);

    await act(async () => {
      await result.current.updatePinyin(0, "nihao");
    });

    // Verify save_text was called with the updated text
    expect(mockInvoke).toHaveBeenCalledWith("save_text", {
      text: {
        rawInput: "你好世界",
        segments: [
          { type: "word", word: { characters: "你好", pinyin: "nihao" } },
          { type: "plain", text: "，" },
          { type: "word", word: { characters: "世界", pinyin: "shìjiè" } },
        ],
      },
    });

    // Verify React state is updated
    expect(result.current.text!.segments[0]).toEqual({
      type: "word",
      word: { characters: "你好", pinyin: "nihao" },
    });

    // Verify other segments are unchanged
    expect(result.current.text!.segments[2]).toEqual({
      type: "word",
      word: { characters: "世界", pinyin: "shìjiè" },
    });
  });

  it("does not mutate the original text object", async () => {
    const originalText = structuredClone(sampleText);
    mockInvoke.mockResolvedValueOnce(sampleText);

    const { result } = renderHook(() => useTextLoader());
    await waitFor(() => {
      expect(result.current.text).toEqual(sampleText);
    });

    mockInvoke.mockResolvedValueOnce(undefined);

    await act(async () => {
      await result.current.updatePinyin(0, "nihao");
    });

    // Original sampleText should be unchanged
    expect(sampleText).toEqual(originalText);
  });

  it("skips non-word segments gracefully", async () => {
    mockInvoke.mockResolvedValueOnce(sampleText);

    const { result } = renderHook(() => useTextLoader());
    await waitFor(() => {
      expect(result.current.text).toEqual(sampleText);
    });

    mockInvoke.mockResolvedValueOnce(undefined);

    // Index 1 is a plain segment — should be left unchanged
    await act(async () => {
      await result.current.updatePinyin(1, "something");
    });

    // Plain segment should be untouched
    expect(result.current.text!.segments[1]).toEqual({
      type: "plain",
      text: "，",
    });
  });

  it("does nothing when text is null", async () => {
    mockInvoke.mockResolvedValueOnce(null);

    const { result } = renderHook(() => useTextLoader());
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.updatePinyin(0, "nihao");
    });

    // save_text should NOT have been called (only load_text was called)
    expect(mockInvoke).toHaveBeenCalledTimes(1);
    expect(mockInvoke).toHaveBeenCalledWith("load_text");
  });
});
