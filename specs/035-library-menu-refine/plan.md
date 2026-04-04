# Implementation Plan: Library Context Menu Refinement

**Branch**: `035-library-menu-refine` | **Date**: 2026-04-04 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/035-library-menu-refine/spec.md`

## Summary

Refactor the Library view to remove the info tooltip icon and lock toggle icon from text preview cards, consolidating their functionality into the right-click context menu. The context menu gains a non-interactive metadata footer (Created/Modified dates) below Delete and a Lock/Unlock action entry. Locked cards use a subtle border/background tint instead of an icon.

## Technical Context

**Language/Version**: TypeScript 5.9 (frontend), Rust stable (backend)
**Primary Dependencies**: React 19, Tailwind CSS 3.4, lucide-react, Tauri 2
**Storage**: SQLite (no schema changes — lock state and dates already stored)
**Testing**: Vitest + @testing-library/react (frontend), cargo test (Rust)
**Target Platform**: Windows (Tauri desktop)
**Project Type**: Desktop app (Tauri: Rust backend + React frontend)
**Performance Goals**: N/A (UI-only change, no new data flow)
**Constraints**: Must work across 6 palettes × light/dark = 12 theme combinations
**Scale/Scope**: 2 components modified (TextPreviewCard, LibraryScreen), 0 new files

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Content-First Design | PASS | Removing icons reduces chrome; locked state uses subtle tint per "minimized UI chrome" rule. Transitions will use 200-300ms ease. Both light and dark modes addressed (FR-011). |
| II. Offline-First Data | PASS | No data model or storage changes. |
| III. DDD with CQRS | PASS | No domain logic changes. `toggle_lock` command already exists. |
| IV. Principled Simplicity | PASS | No new abstractions. Reuses existing `toggle_lock`, `formatDateTime`, menu positioning utilities. |
| V. Test-First Imperative | PASS | Tests will cover card rendering (no icons, locked tint) and context menu structure. |
| Technology Stack | PASS | React + TypeScript + Tailwind CSS. No new dependencies. |
| Visual Identity | PASS | Uses theme-aware CSS variables (`--color-text`, `--color-accent`). |

No violations. Gate passed.

## Project Structure

### Documentation (this feature)

```text
specs/035-library-menu-refine/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output (minimal — no model changes)
├── spec.md              # Feature specification
└── checklists/
    └── requirements.md  # Spec quality checklist
```

### Source Code (repository root)

```text
src/
├── components/
│   ├── TextPreviewCard.tsx   # MODIFY: remove info icon, lock toggle; add locked tint styling
│   └── LibraryScreen.tsx     # MODIFY: add metadata footer + Lock/Unlock entry to context menu; widen menu
├── index.css                 # No changes needed (tint uses existing Tailwind utilities)
└── utils/
    └── formatDateTime.ts     # REUSE: already exists for date formatting

tests/
├── unit/                     # Card rendering tests (locked tint, no icons)
└── integration/              # Context menu structure tests
```

**Structure Decision**: Pure frontend modification within existing component files. No new files, no Rust changes, no schema changes.

## Complexity Tracking

No violations to justify.
