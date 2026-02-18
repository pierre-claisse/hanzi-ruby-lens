import { useState, useEffect, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import type { Text } from "../types/domain";

export type AppView = "empty" | "input" | "processing" | "reading";

function deriveView(text: Text | null): AppView {
  if (!text) return "empty";
  if (text.segments.length > 0) return "reading";
  if (text.rawInput) return "processing";
  return "empty";
}

interface UseTextLoaderReturn {
  text: Text | null;
  isLoading: boolean;
  appView: AppView;
  setView: (view: AppView) => void;
  saveText: (rawInput: string) => Promise<void>;
  processText: (rawInput: string) => Promise<Text>;
  updatePinyin: (segmentIndex: number, newPinyin: string) => Promise<void>;
  isProcessing: boolean;
  processingError: string | null;
  retryProcessing: () => Promise<void>;
}

export function useTextLoader(): UseTextLoaderReturn {
  const [text, setText] = useState<Text | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [appView, setAppView] = useState<AppView>("empty");
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingError, setProcessingError] = useState<string | null>(null);

  useEffect(() => {
    invoke<Text | null>("load_text")
      .then((loaded) => {
        setText(loaded);
        setAppView(deriveView(loaded));
      })
      .catch((err) => {
        console.error("Failed to load text:", err);
        setText(null);
        setAppView("empty");
      })
      .finally(() => setIsLoading(false));
  }, []);

  const saveText = useCallback(async (rawInput: string) => {
    const newText: Text = { rawInput, segments: [] };
    await invoke("save_text", { text: newText });
    setText(newText);
  }, []);

  const processText = useCallback(async (rawInput: string) => {
    setProcessingError(null);
    setIsProcessing(true);
    try {
      const result = await invoke<Text>("process_text", { rawInput });
      setText(result);
      setAppView("reading");
      return result;
    } catch (err) {
      const message = typeof err === "string" ? err : "Processing failed. Please try again.";
      setProcessingError(message);
      throw err;
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const updatePinyin = useCallback(async (segmentIndex: number, newPinyin: string) => {
    if (!text) return;
    const updatedSegments = text.segments.map((seg, i) => {
      if (i !== segmentIndex || seg.type !== "word") return seg;
      return { ...seg, word: { ...seg.word, pinyin: newPinyin } };
    });
    const updatedText: Text = { ...text, segments: updatedSegments };
    await invoke("save_text", { text: updatedText });
    setText(updatedText);
  }, [text]);

  const retryProcessing = useCallback(async () => {
    if (!text?.rawInput) return;
    setProcessingError(null);
    setIsProcessing(true);
    try {
      const result = await invoke<Text>("process_text", { rawInput: text.rawInput });
      setText(result);
      setAppView("reading");
    } catch (err) {
      const message = typeof err === "string" ? err : "Processing failed. Please try again.";
      setProcessingError(message);
    } finally {
      setIsProcessing(false);
    }
  }, [text]);

  return {
    text,
    isLoading,
    appView,
    setView: setAppView,
    saveText,
    processText,
    updatePinyin,
    isProcessing,
    processingError,
    retryProcessing,
  };
}
