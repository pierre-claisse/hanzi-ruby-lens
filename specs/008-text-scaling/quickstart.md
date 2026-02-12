# Quickstart: Text Scaling Controls (008-text-scaling)

**Date**: 2026-02-12

## Overview

Add text zoom controls (100%-200%, 10% steps) via keyboard shortcuts (Ctrl+/Ctrl-) and title bar buttons (ZoomIn/ZoomOut icons). Display current zoom percentage next to title. Persist zoom preference to localStorage.

## New Files

| File | Purpose |
|------|---------|
| `src/hooks/useTextZoom.ts` | Zoom state management, keyboard shortcuts, persistence |
| `src/hooks/useTextZoom.test.ts` | 100% coverage tests for useTextZoom hook |
| `src/components/ZoomInButton.tsx` | Title bar zoom-in button (lucide-react ZoomIn icon) |
| `src/components/ZoomOutButton.tsx` | Title bar zoom-out button (lucide-react ZoomOut icon) |

## Modified Files

| File | Changes |
|------|---------|
| `src/components/TitleBar.tsx` | Add zoom indicator, zoom buttons, reorder buttons |
| `src/components/TextDisplay.tsx` | Accept `zoomLevel` prop, apply dynamic font-size |
| `src/App.tsx` | Wire `useTextZoom` hook, pass props to TitleBar + TextDisplay |
| `src/App.test.tsx` | Update button count (4 → 6), add zoom-related assertions |
| `src/index.css` | Add zoom indicator animation keyframes |

## Implementation Order

1. **useTextZoom hook** — core logic (state, persistence, keyboard, boundaries)
2. **useTextZoom.test.ts** — full test suite before or alongside hook
3. **ZoomInButton + ZoomOutButton** — simple icon buttons with disabled state
4. **TitleBar modifications** — zoom indicator, button reorder, new buttons
5. **TextDisplay modifications** — accept zoomLevel, apply font-size
6. **App.tsx wiring** — connect hook to TitleBar + TextDisplay
7. **App.test.tsx updates** — adjust for new button count
8. **index.css** — zoom indicator animation

Note: No `tauri.conf.json` change needed — `zoomHotkeysEnabled` defaults to `false` in Tauri 2.

## Key Patterns

### Hook Pattern (follow useTheme/usePinyinVisibility)
```typescript
const [zoomLevel, setZoomLevel] = useState<number>(() => {
  try {
    const stored = localStorage.getItem("textZoomLevel");
    // validate: integer, multiple of 10, within [100, 200]
  } catch { console.error(...); }
  return 100;
});

useEffect(() => {
  try { localStorage.setItem("textZoomLevel", String(zoomLevel)); }
  catch { console.error(...); }
}, [zoomLevel]);
```

### Keyboard Shortcut Pattern (follow useFullscreen)
```typescript
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.ctrlKey && (e.key === "=" || e.key === "+")) {
      e.preventDefault();
      setZoomLevel(prev => Math.min(prev + 10, 200));
    } else if (e.ctrlKey && e.key === "-") {
      e.preventDefault();
      setZoomLevel(prev => Math.max(prev - 10, 100));
    }
  };
  document.addEventListener("keydown", handleKeyDown);
  return () => document.removeEventListener("keydown", handleKeyDown);
}, []);
```

### Button Pattern (follow PinyinToggle/ThemeToggle)
```typescript
<button
  onClick={onClick}
  onPointerDown={(e) => e.stopPropagation()}
  disabled={disabled}
  aria-label="Zoom in"
  className="p-1.5 rounded-lg border border-ink/20 bg-paper text-ink hover:bg-ink/5
    focus:outline-none focus:ring-2 focus:ring-vermillion focus:ring-offset-2
    transition-colors cursor-pointer
    disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-paper"
>
  <ZoomIn className="w-5 h-5" aria-hidden="true" />
</button>
```

### Font-Size Scaling
```typescript
// TextDisplay: replace text-2xl with dynamic fontSize
const BASE_FONT_SIZE_REM = 1.5; // equivalent to Tailwind text-2xl
<div style={{ fontSize: `${BASE_FONT_SIZE_REM * zoomLevel / 100}rem` }}>
```

## Test Coverage Requirements

All four metrics must reach 100% for `useTextZoom.ts`:
- Statements
- Branches
- Functions
- Lines

Follow test patterns from `usePinyinVisibility.test.ts`:
- localStorage mock in `beforeEach`
- Error handling with `console.error` spy
- `renderHook`, `act`, `vi.waitFor` from @testing-library/react + vitest
