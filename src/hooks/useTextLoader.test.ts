import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import type { Text } from "../types/domain";

// Mock @tauri-apps/api/core
const mockInvoke = vi.fn();
vi.mock("@tauri-apps/api/core", () => ({
  invoke: (...args: unknown[]) => mockInvoke(...args),
}));

// Mock Tauri window API (needed because sampleText import chain)
vi.mock("@tauri-apps/api/window", () => ({
  getCurrentWindow: () => ({
    setFullscreen: vi.fn().mockResolvedValue(undefined),
    isFullscreen: vi.fn().mockResolvedValue(false),
    setResizable: vi.fn().mockResolvedValue(undefined),
    close: vi.fn().mockResolvedValue(undefined),
  }),
}));

import { useTextLoader } from "./useTextLoader";
import { sampleText } from "../data/sample-text";

describe("useTextLoader", () => {
  beforeEach(() => {
    mockInvoke.mockReset();
  });

  it("returns sampleText initially with isLoading=true, then loaded text on success", async () => {
    const loadedText: Text = {
      rawInput: "測試文本",
      segments: [
        { type: "word", word: { characters: "測試", pinyin: "cèshì" } },
        { type: "word", word: { characters: "文本", pinyin: "wénběn" } },
      ],
    };
    mockInvoke.mockResolvedValue(loadedText);

    const { result } = renderHook(() => useTextLoader());

    // Initially: sampleText, isLoading=true
    expect(result.current.text).toBe(sampleText);
    expect(result.current.isLoading).toBe(true);

    // After load completes
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.text).toEqual(loadedText);
    expect(mockInvoke).toHaveBeenCalledWith("load_text");
  });

  it("returns sampleText on null response (first launch)", async () => {
    mockInvoke.mockResolvedValue(null);

    const { result } = renderHook(() => useTextLoader());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.text).toBe(sampleText);
  });

  it("returns sampleText on invoke error (corrupted DB)", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockInvoke.mockRejectedValue("Database error: corrupted");

    const { result } = renderHook(() => useTextLoader());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.text).toBe(sampleText);
    expect(consoleSpy).toHaveBeenCalledWith(
      "Failed to load text:",
      "Database error: corrupted",
    );
    consoleSpy.mockRestore();
  });
});
