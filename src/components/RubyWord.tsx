import { forwardRef } from "react";
import type { Word } from "../types/domain";

interface RubyWordProps {
  word: Word;
  showPinyin?: boolean;
  isHighlighted?: boolean;
  onMouseEnter?: () => void;
  onContextMenu?: (e: React.MouseEvent) => void;
}

export const RubyWord = forwardRef<HTMLElement, RubyWordProps>(
  function RubyWord({ word, showPinyin = true, isHighlighted, onMouseEnter, onContextMenu }, ref) {
    const inFocusMode = isHighlighted !== undefined;
    const highlightClass = inFocusMode
      ? (isHighlighted ? "bg-accent/24" : "")
      : "hover:bg-accent/24";

    return (
      <ruby
        ref={ref}
        className={`font-hanzi rounded pt-6 pb-1.5 transition-colors duration-200 ease-in-out ${highlightClass} focus-visible:ring-2 focus-visible:ring-accent`}
        onMouseEnter={onMouseEnter}
        onContextMenu={onContextMenu}
      >
        {word.characters}
        <rp>(</rp>
        <rt className={`text-accent transition-opacity duration-200 ease-in-out ${showPinyin ? 'opacity-100' : 'opacity-0'}`}>
          {word.pinyin}
        </rt>
        <rp>)</rp>
      </ruby>
    );
  }
);
