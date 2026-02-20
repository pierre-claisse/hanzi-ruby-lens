import { Pencil } from 'lucide-react';
import { PinyinToggle } from './PinyinToggle';
import { TranslateButton } from './TranslateButton';
import { ZoomInButton } from './ZoomInButton';
import { ZoomOutButton } from './ZoomOutButton';
import { PaletteSelector } from './PaletteSelector';
import { ThemeToggle } from './ThemeToggle';
import { FullscreenToggle } from './FullscreenToggle';
import { CloseButton } from './CloseButton';
import type { ColorPalette } from '../data/palettes';

interface TitleBarProps {
  pinyinVisible: boolean;
  onPinyinToggle: (visible: boolean) => void;
  zoomLevel: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  isMinZoom: boolean;
  isMaxZoom: boolean;
  palettes: readonly ColorPalette[];
  selectedPaletteId: string;
  onPaletteSelect: (id: string) => void;
  theme: "light" | "dark";
  onThemeToggle: () => void;
  onEdit?: () => void;
  showEdit?: boolean;
  rawInput?: string;
}

export function TitleBar({ pinyinVisible, onPinyinToggle, zoomLevel, onZoomIn, onZoomOut, isMinZoom, isMaxZoom, palettes, selectedPaletteId, onPaletteSelect, theme, onThemeToggle, onEdit, showEdit, rawInput }: TitleBarProps) {
  return (
    <header
      data-tauri-drag-region
      className="fixed top-0 left-0 right-0 h-12 bg-surface border-b border-content/10 flex items-center justify-between px-4 z-50"
    >
      <div data-tauri-drag-region className="flex items-center gap-2">
        <h1 data-tauri-drag-region className="text-sm text-content font-medium">Hanzi Ruby Lens</h1>
        <span
          key={zoomLevel}
          data-tauri-drag-region
          className="text-xs text-content/40"
          style={{ animation: 'zoom-indicator-fade 200ms ease-in-out' }}
        >
          ({zoomLevel}%)
        </span>
      </div>

      <div className="flex gap-1">
        {showEdit && onEdit && (
          <button
            type="button"
            className="p-1.5 rounded-lg border border-content/20 bg-surface text-content hover:bg-content/5 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 transition-colors cursor-pointer"
            onClick={onEdit}
            onPointerDown={(e) => e.stopPropagation()}
            aria-label="Edit text"
          >
            <Pencil className="w-5 h-5" aria-hidden="true" />
          </button>
        )}
        <TranslateButton rawInput={rawInput ?? ""} />
        <PinyinToggle visible={pinyinVisible} onToggle={onPinyinToggle} />
        <ZoomInButton onClick={onZoomIn} disabled={isMaxZoom} />
        <ZoomOutButton onClick={onZoomOut} disabled={isMinZoom} />
        <PaletteSelector palettes={palettes} selectedPaletteId={selectedPaletteId} onSelect={onPaletteSelect} theme={theme} />
        <ThemeToggle theme={theme} onToggle={onThemeToggle} />
        <FullscreenToggle />
        <CloseButton />
      </div>
    </header>
  );
}
