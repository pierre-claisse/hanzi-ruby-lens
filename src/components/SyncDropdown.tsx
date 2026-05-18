import { useState, useRef, useEffect, useCallback } from "react";
import type { ReactNode } from "react";
import { AlertCircle, AlertTriangle, CircleUser, CloudDownload, CloudUpload } from "lucide-react";
import { invoke } from "@tauri-apps/api/core";
import { message, confirm } from "@tauri-apps/plugin-dialog";
import { useLastSync } from "../hooks/useLastSync";
import { SyncPasswordDialog } from "./SyncPasswordDialog";
import { formatInZone } from "../utils/dateTimeFormat";

interface SyncDropdownProps {
  /** Fixed identity name, derived from isAuthorizedDevice — never edited here. */
  name: string;
  /** Viewer time zone, used to format the pull-message timestamp. */
  timeZone: string;
  onPullComplete: () => void;
  /** Rendered between the Save button and the Avatar button. */
  betweenSlot?: ReactNode;
}

interface SyncSaveResult {
  author: string;
  timestamp: string;
}

interface SyncPullResult {
  author: string | null;
  timestamp: string | null;
  textCount: number;
  tagCount: number;
}

interface SyncErrorPayload {
  kind: string;
  message: string;
}

function isSyncErrorPayload(e: unknown): e is SyncErrorPayload {
  return (
    typeof e === "object" &&
    e !== null &&
    "kind" in e &&
    "message" in e &&
    typeof (e as Record<string, unknown>).kind === "string"
  );
}

type Flow =
  | { type: "idle" }
  | { type: "password"; action: "pull" | "save"; error?: string; inProgress: boolean };

export function SyncDropdown({ name, timeZone, onPullComplete, betweenSlot }: SyncDropdownProps) {
  const [flow, setFlow] = useState<Flow>({ type: "idle" });
  const [avatarOpen, setAvatarOpen] = useState(false);
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

  // ── Pull flow ────────────────────────────────────────────────────────────

  const startPull = useCallback(async () => {
    if (isDirty) {
      const confirmed = await confirm(
        "You have local changes that haven't been saved to the cloud. Pulling will overwrite them. Continue anyway?",
        { title: "Discard local changes?", kind: "warning" },
      );
      if (!confirmed) return;
    }
    setFlow({ type: "password", action: "pull", inProgress: false });
  }, [isDirty]);

  const submitPullPassword = useCallback(
    async (password: string) => {
      setFlow({ type: "password", action: "pull", inProgress: true });
      try {
        const result = await invoke<SyncPullResult>("sync_pull", { password });
        setFlow({ type: "idle" });
        recordSync({
          author: result.author ?? undefined,
          timestamp: result.timestamp ?? undefined,
        });
        onPullComplete();
        const who = result.author ? ` from ${result.author}` : "";
        const when = result.timestamp ? ` (${formatInZone(result.timestamp, timeZone)})` : "";
        await message(
          `Library and calendar synced with latest data${who}${when}.`,
          { title: "Sync Pull", kind: "info" },
        );
      } catch (err) {
        if (isSyncErrorPayload(err)) {
          if (err.kind === "invalid_password") {
            setFlow({
              type: "password",
              action: "pull",
              error: "Invalid password.",
              inProgress: false,
            });
            return;
          }
          setFlow({ type: "idle" });
          await message(err.message, { title: "Sync Pull Error", kind: "error" });
        } else {
          setFlow({ type: "idle" });
          await message(typeof err === "string" ? err : "Pull failed.", {
            title: "Sync Pull Error",
            kind: "error",
          });
        }
      }
    },
    [recordSync, onPullComplete, timeZone],
  );

  // ── Save flow ────────────────────────────────────────────────────────────

  const startSave = useCallback(() => {
    setFlow({ type: "password", action: "save", inProgress: false });
  }, []);

  const submitSavePassword = useCallback(
    async (password: string) => {
      const author = name;
      setFlow({ type: "password", action: "save", inProgress: true });
      try {
        const result = await invoke<SyncSaveResult>("sync_save", {
          password,
          author,
          lastSyncTimestamp: meta?.timestamp ?? null,
        });
        setFlow({ type: "idle" });
        recordSync({
          author: result.author,
          timestamp: result.timestamp,
        });
        await message(
          `Saved at ${formatInZone(result.timestamp, timeZone)}${result.author ? ` by ${result.author}` : ""}.`,
          { title: "Sync Save", kind: "info" },
        );
      } catch (err) {
        if (isSyncErrorPayload(err)) {
          if (err.kind === "invalid_password") {
            setFlow({
              type: "password",
              action: "save",
              error: "Invalid password.",
              inProgress: false,
            });
            return;
          }
          if (err.kind === "conflict") {
            setFlow({ type: "idle" });
            const wantsPullFirst = await confirm(
              "The remote data has been updated since your last pull. Your save would overwrite those changes.\n\nClick OK to pull first (your local changes will be replaced by the remote version, then you can re-apply and save them). Click Cancel to abandon this save.",
              { title: "Sync conflict", kind: "warning" },
            );
            if (wantsPullFirst) {
              startPull();
            }
            return;
          }
          setFlow({ type: "idle" });
          await message(err.message, { title: "Sync Save Error", kind: "error" });
        } else {
          setFlow({ type: "idle" });
          await message(typeof err === "string" ? err : "Save failed.", {
            title: "Sync Save Error",
            kind: "error",
          });
        }
      }
    },
    [meta?.timestamp, name, recordSync, startPull, timeZone],
  );

  const handlePasswordSubmit = useCallback(
    (password: string) => {
      if (flow.type !== "password") return;
      if (flow.action === "pull") submitPullPassword(password);
      else submitSavePassword(password);
    },
    [flow, submitPullPassword, submitSavePassword],
  );

  const handlePasswordClose = useCallback(() => {
    if (flow.type === "password" && flow.inProgress) return;
    setFlow({ type: "idle" });
  }, [flow]);

  // ── UI ───────────────────────────────────────────────────────────────────

  return (
    <>
      <button
        type="button"
        onClick={startPull}
        onPointerDown={(e) => e.stopPropagation()}
        aria-label={isDirty ? "Pull from sync (will overwrite local changes)" : "Pull from sync"}
        title={isDirty ? "Pull — will overwrite local changes" : "Pull"}
        className="relative p-1.5 rounded-lg border border-content/20 bg-surface text-content hover:bg-content/5 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 transition-colors cursor-pointer"
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
        onClick={startSave}
        onPointerDown={(e) => e.stopPropagation()}
        disabled={!isDirty}
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
            className="absolute right-0 top-full mt-1 min-w-[10rem] rounded-lg border border-content/20 bg-surface shadow-lg py-2 px-3 z-50"
          >
            <p className="text-xs text-content/50 mb-0.5">Signed in as</p>
            <p className="text-sm text-content">{name}</p>
          </div>
        )}
      </div>

      <SyncPasswordDialog
        open={flow.type === "password"}
        title={
          flow.type === "password" && flow.action === "save"
            ? "Save your changes"
            : "Pull the latest changes"
        }
        inProgress={flow.type === "password" && flow.inProgress}
        errorMessage={flow.type === "password" ? flow.error : undefined}
        onSubmit={handlePasswordSubmit}
        onClose={handlePasswordClose}
      />
    </>
  );
}
