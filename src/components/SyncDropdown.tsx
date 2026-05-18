// Pull / Save / Avatar controls in the title bar. The PWA refactor (Phase 6)
// removed the per-action SyncPasswordDialog — the syncPassword is captured
// once at login by the AuthProvider and reused for every sync call until
// the next page reload.
import { useState, useRef, useEffect, useCallback } from "react";
import type { ReactNode } from "react";
import { AlertCircle, AlertTriangle, CircleUser, CloudDownload, CloudUpload } from "lucide-react";
import { message, confirm } from "@tauri-apps/plugin-dialog";
import { useAuth } from "../auth";
import { useLastSync } from "../hooks/useLastSync";
import { pullGist, saveGist, SyncError } from "../sync";
import { exportAll, importAll, validateExportPayload, type ExportPayload } from "../db";
import { formatInZone, nowUtcIso } from "../utils/dateTimeFormat";

interface SyncDropdownProps {
  name: string;
  timeZone: string;
  onPullComplete: () => void;
  /** Rendered between the Save button and the Avatar button. */
  betweenSlot?: ReactNode;
}

export function SyncDropdown({ name, timeZone, onPullComplete, betweenSlot }: SyncDropdownProps) {
  const { state, signOut } = useAuth();
  const [avatarOpen, setAvatarOpen] = useState(false);
  const [inFlight, setInFlight] = useState<null | "pull" | "save">(null);
  const avatarRef = useRef<HTMLDivElement>(null);
  const { meta, isDirty, recordSync } = useLastSync();

  // Click-outside to close the avatar dropdown.
  useEffect(() => {
    if (!avatarOpen) return;
    const handler = (e: MouseEvent) => {
      if (avatarRef.current && !avatarRef.current.contains(e.target as Node)) {
        setAvatarOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [avatarOpen]);

  if (state.status !== "unlocked") return null;
  const { pat, gistId } = state;

  const handlePull = useCallback(async () => {
    if (inFlight) return;
    if (isDirty) {
      const ok = await confirm(
        "You have local changes that haven't been saved to the cloud. Pulling will overwrite them. Continue anyway?",
        { title: "Discard local changes?", kind: "warning" },
      );
      if (!ok) return;
    }
    setInFlight("pull");
    try {
      const json = await pullGist(pat, gistId);
      let payload: ExportPayload;
      try {
        payload = JSON.parse(json) as ExportPayload;
      } catch (e) {
        throw new SyncError("other", `Invalid remote payload: ${(e as Error).message}`);
      }
      validateExportPayload(payload);
      await importAll(payload);
      recordSync({
        author: payload.sync_author ?? undefined,
        timestamp: payload.sync_timestamp ?? undefined,
      });
      onPullComplete();
      const who = payload.sync_author ? ` from ${payload.sync_author}` : "";
      const when = payload.sync_timestamp
        ? ` (${formatInZone(payload.sync_timestamp, timeZone)})`
        : "";
      await message(`Library and calendar synced with latest data${who}${when}.`, {
        title: "Sync Pull",
        kind: "info",
      });
    } catch (err) {
      const msg = err instanceof SyncError ? err.message : (err as Error).message;
      await message(msg, { title: "Sync Pull Error", kind: "error" });
    } finally {
      setInFlight(null);
    }
  }, [inFlight, isDirty, pat, gistId, recordSync, onPullComplete, timeZone]);

  const handleSave = useCallback(async () => {
    if (inFlight) return;
    setInFlight("save");
    try {
      const payload = await exportAll();
      const timestamp = nowUtcIso();
      payload.sync_author = name;
      payload.sync_timestamp = timestamp;
      const json = JSON.stringify(payload);
      await saveGist(pat, gistId, json, meta?.timestamp ?? null);
      recordSync({ author: name, timestamp });
      await message(
        `Saved at ${formatInZone(timestamp, timeZone)} by ${name}.`,
        { title: "Sync Save", kind: "info" },
      );
    } catch (err) {
      if (err instanceof SyncError && err.kind === "conflict") {
        const wantsPullFirst = await confirm(
          "The remote data has been updated since your last pull. Your save would overwrite those changes.\n\nClick OK to pull first (your local changes will be replaced by the remote version, then you can re-apply and save them). Click Cancel to abandon this save.",
          { title: "Sync conflict", kind: "warning" },
        );
        if (wantsPullFirst) {
          setInFlight(null);
          handlePull();
          return;
        }
      } else {
        const msg = err instanceof SyncError ? err.message : (err as Error).message;
        await message(msg, { title: "Sync Save Error", kind: "error" });
      }
    } finally {
      setInFlight(null);
    }
  }, [inFlight, pat, gistId, name, meta?.timestamp, recordSync, handlePull, timeZone]);

  return (
    <>
      <button
        type="button"
        onClick={handlePull}
        onPointerDown={(e) => e.stopPropagation()}
        disabled={inFlight !== null}
        aria-label={isDirty ? "Pull from sync (will overwrite local changes)" : "Pull from sync"}
        title={isDirty ? "Pull — will overwrite local changes" : "Pull"}
        className="relative p-1.5 rounded-lg border border-content/20 bg-surface text-content hover:bg-content/5 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-surface"
      >
        <CloudDownload className="w-5 h-5" aria-hidden="true" />
        {isDirty && (
          <span className="absolute -top-1 -right-1 flex items-center justify-center bg-surface rounded-full">
            <AlertTriangle className="w-3.5 h-3.5 text-accent" strokeWidth={2.5} aria-hidden="true" />
          </span>
        )}
      </button>

      <button
        type="button"
        onClick={handleSave}
        onPointerDown={(e) => e.stopPropagation()}
        disabled={!isDirty || inFlight !== null}
        aria-label={isDirty ? "Save to sync (you have unsaved local changes)" : "Save to sync (nothing to save)"}
        title={isDirty ? "Save — unsaved local changes" : "Nothing to save"}
        className="relative p-1.5 rounded-lg border border-content/20 bg-surface text-content hover:bg-content/5 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-surface"
      >
        <CloudUpload className="w-5 h-5" aria-hidden="true" />
        {isDirty && (
          <span className="absolute -top-1 -right-1 flex items-center justify-center bg-surface rounded-full">
            <AlertCircle className="w-3.5 h-3.5 text-accent" strokeWidth={2.5} aria-hidden="true" />
          </span>
        )}
      </button>

      {betweenSlot}

      <div ref={avatarRef} className="relative">
        <button
          type="button"
          onClick={() => setAvatarOpen((v) => !v)}
          onPointerDown={(e) => e.stopPropagation()}
          aria-label="Your sync name"
          aria-expanded={avatarOpen}
          title={name}
          className="p-1.5 rounded-lg border border-content/20 bg-surface text-content hover:bg-content/5 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 transition-colors cursor-pointer"
        >
          <CircleUser className="w-5 h-5" aria-hidden="true" />
        </button>

        {avatarOpen && (
          <div
            onPointerDown={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            className="absolute right-0 top-full mt-1 min-w-[12rem] rounded-lg border border-content/20 bg-surface shadow-lg py-2 px-3 z-50"
          >
            <p className="text-xs text-content/50 mb-0.5">Signed in as</p>
            <p className="text-sm text-content mb-3">{name}</p>
            <button
              type="button"
              onClick={() => {
                setAvatarOpen(false);
                signOut();
              }}
              className="w-full text-xs text-content/70 hover:text-content border border-content/20 rounded px-2 py-1 transition-colors"
            >
              Sign out
            </button>
          </div>
        )}
      </div>
    </>
  );
}
