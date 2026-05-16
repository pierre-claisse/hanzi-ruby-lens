import { useState, useCallback, useEffect } from "react";
import {
  clearLocalDirty,
  isLocalDirty,
  markLocalDirty,
  subscribeSyncState,
} from "../utils/syncDirty";

const META_KEY = "lastSyncMeta";
const ETAG_KEY = "lastSyncEtag";

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

function readEtag(): string | null {
  try {
    return localStorage.getItem(ETAG_KEY);
  } catch {
    return null;
  }
}

export function useLastSync() {
  const [meta, setMetaState] = useState<SyncMeta | null>(readMeta);
  const [etag, setEtagState] = useState<string | null>(readEtag);
  const [isDirty, setDirtyState] = useState<boolean>(isLocalDirty);

  // Single subscription: re-read all sync state on any change. Covers writes
  // from App.tsx (Reset / Import wipe everything) and from this hook itself
  // (recordSync writes meta + etag + clears dirty).
  useEffect(() => {
    const refresh = () => {
      setMetaState(readMeta());
      setEtagState(readEtag());
      setDirtyState(isLocalDirty());
    };
    return subscribeSyncState(refresh);
  }, []);

  const recordSync = useCallback(
    (next: { author?: string; timestamp?: string; etag?: string | null }) => {
      const newMeta: SyncMeta = {
        author: next.author,
        timestamp: next.timestamp,
      };
      try {
        localStorage.setItem(META_KEY, JSON.stringify(newMeta));
        if (next.etag !== undefined && next.etag !== null) {
          localStorage.setItem(ETAG_KEY, next.etag);
        }
      } catch {
        // ignore
      }
      // notifying via clearLocalDirty also triggers the meta/etag refresh path
      // (single shared event).
      clearLocalDirty();
    },
    [],
  );

  return {
    meta,
    etag,
    isDirty,
    recordSync,
    markDirty: markLocalDirty,
    markClean: clearLocalDirty,
  };
}
