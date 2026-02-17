import { useState, useEffect, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import type { Text } from "../types/domain";

export type AppView = "empty" | "input" | "saved" | "reading";

function deriveView(text: Text | null): AppView {
  if (!text) return "empty";
  if (text.segments.length > 0) return "reading";
  return "saved";
}

interface UseTextLoaderReturn {
  text: Text | null;
  isLoading: boolean;
  appView: AppView;
  setView: (view: AppView) => void;
  saveText: (rawInput: string) => Promise<void>;
}

export function useTextLoader(): UseTextLoaderReturn {
  const [text, setText] = useState<Text | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [appView, setAppView] = useState<AppView>("empty");

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

  return { text, isLoading, appView, setView: setAppView, saveText };
}
