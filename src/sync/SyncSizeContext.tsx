// In-memory state for "size of the gist content after the most recent sync".
// Updated by SyncDropdown after a successful pull or save; consumed by
// SyncSizeIndicator to render the small bottom-left badge.
//
// Nothing is persisted — at boot/reload the badge is hidden until the user
// triggers a sync, by design (no extra round-trip just to populate it).
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import type { ReactNode } from "react";

interface SyncSizeContextValue {
  lastSyncSize: number | null;
  setLastSyncSize: (size: number | null) => void;
}

const SyncSizeContext = createContext<SyncSizeContextValue | null>(null);

export const GIST_LIMIT_BYTES = 1024 * 1024;

export function SyncSizeProvider({ children }: { children: ReactNode }) {
  const [lastSyncSize, setLastSyncSizeRaw] = useState<number | null>(null);
  const setLastSyncSize = useCallback((s: number | null) => {
    setLastSyncSizeRaw(s);
  }, []);
  const value = useMemo<SyncSizeContextValue>(
    () => ({ lastSyncSize, setLastSyncSize }),
    [lastSyncSize, setLastSyncSize],
  );
  return (
    <SyncSizeContext.Provider value={value}>
      {children}
    </SyncSizeContext.Provider>
  );
}

export function useSyncSize(): SyncSizeContextValue {
  const ctx = useContext(SyncSizeContext);
  if (!ctx) throw new Error("useSyncSize must be used inside <SyncSizeProvider>");
  return ctx;
}
