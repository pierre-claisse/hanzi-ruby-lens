# Implementation Plan: Timestamps, Sort Persistence & System Theme

**Branch**: `030-timestamps-sort-theme` | **Date**: 2026-02-25 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/030-timestamps-sort-theme/spec.md`

## Summary

Four changes to the library experience: (1) move dates off preview cards into a hover tooltip with full YYYY-MM-DD HH:mm timestamps, (2) add a `modified_at` column to track last correction time, (3) persist sort order in localStorage, (4) replace localStorage-based theme with live OS theme detection via `prefers-color-scheme` media query.

## Technical Context

**Language/Version**: TypeScript 5.9 + Rust (stable), Tauri 2
**Primary Dependencies**: React 19, Tailwind CSS 3.4, lucide-react, rusqlite 0.38
**Storage**: SQLite (local, bundled via rusqlite) + localStorage (UI preferences)
**Testing**: Vitest + @testing-library/react (frontend), cargo test (Rust), all in Docker
**Target Platform**: Windows 11 (Tauri WebView2)
**Project Type**: Desktop app (Tauri: Rust backend + React frontend)
**Performance Goals**: Tooltip appears instantly on hover; theme switch < 100ms
**Constraints**: Offline-first; no network required
**Scale/Scope**: Single-user desktop app, ~10-100 texts in library

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Content-First Design | PASS | Removing dates from card surface improves minimalism. Tooltip on hover follows "controls appear on hover" rule. |
| II. Offline-First Data | PASS | All data in local SQLite. Sort preference in localStorage. No network dependency. |
| III. Domain-Driven Design | PASS | `modified_at` extends the Text aggregate. Sort preference is a UI concern (not domain). Theme is infrastructure. |
| IV. Principled Simplicity | PASS | CSS-only tooltip avoids new dependencies. localStorage for sort follows existing pattern. |
| V. Test-First Imperative | PASS | Tests will cover all 4 stories. All tests run in Docker. |
| VI. Docker-Only Execution | PASS | No change to execution model. |
| Domain Language | PASS | Text entity extended with `modified_at`. No new domain terms needed. |

No violations. No complexity tracking needed.

## Project Structure

### Documentation (this feature)

```text
specs/030-timestamps-sort-theme/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
└── tasks.md             # Phase 2 output (/speckit.tasks)
```

### Source Code (files affected)

```text
src-tauri/src/
├── database.rs          # MODIFY: ALTER TABLE migration, modified_at in queries and corrections
├── domain.rs            # MODIFY: Add modified_at to TextPreviewWithTags and Text
├── commands.rs          # NO CHANGE (pass-through; structs change underneath)
└── lib.rs               # NO CHANGE

src/
├── types/domain.ts      # MODIFY: Add modifiedAt to TextPreview and Text
├── components/
│   └── TextPreviewCard.tsx  # MODIFY: Remove date, add Info icon + CSS tooltip
├── hooks/
│   ├── useTextLoader.ts     # MODIFY: Persist sortAsc to localStorage
│   └── useTheme.ts          # MODIFY: Replace localStorage with matchMedia
└── index.css            # NO CHANGE (dark mode CSS already works via .dark class)

tests/
├── unit/                # New/modified tests for sort persistence, theme
├── hooks/               # Modified tests for useTextLoader (sortAsc persistence)
└── integration/         # Modified tests (TextPreview mock data needs modifiedAt)
```

### Key Implementation Details

**Tooltip approach**: CSS-only tooltip using `group` + `group-hover` Tailwind classes on the Info icon container. No library needed. Content set via data attributes or nested `<span>`.

**Schema migration**: `ALTER TABLE texts ADD COLUMN modified_at TEXT` in `initialize()` — idempotent (SQLite ignores if column exists; wrap in try/catch or check column existence).

**Theme listener**: `window.matchMedia("(prefers-color-scheme: dark)")` with `addEventListener("change", ...)` in a `useEffect` cleanup pattern.

**Sort persistence**: Read from `localStorage.getItem("sortAsc")` in `useState` initializer. Write via `useEffect` on `sortAsc` change. Move sort state initialization from `useTextLoader.ts` to read localStorage.
