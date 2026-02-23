import { useState, useEffect, useCallback } from "react";
import { Plus, Trash2 } from "lucide-react";
import type { TextPreview } from "../types/domain";
import { TextPreviewCard } from "./TextPreviewCard";

interface LibraryScreenProps {
  previews: TextPreview[];
  onAddText: () => void;
  onOpenText: (id: number) => void;
  onDeleteText: (id: number) => void;
}

export function LibraryScreen({ previews, onAddText, onOpenText, onDeleteText }: LibraryScreenProps) {
  const [contextMenu, setContextMenu] = useState<{ id: number; x: number; y: number } | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

  const handleContextMenu = useCallback((e: React.MouseEvent, id: number) => {
    e.preventDefault();
    setContextMenu({ id, x: e.clientX, y: e.clientY });
  }, []);

  const handleDelete = useCallback(() => {
    if (contextMenu) {
      setConfirmDeleteId(contextMenu.id);
      setContextMenu(null);
    }
  }, [contextMenu]);

  const handleConfirmDelete = useCallback(() => {
    if (confirmDeleteId !== null) {
      onDeleteText(confirmDeleteId);
      setConfirmDeleteId(null);
    }
  }, [confirmDeleteId, onDeleteText]);

  const handleCancelDelete = useCallback(() => {
    setConfirmDeleteId(null);
  }, []);

  // Close context menu on click outside
  useEffect(() => {
    if (!contextMenu) return;
    const handler = () => setContextMenu(null);
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [contextMenu]);

  return (
    <div className="bg-surface text-content min-h-screen pt-16 pb-24 px-8">
      <div className="max-w-3xl mx-auto">
        {previews.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <p className="text-content/40 text-lg text-center">
              No texts yet. Click the + button to add your first text.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2 mt-4">
            {previews.map((preview) => (
              <TextPreviewCard
                key={preview.id}
                preview={preview}
                onClick={() => onOpenText(preview.id)}
                onContextMenu={(e) => handleContextMenu(e, preview.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Fixed add button */}
      <button
        type="button"
        className="fixed bottom-8 right-8 w-14 h-14 rounded-full bg-accent text-white shadow-lg flex items-center justify-center hover:opacity-90 transition-opacity focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 cursor-pointer"
        onClick={onAddText}
        aria-label="Add text"
      >
        <Plus className="w-6 h-6" aria-hidden="true" />
      </button>

      {/* Context menu */}
      {contextMenu && (
        <div
          role="menu"
          className="fixed z-50 w-44 rounded-lg border border-content/20 bg-surface shadow-lg py-1"
          style={{ top: contextMenu.y, left: contextMenu.x }}
          onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
        >
          <div
            role="menuitem"
            className="px-3 py-2 text-sm text-red-500 cursor-default transition-colors hover:bg-content/10 flex items-center gap-2"
            onClick={handleDelete}
          >
            <Trash2 size={16} />
            Delete
          </div>
        </div>
      )}

      {/* Confirmation dialog */}
      {confirmDeleteId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-surface border border-content/20 rounded-xl shadow-xl p-6 max-w-sm mx-4">
            <p className="text-content text-base mb-6">
              Are you sure you want to delete this text? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                className="px-4 py-2 text-content/60 hover:text-content transition-colors rounded-lg focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2"
                onClick={handleCancelDelete}
              >
                Cancel
              </button>
              <button
                type="button"
                className="px-4 py-2 bg-red-500 text-white rounded-lg font-medium hover:opacity-90 transition-opacity focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                onClick={handleConfirmDelete}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
