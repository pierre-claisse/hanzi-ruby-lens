import { useMemo, useRef, useEffect, useCallback } from "react";
import type { Text } from "../types/domain";
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

  // Click-outside handler for context menu
  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        closeMenu();
      }
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
      {text.segments.map((segment, index) => {
        if (segment.type === "word") {
          const wIndex = wordIndexMap.get(index)!;
          return (
            <RubyWord
              key={index}
              word={segment.word}
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
        return <span key={index}>{segment.text}</span>;
      })}
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
