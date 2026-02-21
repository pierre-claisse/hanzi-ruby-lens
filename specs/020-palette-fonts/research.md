# Research: Palette Fonts

**Feature**: 020-palette-fonts
**Date**: 2026-02-20

## Decision 1: Font Sourcing Strategy

**Decision**: All 6 CJK fonts are available on npm. Use npm packages
exclusively — no manual font downloads required. No separate Latin font
packages needed — CJK fonts include Latin glyphs covering pinyin
diacritics and UI text.

**Rationale**: npm packages provide versioned, reproducible font delivery.
Fontsource packages handle `@font-face` declarations and unicode-range
subsetting automatically. The only exception is Chiron Sung HK, which
uses the author's own npm package (`chiron-sung-hk-webfont`) instead of
fontsource.

**Alternatives considered**:
- Self-hosted WOFF2 files in `src/fonts/`: rejected because all fonts
  have npm packages, adding files to git would bloat the repository
  unnecessarily.
- Google Fonts CDN: rejected — violates FR-007 (no runtime network
  requests) and constitution principle II (Offline-First Data).

### Font Package Matrix

| Palette           | CJK Font         | CJK Package                              | CJK Type |
|-------------------|------------------|------------------------------------------|----------|
| Vermillion Scroll | Cactus Classical Serif | `@fontsource/cactus-classical-serif` | Static   |
| Jade Garden       | LXGW WenKai TC   | `@fontsource/lxgw-wenkai-tc`            | Static   |
| Indigo Silk       | Chiron Hei HK    | `@fontsource-variable/chiron-hei-hk`    | Variable |
| Plum Blossom      | Huninn           | `@fontsource/huninn`                    | Static   |
| Golden Pavilion   | Chiron Sung HK   | `chiron-sung-hk-webfont`                | Variable |
| Ink Wash          | Chocolate Classical Sans | `@fontsource/chocolate-classical-sans` | Static |

**Note**: 6 font packages total. No dedicated fallback font needed —
fonts are bundled locally in a Tauri desktop app. Latin font packages
are not needed — CJK fonts cover the entire UI.

## Decision 2: CSS Font Switching Mechanism

**Decision**: Use a single CSS custom property (`--font-palette`) set per
`[data-palette]` block, referenced by Tailwind's `fontFamily.palette`
config via `var()`. The body element applies `font-palette` class which
cascades to all children via CSS inheritance.

**Rationale**: This extends the existing palette-switching pattern
(CSS custom properties for colors on `[data-palette]` selectors). Font
changes happen via the same mechanism — zero JavaScript overhead, instant
CSS variable resolution.

**Alternatives considered**:
- Dynamic JavaScript class swapping: rejected — more complex, breaks
  the existing CSS-only pattern, requires hook changes.
- Separate font preference with its own persistence: rejected — FR-006
  requires fonts to be tied to palette selection.

### Implementation Pattern

```css
/* In index.css — each palette block gains a font variable */
[data-palette="vermillion-scroll"] {
  --color-background: 254 252 243;
  --color-text: 45 45 45;
  --color-accent: 200 75 49;
  --font-palette: "Cactus Classical Serif";
}
```

```ts
// In tailwind.config.ts — single font family references the CSS variable
fontFamily: {
  palette: ['var(--font-palette)', 'sans-serif'],
},
```

No dedicated fallback font is bundled. In a Tauri desktop app, all fonts
are compiled into `dist/assets/` by Vite — they load from local disk,
making font loading failures effectively impossible. The generic
`sans-serif` fallback covers the theoretical edge case.

## Decision 3: Font Weight Selection

**Decision**: Import only Regular weight (400) for all fonts. For
variable fonts, import the default axis range but only use weight 400.

**Rationale**: The application does not use bold CJK text or bold pinyin.
The title bar text is UI chrome (small, non-CJK). Limiting to weight 400
minimizes bundle size without impacting the user experience.

**Alternatives considered**:
- Multiple weights (400 + 700): rejected — no current use case for bold
  Chinese text. Doubles CJK font size for no benefit.
- Full weight range: rejected — same reasoning, even worse size impact.

## Decision 4: Fontsource Import Strategy

**Decision**: Import each font in `main.tsx` alongside existing imports.
For static fonts, import only weight 400. For variable fonts, the default
import includes all weights on the variable axis.

**Rationale**: Fontsource's import convention registers `@font-face`
declarations globally. Importing in `main.tsx` (the entry point) ensures
fonts are available before any component renders.

### Import Pattern

```ts
// main.tsx — CJK fonts
import "@fontsource/cactus-classical-serif";
import "@fontsource/chocolate-classical-sans";
import "@fontsource/lxgw-wenkai-tc";
import "@fontsource-variable/chiron-hei-hk";
import "@fontsource/huninn";
import "chiron-sung-hk-webfont/css/vf.css";
```

### Font Family Names (for CSS variables)

These names are determined by each package's `@font-face` declarations:

| Package                                  | CSS `font-family` name       |
|------------------------------------------|------------------------------|
| `@fontsource/cactus-classical-serif`     | `"Cactus Classical Serif"`   |
| `@fontsource/lxgw-wenkai-tc`            | `"LXGW WenKai TC"`           |
| `@fontsource-variable/chiron-hei-hk`    | `"Chiron Hei HK Variable"`   |
| `@fontsource/huninn`                    | `"Huninn"`                   |
| `chiron-sung-hk-webfont` (vf.css)       | `"Chiron Sung HK WS"`        |

**Note**: These family names were verified during implementation.
Chiron Sung HK uses `"Chiron Sung HK WS"` (not `"Chiron Sung HK VF"`
as originally expected from the package name).

## Decision 5: Bundle Size Impact

**Decision**: Accept the significant bundle size increase. The spec
explicitly states this tradeoff is accepted.

**Estimated additional WOFF2 data**:

| Font               | Estimated WOFF2 size |
|--------------------|---------------------|
| Cactus Classical Serif | ~6 MB           |
| LXGW WenKai TC     | ~8 MB               |
| Chiron Hei HK      | ~10 MB              |
| Huninn             | ~5 MB               |
| Chiron Sung HK     | ~10 MB              |
| **Total new fonts**| **~39 MB**          |

Current installer: ~7 MB. Post-feature installer: estimated ~46 MB.
No Latin font packages needed — CJK fonts cover pinyin and UI text.

## Decision 6: No FOUT Risk

**Decision**: No special FOUT prevention needed for bundled local fonts.

**Rationale**: FOUT (Flash of Unstyled Text) occurs when web fonts load
asynchronously over the network. In a Tauri desktop app, Vite bundles all
font WOFF2 files into `dist/assets/`. The WebView loads them from local
disk — effectively instant. The CSS `font-display` value is irrelevant
because fonts are already available when the page renders.

**Alternatives considered**:
- Preloading fonts with `<link rel="preload">`: unnecessary for local
  assets but harmless if added.
- Font loading API (`document.fonts.ready`): overkill — no async loading.
