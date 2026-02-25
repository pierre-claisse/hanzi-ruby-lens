import { Info } from "lucide-react";
import { TAG_COLORS } from "../data/tagColors";
import type { TextPreview } from "../types/domain";
import { formatDateTime } from "../utils/formatDateTime";

interface TextPreviewCardProps {
  preview: TextPreview;
  selected?: boolean;
  onClick: (e: React.MouseEvent) => void;
  onContextMenu: (e: React.MouseEvent) => void;
}

const MAX_VISIBLE_TAGS = 3;

export function TextPreviewCard({ preview, selected, onClick, onContextMenu }: TextPreviewCardProps) {
  const visibleTags = preview.tags.slice(0, MAX_VISIBLE_TAGS);
  const overflowCount = preview.tags.length - MAX_VISIBLE_TAGS;

  return (
    <button
      type="button"
      className={`flex flex-col justify-start text-left p-4 rounded-lg border bg-surface hover:bg-content/5 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 ${
        selected ? "border-accent ring-2 ring-accent" : "border-content/10"
      }`}
      onClick={onClick}
      onContextMenu={onContextMenu}
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-content font-medium text-xl truncate">{preview.title}</h3>
        <div className="relative group flex-shrink-0">
          <Info className="w-4 h-4 text-content/30 group-hover:text-content/60 transition-colors mt-1" aria-label="Details" />
          <div className="absolute right-0 top-full mt-1 z-10 invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-opacity bg-surface border border-content/10 rounded-md shadow-lg px-3 py-2 text-sm text-content/70 whitespace-nowrap">
            <div>Created: {formatDateTime(preview.createdAt)}</div>
            {preview.modifiedAt && (
              <div>Modified: {formatDateTime(preview.modifiedAt)}</div>
            )}
          </div>
        </div>
      </div>
      {preview.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {visibleTags.map((tag) => {
            const color = TAG_COLORS.find((c) => c.key === tag.color);
            return (
              <span
                key={tag.id}
                className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium"
                style={{
                  backgroundColor: color?.bg ?? "#64748B",
                  color: color?.text ?? "#FFFFFF",
                }}
              >
                {tag.label}
              </span>
            );
          })}
          {overflowCount > 0 && (
            <span className="text-xs text-content/40 self-center">+{overflowCount}</span>
          )}
        </div>
      )}
    </button>
  );
}
