import { useState, useCallback } from "react";

interface UseWordNavigationProps {
  wordCount: number;
  onMenuAction?: (index: number) => void;
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
  handleMenuEntryHover: (index: number) => void;
}

const MENU_ENTRY_COUNT = 3;

export function useWordNavigation({ wordCount, onMenuAction }: UseWordNavigationProps): UseWordNavigationReturn {
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
      e.preventDefault();
      return;
    }

    if (menuOpen) {
      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setMenuFocusedIndex(i => (i + 1) % MENU_ENTRY_COUNT);
          break;
        case "ArrowUp":
          e.preventDefault();
          setMenuFocusedIndex(i => (i - 1 + MENU_ENTRY_COUNT) % MENU_ENTRY_COUNT);
          break;
        case "ArrowLeft":
          e.preventDefault();
          closeMenu();
          setTrackedIndex(i => Math.max(0, i - 1));
          break;
        case "ArrowRight":
          e.preventDefault();
          closeMenu();
          setTrackedIndex(i => Math.min(wordCount - 1, i + 1));
          break;
        case "Enter":
          e.preventDefault();
          onMenuAction?.(menuFocusedIndex);
          closeMenu();
          break;
        case "Escape":
          // FR-016: Escape does nothing
          break;
      }
      return;
    }

    switch (e.key) {
      case "ArrowRight":
        e.preventDefault();
        setTrackedIndex(i => Math.min(wordCount - 1, i + 1));
        break;
      case "ArrowLeft":
        e.preventDefault();
        setTrackedIndex(i => Math.max(0, i - 1));
        break;
      case "Enter":
        e.preventDefault();
        setMenuOpen(true);
        setMenuFocusedIndex(0);
        break;
    }
  }, [menuOpen, wordCount, menuFocusedIndex, closeMenu, onMenuAction]);

  const handleFocus = useCallback(() => {
    setIsFocused(true);
  }, []);

  const handleBlur = useCallback(() => {
    setIsFocused(false);
    closeMenu();
  }, [closeMenu]);

  const handleMenuEntryHover = useCallback((index: number) => {
    setMenuFocusedIndex(index);
  }, []);

  const handleWordHover = useCallback((index: number) => {
    if (menuOpen) return;
    setTrackedIndex(index);
  }, [menuOpen]);

  return {
    trackedIndex, isFocused, menuOpen, menuFocusedIndex,
    handleFocus, handleBlur, handleWordHover, handleKeyDown,
    openMenuForWord, closeMenu, handleMenuEntryHover,
  };
}
