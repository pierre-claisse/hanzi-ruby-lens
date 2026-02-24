import { useState, useEffect, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import type { Text, TextPreview } from "../types/domain";

export type AppView = "library" | "input" | "processing" | "reading";

interface UseTextLoaderReturn {
  previews: TextPreview[];
  activeText: Text | null;
  isLoading: boolean;
  appView: AppView;
  setView: (view: AppView) => void;
  createText: (title: string, rawInput: string) => Promise<void>;
  openText: (id: number) => Promise<void>;
  updatePinyin: (segmentIndex: number, newPinyin: string) => Promise<void>;
  splitSegment: (segmentIndex: number, splitAfterCharIndex: number) => Promise<void>;
  mergeSegments: (segmentIndex: number) => Promise<void>;
  deleteText: (id: number) => Promise<void>;
  refreshPreviews: () => Promise<void>;
  isProcessing: boolean;
  processingError: string | null;
}

export function useTextLoader(): UseTextLoaderReturn {
  const [previews, setPreviews] = useState<TextPreview[]>([]);
  const [activeText, setActiveText] = useState<Text | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [appView, setAppView] = useState<AppView>("library");
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingError, setProcessingError] = useState<string | null>(null);

  const refreshPreviews = useCallback(async () => {
    const list = await invoke<TextPreview[]>("list_texts");
    setPreviews(list);
  }, []);

  useEffect(() => {
    refreshPreviews()
      .catch((err) => {
        console.error("Failed to load texts:", err);
      })
      .finally(() => setIsLoading(false));
  }, [refreshPreviews]);

  const createText = useCallback(async (title: string, rawInput: string) => {
    setProcessingError(null);
    setIsProcessing(true);
    setAppView("processing");
    try {
      const result = await invoke<Text>("create_text", { title, rawInput });
      setActiveText(result);
      setPreviews((prev) => [
        { id: result.id, title: result.title, createdAt: result.createdAt },
        ...prev,
      ]);
      setAppView("reading");
    } catch (err) {
      const message = typeof err === "string" ? err : "Processing failed. Please try again.";
      setProcessingError(message);
      setAppView("library");
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const openText = useCallback(async (id: number) => {
    const loaded = await invoke<Text | null>("load_text", { textId: id });
    if (loaded) {
      setActiveText(loaded);
      setAppView("reading");
    }
  }, []);

  const updatePinyin = useCallback(async (segmentIndex: number, newPinyin: string) => {
    if (!activeText) return;
    await invoke("update_pinyin", {
      textId: activeText.id,
      segmentIndex,
      newPinyin,
    });
    setActiveText((prev) => {
      if (!prev) return prev;
      const updatedSegments = prev.segments.map((seg, i) => {
        if (i !== segmentIndex || seg.type !== "word") return seg;
        return { ...seg, word: { ...seg.word, pinyin: newPinyin } };
      });
      return { ...prev, segments: updatedSegments };
    });
  }, [activeText]);

  const splitSegment = useCallback(async (segmentIndex: number, splitAfterCharIndex: number) => {
    if (!activeText) return;
    await invoke("split_segment", {
      textId: activeText.id,
      segmentIndex,
      splitAfterCharIndex,
    });
    const reloaded = await invoke<Text | null>("load_text", { textId: activeText.id });
    if (reloaded) setActiveText(reloaded);
  }, [activeText]);

  const mergeSegments = useCallback(async (segmentIndex: number) => {
    if (!activeText) return;
    await invoke("merge_segments", {
      textId: activeText.id,
      segmentIndex,
    });
    const reloaded = await invoke<Text | null>("load_text", { textId: activeText.id });
    if (reloaded) setActiveText(reloaded);
  }, [activeText]);

  const deleteText = useCallback(async (id: number) => {
    await invoke("delete_text", { textId: id });
    setPreviews((prev) => prev.filter((p) => p.id !== id));
    if (activeText?.id === id) {
      setActiveText(null);
    }
  }, [activeText]);

  return {
    previews,
    activeText,
    isLoading,
    appView,
    setView: setAppView,
    createText,
    openText,
    updatePinyin,
    splitSegment,
    mergeSegments,
    deleteText,
    refreshPreviews,
    isProcessing,
    processingError,
  };
}
