import { PanelRightClose, PanelRightOpen, MessageSquare } from "lucide-react";
import type { TextSegment } from "../types/domain";

interface CommentsPanelProps {
  segments: TextSegment[];
  isOpen: boolean;
  onToggle: () => void;
  onCommentClick: (segmentIndex: number) => void;
  locked: boolean;
}

export function CommentsPanel({ segments, isOpen, onToggle, onCommentClick, locked }: CommentsPanelProps) {
  const comments = segments
    .map((seg, index) => ({ seg, index }))
    .filter((item) => item.seg.type === "word" && !!item.seg.word.comment);

  return (
    <div className="flex-shrink-0 relative">
      {/* Toggle button — absolutely positioned so it doesn't affect text layout */}
      <button
        type="button"
        className="absolute -left-10 top-16 z-10 flex items-center justify-center w-8 h-8 rounded-lg text-content/40 hover:text-content hover:bg-content/5 transition-colors"
        onClick={onToggle}
        aria-label={isOpen ? "Close comments panel" : "Open comments panel"}
        title={isOpen ? "Close comments panel" : "Open comments panel"}
      >
        {isOpen ? <PanelRightClose className="w-4 h-4" /> : <PanelRightOpen className="w-4 h-4" />}
      </button>

      {/* Panel wrapper — border stretches full height, width transitions */}
      <div className={`transition-[width,border-color] duration-200 ease-in-out overflow-hidden border-l ${isOpen ? "w-72 border-content/10" : "w-0 border-transparent"}`}>
        <div className="w-72 px-4 pt-16 pb-4 h-screen overflow-y-auto">
          <h3 className="text-sm font-semibold text-content/60 mb-3 h-8 flex items-center gap-1.5">
            <MessageSquare className="w-4 h-4" />
            Comments ({comments.length})
          </h3>

          {comments.length === 0 ? (
            <p className="text-sm text-content/30 text-center py-8">No comments</p>
          ) : (
            <div className="space-y-2">
              {comments.map(({ seg, index }) => {
                if (seg.type !== "word") return null;
                return (
                  <button
                    key={index}
                    type="button"
                    className={`w-full text-left p-2.5 rounded-lg border border-content/10 transition-colors ${
                      locked
                        ? "cursor-default"
                        : "hover:border-accent/30 hover:bg-accent/5 cursor-pointer"
                    }`}
                    onClick={locked ? undefined : () => onCommentClick(index)}
                  >
                    <span className="text-accent font-medium text-sm">{seg.word.characters}</span>
                    <p className="text-xs text-content/70 mt-1 line-clamp-3">{seg.word.comment}</p>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
