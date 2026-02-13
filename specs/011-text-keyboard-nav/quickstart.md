# Quickstart: Text Keyboard Navigation

**Feature**: 011-text-keyboard-nav
**Quick reference for implementation patterns**

## 1. useWordNavigation Hook

Core state management for word tracking + context menu.

```typescript
// src/hooks/useWordNavigation.ts
import { useState, useCallback } from "react";

interface UseWordNavigationProps {
  wordCount: number;
}

interface UseWordNavigationReturn {
  trackedIndex: number;
  isFocused: boolean;
  menuOpen: boolean;
  menuFocusedIndex: number;
  handleFocus: () => void;
  handleBlur: () => void;
  handleWordHover: (index: number) => void;
  handleKeyDown: (e: React.KeyboardEvent) => void;
  openMenuForWord: (index: number) => void;
  closeMenu: () => void;
}

const MENU_ENTRY_COUNT = 2;

export function useWordNavigation({ wordCount }: UseWordNavigationProps): UseWordNavigationReturn {
  const [trackedIndex, setTrackedIndex] = useState(0);
  const [isFocused, setIsFocused] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuFocusedIndex, setMenuFocusedIndex] = useState(0);

  const openMenuForWord = useCallback((index: number) => {
    setTrackedIndex(index);
    setMenuOpen(true);
    setMenuFocusedIndex(0);
  }, []);

  const closeMenu = useCallback(() => {
    setMenuOpen(false);
    setMenuFocusedIndex(0);
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === " ") {
      e.preventDefault(); // FR-009: Space does nothing
      return;
    }

    if (menuOpen) {
      // Menu-mode keyboard handling
      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setMenuFocusedIndex(i => (i + 1) % MENU_ENTRY_COUNT); // FR-013: wrapping
          break;
        case "ArrowUp":
          e.preventDefault();
          setMenuFocusedIndex(i => (i - 1 + MENU_ENTRY_COUNT) % MENU_ENTRY_COUNT);
          break;
        case "ArrowLeft":
          e.preventDefault();
          closeMenu(); // FR-017: close menu
          setTrackedIndex(i => Math.max(0, i - 1)); // resume navigation
          break;
        case "ArrowRight":
          e.preventDefault();
          closeMenu();
          setTrackedIndex(i => Math.min(wordCount - 1, i + 1));
          break;
        case "Enter":
          e.preventDefault(); // FR-012a: Enter does nothing on menu entries
          break;
        case "Escape":
          // FR-016: Escape does nothing
          break;
      }
      return;
    }

    // Word-navigation-mode keyboard handling
    switch (e.key) {
      case "ArrowRight":
        e.preventDefault();
        setTrackedIndex(i => Math.min(wordCount - 1, i + 1)); // FR-004, FR-006
        break;
      case "ArrowLeft":
        e.preventDefault();
        setTrackedIndex(i => Math.max(0, i - 1)); // FR-005, FR-006
        break;
      case "Enter":
        e.preventDefault();
        openMenuForWord(trackedIndex); // FR-010
        break;
    }
  }, [menuOpen, wordCount, trackedIndex, openMenuForWord, closeMenu]);

  const handleFocus = useCallback(() => {
    setIsFocused(true); // FR-003: highlight first word on focus
  }, []);

  const handleBlur = useCallback(() => {
    setIsFocused(false);
    closeMenu(); // Edge case: menu closes on focus loss
  }, [closeMenu]);

  const handleWordHover = useCallback((index: number) => {
    setTrackedIndex(index); // FR-007: mouse permanently sets tracked position
  }, []);

  return {
    trackedIndex, isFocused, menuOpen, menuFocusedIndex,
    handleFocus, handleBlur, handleWordHover, handleKeyDown,
    openMenuForWord, closeMenu,
  };
}
```

## 2. RubyWord with Controlled Highlight

```typescript
// Key changes to src/components/RubyWord.tsx
interface RubyWordProps {
  word: Word;
  showPinyin?: boolean;
  isHighlighted?: boolean;     // undefined = normal mode (CSS hover)
  onMouseEnter?: () => void;   // FR-007: mouse hover updates tracked position
  onContextMenu?: (e: React.MouseEvent) => void; // FR-011: right-click menu
}

export function RubyWord({ word, showPinyin = true, isHighlighted, onMouseEnter, onContextMenu }: RubyWordProps) {
  const inFocusMode = isHighlighted !== undefined;
  const highlightClass = inFocusMode
    ? (isHighlighted ? "bg-accent/24" : "")           // Controlled: only highlighted word
    : "hover:bg-accent/24";                             // Normal: CSS hover

  return (
    <ruby
      className={`font-hanzi rounded pt-6 pb-1.5 transition-colors duration-200 ease-in-out ${highlightClass}`}
      onMouseEnter={onMouseEnter}
      onContextMenu={onContextMenu}
    >
      {/* ... existing ruby content ... */}
    </ruby>
  );
}
```

## 3. WordContextMenu Component

```typescript
// src/components/WordContextMenu.tsx — follows PaletteSelector pattern
// Key patterns:
// - Click-outside: document.addEventListener("mousedown", handler)
// - Tab-away: onBlur with relatedTarget check
// - Positioned absolutely near the word element's bounding rect
// - role="menu" with role="menuitem" entries
// - focusedIndex wraps via modulo arithmetic
```

## 4. App.tsx DOM Reorder for Tab Order

```typescript
// Before (current):
return (
  <>
    <TitleBar ... />
    <div className="bg-surface text-content min-h-screen px-6 pt-24 pb-12">
      <TextDisplay ... />
    </div>
  </>
);

// After (FR-002: Text first in tab order):
return (
  <>
    <div className="bg-surface text-content min-h-screen px-6 pt-24 pb-12">
      <TextDisplay ... />  {/* First in DOM = first in tab order */}
    </div>
    <TitleBar ... />        {/* Fixed position — visual order unchanged */}
  </>
);
```

## 5. TextDisplay Focusable Container

```typescript
// Key changes to src/components/TextDisplay.tsx
// - Add tabIndex={0} to container div
// - Add onKeyDown, onFocus, onBlur handlers
// - Pass isHighlighted + onMouseEnter + onContextMenu to each RubyWord
// - Render WordContextMenu when menuOpen, positioned at tracked word
// - Use ref on container for click-outside detection
// - Use refs array or data attributes on word elements for menu positioning
```

## FR-to-File Mapping

| FR | File | Pattern |
|----|------|---------|
| FR-001, FR-003 | TextDisplay.tsx | `tabIndex={0}`, `onFocus` → highlight first word |
| FR-002 | App.tsx | DOM reorder (TextDisplay before TitleBar) |
| FR-004–006 | useWordNavigation.ts | ArrowRight/Left with `Math.min`/`Math.max` clamping |
| FR-007–008 | useWordNavigation.ts + RubyWord.tsx | `onMouseEnter` → `setTrackedIndex`, no revert on leave |
| FR-009 | useWordNavigation.ts | `e.preventDefault()` on Space |
| FR-010–011 | useWordNavigation.ts + TextDisplay.tsx | Enter → `openMenuForWord`, onContextMenu → `openMenuForWord` |
| FR-012, FR-012a | WordContextMenu.tsx | 2 entries, Enter = no-op |
| FR-013 | useWordNavigation.ts | ArrowUp/Down with modulo wrapping |
| FR-014–015 | WordContextMenu.tsx + TextDisplay.tsx | onBlur + mousedown outside → `closeMenu` |
| FR-016 | useWordNavigation.ts | Escape case is empty (no-op) |
| FR-017 | useWordNavigation.ts | ArrowLeft/Right in menu mode → `closeMenu` + navigate |
| FR-018 | TextDisplay.tsx | onContextMenu on any word → `openMenuForWord(wordIndex)` |
