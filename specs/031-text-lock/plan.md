# Implementation Plan: Text Lock

**Branch**: `031-text-lock` | **Date**: 2026-02-25 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/031-text-lock/spec.md`

## Summary

Add a lock/unlock toggle to library text cards that prevents accidental corrections (pinyin edit, split, merge) in reading mode. The lock state is a boolean column on the `texts` table, exposed through existing domain types. The library card gets a discreet padlock toggle near the Info icon. In reading mode, the context menu disables correction entries (greyed out with padlock icons) when the text is locked.

## Technical Context

**Language/Version**: Rust (stable) + TypeScript 5.9
**Primary Dependencies**: Tauri 2, React 19, Tailwind CSS 3.4, lucide-react (provides `Lock`, `Unlock`, `LockKeyhole` icons)
**Storage**: SQLite (rusqlite 0.38, bundled) — `%APPDATA%\com.hanzirubylens.app\hanzi-ruby-lens.db`
**Testing**: Vitest + @testing-library/react (frontend), cargo test (Rust) — all in Docker
**Target Platform**: Windows 11 desktop
**Project Type**: Tauri desktop app (Rust backend + React frontend)
**Performance Goals**: Lock toggle < 1s (single UPDATE query)
**Constraints**: Offline-capable, single-user desktop app
**Scale/Scope**: Single boolean field on `texts` table, ~6 files modified

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Content-First Design | PASS | Lock toggle is discreet (follows Info icon pattern). Padlock icons in context menu serve functional communication, not decoration. |
| II. Offline-First Data | PASS | Lock state stored in local SQLite. No network dependency. |
| III. Domain-Driven Design with CQRS | PASS | `toggle_lock` is a command (write). Lock state is read via existing list/load queries. Text remains aggregate root. |
| IV. Principled Simplicity | PASS | Single boolean column, no new abstractions. Lock check is a simple conditional in the context menu builder. |
| V. Test-First Imperative | PASS | Tests for toggle command, lock persistence, and context menu disabling. All in Docker. |
| VI. Docker-Only Execution | PASS | All testing and building happens in Docker. |

**Gate result**: ALL PASS — no violations.

## Project Structure

### Documentation (this feature)

```text
specs/031-text-lock/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
└── tasks.md             # Phase 2 output (/speckit.tasks)
```

### Source Code (repository root)

```text
src-tauri/src/
├── database.rs          # Add locked column migration, toggle_lock_db(), update list/load queries
├── domain.rs            # Add locked field to Text and TextPreviewWithTags
├── commands.rs          # Add toggle_lock command
└── lib.rs               # Register toggle_lock command

src/
├── types/domain.ts      # Add locked field to Text and TextPreview interfaces
├── components/
│   ├── TextPreviewCard.tsx  # Add lock toggle button near Info icon
│   ├── TextDisplay.tsx      # Pass locked state to buildMenuEntries, disable correction entries
│   └── WordContextMenu.tsx  # Support disabled entries with padlock icon override
└── hooks/
    └── useTextLoader.ts     # (No changes — locked field flows through existing data path)

tests/
├── unit/                # Lock toggle tests, context menu disabled state tests
├── contract/            # Toggle lock command contract tests
└── integration/         # Lock enforcement integration tests
```

**Structure Decision**: Existing Tauri project structure. No new directories needed — all changes are additions to existing files.
