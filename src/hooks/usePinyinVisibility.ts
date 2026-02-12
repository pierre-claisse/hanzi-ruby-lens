import { useState, useEffect } from "react";

export function usePinyinVisibility(): [boolean, (visible: boolean) => void] {
  // Lazy initialization: read localStorage only once on mount
  const [visible, setVisible] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem("pinyinVisible");
      if (stored === "true" || stored === "false") {
        return stored === "true";
      }
    } catch (error) {
      // Handle localStorage unavailable (private browsing, quota exceeded)
      console.error("Failed to read pinyin visibility preference:", error);
    }
    // Default to visible (per FR-004)
    return true;
  });

  useEffect(() => {
    // Persist visibility preference
    try {
      localStorage.setItem("pinyinVisible", String(visible));
    } catch (error) {
      // Silent fallback (per FR-004)
      console.error("Failed to persist pinyin visibility preference:", error);
    }
  }, [visible]);

  return [visible, setVisible];
}
