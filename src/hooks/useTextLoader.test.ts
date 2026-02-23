import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import type { Text, TextPreview } from "../types/domain";

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

const samplePreviews: TextPreview[] = [
  { id: 1, title: "Test Title", createdAt: "2026-02-23T12:00:00" },
];

const sampleText: Text = {
  id: 1,
  title: "Test Title",
  createdAt: "2026-02-23T12:00:00",
  rawInput: "你好世界",
  segments: [
    { type: "word", word: { characters: "你好", pinyin: "nǐhǎo" } },
    { type: "plain", text: "，" },
    { type: "word", word: { characters: "世界", pinyin: "shìjiè" } },
  ],
};

describe("useTextLoader", () => {
  beforeEach(() => {
    mockInvoke.mockReset();
  });

  it("loads previews on mount and starts in library view", async () => {
    mockInvoke.mockResolvedValueOnce(samplePreviews);

    const { result } = renderHook(() => useTextLoader());

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.appView).toBe("library");
    expect(result.current.previews).toEqual(samplePreviews);
    expect(mockInvoke).toHaveBeenCalledWith("list_texts");
  });

  it("starts in library view with empty previews", async () => {
    mockInvoke.mockResolvedValueOnce([]);

    const { result } = renderHook(() => useTextLoader());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.appView).toBe("library");
    expect(result.current.previews).toEqual([]);
  });

  it("handles error on load gracefully", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockInvoke.mockRejectedValue("Database error: corrupted");

    const { result } = renderHook(() => useTextLoader());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.appView).toBe("library");
    expect(result.current.previews).toEqual([]);
    consoleSpy.mockRestore();
  });

  it("setView changes appView", async () => {
    mockInvoke.mockResolvedValueOnce([]);
    const { result } = renderHook(() => useTextLoader());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    act(() => {
      result.current.setView("input");
    });

    expect(result.current.appView).toBe("input");
  });

  it("createText calls create_text and transitions to reading", async () => {
    mockInvoke.mockResolvedValueOnce([]); // list_texts
    mockInvoke.mockResolvedValueOnce(sampleText); // create_text

    const { result } = renderHook(() => useTextLoader());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.createText("Test Title", "你好世界");
    });

    expect(mockInvoke).toHaveBeenCalledWith("create_text", {
      title: "Test Title",
      rawInput: "你好世界",
    });
    expect(result.current.activeText).toEqual(sampleText);
    expect(result.current.appView).toBe("reading");
    expect(result.current.previews).toHaveLength(1);
  });

  it("openText calls load_text and transitions to reading", async () => {
    mockInvoke.mockResolvedValueOnce(samplePreviews); // list_texts
    mockInvoke.mockResolvedValueOnce(sampleText); // load_text

    const { result } = renderHook(() => useTextLoader());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.openText(1);
    });

    expect(mockInvoke).toHaveBeenCalledWith("load_text", { textId: 1 });
    expect(result.current.activeText).toEqual(sampleText);
    expect(result.current.appView).toBe("reading");
  });

  it("deleteText removes preview from list", async () => {
    mockInvoke.mockResolvedValueOnce(samplePreviews); // list_texts
    mockInvoke.mockResolvedValueOnce(undefined); // delete_text

    const { result } = renderHook(() => useTextLoader());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.deleteText(1);
    });

    expect(mockInvoke).toHaveBeenCalledWith("delete_text", { textId: 1 });
    expect(result.current.previews).toHaveLength(0);
  });
});
