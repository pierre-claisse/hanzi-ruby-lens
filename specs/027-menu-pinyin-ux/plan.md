# Implementation Plan: Adaptive Menu Positioning & Numbered Pinyin Input

**Branch**: `027-menu-pinyin-ux` | **Date**: 2026-02-24 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/027-menu-pinyin-ux/spec.md`

## Summary

Two frontend UX improvements: (1) context menu opens above words in the lower half of the viewport instead of always below, and (2) the pinyin correction input displays/accepts numbered tones (e.g., "xi3huan1") and converts to diacritical format ("xǐhuān") on submission. No backend changes. Two new TypeScript utility functions for bidirectional pinyin conversion, plus a positioning change in `getMenuPosition`.

## Technical Context

**Language/Version**: TypeScript 5.9 (frontend), no Rust changes
**Primary Dependencies**: React 19, Tailwind CSS 3.4 (existing)
**Storage**: No changes — backend continues to store diacritical pinyin in SQLite
**Testing**: Vitest + @testing-library/react (unit tests for conversion utilities)
**Target Platform**: Windows (Tauri 2 desktop)
**Project Type**: Tauri desktop app (frontend + backend)
**Performance Goals**: Conversion functions must be instantaneous (<1ms for any valid pinyin string)
**Constraints**: Offline-only, no new dependencies
**Scale/Scope**: 2 new utility functions, 3 modified components, ~200 lines of new code

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Content-First Design | PASS | Menu positioning improves readability; numbered input is transient (editing only) |
| II. Offline-First Data | PASS | No network required; all conversion is client-side |
| III. DDD with CQRS | PASS | No new commands; existing `update_pinyin` unchanged; pinyin remains diacritical in storage |
| IV. Principled Simplicity | PASS | Two pure functions + one positioning change; no new abstractions |
| V. Test-First | PASS | Conversion utilities are pure functions, ideal for unit testing |
| VI. Docker-Only Execution | PASS | Tests run in existing Docker container via `npm test` |
| Domain: Word pinyin format | PASS | Storage format stays diacritical; numbered is UI-only |
| Domain: Text immutability | PASS | No text content changes |

**Post-design re-check**: All gates still pass. No new backend commands, no schema changes, no new dependencies.

## Project Structure

### Documentation (this feature)

```text
specs/027-menu-pinyin-ux/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── pinyin-conversion.md
├── checklists/
│   └── requirements.md
└── tasks.md
```

### Source Code (files to create/modify)

```text
src/
├── utils/
│   └── pinyinConversion.ts    # NEW — diacriticalToNumbered, numberedToDiacritical
├── components/
│   ├── TextDisplay.tsx         # MODIFY — getMenuPosition (above/below logic)
│   ├── WordContextMenu.tsx     # MODIFY — accept direction prop for above positioning
│   └── RubyWord.tsx            # MODIFY — convert pinyin format for editValue
└── hooks/
    └── (no changes)

tests/
└── unit/
    └── pinyinConversion.test.ts  # NEW — conversion utility tests
```

**Structure Decision**: Standard Tauri project layout. New `src/utils/` directory for the pure conversion functions, keeping them separate from components for testability.
