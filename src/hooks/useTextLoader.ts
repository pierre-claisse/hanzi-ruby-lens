import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import type { Text } from "../types/domain";
import { sampleText } from "../data/sample-text";

export function useTextLoader(): { text: Text; isLoading: boolean } {
  const [text, setText] = useState<Text>(sampleText);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    invoke<Text | null>("load_text")
      .then((loaded) => {
        if (loaded) setText(loaded);
      })
      .catch((err) => {
        console.error("Failed to load text:", err);
      })
      .finally(() => setIsLoading(false));
  }, []);

  return { text, isLoading };
}
