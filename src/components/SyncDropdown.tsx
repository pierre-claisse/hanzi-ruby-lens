import { useState, useRef, useEffect, useCallback } from "react";
import { AlertCircle, AlertTriangle, Check, CircleUser, CloudDownload, CloudUpload } from "lucide-react";
import { invoke } from "@tauri-apps/api/core";
import { message, confirm } from "@tauri-apps/plugin-dialog";
import { useUserName } from "../hooks/useUserName";
import { useLastSync } from "../hooks/useLastSync";
import { SyncPasswordDialog } from "./SyncPasswordDialog";

interface SyncDropdownProps {
  onPullComplete: () => void;
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

export function SyncDropdown({ onPullComplete }: SyncDropdownProps) {
  const [flow, setFlow] = useState<Flow>({ type: "idle" });
  const [avatarOpen, setAvatarOpen] = useState(false);
  const [nameDraft, setNameDraft] = useState<string>("");
  const avatarRef = useRef<HTMLDivElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);

  const { name: storedName, setName } = useUserName();
  const { meta, isDirty, recordSync } = useLastSync();

  // Init/refresh the draft from storedName when the avatar dropdown opens.
  useEffect(() => {
    if (avatarOpen) {
      setNameDraft(storedName);
      // autofocus the input shortly after mount
      setTimeout(() => nameInputRef.current?.focus(), 0);
    }
  }, [avatarOpen, storedName]);

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

  const nameDirty = nameDraft.trim() !== storedName.trim();
  const applyNameDraft = useCallback(() => {
    setName(nameDraft.trim());
    setAvatarOpen(false);
  }, [nameDraft, setName]);

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
        await message(
          `Pulled ${result.textCount} text(s), ${result.tagCount} tag(s)` +
            (result.author && result.timestamp
              ? ` — last saved by ${result.author} at ${result.timestamp}`
              : "") +
            ".",
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
    [recordSync, onPullComplete],
  );

  // ── Save flow ────────────────────────────────────────────────────────────

  const startSave = useCallback(() => {
    setFlow({ type: "password", action: "save", inProgress: false });
  }, []);

  const submitSavePassword = useCallback(
    async (password: string) => {
      const author = storedName.trim() || "Unknown";
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
          `Saved at ${result.timestamp}${result.author ? ` by ${result.author}` : ""}.`,
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
    [meta?.timestamp, storedName, recordSync, startPull],
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

      <div ref={avatarRef} className="relative">
        <button
          type="button"
          onClick={() => setAvatarOpen((v) => !v)}
          onPointerDown={(e) => e.stopPropagation()}
          aria-label="Your sync name"
          aria-expanded={avatarOpen}
          title={storedName || "Set your name"}
          className="p-1.5 rounded-lg border border-content/20 bg-surface text-content hover:bg-content/5 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 transition-colors cursor-pointer"
        >
          <CircleUser className="w-5 h-5" aria-hidden="true" />
        </button>

        {avatarOpen && (
          <div
            onPointerDown={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            className="absolute right-0 top-full mt-1 w-56 rounded-lg border border-content/20 bg-surface shadow-lg py-2 px-3 z-50"
          >
            <label className="block text-xs text-content/50 mb-1">Your name</label>
            <div className="flex items-center gap-1.5">
              <input
                ref={nameInputRef}
                type="text"
                className="flex-1 min-w-0 px-2 py-1 text-sm bg-content/5 border border-content/20 rounded text-content placeholder:text-content/30 focus:outline-none focus:ring-2 focus:ring-accent"
                placeholder="Type your name"
                value={nameDraft}
                onChange={(e) => setNameDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && nameDirty) {
                    e.preventDefault();
                    applyNameDraft();
                  } else if (e.key === "Escape") {
                    e.preventDefault();
                    setAvatarOpen(false);
                  }
                }}
                maxLength={64}
              />
              {nameDirty && (
                <button
                  type="button"
                  onClick={applyNameDraft}
                  className="flex-shrink-0 p-1 rounded text-accent hover:bg-accent/10 transition-colors"
                  aria-label="Apply name"
                  title="Apply name"
                >
                  <Check className="w-4 h-4" aria-hidden="true" />
                </button>
              )}
            </div>
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
