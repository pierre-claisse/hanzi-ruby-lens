import { useState, useCallback, useEffect } from "react";
import {
  clearLocalDirty,
  isLocalDirty,
  markLocalDirty,
  subscribeSyncState,
} from "../utils/syncDirty";

const META_KEY = "lastSyncMeta";

export interface SyncMeta {
  author?: string;
  timestamp?: string;
}

function readMeta(): SyncMeta | null {
  try {
    const raw = localStorage.getItem(META_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as SyncMeta;
  } catch {
    return null;
  }
}

export function useLastSync() {
  const [meta, setMetaState] = useState<SyncMeta | null>(readMeta);
  const [isDirty, setDirtyState] = useState<boolean>(isLocalDirty);

  useEffect(() => {
    const refresh = () => {
      setMetaState(readMeta());
      setDirtyState(isLocalDirty());
    };
    return subscribeSyncState(refresh);
  }, []);

  const recordSync = useCallback(
    (next: { author?: string; timestamp?: string }) => {
      const newMeta: SyncMeta = {
        author: next.author,
        timestamp: next.timestamp,
      };
      try {
        localStorage.setItem(META_KEY, JSON.stringify(newMeta));
      } catch {
        // ignore
      }
      // notifying via clearLocalDirty also re-broadcasts the meta refresh path
      // (single shared event).
      clearLocalDirty();
    },
    [],
  );

  return {
    meta,
    isDirty,
    recordSync,
    markDirty: markLocalDirty,
    markClean: clearLocalDirty,
  };
}
