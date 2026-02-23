import type { TextPreview } from "../types/domain";

interface TextPreviewCardProps {
  preview: TextPreview;
  onClick: () => void;
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

export function TextPreviewCard({ preview, onClick, onContextMenu }: TextPreviewCardProps) {
  return (
    <button
      type="button"
      className="text-left p-4 rounded-lg border border-content/10 bg-surface hover:bg-content/5 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2"
      onClick={onClick}
      onContextMenu={onContextMenu}
    >
      <h3 className="text-content font-medium text-xl truncate">{preview.title}</h3>
      <p className="text-content/40 text-sm mt-1">{formatDate(preview.createdAt)}</p>
    </button>
  );
}
