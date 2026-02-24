import { TAG_COLORS } from "../data/tagColors";
import type { TextPreview } from "../types/domain";

interface TextPreviewCardProps {
  preview: TextPreview;
  selected?: boolean;
  onClick: (e: React.MouseEvent) => void;
  onContextMenu: (e: React.MouseEvent) => void;
}

function formatDate(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

const MAX_VISIBLE_TAGS = 3;

export function TextPreviewCard({ preview, selected, onClick, onContextMenu }: TextPreviewCardProps) {
  const visibleTags = preview.tags.slice(0, MAX_VISIBLE_TAGS);
  const overflowCount = preview.tags.length - MAX_VISIBLE_TAGS;

  return (
    <button
      type="button"
      className={`text-left p-4 rounded-lg border bg-surface hover:bg-content/5 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 ${
        selected ? "border-accent ring-2 ring-accent" : "border-content/10"
      }`}
      onClick={onClick}
      onContextMenu={onContextMenu}
    >
      <h3 className="text-content font-medium text-xl truncate">{preview.title}</h3>
      <p className="text-content/40 text-sm mt-1">{formatDate(preview.createdAt)}</p>
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
