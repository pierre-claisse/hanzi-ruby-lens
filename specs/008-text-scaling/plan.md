# Implementation Plan: Text Scaling Controls

**Branch**: `008-text-scaling` | **Date**: 2026-02-12 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/008-text-scaling/spec.md`

## Summary

Add text zoom controls (50%-200% in 10% steps) to the reading interface via keyboard shortcuts (Ctrl+/Ctrl-) and title bar buttons (ZoomIn/ZoomOut lucide-react icons). Display current zoom percentage next to the title with smooth transition animation. Persist zoom preference to localStorage following established hook patterns. Achieve 100% test coverage for the new hook.

## Technical Context

**Language/Version**: TypeScript 5.5 (frontend), Rust stable (Tauri backend — no changes)
**Primary Dependencies**: React 18.3, Tailwind CSS 3.4, lucide-react 0.563.0, @tauri-apps/api 2.0
**Storage**: Browser localStorage (key: `"textZoomLevel"`, value: string integer)
**Testing**: Vitest 2.0 + @testing-library/react 16 + @vitest/coverage-v8 2.0
**Target Platform**: Windows desktop (Tauri 2, WebView2)
**Project Type**: Single (Tauri desktop app with React frontend)
**Performance Goals**: Zoom changes apply under 100ms (SC-003), 100 consecutive rapid interactions without errors (SC-007)
**Constraints**: Zoom range 50%-200%, increments of 10% only, zoom applies to text content only (not title bar)
**Scale/Scope**: 4 new files, 5 modified files, ~200 lines new code + ~200 lines tests

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Content-First Design | PASS | Zoom serves readability (core content focus). Indicator styled subdued (grey). Transitions use 200ms ease per constitution guideline. |
| II. Offline-First Data | PASS | Zoom preference in localStorage. No network needed. |
| III. DDD with CQRS | PASS | Zoom is a UI preference, not a domain concern. No domain model changes. Domain entities (Text, Word) unaffected. |
| IV. Principled Simplicity | PASS | Single hook follows existing patterns. No speculative features. Minimal new abstractions. |
| V. Test-First Imperative | PASS | 100% coverage required (FR-027). Tests run in Docker via `npm run test`. |
| VI. Docker-Only Execution | PASS | All testing via Docker. No local test infrastructure needed. |
| Domain Language | PASS | "Text" in "Text Scaling" refers to visual rendering, not domain `Text` aggregate. No terminology conflict. |
| Technology Stack | PASS | React, TypeScript, Tailwind CSS, lucide-react — all within constitutional tech stack. |
| Visual Identity | PASS | Noto Sans CJK TC preserved. Ruby annotations maintain ~50% ratio via CSS inheritance. |
| Git-Flow | PASS | Feature branch `008-text-scaling` follows convention. |

**Gate result**: ALL PASS — no violations, no justifications needed.

## Project Structure

### Documentation (this feature)

```text
specs/008-text-scaling/
├── spec.md
├── plan.md                        # This file
├── research.md                    # Phase 0 output
├── data-model.md                  # Phase 1 output
├── quickstart.md                  # Phase 1 output
├── contracts/
│   └── component-interfaces.md    # Phase 1 output
├── checklists/
│   └── requirements.md
└── tasks.md                       # Phase 2 output (/speckit.tasks)
```

### Source Code (repository root)

```text
src/
├── hooks/
│   ├── useTextZoom.ts             # NEW: zoom state, persistence, keyboard shortcuts
│   ├── useTextZoom.test.ts        # NEW: 100% coverage tests
│   ├── useTheme.ts                # (unchanged)
│   ├── useTheme.test.ts           # (unchanged)
│   ├── useFullscreen.ts           # (unchanged)
│   ├── useFullscreen.test.ts      # (unchanged)
│   ├── usePinyinVisibility.ts     # (unchanged)
│   └── usePinyinVisibility.test.ts # (unchanged)
├── components/
│   ├── ZoomInButton.tsx           # NEW: title bar zoom-in button
│   ├── ZoomOutButton.tsx          # NEW: title bar zoom-out button
│   ├── TitleBar.tsx               # MODIFIED: zoom indicator, button reorder, new imports
│   ├── TextDisplay.tsx            # MODIFIED: accept zoomLevel prop, dynamic font-size
│   ├── PinyinToggle.tsx           # (unchanged)
│   ├── ThemeToggle.tsx            # (unchanged)
│   ├── FullscreenToggle.tsx       # (unchanged)
│   ├── CloseButton.tsx            # (unchanged)
│   └── RubyWord.tsx               # (unchanged)
├── App.tsx                        # MODIFIED: wire useTextZoom, pass props
├── App.test.tsx                   # MODIFIED: update button count (4 → 6)
├── index.css                      # MODIFIED: add zoom indicator animation keyframes
├── types/
│   └── domain.ts                  # (unchanged)
└── data/
    └── sample-text.ts             # (unchanged)

src-tauri/
└── tauri.conf.json                # MODIFIED: add zoomHotkeysEnabled: false
```

**Structure Decision**: Single project, frontend-only changes. No new directories. New files follow existing naming and location conventions (`src/hooks/`, `src/components/`).

## Design Decisions

### D1: Hook Architecture — State in App, Props Down

The `useTextZoom` hook is called in `App.tsx` (not in individual components) because zoom state flows to both TitleBar (indicator + buttons) and TextDisplay (font-size). This follows the `usePinyinVisibility` pattern where the parent lifts state for multi-consumer distribution.

### D2: Font-Size Scaling via Inline Style

TextDisplay applies zoom via inline `style={{ fontSize }}` rather than Tailwind classes because:
- Tailwind's `text-2xl` uses `rem` (root-relative), which can't be overridden by parent font-size
- Dynamic class generation (e.g., `text-[${x}rem]`) isn't supported by Tailwind's JIT compiler with runtime values
- Inline style cleanly overrides the Tailwind class with correct specificity

Formula: `fontSize = 1.5 * (zoomLevel / 100)` rem (1.5rem = text-2xl base)

### D3: Keyboard Handling with Functional State Updates

The keydown event handler uses `setZoomLevel(prev => ...)` (functional state updates) rather than referencing `zoomLevel` directly. This avoids stale closures and allows the `useEffect` to have a stable dependency array (`[]`), since `setZoomLevel` from `useState` is guaranteed stable.

### D4: Tauri Config + JavaScript Prevention

Native WebView2 zoom is disabled via two layers:
1. `zoomHotkeysEnabled: false` in `tauri.conf.json` — platform-level prevention
2. `e.preventDefault()` in JavaScript keydown handler — event-level prevention

This defense-in-depth approach ensures custom zoom works reliably regardless of WebView2 behavior.

### D5: Zoom Indicator Animation via React Key Prop

The zoom indicator uses `key={zoomLevel}` on the span element. When zoomLevel changes, React unmounts and remounts the span, triggering a CSS `@keyframes` fade-in animation (200ms ease-in-out). This achieves "smooth transition" per FR-021 without external animation libraries.

### D6: Button Disabled State via HTML `disabled` Attribute

Standard HTML `disabled` attribute with Tailwind `disabled:` variants. Disabled buttons are excluded from tab order (HTML spec behavior). At max zoom (200%), ZoomIn is disabled; at min zoom (50%), ZoomOut is disabled. Tab order preserves correct sequence for enabled buttons.

## Implementation Order

### Phase 1: Core Hook (no UI changes)

1. Create `src/hooks/useTextZoom.ts`:
   - Constants: MIN_ZOOM=50, MAX_ZOOM=200, DEFAULT_ZOOM=100, ZOOM_STEP=10
   - `useState<number>` with lazy initializer (localStorage read + validation)
   - `useEffect` for localStorage persistence
   - `useEffect` for keyboard shortcuts (Ctrl+=/+, Ctrl+-, with e.preventDefault())
   - Derived state: `isMinZoom`, `isMaxZoom`
   - Exported functions: `zoomIn`, `zoomOut`
   - Error handling: try-catch with console.error (matching useTheme/usePinyinVisibility)

2. Create `src/hooks/useTextZoom.test.ts`:
   - Follow usePinyinVisibility.test.ts patterns (localStorage mock, beforeEach, console.error spy)
   - Test cases: default initialization, persistence, restore from localStorage, zoom in/out, boundaries (min/max), keyboard shortcuts, error handling (read/write), invalid stored values, key event cleanup on unmount
   - Target: 100% coverage (statements, branches, functions, lines)

### Phase 2: UI Components

3. Create `src/components/ZoomInButton.tsx`:
   - Props: `{ onClick, disabled }`
   - lucide-react `ZoomIn` icon (w-5 h-5)
   - Standard button styling + `disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-paper`
   - `onPointerDown` stopPropagation (drag region)
   - `aria-label="Zoom in"`

4. Create `src/components/ZoomOutButton.tsx`:
   - Same pattern as ZoomInButton with `ZoomOut` icon and `aria-label="Zoom out"`

### Phase 3: Integration

5. Modify `src/index.css`:
   - Add `@keyframes zoom-indicator-fade` animation (from opacity:0 to opacity:1, 200ms)

6. Modify `src/components/TitleBar.tsx`:
   - Expand `TitleBarProps` with zoom props: `zoomLevel, onZoomIn, onZoomOut, isMinZoom, isMaxZoom`
   - Add zoom indicator span next to h1 title: `<span key={zoomLevel}>({zoomLevel}%)</span>` with subdued styling and animation
   - Import and render ZoomInButton + ZoomOutButton
   - Reorder buttons: PinyinToggle → ZoomInButton → ZoomOutButton → ThemeToggle → FullscreenToggle → CloseButton

7. Modify `src/components/TextDisplay.tsx`:
   - Add `zoomLevel` to props (optional, default 100)
   - Replace `text-2xl` Tailwind class with inline `style={{ fontSize: \`${1.5 * zoomLevel / 100}rem\` }}`
   - Keep `font-hanzi leading-[2.5] select-none cursor-default`

8. Modify `src/App.tsx`:
   - Import and call `useTextZoom()` hook
   - Pass zoom props to TitleBar
   - Pass `zoomLevel` to TextDisplay

### Phase 4: Test Updates & Config

9. Modify `src/App.test.tsx`:
   - Update "renders TitleBar with title and **six** buttons" test (4 → 6)
   - Update comment to reflect new button list

10. Modify `src-tauri/tauri.conf.json`:
    - Add `"zoomHotkeysEnabled": false` to the window configuration object

## Complexity Tracking

No constitution violations detected. No complexity justifications needed.
