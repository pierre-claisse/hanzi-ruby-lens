# Data Model: Palette Fonts

**Feature**: 020-palette-fonts
**Date**: 2026-02-20
**Revised**: 2026-02-21 — Latin fonts removed. Single CJK font per palette covers all text.

## Entity Changes

### Palette (modified)

The existing `ColorPalette` type gains a `font` attribute. No new
entities are introduced. No separate Latin font is needed — CJK fonts
include Latin glyphs that cover pinyin diacritics and UI text.

**Current shape**:

```text
ColorPalette
├── id: string (unique identifier, e.g., "vermillion-scroll")
├── name: string (display name)
├── lightName: string (light mode display name)
├── darkName: string (dark mode display name)
├── light: PaletteColors { background, text, accent }
└── dark: PaletteColors { background, text, accent }
```

**New shape**:

```text
ColorPalette
├── id: string
├── name: string
├── lightName: string
├── darkName: string
├── light: PaletteColors { background, text, accent }
├── dark: PaletteColors { background, text, accent }
└── font: string       ← NEW (CSS font-family name)
```

**Constraints**:
- `font` is the same in light and dark modes — a palette's typographic
  identity does not change with the theme.
- `font` MUST refer to a font-family name that is registered via
  `@font-face` at application startup.
- Each font-family name MUST be unique across palettes (no two palettes
  share the same font).

### Palette Font Assignments (static data)

| Palette ID          | `font`                        |
|---------------------|-------------------------------|
| `vermillion-scroll` | `"Cactus Classical Serif"`    |
| `jade-garden`       | `"LXGW WenKai TC"`            |
| `indigo-silk`       | `"Chiron Hei HK Variable"`    |
| `plum-blossom`      | `"Huninn"`                    |
| `golden-pavilion`   | `"Chiron Sung HK WS"`         |
| `ink-wash`          | `"Chocolate Classical Sans"`  |

**Note**: The exact CSS font-family names above are derived from each
npm package's `@font-face` declarations and were verified during
implementation.

## Persistence

No persistence changes required. The palette ID is already saved in
`localStorage` (key: `"colorPalette"`). Since the font is derived from
the palette definition (static data), restoring the palette ID
automatically restores the correct font.

## CSS Custom Properties (infrastructure)

One new CSS custom property is introduced alongside the existing color
properties:

```text
--font-palette    (set per [data-palette] selector)
```

This is consumed by the Tailwind `fontFamily.palette` configuration
and resolved at runtime by the browser's CSS engine. No JavaScript
reads or writes this variable — it flows from palette selection
(`data-palette` attribute on `<html>`) to rendered fonts entirely
through CSS. The body element applies `font-palette` which cascades
to all children.
