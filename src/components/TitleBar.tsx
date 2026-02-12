import { PinyinToggle } from './PinyinToggle';
import { ZoomInButton } from './ZoomInButton';
import { ZoomOutButton } from './ZoomOutButton';
import { ThemeToggle } from './ThemeToggle';
import { FullscreenToggle } from './FullscreenToggle';
import { CloseButton } from './CloseButton';

interface TitleBarProps {
  pinyinVisible: boolean;
  onPinyinToggle: (visible: boolean) => void;
  zoomLevel: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  isMinZoom: boolean;
  isMaxZoom: boolean;
}

export function TitleBar({ pinyinVisible, onPinyinToggle, zoomLevel, onZoomIn, onZoomOut, isMinZoom, isMaxZoom }: TitleBarProps) {
  return (
    <header
      data-tauri-drag-region
      className="fixed top-0 left-0 right-0 h-12 bg-paper border-b border-ink/10 flex items-center justify-between px-4 z-50"
    >
      <div data-tauri-drag-region className="flex items-center gap-2">
        <h1 data-tauri-drag-region className="text-sm text-ink font-medium">Hanzi Ruby Lens</h1>
        <span
          key={zoomLevel}
          data-tauri-drag-region
          className="text-xs text-ink/40"
          style={{ animation: 'zoom-indicator-fade 200ms ease-in-out' }}
        >
          ({zoomLevel}%)
        </span>
      </div>

      <div className="flex gap-1">
        <PinyinToggle visible={pinyinVisible} onToggle={onPinyinToggle} />
        <ZoomInButton onClick={onZoomIn} disabled={isMaxZoom} />
        <ZoomOutButton onClick={onZoomOut} disabled={isMinZoom} />
        <ThemeToggle />
        <FullscreenToggle />
        <CloseButton />
      </div>
    </header>
  );
}
