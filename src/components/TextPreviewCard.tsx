import { TAG_COLORS } from "../data/tagColors";
import type { TextPreview } from "../types/domain";

interface TextPreviewCardProps {
  preview: TextPreview;
  selected?: boolean;
  unreadCount?: number;
  onClick: (e: React.MouseEvent) => void;
  onContextMenu: (e: React.MouseEvent) => void;
}

const MAX_VISIBLE_TAGS = 3;

export function TextPreviewCard({ preview, selected, unreadCount = 0, onClick, onContextMenu }: TextPreviewCardProps) {
  const visibleTags = preview.tags.slice(0, MAX_VISIBLE_TAGS);
  const overflowCount = preview.tags.length - MAX_VISIBLE_TAGS;

  return (
    <button
      type="button"
      className={`flex flex-col justify-start text-left p-4 rounded-lg border transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 ${
        preview.locked ? "bg-content/5" : "bg-surface"
      } hover:bg-content/5 ${
        selected ? "border-accent ring-2 ring-accent" : "border-content/10"
      }`}
      onClick={onClick}
      onContextMenu={onContextMenu}
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-content font-medium text-xl truncate">{preview.title}</h3>
        {unreadCount > 0 && (
          <span
            aria-label={`${unreadCount} unread comment${unreadCount > 1 ? "s" : ""}`}
            className="flex-shrink-0 inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1.5 rounded-full bg-accent text-white text-xs font-semibold"
          >
            {unreadCount}
          </span>
        )}
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
