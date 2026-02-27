import { ArrowLeft, Plus, Tags, ArrowUp, ArrowDown } from 'lucide-react';
import { PinyinToggle } from './PinyinToggle';
import { TranslateButton } from './TranslateButton';
import { ZoomInButton } from './ZoomInButton';
import { ZoomOutButton } from './ZoomOutButton';
import { PaletteSelector } from './PaletteSelector';
import { ThemeToggle } from './ThemeToggle';
import { FullscreenToggle } from './FullscreenToggle';
import { CloseButton } from './CloseButton';
import { TagFilterDropdown } from './TagFilterDropdown';
import { DataManagementDropdown } from './DataManagementDropdown';
import type { ColorPalette } from '../data/palettes';
import type { Tag } from '../types/domain';

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
  onBack?: () => void;
  showBack?: boolean;
  rawInput?: string;
  onAddText?: () => void;
  showAddButton?: boolean;
  titleText?: string;
  onManageTags?: () => void;
  tags?: Tag[];
  filterTagIds?: number[];
  onFilterTagIds?: (ids: number[]) => void;
  sortAsc?: boolean;
  onToggleSort?: () => void;
  onDataImportComplete?: () => void;
  onDataResetComplete?: () => void;
}

export function TitleBar({ pinyinVisible, onPinyinToggle, zoomLevel, onZoomIn, onZoomOut, isMinZoom, isMaxZoom, palettes, selectedPaletteId, onPaletteSelect, theme, onThemeToggle, onBack, showBack, rawInput, onAddText, showAddButton, titleText, onManageTags, tags, filterTagIds, onFilterTagIds, sortAsc, onToggleSort, onDataImportComplete, onDataResetComplete }: TitleBarProps) {
  return (
    <header
      data-tauri-drag-region
      className="fixed top-0 left-0 right-0 h-12 bg-surface border-b border-content/10 flex items-center justify-between px-4 z-50"
    >
      <div data-tauri-drag-region className="flex items-center gap-2">
        {showBack && onBack && (
          <button
            type="button"
            className="p-1.5 rounded-lg border border-content/20 bg-surface text-content hover:bg-content/5 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 transition-colors cursor-pointer"
            onClick={onBack}
            onPointerDown={(e) => e.stopPropagation()}
            aria-label="Back to library"
          >
            <ArrowLeft className="w-5 h-5" aria-hidden="true" />
          </button>
        )}
        <h1 data-tauri-drag-region className="text-base text-content font-medium truncate max-w-[40vw]">{titleText ?? "Hanzi Ruby Lens"}</h1>
        {showBack && (
          <span
            key={zoomLevel}
            data-tauri-drag-region
            className="text-base text-content/40"
            style={{ animation: 'zoom-indicator-fade 200ms ease-in-out' }}
          >
            ({zoomLevel}%)
          </span>
        )}
      </div>

      {showAddButton && tags && filterTagIds && onFilterTagIds && onToggleSort !== undefined && (
        <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2">
          <TagFilterDropdown
            tags={tags}
            selectedIds={filterTagIds}
            onChange={onFilterTagIds}
          />
          <button
            type="button"
            className="p-1.5 rounded-lg border border-content/20 bg-surface text-content hover:bg-content/5 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 transition-colors cursor-pointer"
            onClick={onToggleSort}
            onPointerDown={(e) => e.stopPropagation()}
            aria-label={sortAsc ? "Sort: oldest first" : "Sort: newest first"}
            title={sortAsc ? "Sort: oldest first" : "Sort: newest first"}
          >
            {sortAsc ? (
              <ArrowUp className="w-4 h-4" aria-hidden="true" />
            ) : (
              <ArrowDown className="w-4 h-4" aria-hidden="true" />
            )}
          </button>
        </div>
      )}

      <div className="flex gap-1">
        {showBack && (
          <>
            <TranslateButton rawInput={rawInput ?? ""} />
            <PinyinToggle visible={pinyinVisible} onToggle={onPinyinToggle} />
            <ZoomOutButton onClick={onZoomOut} disabled={isMinZoom} />
            <ZoomInButton onClick={onZoomIn} disabled={isMaxZoom} />
          </>
        )}
        {showAddButton && onAddText && (
          <button
            type="button"
            className="p-1.5 rounded-lg border border-content/20 bg-surface text-content hover:bg-content/5 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 transition-colors cursor-pointer"
            onClick={onAddText}
            onPointerDown={(e) => e.stopPropagation()}
            aria-label="Add text"
          >
            <Plus className="w-5 h-5" aria-hidden="true" />
          </button>
        )}
        {showAddButton && onManageTags && (
          <button
            type="button"
            className="p-1.5 rounded-lg border border-content/20 bg-surface text-content hover:bg-content/5 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 transition-colors cursor-pointer"
            onClick={onManageTags}
            onPointerDown={(e) => e.stopPropagation()}
            aria-label="Manage tags"
          >
            <Tags className="w-5 h-5" aria-hidden="true" />
          </button>
        )}
        {showAddButton && onDataImportComplete && onDataResetComplete && (
          <DataManagementDropdown
            onImportComplete={onDataImportComplete}
            onResetComplete={onDataResetComplete}
          />
        )}
        <PaletteSelector palettes={palettes} selectedPaletteId={selectedPaletteId} onSelect={onPaletteSelect} theme={theme} />
        <ThemeToggle theme={theme} onToggle={onThemeToggle} />
        <FullscreenToggle />
        <CloseButton />
      </div>
    </header>
  );
}
