import { useState, useRef, useEffect } from "react";
import { Palette } from "lucide-react";
import type { ColorPalette } from "../data/palettes";

interface PaletteSelectorProps {
  palettes: readonly ColorPalette[];
  selectedPaletteId: string;
  onSelect: (id: string) => void;
  theme: "light" | "dark";
}

export function PaletteSelector({ palettes, selectedPaletteId, onSelect, theme }: PaletteSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const selectedIndex = palettes.findIndex((p) => p.id === selectedPaletteId);

  // Click-outside handler (T023)
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [isOpen]);

  // Tab-away detection (T024)
  const handleBlur = (e: React.FocusEvent) => {
    if (containerRef.current && !containerRef.current.contains(e.relatedTarget as Node)) {
      setIsOpen(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === "Enter") {
        e.preventDefault();
        setIsOpen(true);
        setFocusedIndex(selectedIndex >= 0 ? selectedIndex : 0);
      }
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setFocusedIndex((i) => (i + 1) % palettes.length);
        break;
      case "ArrowUp":
        e.preventDefault();
        setFocusedIndex((i) => (i - 1 + palettes.length) % palettes.length);
        break;
      case "Enter":
        e.preventDefault();
        onSelect(palettes[focusedIndex].id);
        break;
    }
  };

  const handleToggleClick = () => {
    if (isOpen) {
      setIsOpen(false);
    } else {
      setIsOpen(true);
      setFocusedIndex(selectedIndex >= 0 ? selectedIndex : 0);
    }
  };

  const handleItemClick = (id: string, index: number) => {
    onSelect(id);
    setFocusedIndex(index);
  };

  return (
    <div ref={containerRef} className="relative" onBlur={handleBlur} onKeyDown={handleKeyDown}>
      <button
        ref={buttonRef}
        onClick={handleToggleClick}
        onPointerDown={(e) => e.stopPropagation()}
        aria-label="Select color palette"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        className="p-1.5 rounded-lg border border-content/20 bg-surface text-content hover:bg-content/5 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 transition-colors cursor-pointer"
      >
        <Palette className="w-5 h-5" aria-hidden="true" />
      </button>

      {isOpen && (
        <ul
          role="listbox"
          aria-activedescendant={`palette-${palettes[focusedIndex].id}`}
          onPointerDown={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.preventDefault()}
          className="absolute right-0 top-full mt-1 w-56 rounded-lg border border-content/20 bg-surface shadow-lg py-1 z-50"
        >
          {palettes.map((palette, index) => {
            const colors = palette[theme];
            const variantName = theme === "light" ? palette.lightName : palette.darkName;
            const isSelected = palette.id === selectedPaletteId;
            const isFocused = index === focusedIndex;

            return (
              <li
                key={palette.id}
                id={`palette-${palette.id}`}
                role="option"
                aria-selected={isSelected}
                onClick={() => handleItemClick(palette.id, index)}
                className={`flex items-center gap-2 px-3 py-2 cursor-pointer transition-colors ${
                  isFocused ? "bg-content/10" : ""
                } ${isSelected ? "bg-accent/12" : ""}`}
              >
                <span className="w-4 text-accent text-sm">{isSelected ? "\u2713" : ""}</span>
                <div className="flex-1 min-w-0">
                  <span className="text-sm text-content">{palette.name}</span>
                  <span className="block text-xs italic text-content/50">{variantName}</span>
                </div>
                <div className="flex gap-1">
                  <span
                    className="w-3.5 h-3.5 rounded-full border border-content/20"
                    style={{ backgroundColor: colors.background }}
                  />
                  <span
                    className="w-3.5 h-3.5 rounded-full border border-content/20"
                    style={{ backgroundColor: colors.text }}
                  />
                  <span
                    className="w-3.5 h-3.5 rounded-full border border-content/20"
                    style={{ backgroundColor: colors.accent }}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
