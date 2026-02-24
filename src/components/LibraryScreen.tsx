import { useState, useEffect, useCallback } from "react";
import { Trash2, ChevronRight, Check } from "lucide-react";
import { invoke } from "@tauri-apps/api/core";
import { TAG_COLORS } from "../data/tagColors";
import type { TextPreview, Tag } from "../types/domain";
import { TextPreviewCard } from "./TextPreviewCard";

interface LibraryScreenProps {
  previews: TextPreview[];
  onOpenText: (id: number) => void;
  onDeleteText: (id: number) => void;
  tags: Tag[];
  onTagsChanged: () => Promise<void>;
  filterActive: boolean;
}

export function LibraryScreen({ previews, onOpenText, onDeleteText, tags, onTagsChanged, filterActive }: LibraryScreenProps) {
  const [contextMenu, setContextMenu] = useState<{ ids: number[]; x: number; y: number } | null>(null);
  const [tagsSubmenu, setTagsSubmenu] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  const handleContextMenu = useCallback((e: React.MouseEvent, id: number) => {
    e.preventDefault();
    // If the right-clicked card is in the selection, operate on all selected
    const ids = selectedIds.has(id) ? Array.from(selectedIds) : [id];
    setContextMenu({ ids, x: e.clientX, y: e.clientY });
    setTagsSubmenu(false);
  }, [selectedIds]);

  const handleCardClick = useCallback((e: React.MouseEvent, id: number) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      setSelectedIds((prev) => {
        const next = new Set(prev);
        if (next.has(id)) {
          next.delete(id);
        } else {
          next.add(id);
        }
        return next;
      });
    } else {
      setSelectedIds(new Set());
      onOpenText(id);
    }
  }, [onOpenText]);

  const handleDelete = useCallback(() => {
    if (contextMenu) {
      setConfirmDeleteId(contextMenu.ids[0]);
      setContextMenu(null);
    }
  }, [contextMenu]);

  const handleConfirmDelete = useCallback(() => {
    if (confirmDeleteId !== null) {
      onDeleteText(confirmDeleteId);
      setConfirmDeleteId(null);
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(confirmDeleteId);
        return next;
      });
    }
  }, [confirmDeleteId, onDeleteText]);

  const handleCancelDelete = useCallback(() => {
    setConfirmDeleteId(null);
  }, []);

  const handleToggleTag = useCallback(async (tagId: number) => {
    if (!contextMenu) return;
    const textIds = contextMenu.ids;

    // Check if all target texts have this tag
    const allHaveTag = textIds.every((tid) => {
      const preview = previews.find((p) => p.id === tid);
      return preview?.tags.some((t) => t.id === tagId);
    });

    if (allHaveTag) {
      await invoke("remove_tag", { textIds, tagId });
    } else {
      await invoke("assign_tag", { textIds, tagId });
    }
    await onTagsChanged();
  }, [contextMenu, previews, onTagsChanged]);

  // Close context menu on click outside
  useEffect(() => {
    if (!contextMenu) return;
    const handler = () => {
      setContextMenu(null);
      setTagsSubmenu(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [contextMenu]);

  const getColorBg = (key: string) => TAG_COLORS.find((c) => c.key === key)?.bg ?? "#64748B";

  // For the tags submenu: determine which tags are assigned to the context-menu targets
  const contextTagState = (tagId: number): boolean => {
    if (!contextMenu) return false;
    return contextMenu.ids.every((tid) => {
      const preview = previews.find((p) => p.id === tid);
      return preview?.tags.some((t) => t.id === tagId);
    });
  };

  return (
    <div className="bg-surface text-content min-h-screen pt-16 pb-12 px-8">
      <div className="max-w-5xl mx-auto">
        {previews.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <p className="text-content/40 text-lg text-center">
              {filterActive
                ? "No texts match the selected tags."
                : "No texts yet. Click the + button to add your first text."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-4 mt-4">
            {previews.map((preview) => (
              <TextPreviewCard
                key={preview.id}
                preview={preview}
                selected={selectedIds.has(preview.id)}
                onClick={(e) => handleCardClick(e, preview.id)}
                onContextMenu={(e) => handleContextMenu(e, preview.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Context menu */}
      {contextMenu && (
        <div
          role="menu"
          className="fixed z-50 w-44 rounded-lg border border-content/20 bg-surface shadow-lg py-1"
          style={{ top: contextMenu.y, left: contextMenu.x }}
          onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
        >
          {/* Tags submenu trigger */}
          {tags.length > 0 && (
            <div
              role="menuitem"
              className="px-3 py-2 text-sm text-content cursor-default transition-colors hover:bg-content/10 flex items-center justify-between"
              onClick={() => setTagsSubmenu(!tagsSubmenu)}
              onMouseEnter={() => setTagsSubmenu(true)}
            >
              <span>Tags</span>
              <ChevronRight size={14} className="text-content/40" />
            </div>
          )}

          <div
            role="menuitem"
            className="px-3 py-2 text-sm text-red-500 cursor-default transition-colors hover:bg-content/10 flex items-center gap-2"
            onClick={handleDelete}
          >
            <Trash2 size={16} />
            Delete
          </div>

          {/* Tags submenu */}
          {tagsSubmenu && (
            <div
              className="absolute left-full top-0 ml-1 w-48 rounded-lg border border-content/20 bg-surface shadow-lg py-1"
              onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
            >
              {tags.map((tag) => {
                const checked = contextTagState(tag.id);
                return (
                  <div
                    key={tag.id}
                    role="menuitemcheckbox"
                    aria-checked={checked}
                    className="px-3 py-1.5 text-sm text-content cursor-default transition-colors hover:bg-content/10 flex items-center gap-2"
                    onClick={() => handleToggleTag(tag.id)}
                  >
                    <span className="w-4 h-4 flex items-center justify-center">
                      {checked && <Check size={14} className="text-accent" />}
                    </span>
                    <span
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: getColorBg(tag.color) }}
                    />
                    <span className="truncate">{tag.label}</span>
                  </div>
                );
              })}
            </div>
          )}
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
