import { useState, useEffect, useCallback } from "react";

const MIN_ZOOM = 100;
const MAX_ZOOM = 200;
const DEFAULT_ZOOM = 100;
const ZOOM_STEP = 10;
const STORAGE_KEY = "textZoomLevel";

interface UseTextZoomReturn {
  zoomLevel: number;
  zoomIn: () => void;
  zoomOut: () => void;
  isMinZoom: boolean;
  isMaxZoom: boolean;
}

function isValidZoomLevel(value: number): boolean {
  return (
    Number.isInteger(value) &&
    value >= MIN_ZOOM &&
    value <= MAX_ZOOM &&
    value % ZOOM_STEP === 0
  );
}

export function useTextZoom(): UseTextZoomReturn {
  const [zoomLevel, setZoomLevel] = useState<number>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored !== null) {
        const parsed = Number(stored);
        if (isValidZoomLevel(parsed)) {
          return parsed;
        }
      }
    } catch (error) {
      console.error("Failed to read text zoom preference:", error);
    }
    return DEFAULT_ZOOM;
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, String(zoomLevel));
    } catch (error) {
      console.error("Failed to persist text zoom preference:", error);
    }
  }, [zoomLevel]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && (e.key === "=" || e.key === "+")) {
        e.preventDefault();
        setZoomLevel((prev) => Math.min(prev + ZOOM_STEP, MAX_ZOOM));
      } else if (e.ctrlKey && e.key === "-") {
        e.preventDefault();
        setZoomLevel((prev) => Math.max(prev - ZOOM_STEP, MIN_ZOOM));
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  const zoomIn = useCallback(() => {
    setZoomLevel((prev) => Math.min(prev + ZOOM_STEP, MAX_ZOOM));
  }, []);

  const zoomOut = useCallback(() => {
    setZoomLevel((prev) => Math.max(prev - ZOOM_STEP, MIN_ZOOM));
  }, []);

  return {
    zoomLevel,
    zoomIn,
    zoomOut,
    isMinZoom: zoomLevel === MIN_ZOOM,
    isMaxZoom: zoomLevel === MAX_ZOOM,
  };
}
