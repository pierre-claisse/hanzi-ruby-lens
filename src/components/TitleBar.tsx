import { ArrowLeft, Plus, Tags, ArrowUp, ArrowDown, CalendarDays, Library } from 'lucide-react';
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
import { SyncDropdown } from './SyncDropdown';
import type { ColorPalette } from '../data/palettes';
import type { Tag } from '../types/domain';
import type { AppView } from '../hooks/useTextLoader';

interface TitleBarProps {
  appView: AppView;
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
  titleText?: string;
  onManageTags?: () => void;
  tags?: Tag[];
  filterTagIds?: number[];
  onFilterTagIds?: (ids: number[]) => void;
  sortAsc?: boolean;
  onToggleSort?: () => void;
  onDataImportComplete?: () => void;
  onDataResetComplete?: () => void;
  isAuthorizedDevice?: boolean;
  syncConfigured?: boolean;
  onSyncPullComplete?: () => void;
  onToggleCalendarView?: () => void;
  identityName?: string;
  identityTimeZone?: string;
}

export function TitleBar({ appView, pinyinVisible, onPinyinToggle, zoomLevel, onZoomIn, onZoomOut, isMinZoom, isMaxZoom, palettes, selectedPaletteId, onPaletteSelect, theme, onThemeToggle, onBack, showBack, rawInput, onAddText, titleText, onManageTags, tags, filterTagIds, onFilterTagIds, sortAsc, onToggleSort, onDataImportComplete, onDataResetComplete, isAuthorizedDevice, syncConfigured, onSyncPullComplete, onToggleCalendarView, identityName, identityTimeZone }: TitleBarProps) {
  const isLibrary = appView === "library";
  const isCalendar = appView === "calendar";
  const calendarToggleButton = onToggleCalendarView && (isLibrary || isCalendar) ? (
    <button
      type="button"
      className="p-1.5 rounded-lg border border-content/20 bg-surface text-content hover:bg-content/5 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 transition-colors cursor-pointer"
      onClick={onToggleCalendarView}
      onPointerDown={(e) => e.stopPropagation()}
      aria-label={isLibrary ? "Open calendar" : "Back to library"}
      title={isLibrary ? "Calendar" : "Library"}
    >
      {isLibrary ? (
        <CalendarDays className="w-5 h-5" aria-hidden="true" />
      ) : (
        <Library className="w-5 h-5" aria-hidden="true" />
      )}
    </button>
  ) : null;
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
        {isLibrary && tags && filterTagIds && onFilterTagIds && onToggleSort !== undefined && (
          <>
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
          </>
        )}
      </div>

      <div className="flex gap-1">
        {showBack && (
          <>
            <TranslateButton rawInput={rawInput ?? ""} />
            <PinyinToggle visible={pinyinVisible} onToggle={onPinyinToggle} />
            <ZoomOutButton onClick={onZoomOut} disabled={isMinZoom} />
            <ZoomInButton onClick={onZoomIn} disabled={isMaxZoom} />
          </>
        )}
        {isLibrary && onAddText && (
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
        {isLibrary && onManageTags && (
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
        {(isLibrary || isCalendar) && isAuthorizedDevice && onDataImportComplete && onDataResetComplete && (
          <DataManagementDropdown
            onImportComplete={onDataImportComplete}
            onResetComplete={onDataResetComplete}
          />
        )}
        {syncConfigured && onSyncPullComplete && identityName && identityTimeZone && (
          <SyncDropdown
            name={identityName}
            timeZone={identityTimeZone}
            onPullComplete={onSyncPullComplete}
            betweenSlot={calendarToggleButton}
          />
        )}
        {!syncConfigured && calendarToggleButton}
        <PaletteSelector palettes={palettes} selectedPaletteId={selectedPaletteId} onSelect={onPaletteSelect} theme={theme} />
        <ThemeToggle theme={theme} onToggle={onThemeToggle} />
        <FullscreenToggle />
        <CloseButton />
      </div>
    </header>
  );
}
