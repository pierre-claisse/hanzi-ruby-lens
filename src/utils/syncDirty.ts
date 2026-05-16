// Shared sync-state in localStorage:
//   - "localDirty"     : "true" | "false"  — local DB has changes not yet sent
//                                            to remote; gates the Pull warning.
//   - "lastSyncMeta"   : JSON { author?, timestamp? } — shown under the Pull
//                                            button in SyncDropdown.
//   - "lastSyncEtag"   : opaque ETag string — sent as If-Match (Save) or
//                                            If-None-Match (Pull) for GitHub's
//                                            optimistic concurrency.
//
// All three keys are mutated outside the hook (App.tsx after Reset / Import,
// every data-modifying callback after success). The custom event below is
// dispatched on every write so any mounted useLastSync instance re-reads the
// new values immediately (localStorage's native `storage` event is cross-tab
// only — useless inside a single window).

const DIRTY_KEY = "localDirty";
const META_KEY = "lastSyncMeta";
const ETAG_KEY = "lastSyncEtag";
const EVENT = "hrl-sync-state-changed";

function notify() {
  window.dispatchEvent(new CustomEvent(EVENT));
}

export function markLocalDirty() {
  try {
    localStorage.setItem(DIRTY_KEY, "true");
  } catch {
    // localStorage unavailable
  }
  notify();
}

export function clearLocalDirty() {
  try {
    localStorage.setItem(DIRTY_KEY, "false");
  } catch {
    // localStorage unavailable
  }
  notify();
}

export function isLocalDirty(): boolean {
  try {
    return localStorage.getItem(DIRTY_KEY) === "true";
  } catch {
    return false;
  }
}

/**
 * Wipe all sync-related metadata: dirty flag, last-sync meta, ETag.
 * Use after any operation that invalidates the local↔remote relationship:
 *  - Reset (local emptied; ETag no longer represents what we have locally).
 *  - Import (local replaced by a file unrelated to the remote).
 * The next Pull will fetch fresh (no If-None-Match) and the next Save will
 * push without an If-Match constraint.
 */
export function clearSyncState() {
  try {
    localStorage.removeItem(META_KEY);
    localStorage.removeItem(ETAG_KEY);
    localStorage.setItem(DIRTY_KEY, "false");
  } catch {
    // localStorage unavailable
  }
  notify();
}

export function subscribeSyncState(listener: () => void): () => void {
  const handler = () => listener();
  window.addEventListener(EVENT, handler);
  // catch cross-tab updates too (rare in Tauri, but cheap)
  window.addEventListener("storage", handler);
  return () => {
    window.removeEventListener(EVENT, handler);
    window.removeEventListener("storage", handler);
  };
}
