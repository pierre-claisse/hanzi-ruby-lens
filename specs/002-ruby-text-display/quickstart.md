# Quickstart: Ruby Text Display

**Feature**: 002-ruby-text-display
**Date**: 2026-02-09

## Prerequisites

- Docker Desktop running in Windows containers mode
- Node.js and npm installed

## Verify

### Run tests

```bash
npm run test
```

Expected: All Vitest frontend tests pass (RubyWord, TextDisplay,
MinWidthOverlay). Cargo tests pass unchanged.

### Build the application

```bash
npm run build
```

Expected: Build completes. The `.exe` appears in `output/`.

### Manual verification

1. Launch the built application.
2. Verify: Chinese text with pinyin ruby annotations is visible.
3. Verify: Pinyin appears above each Word as a single unit (e.g.,
   "xiànzài" above 現在, not split per character).
4. Verify: Punctuation and numbers appear inline without ruby.
5. Verify: Hovering a Word highlights it with a warm background and
   emphasizes the pinyin (200–300 ms transition).
6. Verify: Resizing the window below 400px shows the minimum-width
   overlay. Enlarging past 400px restores the text.
7. Verify: Light and dark modes both render correctly with the Ink &
   Vermillion palette (warm off-white / deep ink background).

## What changed

### New dependencies

- `@fontsource-variable/noto-sans-tc` — Chinese text font (bundled)
- `@fontsource-variable/inter` — Pinyin/UI font (bundled)

### New files

| File | Purpose |
|------|---------|
| `src/types/domain.ts` | Word and Text TypeScript types |
| `src/data/sample-text.ts` | Hardcoded sample Text with Words |
| `src/components/RubyWord.tsx` | Single Word with `<ruby>` annotation |
| `src/components/TextDisplay.tsx` | Full Text rendering |
| `src/components/MinWidthOverlay.tsx` | Below-400px overlay |
| `src/hooks/useMinWidth.ts` | Window width tracking |

### Modified files

| File | Change |
|------|--------|
| `src/main.tsx` | Font imports added |
| `src/index.css` | CSS variables for theme, ruby base styles |
| `src/App.tsx` | Renders TextDisplay instead of placeholder |
| `tailwind.config.ts` | Dark mode, semantic colors, font families |
