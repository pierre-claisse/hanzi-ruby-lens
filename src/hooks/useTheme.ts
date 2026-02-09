import { useState, useEffect } from "react";

type Theme = "light" | "dark";

export function useTheme(): [Theme, (theme: Theme) => void] {
  // Lazy initialization: read localStorage only once on mount
  const [theme, setTheme] = useState<Theme>(() => {
    try {
      const stored = localStorage.getItem("theme");
      if (stored === "light" || stored === "dark") {
        return stored;
      }
    } catch (error) {
      // Handle localStorage unavailable (private browsing, quota exceeded)
      console.error("Failed to read theme preference:", error);
    }
    // Fallback to light mode (per FR-003)
    return "light";
  });

  useEffect(() => {
    // Persist theme preference
    try {
      localStorage.setItem("theme", theme);
    } catch (error) {
      // Silent fallback (per FR-003)
      console.error("Failed to persist theme preference:", error);
    }

    // Update document root class for Tailwind dark mode
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  return [theme, setTheme];
}
