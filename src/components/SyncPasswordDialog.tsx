import { useState, useEffect, useRef, useCallback } from "react";
import { X } from "lucide-react";

interface SyncPasswordDialogProps {
  open: boolean;
  title: string;
  description?: string;
  inProgress?: boolean;
  errorMessage?: string;
  onSubmit: (password: string) => void;
  onClose: () => void;
}

export function SyncPasswordDialog({
  open,
  title,
  description,
  inProgress,
  errorMessage,
  onSubmit,
  onClose,
}: SyncPasswordDialogProps) {
  const [value, setValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setValue("");
      // focus on the next tick to allow the input to be mounted
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [open]);

  const handleSubmit = useCallback(() => {
    if (!value || inProgress) return;
    onSubmit(value);
  }, [value, inProgress, onSubmit]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
      if (e.key === "Enter") {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit, onClose],
  );

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onMouseDown={inProgress ? undefined : onClose}
    >
      <div
        className="bg-surface border border-content/20 rounded-xl shadow-xl w-full max-w-md mx-4"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-content/10">
          <h2 className="text-lg font-semibold text-content">{title}</h2>
          <button
            type="button"
            className="p-1 rounded-lg text-content/40 hover:text-content hover:bg-content/5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            onClick={onClose}
            aria-label="Close"
            disabled={inProgress}
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="px-5 py-4">
          {description && (
            <p className="text-sm text-content/70 mb-3">{description}</p>
          )}
          <input
            ref={inputRef}
            type="password"
            className="w-full px-3 py-2 text-sm bg-content/5 border border-content/20 rounded-lg text-content placeholder:text-content/30 focus:outline-none focus:ring-2 focus:ring-accent"
            placeholder="Sync password"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={inProgress}
            autoComplete="off"
          />
          {errorMessage && (
            <p className="text-sm text-red-500 mt-2">{errorMessage}</p>
          )}
        </div>
        <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-content/10">
          <button
            type="button"
            className="px-4 py-2 text-sm text-content/60 hover:text-content transition-colors rounded-lg disabled:opacity-40 disabled:cursor-not-allowed"
            onClick={onClose}
            disabled={inProgress}
          >
            Cancel
          </button>
          <button
            type="button"
            className="px-4 py-2 text-sm font-medium rounded-lg bg-accent text-white hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
            onClick={handleSubmit}
            disabled={value.length === 0 || inProgress}
          >
            {inProgress ? "Working..." : "Continue"}
          </button>
        </div>
      </div>
    </div>
  );
}
