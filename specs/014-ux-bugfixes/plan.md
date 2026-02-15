# Implementation Plan: UX Bugfixes

**Branch**: `014-ux-bugfixes` | **Date**: 2026-02-15 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/014-ux-bugfixes/spec.md`

## Summary

Fix 4 UX bugs: (1) remove max-width constraint and increase default window to 1600×900, (2) suppress word hover while context menu is open, (3) fix pinyin ruby spacing via `ruby-align: center` on `ruby` element, (4) add themed scrollbar via `::-webkit-scrollbar` pseudo-elements using CSS custom properties.

## Technical Context

**Language/Version**: TypeScript 5.5 (frontend), Rust stable (Tauri backend — no Rust changes)
**Primary Dependencies**: React 18.3, Tailwind CSS 3.4, Tauri 2
**Storage**: N/A (no data changes)
**Testing**: Vitest (happy-dom), cargo test (no new Rust tests)
**Target Platform**: Windows (Tauri WebView2 / Chromium-based)
**Project Type**: Tauri desktop app (frontend + backend)
**Performance Goals**: N/A (CSS and state logic changes only)
**Constraints**: WebView2 uses Chromium engine — `::-webkit-scrollbar` is supported
**Scale/Scope**: 4 targeted fixes across ~5 files

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Content-First Design | PASS | Wider layout gives more space to text; scrollbar styling reduces visual noise |
| II. Offline-First Data | PASS | No data changes |
| III. DDD with CQRS | PASS | No domain logic changes |
| IV. Principled Simplicity | PASS | Minimal, targeted fixes |
| V. Test-First Imperative | PASS | Existing tests must pass; behavioral fix in useWordNavigation testable |
| VI. Docker-Only Execution | PASS | Tests run in Docker |
| Domain Language | PASS | No terminology changes |
| Visual Identity | PASS | Scrollbar colors use palette system; pinyin fix improves ruby rendering |

No violations. No complexity tracking needed.

## Project Structure

### Documentation (this feature)

```text
specs/014-ux-bugfixes/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── spec.md              # Feature specification
├── checklists/
│   └── requirements.md  # Spec quality checklist
└── tasks.md             # Phase 2 output (via /speckit.tasks)
```

### Source Code (files affected)

```text
src-tauri/
└── tauri.conf.json          # Window size: 1024×768 → 1600×900

src/
├── App.tsx                  # Remove max-w-2xl, adjust padding
├── index.css                # Ruby-align fix, scrollbar styles
├── hooks/
│   └── useWordNavigation.ts # Suppress hover when menu open
└── components/
    └── RubyWord.tsx         # Possibly adjust for pinyin fix (if CSS alone insufficient)

tests/
└── (no new test files — existing tests must pass)
```

**Structure Decision**: No new files needed. All changes are modifications to existing files.

## Fix Details

### Fix 1: Wide Layout + Window Size

**Files**: `src/App.tsx`, `src-tauri/tauri.conf.json`

- Remove `max-w-2xl mx-auto` wrapper in App.tsx — let text flow to edges
- Keep reasonable side padding (reduce from `px-6` to something appropriate, or keep `px-6` — the max-width was the real constraint)
- Update `tauri.conf.json`: `width: 1600`, `height: 900`, `minWidth: 1600`, `minHeight: 900`

### Fix 2: Context Menu Hover Suppression

**File**: `src/hooks/useWordNavigation.ts`

Current `handleWordHover` (line 109-114):
```typescript
const handleWordHover = useCallback((index: number) => {
    if (menuOpen && index !== trackedIndex) {
      closeMenu();  // BUG: closes menu when mouse crosses other words
    }
    setTrackedIndex(index);  // BUG: moves tracked word even when menu open
}, [menuOpen, trackedIndex, closeMenu]);
```

Fix: When `menuOpen` is true, ignore all hover events entirely:
```typescript
const handleWordHover = useCallback((index: number) => {
    if (menuOpen) return;  // Suppress hover while menu is open
    setTrackedIndex(index);
}, [menuOpen]);
```

The menu already closes on click-outside (mousedown handler in TextDisplay.tsx) and on Escape (keyboard handler). No other close mechanism needed for hover path.

### Fix 3: Pinyin Ruby Alignment

**File**: `src/index.css`

Current CSS has `ruby-align: center` on `rt` — it should be on the `ruby` element. Chromium distributes ruby text across base characters by default; `ruby-align: center` on `ruby` tells it to center the annotation as a single unit over the entire base.

Move `ruby-align: center` from `rt` to `ruby`:
```css
ruby {
    ruby-position: over;
    ruby-align: center;
    white-space: nowrap;
}
```

If this doesn't fully resolve in WebView2/Chromium, fallback: add `text-align: center` to `rt` as well.

### Fix 4: Themed Scrollbar

**File**: `src/index.css`

Add `::-webkit-scrollbar` pseudo-elements in `@layer base` using CSS custom properties that already exist (`--color-background`, `--color-text`, `--color-accent`). These update automatically when palette/theme changes.

```css
::-webkit-scrollbar { width: 8px; }
::-webkit-scrollbar-track { background: rgb(var(--color-background)); }
::-webkit-scrollbar-thumb {
    background: rgb(var(--color-text) / 0.2);
    border-radius: 4px;
}
::-webkit-scrollbar-thumb:hover {
    background: rgb(var(--color-text) / 0.35);
}
```

WebView2 is Chromium-based, so `::-webkit-scrollbar` is fully supported.
