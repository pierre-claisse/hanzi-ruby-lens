// Shared sync-state in localStorage:
//   - "localDirty"   : "true" | "false"  — local DB has changes not yet sent
//                                          to remote; gates the Pull warning
//                                          and the Save button enabled state.
//   - "lastSyncMeta" : JSON { author?, timestamp? } — captured on every
//                                          successful Save / Pull. The
//                                          timestamp is sent to the backend
//                                          on Save as the concurrency token
//                                          (GitHub Gists do not support
//                                          If-Match, so we compare
//                                          application-side).
//
// Both keys are mutated outside the hook (App.tsx after Reset / Import,
// every data-modifying callback after success). The custom event below is
// dispatched on every write so any mounted useLastSync instance re-reads the
// new values immediately (localStorage's native `storage` event is cross-tab
// only — useless inside a single window).

const DIRTY_KEY = "localDirty";
const META_KEY = "lastSyncMeta";
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
 * Wipe all sync-related metadata: dirty flag, last-sync meta.
 * Use after any operation that invalidates the local↔remote relationship:
 *  - Reset (local emptied; meta no longer represents what we have locally).
 *  - Import (local replaced by a file unrelated to the remote).
 * The next Save will then see `lastSyncTimestamp === undefined` and the
 * backend will treat any non-empty remote as a conflict (forcing a Pull first).
 */
export function clearSyncState() {
  try {
    localStorage.removeItem(META_KEY);
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
