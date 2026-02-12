# Quickstart: Color Palette System (009-color-palettes)

**Date**: 2026-02-12

## Overview

Add 7 culturally-themed color palettes with a dropdown selector in the title bar. Colors applied via CSS `[data-palette]` attribute selectors. Rename CSS properties to `--color-background`/`--color-text`/`--color-accent` and Tailwind tokens to `surface`/`content`/`accent`. Palette toggle uses lucide-react `Palette` icon. Dropdown shows palette names with 3 color swatches. Keyboard-accessible (Enter, arrows, Tab). Preference persisted to localStorage.

## New Files

| File | Purpose |
|------|---------|
| `src/data/palettes.ts` | 7 palette definitions (id, name, hex colors per mode) |
| `src/hooks/useColorPalette.ts` | Palette state, localStorage persistence, `data-palette` attribute |
| `src/hooks/useColorPalette.test.ts` | 100% coverage tests for useColorPalette hook |
| `src/components/PaletteSelector.tsx` | Toggle button + dropdown (keyboard nav, click-outside, swatches) |

## Modified Files

| File | Change |
|------|--------|
| `tailwind.config.ts` | Rename color tokens: `paper`→`surface`, `ink`→`content`, `vermillion`→`accent` |
| `src/index.css` | Rename CSS properties + add 14 `[data-palette]` CSS rule blocks (7 palettes × light/dark) |
| `src/App.tsx` | Add `useColorPalette()`, lift `useTheme()`, rename color classes |
| `src/components/TitleBar.tsx` | Add PaletteSelector, accept palette + theme props, rename color classes |
| `src/components/ThemeToggle.tsx` | Refactor to props-driven, rename color classes |
| `src/components/ThemeToggle.test.tsx` | Update tests for props-driven interface |
| `src/components/PinyinToggle.tsx` | Rename color classes |
| `src/components/FullscreenToggle.tsx` | Rename color classes |
| `src/components/CloseButton.tsx` | Rename color classes |
| `src/components/ZoomInButton.tsx` | Rename color classes |
| `src/components/ZoomOutButton.tsx` | Rename color classes |
| `src/components/TextDisplay.tsx` | Rename color classes |
| `src/components/*.test.tsx` | Update assertions for renamed classes |
| `src/App.test.tsx` | Update button count (6→7) |

## CSS Architecture

### data-palette Attribute Selectors

```css
/* Fallback (before React hydrates) */
:root {
  --color-background: 254 252 243;
  --color-text: 45 45 45;
  --color-accent: 200 75 49;
}
.dark {
  --color-background: 26 26 46;
  --color-text: 245 240 232;
}

/* Per-palette overrides */
[data-palette="vermillion-scroll"] {
  --color-background: 254 252 243;
  --color-text: 45 45 45;
  --color-accent: 200 75 49;
}
.dark[data-palette="vermillion-scroll"] {
  --color-background: 26 26 46;
  --color-text: 245 240 232;
  --color-accent: 200 75 49;
}

[data-palette="jade-garden"] {
  --color-background: 244 248 240;
  --color-text: 42 58 46;
  --color-accent: 46 139 87;
}
.dark[data-palette="jade-garden"] {
  --color-background: 27 36 32;
  --color-text: 224 234 219;
  --color-accent: 46 139 87;
}
/* ... etc for all 7 palettes */
```

**Tailwind config** (renamed tokens):
```typescript
colors: {
  surface: "rgb(var(--color-background) / <alpha-value>)",
  content: "rgb(var(--color-text) / <alpha-value>)",
  accent: "rgb(var(--color-accent) / <alpha-value>)",
}
```

**How it works**: `useColorPalette` sets `document.documentElement.dataset.palette = "jade-garden"`. CSS selectors match instantly. Tailwind utilities (`bg-surface`, `text-content`, `text-accent`) resolve through the CSS custom properties.

### Token Rename Cheat Sheet

| Old Class | New Class |
|-----------|-----------|
| `bg-paper` | `bg-surface` |
| `text-ink` | `text-content` |
| `text-ink/50` | `text-content/50` |
| `border-ink/20` | `border-content/20` |
| `border-ink/10` | `border-content/10` |
| `text-ink/40` | `text-content/40` |
| `hover:bg-ink/5` | `hover:bg-content/5` |
| `hover:bg-vermillion/24` | `hover:bg-accent/24` |
| `focus:ring-vermillion` | `focus:ring-accent` |
| `focus-visible:ring-vermillion` | `focus-visible:ring-accent` |
| `ring-vermillion` | `ring-accent` |

## RGB Color Reference

All hex→RGB conversions for CSS rules:

| Palette | Mode | background | text | accent |
|---------|------|------------|------|--------|
| Vermillion Scroll | light | 254 252 243 | 45 45 45 | 200 75 49 |
| Vermillion Scroll | dark | 26 26 46 | 245 240 232 | 200 75 49 |
| Jade Garden | light | 244 248 240 | 42 58 46 | 46 139 87 |
| Jade Garden | dark | 27 36 32 | 224 234 219 | 46 139 87 |
| Indigo Silk | light | 247 245 240 | 44 44 58 | 59 89 152 |
| Indigo Silk | dark | 20 22 43 | 232 228 221 | 107 140 206 |
| Cinnabar & Smoke | light | 250 247 242 | 26 26 26 | 191 48 48 |
| Cinnabar & Smoke | dark | 28 26 23 | 240 235 227 | 212 64 64 |
| Plum Blossom | light | 251 245 243 | 58 45 61 | 155 45 94 |
| Plum Blossom | dark | 34 28 38 | 240 228 232 | 199 91 142 |
| Golden Pavilion | light | 253 248 238 | 53 43 30 | 196 136 32 |
| Golden Pavilion | dark | 31 27 20 | 237 228 208 | 212 160 48 |
| Ink Wash | light | 245 245 242 | 51 51 51 | 119 119 119 |
| Ink Wash | dark | 29 29 29 | 217 217 214 | 153 153 153 |

## Key Patterns

### Hook Pattern (follow useTheme/usePinyinVisibility)

```typescript
const [paletteId, setPaletteId] = useState<string>(() => {
  try {
    const stored = localStorage.getItem("colorPalette");
    if (stored && PALETTES.some(p => p.id === stored)) {
      return stored;
    }
  } catch { console.error(...); }
  return DEFAULT_PALETTE_ID;
});

useEffect(() => {
  try { localStorage.setItem("colorPalette", paletteId); }
  catch { console.error(...); }
  document.documentElement.dataset.palette = paletteId;
}, [paletteId]);
```

### Dropdown Keyboard Navigation

```typescript
const handleKeyDown = (e: React.KeyboardEvent) => {
  if (!isOpen) {
    if (e.key === "Enter") { setIsOpen(true); setFocusedIndex(selectedIndex); e.preventDefault(); }
    return;
  }
  switch (e.key) {
    case "ArrowDown": e.preventDefault(); setFocusedIndex(i => (i + 1) % 7); break;
    case "ArrowUp":   e.preventDefault(); setFocusedIndex(i => (i - 1 + 7) % 7); break;
    case "Enter":     e.preventDefault(); onSelect(palettes[focusedIndex].id); setIsOpen(false); break;
  }
};
```

### Click-Outside Pattern

```typescript
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
```

### Tab-Away Detection (onBlur + relatedTarget)

```typescript
const handleBlur = (e: React.FocusEvent) => {
  if (containerRef.current && !containerRef.current.contains(e.relatedTarget as Node)) {
    setIsOpen(false);
  }
};
```

## Button Styling (standard pattern, post-rename)

```typescript
className="p-1.5 rounded-lg border border-content/20 bg-surface text-content
  hover:bg-content/5 focus:outline-none focus:ring-2 focus:ring-accent
  focus:ring-offset-2 transition-colors cursor-pointer"
```

## Testing Strategy

### useColorPalette.test.ts (100% coverage target)

Follow `usePinyinVisibility.test.ts` + `useTextZoom.test.ts` patterns:
- localStorage mock in `beforeEach`
- Error handling with `console.error` spy
- `renderHook`, `act`, `vi.waitFor` from @testing-library/react + vitest

Test cases:
- Default initialization ("vermillion-scroll")
- Restore valid palette from localStorage
- Persist on change
- Invalid stored value → fallback
- Unknown palette ID → fallback
- `setPalette` updates `document.documentElement.dataset.palette`
- localStorage read error → console.error + default
- localStorage write error → console.error + state still works
- `setPalette` with unknown ID is no-op
- `palettes` returns all 7 palettes

Coverage targets:
- Statements: 100%
- Branches: 100%
- Functions: 100%
- Lines: 100%
