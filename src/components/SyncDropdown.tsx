import { useState, useRef, useEffect, useCallback } from "react";
import { Check, Cloud, CloudDownload, CloudUpload } from "lucide-react";
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
  etag: string | null;
}

type SyncPullResult =
  | { kind: "upToDate"; etag: string | null }
  | {
      kind: "imported";
      author: string | null;
      timestamp: string | null;
      textCount: number;
      tagCount: number;
      etag: string | null;
    };

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
  const [isOpen, setIsOpen] = useState(false);
  const [flow, setFlow] = useState<Flow>({ type: "idle" });
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [nameDraft, setNameDraft] = useState<string>("");

  const { name: storedName, setName } = useUserName();
  const { etag, isDirty, recordSync } = useLastSync();

  // Sync the input draft with the stored name whenever the panel opens.
  useEffect(() => {
    if (isOpen) setNameDraft(storedName);
  }, [isOpen, storedName]);

  // Click-outside to close the panel (but not while a modal flow is active).
  useEffect(() => {
    if (!isOpen || flow.type !== "idle") return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [isOpen, flow.type]);

  const nameDirty = nameDraft.trim() !== storedName.trim();
  const applyNameDraft = useCallback(() => {
    setName(nameDraft.trim());
  }, [nameDraft, setName]);

  // ── Pull flow ────────────────────────────────────────────────────────────

  const startPull = useCallback(async () => {
    setIsOpen(false);

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
        const result = await invoke<SyncPullResult>("sync_pull", {
          password,
          ifNoneMatchEtag: etag,
        });
        setFlow({ type: "idle" });
        if (result.kind === "upToDate") {
          // Local already matches remote — leave etag and dirty as-is.
          await message("Already up to date — no changes pulled.", {
            title: "Sync Pull",
            kind: "info",
          });
        } else {
          recordSync({
            author: result.author ?? undefined,
            timestamp: result.timestamp ?? undefined,
            etag: result.etag,
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
        }
      } catch (err) {
        if (isSyncErrorPayload(err)) {
          if (err.kind === "invalid_password") {
            setFlow({
              type: "password",
              action: "pull",
              error: "Invalid sync password.",
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
    [etag, recordSync, onPullComplete],
  );

  // ── Save flow ────────────────────────────────────────────────────────────

  const startSave = useCallback(() => {
    setIsOpen(false);
    if (!storedName.trim()) {
      // Onboarding should normally cover this; guard defensively.
      message("Please set your name first.", { title: "Sync Save", kind: "warning" });
      return;
    }
    setFlow({ type: "password", action: "save", inProgress: false });
  }, [storedName]);

  const submitSavePassword = useCallback(
    async (password: string) => {
      const author = storedName.trim() || "Unknown";
      setFlow({ type: "password", action: "save", inProgress: true });
      try {
        const result = await invoke<SyncSaveResult>("sync_save", {
          password,
          author,
          ifMatchEtag: etag,
        });
        setFlow({ type: "idle" });
        recordSync({
          author: result.author,
          timestamp: result.timestamp,
          etag: result.etag,
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
              error: "Invalid sync password.",
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
    [etag, storedName, recordSync, startPull],
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
      <div ref={containerRef} className="relative">
        <button
          ref={buttonRef}
          onClick={() => setIsOpen((v) => !v)}
          onPointerDown={(e) => e.stopPropagation()}
          aria-label="Sync"
          aria-expanded={isOpen}
          className="p-1.5 rounded-lg border border-content/20 bg-surface text-content hover:bg-content/5 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 transition-colors cursor-pointer"
        >
          <Cloud className="w-5 h-5" aria-hidden="true" />
        </button>

        {isOpen && (
          <div
            onPointerDown={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            className="absolute right-0 top-full mt-1 w-72 rounded-lg border border-content/20 bg-surface shadow-lg py-2 z-50"
          >
            <div className="px-3 py-2">
              <label className="block text-xs text-content/50 mb-1">Your name</label>
              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  className="flex-1 min-w-0 px-2 py-1 text-sm bg-content/5 border border-content/20 rounded text-content placeholder:text-content/30 focus:outline-none focus:ring-2 focus:ring-accent"
                  placeholder="Type your name"
                  value={nameDraft}
                  onChange={(e) => setNameDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && nameDirty) {
                      e.preventDefault();
                      applyNameDraft();
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
            <div className="my-1 border-t border-content/10" />
            <button
              type="button"
              onClick={startPull}
              className="w-full text-left flex items-center gap-2 px-3 py-2 hover:bg-content/5 transition-colors"
            >
              <CloudDownload className="w-4 h-4 text-content/60" aria-hidden="true" />
              <span className="text-sm text-content">Pull</span>
            </button>
            <button
              type="button"
              onClick={startSave}
              className="w-full text-left flex items-center gap-2 px-3 py-2 hover:bg-content/5 transition-colors"
            >
              <CloudUpload className="w-4 h-4 text-content/60" aria-hidden="true" />
              <span className="text-sm text-content">Save</span>
            </button>
            {isDirty && (
              <p className="px-3 pb-2 text-[11px] text-amber-500">Local changes not yet saved.</p>
            )}
          </div>
        )}
      </div>

      <SyncPasswordDialog
        open={flow.type === "password"}
        title={
          flow.type === "password" && flow.action === "save"
            ? "Sync Save — enter password"
            : "Sync Pull — enter password"
        }
        description={
          flow.type === "password" && flow.action === "save"
            ? "Enter the password to save your changes."
            : "Enter the password to pull the latest changes."
        }
        inProgress={flow.type === "password" && flow.inProgress}
        errorMessage={flow.type === "password" ? flow.error : undefined}
        onSubmit={handlePasswordSubmit}
        onClose={handlePasswordClose}
      />
    </>
  );
}
