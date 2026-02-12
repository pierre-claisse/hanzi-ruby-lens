# Research: Text Scaling Controls (008-text-scaling)

**Date**: 2026-02-12

## R1: Preventing Browser Default Zoom in Tauri 2

**Decision**: Use `e.preventDefault()` in JavaScript keydown handler + add `zoomHotkeysEnabled: false` to `tauri.conf.json` as defense-in-depth.

**Rationale**: Tauri 2 uses WRY which wraps WebView2 on Windows. WebView2 has built-in Ctrl+/- zoom that conflicts with custom zoom. Two-layer prevention ensures reliable behavior:
1. `e.preventDefault()` in the keydown handler intercepts the event before the webview processes it
2. `zoomHotkeysEnabled: false` in tauri.conf.json disables WebView2's `IsZoomControlEnabled` setting at the platform level, handling Ctrl+=, Ctrl++, Ctrl+-, and Ctrl+MouseWheel

**Alternatives considered**:
- `tauri-plugin-prevent-default` crate: More granular control but adds a Rust dependency for something achievable with config + JS
- JavaScript-only approach: Works but timing issues possible on first document load
- Config-only approach: Works but doesn't intercept the event for our custom handler

**Sources**: Tauri GitHub issues #7418, WRY #569, WebView2 IsZoomControlEnabled docs

## R2: CSS Font-Size Scaling with Ruby Elements

**Decision**: Apply inline `fontSize` on TextDisplay container; remove Tailwind `text-2xl` class to avoid conflict.

**Rationale**: The `<rt>` element has a default `font-size: 50%` relative to its parent in browser user-agent stylesheets. Changing the parent container's `font-size` scales both Chinese characters and ruby annotations proportionally. This satisfies FR-008 (proportional scaling) and SC-004 (pinyin ~50% of base).

**Key findings**:
- `rt` default font-size is 50% of parent (CSS Ruby spec) — scales automatically
- `line-height` does NOT affect ruby annotation spacing (W3C CSSWG Issue #4979) — browser calculates ruby spacing independently based on annotation height
- Unitless `line-height: 2.5` still provides proper inter-line spacing (scales with font-size)
- Chromium minimum font-size setting (default 10px) could clip annotations at extreme zoom-out — at 50% zoom, base = 0.75rem = 12px, rt = 6px which is below 10px default minimum. Mitigation: this is a browser setting, not app-controllable. At 50% zoom, pinyin may render at 10px minimum instead of 6px. Acceptable trade-off per spec.

**Zoom formula**: `fontSize = 1.5rem * (zoomLevel / 100)`
- Base: 1.5rem (equivalent to Tailwind `text-2xl` at default root size)
- At 50%: 0.75rem → rt at ~0.375rem
- At 100%: 1.5rem → rt at ~0.75rem (current behavior)
- At 200%: 3rem → rt at ~1.5rem

**Alternatives considered**:
- CSS `transform: scale()`: Doesn't reflow text, keeps original container dimensions
- CSS `zoom` property: Non-standard, not in CSS spec (works in Chromium but not recommended)
- CSS custom property with `calc()`: More complex, no meaningful benefit over inline style
- Changing root `font-size`: Would affect title bar and all other elements

## R3: Lucide React Zoom Icons

**Decision**: Use `ZoomIn` and `ZoomOut` from lucide-react.

**Rationale**: Both icons are available in lucide-react ^0.563.0 (installed version). They render as magnifying glass with + and - symbols, which are universally recognizable zoom controls. Matches user requirement: "lucide react zoom-in icon for zoom-in and zoom-out icon for zoom-out."

**Import**: `import { ZoomIn, ZoomOut } from "lucide-react";`

**Icon appearance**:
- ZoomIn: Magnifying glass circle with + (plus) crosshair inside
- ZoomOut: Magnifying glass circle with - (minus) line inside

## R4: Disabled Button Styling Pattern

**Decision**: Use HTML `disabled` attribute with Tailwind `disabled:` variant classes.

**Rationale**: Standard HTML `disabled` attribute prevents click events, removes button from tab order when disabled, and enables CSS `:disabled` pseudo-class styling. Tailwind's `disabled:` variant provides clean conditional styling without JavaScript class toggling.

**Styling**: Add to existing button class string:
```
disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-paper
```

**Tab order note**: Disabled buttons are excluded from tab order by default (HTML spec). When zoom-in is disabled at 200%, Tab skips it: Pinyin → Zoom out → Theme → Fullscreen → Close. The ORDER is preserved, just with a skip. This is standard web behavior and consistent with FR-026 ("follow same order as visual layout").

## R5: Zoom Indicator Smooth Transition

**Decision**: Use React `key` prop to trigger CSS animation on zoom level change.

**Rationale**: The spec requires "smooth transition (animated change, not instant snap)" for the zoom indicator (FR-021). Since the indicator text content changes (e.g., "(100%)" → "(110%)"), CSS transitions don't apply (text content isn't a CSS property). Using React's `key={zoomLevel}` remounts the span element on each change, triggering a CSS `@keyframes` fade-in animation.

**Implementation**: Define a keyframe animation in index.css or tailwind config:
```css
@keyframes zoom-indicator-fade {
  from { opacity: 0; }
  to { opacity: 1; }
}
```
Apply via `<span key={zoomLevel} style={{ animation: 'zoom-indicator-fade 200ms ease-in-out' }}>({zoomLevel}%)</span>`

**Duration**: 200ms aligns with constitution's "200-300ms ease" guideline for state changes.

**Alternatives considered**:
- Framer Motion / React Spring: Overkill for a single text fade
- CSS transition on opacity with state toggle: More complex, requires state management for animation
- Counter animation (number rolling): More complex, spec doesn't require this level of sophistication

## R6: Hook State Management Pattern

**Decision**: Follow established hook pattern with functional state updates.

**Rationale**: The existing hooks (useTheme, usePinyinVisibility, useFullscreen) establish a consistent pattern:
1. `useState` with lazy initializer for localStorage read
2. `useEffect` for localStorage persistence on state change
3. Try-catch error handling with `console.error` fallback

For useTextZoom, the keyboard event handler uses `setZoomLevel(prev => ...)` (functional updates) to avoid stale closures. This allows the keydown `useEffect` to have empty dependencies (since `setZoomLevel` from `useState` is guaranteed stable).

**State shape**: `useTextZoom` returns an object `{ zoomLevel, zoomIn, zoomOut, isMinZoom, isMaxZoom }` similar to `useFullscreen`'s object return pattern.

**Constants**:
- `MIN_ZOOM = 50`
- `MAX_ZOOM = 200`
- `DEFAULT_ZOOM = 100`
- `ZOOM_STEP = 10`
- `STORAGE_KEY = "textZoomLevel"`

**Validation on load**: Parsed value must be integer, multiple of 10, within [50, 200]. Invalid values fall back to 100.
