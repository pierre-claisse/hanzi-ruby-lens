import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useTextLoader } from "../../src/hooks/useTextLoader";
import type { Text, TextPreview } from "../../src/types/domain";

// Mock Tauri core invoke
const mockInvoke = vi.fn();
vi.mock("@tauri-apps/api/core", () => ({
  invoke: (...args: unknown[]) => mockInvoke(...args),
}));

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

const samplePreviews: TextPreview[] = [
  { id: 1, title: "Test Title", createdAt: "2026-02-23T12:00:00" },
];

describe("useTextLoader", () => {
  beforeEach(() => {
    mockInvoke.mockReset();
  });

  it("loads previews on mount and starts in library view", async () => {
    mockInvoke.mockResolvedValueOnce(samplePreviews);

    const { result } = renderHook(() => useTextLoader());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.appView).toBe("library");
    expect(result.current.previews).toEqual(samplePreviews);
    expect(mockInvoke).toHaveBeenCalledWith("list_texts");
  });

  it("starts in library view even with empty previews", async () => {
    mockInvoke.mockResolvedValueOnce([]);

    const { result } = renderHook(() => useTextLoader());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.appView).toBe("library");
    expect(result.current.previews).toEqual([]);
  });

  describe("createText", () => {
    it("creates text and transitions to reading view", async () => {
      mockInvoke.mockResolvedValueOnce([]); // initial list_texts
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

    it("sets processing error and returns to library on failure", async () => {
      mockInvoke.mockResolvedValueOnce([]); // initial list_texts
      mockInvoke.mockRejectedValueOnce("Processing failed"); // create_text

      const { result } = renderHook(() => useTextLoader());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.createText("Test", "你好");
      });

      expect(result.current.processingError).toBe("Processing failed");
      expect(result.current.appView).toBe("library");
    });
  });

  describe("openText", () => {
    it("loads text by id and transitions to reading view", async () => {
      mockInvoke.mockResolvedValueOnce(samplePreviews); // initial list_texts
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
  });

  describe("updatePinyin", () => {
    it("updates pinyin via IPC and patches local state", async () => {
      mockInvoke.mockResolvedValueOnce(samplePreviews); // initial list_texts
      mockInvoke.mockResolvedValueOnce(sampleText); // load_text
      mockInvoke.mockResolvedValueOnce(undefined); // update_pinyin

      const { result } = renderHook(() => useTextLoader());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.openText(1);
      });

      await act(async () => {
        await result.current.updatePinyin(0, "nihao");
      });

      expect(mockInvoke).toHaveBeenCalledWith("update_pinyin", {
        textId: 1,
        segmentIndex: 0,
        newPinyin: "nihao",
      });

      expect(result.current.activeText!.segments[0]).toEqual({
        type: "word",
        word: { characters: "你好", pinyin: "nihao" },
      });

      // Other segments unchanged
      expect(result.current.activeText!.segments[2]).toEqual({
        type: "word",
        word: { characters: "世界", pinyin: "shìjiè" },
      });
    });

    it("does nothing when no active text", async () => {
      mockInvoke.mockResolvedValueOnce([]); // initial list_texts

      const { result } = renderHook(() => useTextLoader());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.updatePinyin(0, "nihao");
      });

      // Only list_texts was called
      expect(mockInvoke).toHaveBeenCalledTimes(1);
    });
  });

  describe("deleteText", () => {
    it("removes text from previews", async () => {
      mockInvoke.mockResolvedValueOnce(samplePreviews); // initial list_texts
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
});
