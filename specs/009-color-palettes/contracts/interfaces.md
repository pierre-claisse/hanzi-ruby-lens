# Internal Contracts: Color Palette System

**Date**: 2026-02-12

No REST/GraphQL API endpoints — this is a purely frontend feature. Contracts are TypeScript interfaces between modules.

## 1. Palette Data Type

```typescript
// src/data/palettes.ts

interface PaletteColors {
  background: string; // Hex color for background (e.g., "#FEFCF3")
  text: string;       // Hex color for text (e.g., "#2D2D2D")
  accent: string;     // Hex color for accent/pinyin (e.g., "#C84B31")
}

interface ColorPalette {
  id: string;         // Kebab-case slug (e.g., "jade-garden")
  name: string;       // Display name (e.g., "Jade Garden")
  light: PaletteColors;
  dark: PaletteColors;
}

const PALETTES: readonly ColorPalette[];
const DEFAULT_PALETTE_ID: string; // "vermillion-scroll"
```

## 2. useColorPalette Hook

```typescript
// src/hooks/useColorPalette.ts

interface UseColorPaletteReturn {
  paletteId: string;                    // Current palette ID
  setPalette: (id: string) => void;     // Set palette by ID (validates)
  palettes: readonly ColorPalette[];    // All available palettes
}

function useColorPalette(): UseColorPaletteReturn;
```

**Behavior contract**:
- C1: Default initialization returns `"vermillion-scroll"` when no localStorage value
- C2: Restores valid palette ID from localStorage key `"colorPalette"` on mount
- C3: Invalid stored values (unknown ID, null, empty) fall back to `"vermillion-scroll"`
- C4: `setPalette(id)` updates state, persists to localStorage, sets `document.documentElement.dataset.palette`
- C5: `setPalette(unknownId)` is a no-op (ignores invalid IDs)
- C6: localStorage read/write errors are caught, logged to `console.error`, state still works
- C7: `palettes` returns the full PALETTES array for dropdown rendering

## 3. PaletteSelector Component

```typescript
// src/components/PaletteSelector.tsx

interface PaletteSelectorProps {
  palettes: readonly ColorPalette[];
  selectedPaletteId: string;
  onSelect: (id: string) => void;
  theme: "light" | "dark";
}

function PaletteSelector(props: PaletteSelectorProps): JSX.Element;
```

**Behavior contract**:
- Renders a toggle button with `Palette` icon (lucide-react)
- Toggle button opens/closes dropdown on click or Enter (not Space)
- Dropdown lists all palettes by name with 3 color swatches per item
- Swatches show colors for the current `theme` variant
- Selected palette has a visual indicator (distinct from focused)
- Keyboard: Up/Down arrows move focus (wrapping), Enter selects
- Tab closes dropdown, focus moves to next title bar element
- Click outside closes dropdown without changing palette
- Returns focus to toggle button after selection or Escape

## 4. ThemeToggle Component (refactored)

```typescript
// src/components/ThemeToggle.tsx (updated interface)

interface ThemeToggleProps {
  theme: "light" | "dark";
  onToggle: () => void;
}

function ThemeToggle(props: ThemeToggleProps): JSX.Element;
```

**Behavior contract** (unchanged behavior, new interface):
- Renders Sun icon in dark mode, Moon icon in light mode
- Calls `onToggle` on click
- `onPointerDown` calls `stopPropagation()`
- Correct `aria-label` and `aria-pressed` attributes

## 5. TitleBar Component (updated interface)

```typescript
// src/components/TitleBar.tsx (updated interface)

interface TitleBarProps {
  pinyinVisible: boolean;
  onPinyinToggle: (visible: boolean) => void;
  zoomLevel: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  isMinZoom: boolean;
  isMaxZoom: boolean;
  // New props for palette
  palettes: readonly ColorPalette[];
  selectedPaletteId: string;
  onPaletteSelect: (id: string) => void;
  // New props for theme (lifted from ThemeToggle)
  theme: "light" | "dark";
  onThemeToggle: () => void;
}
```

**Button order contract** (FR-024):
1. PinyinToggle
2. ZoomInButton
3. ZoomOutButton
4. PaletteSelector
5. ThemeToggle
6. FullscreenToggle
7. CloseButton
