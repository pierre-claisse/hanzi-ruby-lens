# Implementation Plan: Color Palette System

**Branch**: `009-color-palettes` | **Date**: 2026-02-12 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/009-color-palettes/spec.md`

## Summary

Add 7 culturally-themed color palettes with a dropdown selector in the title bar. Colors applied via CSS `[data-palette]` attribute selectors — the `useColorPalette` hook sets a data attribute on `<html>` and CSS rules override `--color-background`, `--color-text`, `--color-accent` custom properties per palette and theme mode. Existing CSS properties renamed from `--color-paper`/`--color-ink`/`--color-vermillion` to generic names; Tailwind tokens renamed from `paper`/`ink`/`vermillion` to `surface`/`content`/`accent`. Palette toggle uses lucide-react `Palette` icon. Dropdown shows palette names with 3 color swatches (no icons). Full keyboard navigation: Enter to open/select, Up/Down arrows with wrapping, Tab or click-outside to dismiss. Preference persisted to localStorage. Refactoring: rename color tokens across all components + lift `useTheme` from ThemeToggle to App for theme-aware swatch rendering.

## Technical Context

**Language/Version**: TypeScript 5.5 (frontend), Rust stable (Tauri backend — no changes)
**Primary Dependencies**: React 18.3, Tailwind CSS 3.4, lucide-react 0.563.0 (`Palette` icon), @tauri-apps/api 2.0
**Storage**: Browser localStorage (key: `"colorPalette"`, value: palette ID string)
**Testing**: Vitest 2.0, @testing-library/react 16.0, @vitest/coverage-v8
**Target Platform**: Windows (Tauri 2 desktop app)
**Project Type**: Single (Tauri + React frontend)
**Performance Goals**: Color switch under 100ms (CSS-only via attribute selector)
**Constraints**: 100% hook test coverage, keyboard-accessible, 14 valid palette × theme combinations
**Scale/Scope**: 7 palettes, 3 tokens each, light/dark variants = 42 color values total

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Pre-Phase 0 Check

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Content-First Design | PASS | Palette dropdown is unobtrusive title bar control. Colors serve text readability. Transitions use CSS `transition-colors` (200-300ms). Both light and dark modes first-class (14 combinations). |
| II. Offline-First Data | JUSTIFIED | localStorage instead of SQLite for UI preference — consistent with existing useTheme, usePinyinVisibility, useTextZoom. Palette preference is view-layer state, not domain data. SQLite for a string would violate Principle IV. |
| III. DDD with CQRS | N/A | Color palettes are a UI presentation concern, not domain logic. No new entities, aggregates, or commands. Text and Word domain model unaffected. |
| IV. Principled Simplicity | PASS | Static 7-palette array (no database, no API). Single hook for state. CSS attribute selectors for color application. No speculative features. |
| V. Test-First Imperative | PASS | 100% hook coverage required (FR-026). Tests written before/alongside implementation. Tests run in Docker via existing pipeline. |
| VI. Docker-Only Execution | PASS | No changes to Docker pipeline. Existing `npm run test` / `npm run build` in Docker. |
| Visual Identity | PASS | Ruby annotations use accent color (FR-027 → `rt { color: rgb(var(--color-accent)); }`). All palettes provide accent tokens. |
| Domain Language | N/A | No new domain terms. Text/Word unaffected. |

### Post-Phase 1 Re-check

All gates remain PASS/JUSTIFIED/N/A. No new violations introduced by the design.

## Project Structure

### Documentation (this feature)

```text
specs/009-color-palettes/
├── plan.md              # This file
├── spec.md              # Feature specification
├── research.md          # Phase 0 research decisions
├── data-model.md        # Entity definitions and state machine
├── quickstart.md        # Implementation patterns and RGB reference
├── contracts/
│   └── interfaces.md    # TypeScript interface contracts
├── checklists/
│   └── requirements.md  # Spec quality checklist
└── tasks.md             # Phase 2 output (/speckit.tasks)
```

### Source Code (repository root)

```text
src/
├── data/
│   ├── sample-text.ts          # (existing)
│   └── palettes.ts             # NEW — 7 palette definitions
├── hooks/
│   ├── useTheme.ts             # (existing, unchanged)
│   ├── useTheme.test.ts        # (existing, unchanged)
│   ├── usePinyinVisibility.ts  # (existing, unchanged)
│   ├── useTextZoom.ts          # (existing, unchanged)
│   ├── useColorPalette.ts      # NEW — palette state + persistence + data-attribute
│   └── useColorPalette.test.ts # NEW — 100% coverage tests
├── components/
│   ├── TitleBar.tsx             # MODIFIED — add PaletteSelector, accept theme + palette props, rename color classes
│   ├── ThemeToggle.tsx          # MODIFIED — refactor to props-driven, rename color classes
│   ├── ThemeToggle.test.tsx     # MODIFIED — update for props-driven interface
│   ├── PinyinToggle.tsx         # MODIFIED — rename color classes (bg-paper→bg-surface, etc.)
│   ├── FullscreenToggle.tsx     # MODIFIED — rename color classes
│   ├── CloseButton.tsx          # MODIFIED — rename color classes
│   ├── ZoomInButton.tsx         # MODIFIED — rename color classes
│   ├── ZoomOutButton.tsx        # MODIFIED — rename color classes
│   ├── TextDisplay.tsx          # MODIFIED — rename color classes (text-ink/50 → text-content/50)
│   ├── PaletteSelector.tsx      # NEW — toggle button + dropdown component
│   ├── RubyWord.tsx             # MODIFIED — rename color classes (hover:bg-vermillion/24, ring-vermillion)
│   └── RubyWord.test.tsx        # MODIFIED — rename color class assertions
├── App.tsx                      # MODIFIED — add useColorPalette, lift useTheme, rename color classes
├── App.test.tsx                 # MODIFIED — button count 6→7
├── index.css                    # MODIFIED — rename properties + add [data-palette] CSS rules
└── tailwind.config.ts           # MODIFIED — rename color tokens (paper→surface, ink→content, vermillion→accent)
```

**Structure Decision**: Follows the existing single-project structure. New files placed alongside existing files in their respective directories (`data/`, `hooks/`, `components/`).

## Architecture Decisions

### 1. Color Application: CSS `[data-palette]` Attribute Selectors

The hook sets `document.documentElement.dataset.palette = paletteId`. CSS rules like `[data-palette="jade-garden"]` and `.dark[data-palette="jade-garden"]` override `--color-background`, `--color-text`, `--color-accent` custom properties. Tailwind utility classes (`bg-surface`, `text-content`, `text-accent`) resolve automatically — once the token rename is done, zero further component changes needed for palette switching.

**Why not JS `setProperty()`?** Would require the palette hook to know the current theme and react to theme changes. CSS selectors handle this orthogonally.

### 2. ThemeToggle Refactoring: Lift useTheme to App

Currently ThemeToggle calls `useTheme()` internally (self-contained). PaletteSelector needs the current theme for swatch rendering (spec edge case #4: theme switch while dropdown is open updates immediately). Lifting `useTheme()` to App and passing props down makes theme a shared concern — same pattern as PinyinToggle.

**Impact**: ThemeToggle.tsx interface changes (receives `theme` + `onToggle` props). ThemeToggle.test.tsx simplified (no localStorage mock needed — hook tested separately). App.tsx orchestrates both useTheme and useColorPalette.

### 3. Dropdown: `aria-activedescendant` Focus Pattern

DOM focus stays on the PaletteSelector container. A `focusedIndex` state tracks the visually highlighted item. `aria-activedescendant` points to the focused item's ID. Tab naturally moves focus to the next title bar element, triggering `onBlur` to close the dropdown.

### 4. Click-Outside: `mousedown` Document Listener

Added when dropdown opens, removed when it closes. Uses `contains()` to check if the click target is inside the component. The toggle button uses `onPointerDown` with `stopPropagation()` (existing title bar pattern) to prevent the outside listener from firing on toggle clicks.

### 5. CSS Token Rename: Generic Names

CSS custom properties renamed to `--color-background`, `--color-text`, `--color-accent`. Tailwind tokens renamed to `surface`, `content`, `accent` (avoiding `text-text` and `bg-background` collisions). All existing component class names updated via find-and-replace: `bg-paper`→`bg-surface`, `text-ink`→`text-content`, `border-ink/*`→`border-content/*`, `ring-vermillion`→`ring-accent`, etc. See [research.md §9](research.md) for full rationale.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| localStorage instead of SQLite (Principle II) | UI preference string, not domain data | SQLite for a single string preference contradicts Principle IV (YAGNI/KISS). Consistent with useTheme, usePinyinVisibility, useTextZoom. |
