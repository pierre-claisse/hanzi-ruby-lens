# Research: Ruby Text Display

**Feature**: 002-ruby-text-display
**Date**: 2026-02-09

## R1: HTML Ruby Markup for Word-Level Pinyin

**Decision**: Use group ruby — bare text + `<rt>` inside `<ruby>`, no `<rb>`.

**Rationale**: Group ruby renders a single pinyin string above the entire
Word (e.g., "xiànzài" over 現在). The `<rb>` element is deprecated in the
HTML Living Standard. The `<rp>` element provides graceful degradation in
non-supporting browsers.

**Structure**:
```html
<ruby>現在<rp>(</rp><rt>xiànzài</rt><rp>)</rp></ruby>
```

**Alternatives considered**:
- Mono ruby (per-character `<rt>`): rejected — splits pinyin per character,
  violates FR-003 and the constitutional Word definition.
- `<rb>` element: rejected — deprecated per WHATWG Living Standard.

## R2: CSS Styling for Ruby Annotations

**Decision**: Use global `@layer base` rules for `rt` defaults; Tailwind
utilities for container spacing; arbitrary values where needed.

**Key findings**:
- Browser default `font-size: 50%` on `<rt>` matches FR-008 — keep it.
- `ruby-position: over` places pinyin above characters (default, safe in
  Chromium 84+, well within WebView2 baseline).
- `ruby-align: center` centers pinyin above base text (Chrome 128+, safe
  for current WebView2).
- **Line-height is critical**: container needs `line-height: 2.5–3.0` to
  prevent ruby overlap with the line above. Set on the parent, not on `rt`.
- `white-space: nowrap` on `<ruby>` keeps Word + pinyin together as a unit.
- Hover effects on `<ruby>` work with standard CSS `:hover` / Tailwind
  `hover:` prefix — no workarounds needed.

**Alternatives considered**:
- Tailwind utility-only approach: rejected — `ruby-position` and
  `ruby-align` have no Tailwind utilities; need CSS `@layer` rules.
- Inline styles: rejected — constitution requires consistent spacing scale;
  Tailwind utilities are more maintainable.

## R3: Font Loading Strategy

**Decision**: Self-hosted via Fontsource variable packages.

**Packages**:
- `@fontsource-variable/noto-sans-tc` (~4.4 MB, 101 unicode-range chunks)
- `@fontsource-variable/inter` (~1.9 MB, 7 subsets)

**Rationale**: Offline-first constitution (Principle II) requires bundled
fonts. Variable packages are dramatically smaller than static (4.4 MB vs
68.7 MB for Noto Sans TC). Fontsource handles `@font-face` declarations
and unicode-range splitting automatically. Vite copies woff2 files to
`dist/assets/` at build time.

**Font family names** (as declared by Fontsource):
- `"Noto Sans TC Variable"` (Chinese text)
- `"Inter Variable"` (pinyin and UI text)

**Alternatives considered**:
- CDN loading: rejected — violates offline-first constitution.
- Static font packages (`@fontsource/noto-sans-tc`): rejected — 68.7 MB
  is excessive; variable fonts cover all weights in one file.
- Manual `@font-face`: rejected — Fontsource automates this with proper
  unicode-range splitting.

## R4: Tailwind Theme System (Ink & Vermillion)

**Decision**: CSS custom properties with raw RGB channels + Tailwind
semantic color names + `selector` dark mode strategy.

**Palette** (RGB channels for Tailwind `<alpha-value>` compatibility):

| Token       | Light                | Dark                 |
|-------------|----------------------|----------------------|
| `paper`     | 254 252 243 (#FEFCF3)| 26 26 46 (#1A1A2E)  |
| `ink`       | 45 45 45 (#2D2D2D)  | 245 240 232 (#F5F0E8)|
| `vermillion`| 200 75 49 (#C84B31) | 200 75 49 (#C84B31) |

**Dark mode strategy**: `darkMode: "selector"` in Tailwind config. Toggling
the `dark` class on `<html>` swaps all CSS variable values. This enables a
light/dark/system three-way toggle.

**Key pattern**: CSS variables store raw channel values (`--color-paper:
254 252 243`), not `rgb()` strings. This allows Tailwind's opacity modifier
to work: `bg-paper/50` → `rgb(254 252 243 / 0.5)`.

**Hover effect**: `hover:bg-vermillion/[0.08]` produces an 8% opacity
vermillion wash. Extend `opacity: { "8": "0.08" }` in config for cleaner
syntax (`hover:bg-vermillion/8`).

**Transitions**: Tailwind's `transition-colors duration-200 ease-in-out`
or `duration-300` covers the constitutional 200–300 ms range exactly.

**Alternatives considered**:
- `media` dark mode strategy: rejected — no user toggle, only follows OS.
- `dark:` prefix on every utility: rejected — CSS variable approach is
  cleaner, no `dark:` prefixes in JSX.
- Pre-built theme libraries (daisyUI, shadcn themes): rejected — YAGNI;
  three colors with CSS variables is simpler.

## R5: WebView2/Chromium Compatibility

**Decision**: Target Chrome 105+ features (Vite build target is already
`chrome105`). Ruby features available:

| Feature                | Chrome Version | Available |
|------------------------|---------------|-----------|
| `<ruby>`, `<rt>`, `<rp>` | 5+         | Yes       |
| `ruby-position: over`  | 84+           | Yes       |
| `ruby-align: center`   | 128+          | Yes       |
| Line-breakable ruby     | 128+          | Yes       |

WebView2 auto-updates with Edge. As of February 2026, Edge stable is well
past version 128. No compatibility concerns.

**Caveat**: Chromium has a minimum font size setting that could clamp small
ruby text. Not an issue in Tauri where we control the WebView config.

## R6: Non-Word Content Handling

**Decision**: Render non-Word content (punctuation, numbers, spaces) as
bare text nodes alongside `<ruby>` elements. No special wrapper needed.

**Rationale**: The distinction is Word vs non-Word, not Chinese vs
non-Chinese. Chinese punctuation (。，！？「」) is Chinese content but has
no pinyin — it is not a Word. Non-Word text aligns to the same baseline.
The generous `line-height` applies uniformly. Chinese punctuation is
fullwidth and aligns naturally. Numbers and Latin text are narrower but
this is acceptable — no layout issues observed.

**Alternatives considered**:
- Wrapping non-Word content in `<span>`: unnecessary complexity unless
  specific styling is needed later.
