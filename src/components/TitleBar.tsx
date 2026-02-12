import { PinyinToggle } from './PinyinToggle';
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
}

export function TitleBar({ pinyinVisible, onPinyinToggle, zoomLevel, onZoomIn, onZoomOut, isMinZoom, isMaxZoom, palettes, selectedPaletteId, onPaletteSelect, theme, onThemeToggle }: TitleBarProps) {
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
