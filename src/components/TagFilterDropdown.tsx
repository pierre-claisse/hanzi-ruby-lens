import { useState, useEffect, useRef } from "react";
import { ChevronDown, X } from "lucide-react";
import { TAG_COLORS } from "../data/tagColors";
import type { Tag } from "../types/domain";

interface TagFilterDropdownProps {
  tags: Tag[];
  selectedIds: number[];
  onChange: (ids: number[]) => void;
}

export function TagFilterDropdown({ tags, selectedIds, onChange }: TagFilterDropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const toggleTag = (tagId: number) => {
    if (selectedIds.includes(tagId)) {
      onChange(selectedIds.filter((id) => id !== tagId));
    } else {
      onChange([...selectedIds, tagId]);
    }
  };

  const clearAll = () => {
    onChange([]);
    setOpen(false);
  };

  const getColorBg = (key: string) => TAG_COLORS.find((c) => c.key === key)?.bg ?? "#64748B";
  const getColorText = (key: string) => TAG_COLORS.find((c) => c.key === key)?.text ?? "#FFFFFF";

  const selectedTags = tags.filter((t) => selectedIds.includes(t.id));

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-content/20 bg-surface text-content hover:bg-content/5 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 transition-colors cursor-pointer text-sm"
        onClick={() => setOpen(!open)}
        onPointerDown={(e) => e.stopPropagation()}
      >
        {selectedTags.length === 0 ? (
          <span className="text-content/40">Filter by tag...</span>
        ) : (
          <span className="flex items-center gap-1">
            {selectedTags.slice(0, 2).map((tag) => (
              <span
                key={tag.id}
                className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium"
                style={{ backgroundColor: getColorBg(tag.color), color: getColorText(tag.color) }}
              >
                {tag.label}
              </span>
            ))}
            {selectedTags.length > 2 && (
              <span className="text-xs text-content/50">+{selectedTags.length - 2}</span>
            )}
          </span>
        )}
        <ChevronDown className="w-3.5 h-3.5 text-content/40" />
      </button>

      {open && (
        <div className="absolute top-full mt-1 left-0 z-50 w-52 rounded-lg border border-content/20 bg-surface shadow-lg py-1">
          {tags.length === 0 ? (
            <div className="px-3 py-2 text-sm text-content/40">No tags available</div>
          ) : (
            <>
              {tags.map((tag) => {
                const checked = selectedIds.includes(tag.id);
                return (
                  <div
                    key={tag.id}
                    role="menuitemcheckbox"
                    aria-checked={checked}
                    className="px-3 py-1.5 flex items-center gap-2 cursor-default hover:bg-content/5 transition-colors"
                    onClick={() => toggleTag(tag.id)}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleTag(tag.id)}
                      className="rounded border-content/30 accent-accent"
                    />
                    <span
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: getColorBg(tag.color) }}
                    />
                    <span className="text-sm text-content truncate">{tag.label}</span>
                  </div>
                );
              })}
              {selectedIds.length > 0 && (
                <div className="border-t border-content/10 mt-1 pt-1">
                  <div
                    className="px-3 py-1.5 flex items-center gap-2 cursor-default hover:bg-content/5 transition-colors text-sm text-content/50"
                    onClick={clearAll}
                  >
                    <X className="w-3.5 h-3.5" />
                    Clear filter
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
