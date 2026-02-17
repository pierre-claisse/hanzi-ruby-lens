import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import type { Text } from "../types/domain";

// Mock @tauri-apps/api/core
const mockInvoke = vi.fn();
vi.mock("@tauri-apps/api/core", () => ({
  invoke: (...args: unknown[]) => mockInvoke(...args),
}));

// Mock Tauri window API
vi.mock("@tauri-apps/api/window", () => ({
  getCurrentWindow: () => ({
    setFullscreen: vi.fn().mockResolvedValue(undefined),
    isFullscreen: vi.fn().mockResolvedValue(false),
    setResizable: vi.fn().mockResolvedValue(undefined),
    close: vi.fn().mockResolvedValue(undefined),
  }),
}));

import { useTextLoader } from "./useTextLoader";

describe("useTextLoader", () => {
  beforeEach(() => {
    mockInvoke.mockReset();
  });

  it("returns null initially with isLoading=true, then loaded text on success", async () => {
    const loadedText: Text = {
      rawInput: "測試文本",
      segments: [
        { type: "word", word: { characters: "測試", pinyin: "cèshì" } },
        { type: "word", word: { characters: "文本", pinyin: "wénběn" } },
      ],
    };
    mockInvoke.mockResolvedValue(loadedText);

    const { result } = renderHook(() => useTextLoader());

    // Initially: null, isLoading=true
    expect(result.current.text).toBeNull();
    expect(result.current.isLoading).toBe(true);

    // After load completes
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.text).toEqual(loadedText);
    expect(mockInvoke).toHaveBeenCalledWith("load_text");
  });

  it("returns null on null response (first launch)", async () => {
    mockInvoke.mockResolvedValue(null);

    const { result } = renderHook(() => useTextLoader());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.text).toBeNull();
  });

  it("returns null on invoke error (corrupted DB)", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockInvoke.mockRejectedValue("Database error: corrupted");

    const { result } = renderHook(() => useTextLoader());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.text).toBeNull();
    expect(consoleSpy).toHaveBeenCalledWith(
      "Failed to load text:",
      "Database error: corrupted",
    );
    consoleSpy.mockRestore();
  });

  // View state derivation tests
  it("derives 'empty' view when load returns null", async () => {
    mockInvoke.mockResolvedValue(null);

    const { result } = renderHook(() => useTextLoader());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.appView).toBe("empty");
  });

  it("derives 'processing' view when load returns text with empty segments", async () => {
    const unprocessedText: Text = { rawInput: "一些文字", segments: [] };
    mockInvoke.mockResolvedValue(unprocessedText);

    const { result } = renderHook(() => useTextLoader());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.appView).toBe("processing");
  });

  it("derives 'empty' view when load returns text with empty rawInput and empty segments", async () => {
    const emptyText: Text = { rawInput: "", segments: [] };
    mockInvoke.mockResolvedValue(emptyText);

    const { result } = renderHook(() => useTextLoader());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.appView).toBe("empty");
  });

  it("derives 'reading' view when load returns text with segments", async () => {
    const readingText: Text = {
      rawInput: "測試",
      segments: [{ type: "word", word: { characters: "測試", pinyin: "cèshì" } }],
    };
    mockInvoke.mockResolvedValue(readingText);

    const { result } = renderHook(() => useTextLoader());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.appView).toBe("reading");
  });

  it("derives 'empty' view on error", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockInvoke.mockRejectedValue("Database error");

    const { result } = renderHook(() => useTextLoader());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.appView).toBe("empty");
    consoleSpy.mockRestore();
  });

  // saveText tests
  it("saveText invokes save_text with rawInput and empty segments", async () => {
    mockInvoke.mockResolvedValue(null); // initial load
    const { result } = renderHook(() => useTextLoader());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    mockInvoke.mockResolvedValue(undefined); // save response

    await act(async () => {
      await result.current.saveText("新的文字");
    });

    expect(mockInvoke).toHaveBeenCalledWith("save_text", {
      text: { rawInput: "新的文字", segments: [] },
    });
    expect(result.current.text).toEqual({ rawInput: "新的文字", segments: [] });
  });

  // setView tests
  it("setView changes appView", async () => {
    mockInvoke.mockResolvedValue(null);
    const { result } = renderHook(() => useTextLoader());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    act(() => {
      result.current.setView("input");
    });

    expect(result.current.appView).toBe("input");
  });
});
