import { useState, useEffect, useRef, useCallback } from "react";
import { X, Trash2 } from "lucide-react";
import type { Word } from "../types/domain";

interface WordCommentDialogProps {
  open: boolean;
  word: Word | null;
  segmentIndex: number;
  textId: number;
  onSave: (segmentIndex: number, comment: string | null) => void;
  onClose: () => void;
}

export function WordCommentDialog({ open, word, segmentIndex, onSave, onClose }: WordCommentDialogProps) {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (open && word) {
      setValue(word.comment ?? "");
    }
  }, [open, word]);

  useEffect(() => {
    if (open && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [open]);

  const handleSave = useCallback(() => {
    const trimmed = value.trim();
    onSave(segmentIndex, trimmed || null);
    onClose();
  }, [value, segmentIndex, onSave, onClose]);

  const handleDelete = useCallback(() => {
    onSave(segmentIndex, null);
    onClose();
  }, [segmentIndex, onSave, onClose]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      e.preventDefault();
      onClose();
    }
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSave();
    }
  }, [onClose, handleSave]);

  if (!open || !word) return null;

  const isEditing = !!word.comment;
  const charCount = value.length;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onMouseDown={onClose}
    >
      <div
        className="bg-surface border border-content/20 rounded-xl shadow-xl w-full max-w-3xl mx-4"
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-content/10">
          <h2 className="text-lg font-semibold text-content">
            {isEditing ? "Edit Comment" : "Add Comment"} — <span className="text-accent">{word.characters}</span>
          </h2>
          <button
            type="button"
            className="p-1 rounded-lg text-content/40 hover:text-content hover:bg-content/5 transition-colors"
            onClick={onClose}
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-4">
          <textarea
            ref={textareaRef}
            className="w-full h-96 px-3 py-2 text-sm bg-content/5 border border-content/20 rounded-lg text-content placeholder:text-content/30 focus:outline-none focus:ring-2 focus:ring-accent resize-none"
            placeholder="Write a comment..."
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            maxLength={5000}
          />
          <div className="text-xs text-content/40 text-right mt-1">
            {charCount}/5000
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-content/10">
          <div>
            {isEditing && (
              <button
                type="button"
                className="flex items-center gap-1.5 px-3 py-2 text-sm text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                onClick={handleDelete}
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="px-4 py-2 text-sm text-content/60 hover:text-content transition-colors rounded-lg"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="button"
              className="px-4 py-2 text-sm font-medium rounded-lg bg-accent text-white hover:opacity-90 transition-opacity"
              onClick={handleSave}
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
