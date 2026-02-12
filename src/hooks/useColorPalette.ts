import { useState, useEffect, useCallback } from "react";
import { PALETTES, DEFAULT_PALETTE_ID } from "../data/palettes";
import type { ColorPalette } from "../data/palettes";

interface UseColorPaletteReturn {
  paletteId: string;
  setPalette: (id: string) => void;
  palettes: readonly ColorPalette[];
}

export function useColorPalette(): UseColorPaletteReturn {
  const [paletteId, setPaletteId] = useState<string>(() => {
    try {
      const stored = localStorage.getItem("colorPalette");
      if (stored && PALETTES.some((p) => p.id === stored)) {
        return stored;
      }
    } catch (error) {
      console.error("Failed to read color palette preference:", error);
    }
    return DEFAULT_PALETTE_ID;
  });

  useEffect(() => {
    try {
      localStorage.setItem("colorPalette", paletteId);
    } catch (error) {
      console.error("Failed to persist color palette preference:", error);
    }
    document.documentElement.dataset.palette = paletteId;
  }, [paletteId]);

  const setPalette = useCallback((id: string) => {
    if (PALETTES.some((p) => p.id === id)) {
      setPaletteId(id);
    }
  }, []);

  return { paletteId, setPalette, palettes: PALETTES };
}
