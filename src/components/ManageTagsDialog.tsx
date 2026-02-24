import { useState, useCallback, useEffect, useRef } from "react";
import { X, Trash2, Check } from "lucide-react";
import { invoke } from "@tauri-apps/api/core";
import { TAG_COLORS } from "../data/tagColors";
import type { Tag } from "../types/domain";

interface ManageTagsDialogProps {
  open: boolean;
  onClose: () => void;
  tags: Tag[];
  onTagsChanged: () => void;
}

export function ManageTagsDialog({ open, onClose, tags, onTagsChanged }: ManageTagsDialogProps) {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editLabel, setEditLabel] = useState("");
  const [editColor, setEditColor] = useState("");
  const [newLabel, setNewLabel] = useState("");
  const [newColor, setNewColor] = useState(TAG_COLORS[0].key);
  const [error, setError] = useState<string | null>(null);
  const newInputRef = useRef<HTMLInputElement>(null);
  const editInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setEditingId(null);
      setNewLabel("");
      setNewColor(TAG_COLORS[0].key);
      setError(null);
    }
  }, [open]);

  useEffect(() => {
    if (editingId !== null && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editingId]);

  const handleCreate = useCallback(async () => {
    const label = newLabel.trim();
    if (!label) return;
    setError(null);
    try {
      await invoke("create_tag", { label, color: newColor });
      setNewLabel("");
      setNewColor(TAG_COLORS[0].key);
      onTagsChanged();
    } catch (err) {
      setError(typeof err === "string" ? err : "Failed to create tag");
    }
  }, [newLabel, newColor, onTagsChanged]);

  const handleUpdate = useCallback(async () => {
    if (editingId === null) return;
    const label = editLabel.trim();
    if (!label) return;
    setError(null);
    try {
      await invoke("update_tag", { tagId: editingId, label, color: editColor });
      setEditingId(null);
      onTagsChanged();
    } catch (err) {
      setError(typeof err === "string" ? err : "Failed to update tag");
    }
  }, [editingId, editLabel, editColor, onTagsChanged]);

  const handleDelete = useCallback(async (tagId: number) => {
    setError(null);
    try {
      await invoke("delete_tag", { tagId });
      if (editingId === tagId) setEditingId(null);
      onTagsChanged();
    } catch (err) {
      setError(typeof err === "string" ? err : "Failed to delete tag");
    }
  }, [editingId, onTagsChanged]);

  const startEditing = useCallback((tag: Tag) => {
    setEditingId(tag.id);
    setEditLabel(tag.label);
    setEditColor(tag.color);
    setError(null);
  }, []);

  const cancelEditing = useCallback(() => {
    setEditingId(null);
    setError(null);
  }, []);

  const getColorBg = (key: string) => TAG_COLORS.find((c) => c.key === key)?.bg ?? "#64748B";

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div
        className="bg-surface border border-content/20 rounded-xl shadow-xl w-full max-w-md mx-4"
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-content/10">
          <h2 className="text-lg font-semibold text-content">Manage Tags</h2>
          <button
            type="button"
            className="p-1 rounded-lg text-content/40 hover:text-content hover:bg-content/5 transition-colors"
            onClick={onClose}
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="mx-5 mt-3 px-3 py-2 text-sm text-red-500 bg-red-500/10 rounded-lg">
            {error}
          </div>
        )}

        {/* Tag list */}
        <div className="px-5 py-3 max-h-64 overflow-y-auto">
          {tags.length === 0 && (
            <p className="text-content/40 text-sm text-center py-4">No tags yet</p>
          )}
          {tags.map((tag) => (
            <div key={tag.id} className="flex items-center gap-2 py-1.5">
              {editingId === tag.id ? (
                <>
                  {/* Color picker for editing */}
                  <ColorDot
                    colorKey={editColor}
                    bg={getColorBg(editColor)}
                    onClick={() => {
                      const idx = TAG_COLORS.findIndex((c) => c.key === editColor);
                      const next = TAG_COLORS[(idx + 1) % TAG_COLORS.length];
                      setEditColor(next.key);
                    }}
                  />
                  <input
                    ref={editInputRef}
                    type="text"
                    className="flex-1 px-2 py-1 text-sm bg-content/5 border border-content/20 rounded text-content focus:outline-none focus:ring-2 focus:ring-accent"
                    value={editLabel}
                    onChange={(e) => setEditLabel(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleUpdate();
                      if (e.key === "Escape") cancelEditing();
                    }}
                    maxLength={50}
                  />
                  <button
                    type="button"
                    className="p-1 rounded text-green-500 hover:bg-green-500/10 transition-colors"
                    onClick={handleUpdate}
                    aria-label="Save"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    className="p-1 rounded text-content/40 hover:text-content hover:bg-content/5 transition-colors"
                    onClick={cancelEditing}
                    aria-label="Cancel"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </>
              ) : (
                <>
                  <ColorDot colorKey={tag.color} bg={getColorBg(tag.color)} />
                  <span
                    className="flex-1 text-sm text-content cursor-pointer hover:text-accent transition-colors truncate"
                    onClick={() => startEditing(tag)}
                    title="Click to edit"
                  >
                    {tag.label}
                  </span>
                  <button
                    type="button"
                    className="p-1 rounded text-content/30 hover:text-red-500 hover:bg-red-500/10 transition-colors"
                    onClick={() => handleDelete(tag.id)}
                    aria-label={`Delete tag ${tag.label}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>
          ))}
        </div>

        {/* New tag row */}
        <div className="px-5 py-3 border-t border-content/10">
          <div className="flex items-center gap-2">
            <ColorDot
              colorKey={newColor}
              bg={getColorBg(newColor)}
              onClick={() => {
                const idx = TAG_COLORS.findIndex((c) => c.key === newColor);
                const next = TAG_COLORS[(idx + 1) % TAG_COLORS.length];
                setNewColor(next.key);
              }}
            />
            <input
              ref={newInputRef}
              type="text"
              className="flex-1 px-2 py-1 text-sm bg-content/5 border border-content/20 rounded text-content placeholder:text-content/30 focus:outline-none focus:ring-2 focus:ring-accent"
              placeholder="New tag..."
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleCreate();
              }}
              maxLength={50}
            />
            <button
              type="button"
              className="px-3 py-1 text-sm font-medium rounded-lg bg-accent text-white hover:opacity-90 transition-opacity disabled:opacity-40"
              onClick={handleCreate}
              disabled={!newLabel.trim()}
            >
              Add
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end px-5 py-3 border-t border-content/10">
          <button
            type="button"
            className="px-4 py-2 text-sm text-content/60 hover:text-content transition-colors rounded-lg focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2"
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function ColorDot({ colorKey, bg, onClick }: { colorKey: string; bg: string; onClick?: () => void }) {
  return (
    <button
      type="button"
      className="w-5 h-5 rounded-full flex-shrink-0 border border-content/20 transition-transform hover:scale-110"
      style={{ backgroundColor: bg }}
      onClick={onClick}
      aria-label={`Color: ${colorKey}`}
      title={`Color: ${colorKey}${onClick ? " (click to change)" : ""}`}
    />
  );
}
