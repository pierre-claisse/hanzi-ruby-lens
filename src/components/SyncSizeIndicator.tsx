// Small, very faint, non-interactive label pinned to the bottom-left corner
// of the viewport. Shows the size of the gist after the most recent sync,
// against the 1 MB GitHub ceiling. Hidden until a pull/save has happened in
// the current session.
import { GIST_LIMIT_BYTES, useSyncSize } from "../sync/SyncSizeContext";

function fmt(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

export function SyncSizeIndicator() {
  const { lastSyncSize } = useSyncSize();
  if (lastSyncSize === null) return null;
  const remainingPct = Math.max(
    0,
    (1 - lastSyncSize / GIST_LIMIT_BYTES) * 100,
  );
  // `left-6` keeps the badge clear of the left-edge scrollbar used by Library,
  // Calendar and Reading screens (direction:rtl trick).
  return (
    <div
      className="fixed bottom-2 left-6 text-xs text-content/40 pointer-events-none select-none z-40"
      aria-label={`Gist size: ${fmt(lastSyncSize)} of ${fmt(GIST_LIMIT_BYTES)}, ${remainingPct.toFixed(1)}% remaining`}
    >
      {fmt(lastSyncSize)} / {fmt(GIST_LIMIT_BYTES)} ({remainingPct.toFixed(1)}% remaining)
    </div>
  );
}
