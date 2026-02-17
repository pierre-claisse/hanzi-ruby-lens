import { useMemo, useRef, useEffect, useCallback } from "react";
import type { Text, TextSegment } from "../types/domain";
import { openUrl } from "@tauri-apps/plugin-opener";
import { writeText } from "@tauri-apps/plugin-clipboard-manager";
import { RubyWord } from "./RubyWord";
import { WordContextMenu } from "./WordContextMenu";
import { useWordNavigation } from "../hooks/useWordNavigation";

interface TextDisplayProps {
  text: Text;
  showPinyin?: boolean;
  zoomLevel?: number;
}

type BlockItem =
  | { kind: "word"; segmentIndex: number }
  | { kind: "text"; text: string };

interface Block {
  items: BlockItem[];
  isHeading: boolean;
}

function blockCharCount(items: BlockItem[], segments: TextSegment[]): number {
  return items.reduce((sum, item) => {
    if (item.kind === "word") {
      const seg = segments[item.segmentIndex];
      return sum + (seg.type === "word" ? seg.word.characters.length : 0);
    }
    return sum + item.text.length;
  }, 0);
}

function buildBlocks(segments: TextSegment[]): Block[] {
  const blocks: Block[] = [];
  let current: BlockItem[] = [];

  const flush = () => {
    if (current.length > 0) {
      blocks.push({ items: current, isHeading: blockCharCount(current, segments) <= 15 });
      current = [];
    }
  };

  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];
    if (seg.type === "plain" && seg.text.includes("\n\n")) {
      const parts = seg.text.split(/\n\n+/);
      if (parts[0].trim()) {
        current.push({ kind: "text", text: parts[0].trim() });
      }
      flush();
      for (let j = 1; j < parts.length - 1; j++) {
        if (parts[j].trim()) {
          current.push({ kind: "text", text: parts[j].trim() });
          flush();
        }
      }
      if (parts.length > 1 && parts[parts.length - 1].trim()) {
        current.push({ kind: "text", text: parts[parts.length - 1].trim() });
      }
    } else if (seg.type === "word") {
      current.push({ kind: "word", segmentIndex: i });
    } else {
      current.push({ kind: "text", text: seg.text });
    }
  }

  flush();
  return blocks;
}

export function TextDisplay({ text, showPinyin = true, zoomLevel = 100 }: TextDisplayProps) {
  const fontSize = `${1.5 * zoomLevel / 100}rem`;
  const containerRef = useRef<HTMLDivElement>(null);
  const wordRefs = useRef<Map<number, HTMLElement>>(new Map());
  const trackedIndexRef = useRef(0);

  // Build a mapping from segment index to word-only index
  const wordIndexMap = useMemo(() => {
    const map = new Map<number, number>();
    let wordIndex = 0;
    for (let i = 0; i < text.segments.length; i++) {
      if (text.segments[i].type === "word") {
        map.set(i, wordIndex);
        wordIndex++;
      }
    }
    return map;
  }, [text.segments]);

  const wordCount = wordIndexMap.size;

  // Split segments into paragraph blocks; detect headings by character count
  const blocks = useMemo(() => buildBlocks(text.segments), [text.segments]);

  const handleMenuAction = useCallback((entryIndex: number) => {
    const currentTrackedIndex = trackedIndexRef.current;
    let characters = "";
    for (const [segIndex, wIndex] of wordIndexMap) {
      if (wIndex === currentTrackedIndex) {
        const segment = text.segments[segIndex];
        if (segment.type === "word") characters = segment.word.characters;
        break;
      }
    }
    if (!characters) return;
    if (entryIndex === 0) {
      const url = `https://dict.revised.moe.edu.tw/search.jsp?md=1&word=${encodeURIComponent(characters)}&qMd=0&qCol=1&sound=1#radio_sound_1`;
      openUrl(url);
    } else if (entryIndex === 1) {
      const url = `https://translate.google.com/?sl=zh-TW&tl=en&text=${encodeURIComponent(characters)}`;
      openUrl(url);
    } else if (entryIndex === 2) {
      writeText(characters);
    }
  }, [wordIndexMap, text.segments]);

  const {
    trackedIndex, isFocused, menuOpen, menuFocusedIndex,
    handleFocus, handleBlur, handleWordHover, handleKeyDown,
    openMenuForWord, closeMenu, handleMenuEntryHover,
  } = useWordNavigation({ wordCount, onMenuAction: handleMenuAction });

  // Keep ref in sync with hook state
  trackedIndexRef.current = trackedIndex;

  // Wrapper for mouse clicks: action + close menu (keyboard Enter already closes via hook)
  const handleMenuClick = useCallback((entryIndex: number) => {
    handleMenuAction(entryIndex);
    closeMenu();
  }, [handleMenuAction, closeMenu]);

  // Click-outside handler: any mousedown not on the menu closes it
  // (WordContextMenu stops mouseDown propagation, so menu clicks don't reach here)
  useEffect(() => {
    if (!menuOpen) return;
    const handler = () => {
      closeMenu();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [menuOpen, closeMenu]);

  // Compute menu position from tracked word element
  const getMenuPosition = useCallback(() => {
    const wordEl = wordRefs.current.get(trackedIndex);
    const containerEl = containerRef.current;
    if (!wordEl || !containerEl) return { top: 0, left: 0 };

    const wordRect = wordEl.getBoundingClientRect();
    const containerRect = containerEl.getBoundingClientRect();

    return {
      top: wordRect.bottom - containerRect.top + 4,
      left: wordRect.left - containerRect.left,
    };
  }, [trackedIndex]);

  // Tab-away detection: if focus moves outside container, close menu
  const handleContainerBlur = useCallback((e: React.FocusEvent) => {
    if (containerRef.current && !containerRef.current.contains(e.relatedTarget as Node)) {
      handleBlur();
    }
  }, [handleBlur]);

  const handleContextMenu = useCallback((e: React.MouseEvent, wordIndex: number) => {
    e.preventDefault();
    openMenuForWord(wordIndex);
  }, [openMenuForWord]);

  if (text.segments.length === 0) {
    return (
      <div className="font-hanzi leading-[2.5] select-none cursor-default" style={{ fontSize }}>
        <p className="text-center text-content/50 py-16">No text to display.</p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="font-hanzi leading-[2.5] select-none cursor-default outline-none relative"
      style={{ fontSize }}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onFocus={handleFocus}
      onBlur={handleContainerBlur}
    >
      {blocks.map((block, blockIdx) => (
        <div
          key={blockIdx}
          className={
            block.isHeading
              ? "text-[1.4em] font-bold text-center mb-4"
              : "text-justify whitespace-pre-line mb-6"
          }
        >
          {block.items.map((item, itemIdx) => {
            if (item.kind === "word") {
              const seg = text.segments[item.segmentIndex];
              if (seg.type !== "word") return null;
              const wIndex = wordIndexMap.get(item.segmentIndex)!;
              return (
                <RubyWord
                  key={item.segmentIndex}
                  word={seg.word}
                  showPinyin={showPinyin}
                  isHighlighted={isFocused ? wIndex === trackedIndex : undefined}
                  onMouseEnter={() => handleWordHover(wIndex)}
                  onContextMenu={(e) => handleContextMenu(e, wIndex)}
                  ref={(el: HTMLElement | null) => {
                    if (el) wordRefs.current.set(wIndex, el);
                    else wordRefs.current.delete(wIndex);
                  }}
                />
              );
            }
            return <span key={`t-${blockIdx}-${itemIdx}`}>{item.text}</span>;
          })}
        </div>
      ))}
      {menuOpen && isFocused && (
        <WordContextMenu
          focusedIndex={menuFocusedIndex}
          position={getMenuPosition()}
          onEntryHover={handleMenuEntryHover}
          onAction={handleMenuClick}
        />
      )}
    </div>
  );
}
