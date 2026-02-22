import { useState, useEffect, useRef } from "react";

export function formatElapsed(seconds: number): string {
  if (seconds < 60) {
    return `${seconds}s`;
  }
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${s}s`;
}

export function useElapsedTime(isRunning: boolean): {
  elapsed: number;
  formatted: string;
} {
  const [elapsed, setElapsed] = useState(0);
  const wasRunningRef = useRef(false);

  // Reset to 0 on false→true transition
  useEffect(() => {
    if (isRunning && !wasRunningRef.current) {
      setElapsed(0);
    }
    wasRunningRef.current = isRunning;
  }, [isRunning]);

  // Tick every second while running
  useEffect(() => {
    if (!isRunning) return;

    const id = setInterval(() => {
      setElapsed((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(id);
  }, [isRunning]);

  return { elapsed, formatted: formatElapsed(elapsed) };
}
