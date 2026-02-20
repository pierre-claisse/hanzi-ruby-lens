import { useRef, useEffect } from "react";
import type { Ref } from "react";
import type { Word } from "../types/domain";

interface RubyWordProps {
  word: Word;
  ref?: Ref<HTMLElement>;
  showPinyin?: boolean;
  isHighlighted?: boolean;
  isEditing?: boolean;
  editValue?: string;
  onEditChange?: (value: string) => void;
  onEditConfirm?: () => void;
  onEditCancel?: () => void;
  onMouseEnter?: () => void;
  onContextMenu?: (e: React.MouseEvent) => void;
}

export function RubyWord({ word, ref, showPinyin = true, isHighlighted, isEditing, editValue, onEditChange, onEditConfirm, onEditCancel, onMouseEnter, onContextMenu }: RubyWordProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const inFocusMode = isHighlighted !== undefined;
  const highlightClass = inFocusMode
    ? (isHighlighted ? "bg-accent/24" : "")
    : "hover:bg-accent/24";

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    e.stopPropagation();
    if (e.key === "Enter") {
      e.preventDefault();
      onEditConfirm?.();
    } else if (e.key === "Escape") {
      e.preventDefault();
      onEditCancel?.();
    }
  };

  return (
    <ruby
      ref={ref}
      className={`font-hanzi rounded pt-6 pb-1.5 transition-colors duration-200 ease-in-out ${highlightClass} focus-visible:ring-2 focus-visible:ring-accent`}
      onMouseEnter={onMouseEnter}
      onContextMenu={onContextMenu}
    >
      <span>{word.characters}</span>
      <rp>(</rp>
      <rt className={`text-accent transition-opacity duration-200 ease-in-out ${showPinyin || isEditing ? 'opacity-100' : 'opacity-0'}`}>
        {isEditing ? (
          <input
            ref={inputRef}
            type="text"
            value={editValue ?? ""}
            onChange={(e) => onEditChange?.(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={() => onEditCancel?.()}
            className="bg-surface border border-accent/50 rounded px-1 text-accent text-center outline-none"
            style={{ fontSize: "inherit", width: `${Math.max((editValue?.length || 1) + 1, 3)}ch` }}
          />
        ) : (
          word.pinyin
        )}
      </rt>
      <rp>)</rp>
    </ruby>
  );
}
