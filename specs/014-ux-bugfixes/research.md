# Research: UX Bugfixes

## Decision 1: Layout Width Strategy

**Decision**: Remove `max-w-2xl` entirely — no max-width cap. Text flows to window edges with side padding only.

**Rationale**: This is a desktop-only reading app. The user explicitly requested edge-to-edge flow. Combined with 1600×900 default window, this gives maximum reading space. CJK text reads well at wider widths because characters are uniform-width (unlike proportional Latin text which becomes hard to scan at long line lengths).

**Alternatives considered**:
- `max-w-4xl` (896px) — still constraining, wastes space on wide windows
- `max-w-5xl` (1024px) — better but still arbitrary
- Responsive breakpoint switching — over-engineering for a desktop-only app

## Decision 2: Context Menu Hover Fix

**Decision**: When `menuOpen` is true, `handleWordHover` returns immediately without updating `trackedIndex` or closing the menu.

**Rationale**: The menu already has proper close mechanisms: click-outside (mousedown handler), keyboard dismiss (arrow keys navigate away, which closes menu). The only broken path is hover — hovering adjacent words while moving the mouse toward the menu shouldn't change anything. This is the simplest possible fix: a one-line early return.

**Alternatives considered**:
- Adding a "dead zone" between word and menu — complex geometry calculation, fragile across zoom levels
- Debouncing hover events — adds latency to normal hover, affects responsiveness
- Using `pointer-events: none` on words while menu is open — would break click-outside detection

## Decision 3: Pinyin Ruby Alignment

**Decision**: Move `ruby-align: center` from `rt` to `ruby` element in CSS. This tells the browser to center the annotation text over the entire ruby base as a single unit.

**Rationale**: The W3C CSS Ruby spec defines `ruby-align` as a property that controls how ruby annotation boxes align with their base boxes. When set to `center`, the annotation should center over the combined base. Currently it's on `rt` which may not have the intended effect in Chromium. Moving it to `ruby` is the spec-compliant approach.

**Alternatives considered**:
- JavaScript post-processing to split pinyin per character — complex, requires syllable boundary detection, and the spec says pinyin MUST be "displayed as a single unit per Word" (constitution Domain Language)
- `ruby-merge: merge` — not supported in current Chromium
- Wrapping base characters in `<span>` — changes HTML semantics, may introduce other rendering issues
- `display: inline-flex` on `rt` — violates ruby layout model, inconsistent results

**Fallback**: If `ruby-align: center` on `ruby` doesn't resolve in WebView2, add `text-align: center` to `rt` as a supplementary fix.

## Decision 4: Scrollbar Styling Approach

**Decision**: Use `::-webkit-scrollbar` pseudo-elements with CSS custom properties from the palette system.

**Rationale**: WebView2 is Chromium-based and fully supports `::-webkit-scrollbar`. The palette system already defines `--color-background` and `--color-text` as CSS custom properties that update when palette/theme changes. Using these in scrollbar styles means the scrollbar automatically updates — no JavaScript needed.

**Alternatives considered**:
- `scrollbar-color` CSS property (Firefox-only standardized approach) — not supported in Chromium/WebView2
- Custom overlay scrollbar library (e.g., OverlayScrollbars) — dependency overhead for a simple cosmetic fix
- JavaScript-driven scrollbar — over-engineering

**Design**: Thin scrollbar (8px), rounded thumb, uses `--color-text` at low opacity for thumb, `--color-background` for track. Subtle hover effect on thumb.
