import { useMemo, useRef, useEffect, useCallback, useState } from "react";
import type { Text, TextSegment } from "../types/domain";
import { openUrl } from "@tauri-apps/plugin-opener";
import { writeText } from "@tauri-apps/plugin-clipboard-manager";
import { BookSearch, Languages, Copy, MessageSquare, Pencil, Scissors, Combine, Lock } from "lucide-react";
import { RubyWord } from "./RubyWord";
import { WordContextMenu } from "./WordContextMenu";
import type { MenuAction, MenuEntry } from "./WordContextMenu";
import { useWordNavigation } from "../hooks/useWordNavigation";
import { diacriticalToNumbered, numberedToDiacritical } from "../utils/pinyinConversion";
import { computeMenuPosition } from "../utils/menuPositioning";

interface TextDisplayProps {
  text: Text;
  showPinyin?: boolean;
  zoomLevel?: number;
  onPinyinEdit?: (segmentIndex: number, newPinyin: string) => void;
  onShowPinyin?: () => void;
  onSplitSegment?: (segmentIndex: number, splitAfterCharIndex: number) => void;
  onMergeSegments?: (segmentIndex: number) => void;
  onComment?: (segmentIndex: number) => void;
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

/** Build the dynamic menu entries for a word at the given segment index. */
function buildMenuEntries(segIndex: number, segments: TextSegment[], locked: boolean): MenuEntry[] {
  const entries: MenuEntry[] = [
    { label: "MOE Dictionary", icon: BookSearch, action: { type: "dictionary" } },
    { label: "Google Translate", icon: Languages, action: { type: "translate" } },
    { label: "Copy", icon: Copy, action: { type: "copy" } },
    { label: "Comment", icon: locked ? Lock : MessageSquare, action: { type: "comment" }, disabled: locked },
    { label: "Edit Pinyin", icon: locked ? Lock : Pencil, action: { type: "editPinyin" }, disabled: locked },
  ];

  const seg = segments[segIndex];
  if (seg.type !== "word") return entries;

  const charCount = [...seg.word.characters].length;
  const hasComment = !!seg.word.comment;

  // Split options: one per internal character boundary (only for multi-char words)
  if (charCount >= 2) {
    const chars = [...seg.word.characters];
    for (let i = 0; i < charCount - 1; i++) {
      entries.push({
        label: `Split after ${chars[i]}`,
        icon: locked || hasComment ? Lock : Scissors,
        action: { type: "split", splitAfterIndex: i },
        disabled: locked || hasComment,
      });
    }
  }

  // Merge with previous: only if the previous segment is a Word
  if (segIndex > 0) {
    const prev = segments[segIndex - 1];
    if (prev.type === "word") {
      const combinedLen = [...prev.word.characters].length + charCount;
      const prevHasComment = !!prev.word.comment;
      if (combinedLen <= 12) {
        entries.push({
          label: "Merge with previous word",
          icon: locked || hasComment || prevHasComment ? Lock : Combine,
          action: { type: "mergeWithPrevious" },
          disabled: locked || hasComment || prevHasComment,
        });
      }
    }
  }

  // Merge with next: only if the next segment is a Word
  if (segIndex < segments.length - 1) {
    const next = segments[segIndex + 1];
    if (next.type === "word") {
      const combinedLen = charCount + [...next.word.characters].length;
      const nextHasComment = !!next.word.comment;
      if (combinedLen <= 12) {
        entries.push({
          label: "Merge with next word",
          icon: locked || hasComment || nextHasComment ? Lock : Combine,
          action: { type: "mergeWithNext" },
          disabled: locked || hasComment || nextHasComment,
        });
      }
    }
  }

  return entries;
}

export function TextDisplay({ text, showPinyin = true, zoomLevel = 100, onPinyinEdit, onShowPinyin, onSplitSegment, onMergeSegments, onComment }: TextDisplayProps) {
  const fontSize = `${1.5 * zoomLevel / 100}rem`;
  const containerRef = useRef<HTMLDivElement>(null);
  const wordRefs = useRef<Map<number, HTMLElement>>(new Map());
  const trackedIndexRef = useRef(0);
  const [editingWordIndex, setEditingWordIndex] = useState<number | null>(null);
  const [editValue, setEditValue] = useState("");

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

  // Reverse map: word index → segment index
  const wordToSegmentIndex = useMemo(() => {
    const map = new Map<number, number>();
    for (const [segIndex, wIndex] of wordIndexMap) {
      map.set(wIndex, segIndex);
    }
    return map;
  }, [wordIndexMap]);

  const handleMenuAction = useCallback((action: MenuAction) => {
    const currentTrackedIndex = trackedIndexRef.current;
    const segIndex = wordToSegmentIndex.get(currentTrackedIndex);
    if (segIndex === undefined) return;
    const segment = text.segments[segIndex];
    if (segment.type !== "word") return;

    switch (action.type) {
      case "dictionary": {
        const url = `https://dict.revised.moe.edu.tw/search.jsp?md=1&word=${encodeURIComponent(segment.word.characters)}&qMd=0&qCol=1&sound=1#radio_sound_1`;
        openUrl(url);
        break;
      }
      case "translate": {
        const url = `https://translate.google.com/?sl=zh-TW&tl=en&text=${encodeURIComponent(segment.word.characters)}`;
        openUrl(url);
        break;
      }
      case "editPinyin":
        if (!showPinyin) onShowPinyin?.();
        setEditingWordIndex(currentTrackedIndex);
        setEditValue(diacriticalToNumbered(segment.word.pinyin));
        break;
      case "copy":
        writeText(segment.word.characters);
        break;
      case "comment":
        onComment?.(segIndex);
        break;
      case "split":
        onSplitSegment?.(segIndex, action.splitAfterIndex);
        break;
      case "mergeWithPrevious":
        onMergeSegments?.(segIndex - 1);
        break;
      case "mergeWithNext":
        onMergeSegments?.(segIndex);
        break;
    }
  }, [wordToSegmentIndex, text.segments, showPinyin, onShowPinyin, onSplitSegment, onMergeSegments, onComment]);

  // Bridge: hook dispatches by entry index → we resolve to MenuAction via ref
  const menuEntriesRef = useRef<MenuEntry[]>([]);

  const handleMenuActionByIndex = useCallback((entryIndex: number) => {
    const entry = menuEntriesRef.current[entryIndex];
    if (entry && !entry.disabled) handleMenuAction(entry.action);
  }, [handleMenuAction]);

  const {
    trackedIndex, isFocused, menuOpen, menuFocusedIndex,
    handleFocus, handleBlur, handleWordHover, handleKeyDown,
    openMenuForWord, closeMenu, handleMenuEntryHover,
  } = useWordNavigation({ wordCount, menuEntryCount: menuEntriesRef.current.length || 4, onMenuAction: handleMenuActionByIndex });

  // Keep ref in sync with hook state
  trackedIndexRef.current = trackedIndex;

  // Build menu entries for the currently tracked word (depends on trackedIndex from hook)
  const currentMenuEntries = useMemo(() => {
    const segIndex = wordToSegmentIndex.get(trackedIndex);
    if (segIndex === undefined) return [];
    return buildMenuEntries(segIndex, text.segments, text.locked);
  }, [wordToSegmentIndex, text.segments, text.locked, trackedIndex]);

  // Sync ref so hook reads latest entries on next keypress
  menuEntriesRef.current = currentMenuEntries;

  // Scroll tracked word into view when focused (accounts for fixed title bar).
  // Uses requestAnimationFrame to run after the browser's native focus scroll.
  useEffect(() => {
    if (!isFocused) return;
    const id = requestAnimationFrame(() => {
      const wordEl = wordRefs.current.get(trackedIndex);
      if (!wordEl) return;
      const rect = wordEl.getBoundingClientRect();
      const top = 64; // title bar (48px) + padding (16px)
      const bottom = window.innerHeight - 16;
      if (rect.top < top) {
        window.scrollBy({ top: rect.top - top, behavior: "instant" });
      } else if (rect.bottom > bottom) {
        window.scrollBy({ top: rect.bottom - bottom, behavior: "instant" });
      }
    });
    return () => cancelAnimationFrame(id);
  }, [trackedIndex, isFocused]);

  // Wrapper for mouse clicks: action + close menu (keyboard Enter already closes via hook)
  const handleMenuClick = useCallback((action: MenuAction) => {
    handleMenuAction(action);
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

  // Compute menu position via pure function (quadrant-aware: both axes).
  // Shared by both right-click and keyboard-triggered menu opening.
  const getMenuPosition = useCallback(() => {
    const wordEl = wordRefs.current.get(trackedIndex);
    const containerEl = containerRef.current;
    if (!wordEl || !containerEl) return { top: 0, left: 0, direction: "below" as const };

    return computeMenuPosition(
      wordEl.getBoundingClientRect(),
      containerEl.getBoundingClientRect(),
      currentMenuEntries.length,
      window.innerWidth,
      window.innerHeight,
    );
  }, [trackedIndex, currentMenuEntries.length]);

  // Tab-away detection: if focus moves outside container, close menu
  const handleContainerBlur = useCallback((e: React.FocusEvent) => {
    if (containerRef.current && !containerRef.current.contains(e.relatedTarget as Node)) {
      handleBlur();
    }
  }, [handleBlur]);

  const handleEditConfirm = useCallback(() => {
    if (editingWordIndex === null) return;
    const trimmed = editValue.trim();
    if (!trimmed) return; // FR-007: reject empty
    const segIndex = wordToSegmentIndex.get(editingWordIndex);
    if (segIndex !== undefined) {
      onPinyinEdit?.(segIndex, numberedToDiacritical(trimmed));
    }
    setEditingWordIndex(null);
    setEditValue("");
    containerRef.current?.focus(); // FR-009: return focus
  }, [editingWordIndex, editValue, wordToSegmentIndex, onPinyinEdit]);

  const handleEditCancel = useCallback(() => {
    setEditingWordIndex(null);
    setEditValue("");
    containerRef.current?.focus(); // FR-009: return focus
  }, []);

  const handleContextMenu = useCallback((e: React.MouseEvent, wordIndex: number) => {
    e.preventDefault();
    openMenuForWord(wordIndex);
  }, [openMenuForWord]);

  if (text.segments.length === 0) {
    return (
      <div className="leading-[2.5] select-none cursor-default" style={{ fontSize }}>
        <p className="text-center text-content/50 py-16">No text to display.</p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="leading-[2.5] select-none cursor-default outline-none relative"
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
              const isEditingThis = editingWordIndex === wIndex;
              return (
                <RubyWord
                  key={item.segmentIndex}
                  word={seg.word}
                  showPinyin={showPinyin}
                  isHighlighted={isFocused ? wIndex === trackedIndex : undefined}
                  isEditing={isEditingThis}
                  editValue={isEditingThis ? editValue : undefined}
                  onEditChange={isEditingThis ? setEditValue : undefined}
                  onEditConfirm={isEditingThis ? handleEditConfirm : undefined}
                  onEditCancel={isEditingThis ? handleEditCancel : undefined}
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
      {menuOpen && isFocused && (() => {
        const menuPos = getMenuPosition();
        return (
          <WordContextMenu
            entries={currentMenuEntries}
            focusedIndex={menuFocusedIndex}
            position={menuPos}
            direction={menuPos.direction}
            onEntryHover={handleMenuEntryHover}
            onAction={handleMenuClick}
          />
        );
      })()}
    </div>
  );
}
