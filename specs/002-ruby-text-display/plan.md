# Implementation Plan: Ruby Text Display

**Branch**: `002-ruby-text-display` | **Date**: 2026-02-09 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/002-ruby-text-display/spec.md`

## Summary

Display hardcoded Chinese Words with pinyin ruby annotations using HTML
`<ruby>` elements. Frontend-only (React + TypeScript + Tailwind CSS) with
the Ink & Vermillion (水墨風) visual theme, light/dark mode, and Word hover
interactions. No backend logic, no LLM, no persistence.

## Technical Context

**Language/Version**: TypeScript 5.x (frontend), Rust stable (Tauri shell — no changes)
**Primary Dependencies**: React 18, Tailwind CSS 3.x, @fontsource-variable/noto-sans-tc, @fontsource-variable/inter
**Storage**: N/A (hardcoded data, no persistence)
**Testing**: Vitest + @testing-library/react (frontend), cargo test (Tauri shell — no new Rust tests)
**Target Platform**: Windows (Tauri 2 / WebView2)
**Project Type**: Single project (Tauri: `src/` frontend + `src-tauri/` backend)
**Performance Goals**: Initial render < 2 seconds; hover transitions 200–300 ms
**Constraints**: Minimum window width 400px (below: overlay). Offline-capable fonts (bundled).
**Scale/Scope**: One hardcoded Text, ~20–50 Words. Single screen, no navigation.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| # | Principle | Status | Notes |
|---|-----------|--------|-------|
| I | Content-First Design | PASS | Chinese text + ruby is the only visual focus. Minimal UI chrome (no controls beyond hover). Generous whitespace via Tailwind spacing. Transitions 200–300 ms. Light + dark first-class. |
| II | Offline-First Data | PASS (SHOULD, justified) | No data storage in this feature — hardcoded Words. No network calls. Fonts bundled locally via Fontsource. The principle applies to "generated data" which does not exist yet; no violation. |
| III | DDD with CQRS | PASS (SHOULD, justified) | No domain logic in this feature — display only with hardcoded data. Text and Word are represented as TypeScript types matching the constitutional definitions. No commands, no queries, no events. Full DDD/CQRS infrastructure deferred to features that involve persistence and mutation. |
| IV | Principled Simplicity | PASS | No speculative features. Three Tailwind colors, two font families, one component tree. No abstractions beyond Word and Text data types. |
| V | Test-First Imperative | PASS | Vitest tests run inside Docker (existing pipeline). Tests will cover Word rendering, Text composition, hover behavior, and minimum-width overlay. |
| VI | Docker-Only Execution | PASS | All tests and builds execute via existing Docker pipeline (`npm run test`, `npm run build`). No new local tooling. |

**Post-design re-check**: All gates still pass. No new violations introduced
by research decisions (Fontsource fonts, CSS variables, ruby markup).

## Project Structure

### Documentation (this feature)

```text
specs/002-ruby-text-display/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
└── tasks.md             # Phase 2 output (/speckit.tasks)
```

### Source Code (repository root)

```text
src/
├── main.tsx                    # App entry — font imports added here
├── index.css                   # Tailwind layers + CSS variables (theme)
├── App.tsx                     # Root component — renders TextDisplay
├── App.test.tsx                # Updated root test
├── data/
│   └── sample-text.ts          # Hardcoded Text and Words
├── types/
│   └── domain.ts               # Word and Text TypeScript types
├── components/
│   ├── RubyWord.tsx            # Single Word with ruby annotation
│   ├── RubyWord.test.tsx       # Word rendering tests
│   ├── TextDisplay.tsx         # Full Text as sequence of Words
│   ├── TextDisplay.test.tsx    # Text composition tests
│   ├── MinWidthOverlay.tsx     # Below-400px overlay
│   └── MinWidthOverlay.test.tsx
├── hooks/
│   └── useMinWidth.ts          # Window width tracking hook
└── test/
    └── setup.ts                # Existing test setup
```

**Structure Decision**: Extends the existing `src/` layout. New directories:
`data/` (hardcoded content), `types/` (domain types), `components/`
(React components), `hooks/` (custom hooks). No changes to `src-tauri/`.

### Configuration Changes

```text
tailwind.config.ts              # Add darkMode, colors, fontFamily
package.json                    # Add font dependencies
```

## Architecture

### Data Flow

```
sample-text.ts (hardcoded)
    ↓
  TextDisplay component
    ↓ maps Words
  RubyWord component (per Word)
    ↓ renders
  <ruby>characters<rt>pinyin</rt></ruby>
```

### Component Hierarchy

```
App
└── TextDisplay
    ├── RubyWord (×N, one per Word)
    │   └── <ruby>...<rt>pinyin</rt></ruby>
    ├── (bare text nodes for punctuation/spaces)
    └── MinWidthOverlay (conditional, < 400px)
```

### Theme Architecture

CSS custom properties define the palette. Tailwind maps semantic names
(`paper`, `ink`, `vermillion`) to those variables. Dark mode toggles via
the `dark` class on `<html>`, swapping variable values. No `dark:` prefixes
in component JSX.

```
:root                     → light mode variables
.dark                     → dark mode variable overrides
tailwind.config.ts        → semantic color names → CSS vars
components                → bg-paper, text-ink, text-vermillion
```

### Font Strategy

Fontsource variable packages bundled at build time. Vite copies woff2
files to `dist/assets/`. WebView2 loads only the unicode-range chunks
actually needed at runtime.

- `font-hanzi`: Noto Sans TC Variable (Chinese characters)
- `font-sans`: Inter Variable (pinyin, UI text), fallback to system

## Complexity Tracking

No violations to justify. All constitution gates pass.
