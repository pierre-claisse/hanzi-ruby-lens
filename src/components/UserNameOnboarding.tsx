import { useState, useEffect, useRef, useCallback } from "react";

interface UserNameOnboardingProps {
  open: boolean;
  onSubmit: (name: string) => void;
}

export function UserNameOnboarding({ open, onSubmit }: UserNameOnboardingProps) {
  const [value, setValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  const handleSubmit = useCallback(() => {
    const trimmed = value.trim();
    if (!trimmed) return;
    onSubmit(trimmed);
  }, [value, onSubmit]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit],
  );

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-surface border border-content/20 rounded-xl shadow-xl w-full max-w-md mx-4">
        <div className="px-5 py-4 border-b border-content/10">
          <h2 className="text-lg font-semibold text-content">Welcome</h2>
        </div>
        <div className="px-5 py-4">
          <p className="text-sm text-content/70 mb-3">
            Type your name. It will appear next to your saves.
          </p>
          <input
            ref={inputRef}
            type="text"
            className="w-full px-3 py-2 text-sm bg-content/5 border border-content/20 rounded-lg text-content placeholder:text-content/30 focus:outline-none focus:ring-2 focus:ring-accent"
            placeholder="Your name"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            maxLength={64}
          />
        </div>
        <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-content/10">
          <button
            type="button"
            className="px-4 py-2 text-sm font-medium rounded-lg bg-accent text-white hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
            onClick={handleSubmit}
            disabled={value.trim().length === 0}
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}
