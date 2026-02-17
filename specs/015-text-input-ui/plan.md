# Implementation Plan: Text Input UI

**Branch**: `015-text-input-ui` | **Date**: 2026-02-17 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/015-text-input-ui/spec.md`

## Summary

Add a text input workflow to the application: an empty state for first-time users, a textarea for entering/pasting Chinese text, and a confirmation state after saving. Remove the hardcoded sample text fallback. The existing `save_text`/`load_text` Tauri commands are reused — no Rust changes required. The app gains a view state machine (empty → input → saved) managed in React.

## Technical Context

**Language/Version**: TypeScript 5.5 (frontend), Rust stable (Tauri backend — no changes)
**Primary Dependencies**: React 18.3, Tailwind CSS 3.4, lucide-react 0.563.0, @tauri-apps/api 2.0
**Storage**: SQLite via existing `save_text`/`load_text` Tauri commands (no schema changes)
**Testing**: Vitest + @testing-library/react (frontend hooks and integration)
**Target Platform**: Windows (Tauri 2 / WebView2)
**Project Type**: Desktop app (Tauri: Rust backend + React frontend)
**Performance Goals**: Submit 5,000-character text without noticeable delay (SC-004)
**Constraints**: Offline-capable (constitution II), content-first design (constitution I)
**Scale/Scope**: Single user, single Text entity, 3 new components, 1 modified hook, ~5 modified files

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Content-First Design | PASS | Input view uses generous whitespace, no chrome competition. Confirmation state is minimal. |
| II. Offline-First Data | PASS | All data in local SQLite. No network calls. |
| III. DDD with CQRS | PASS | `save_text` is a command, `load_text` is a query. Text is the aggregate root. No new domain entities. |
| IV. Principled Simplicity | PASS | Reuses existing Tauri commands. No new abstractions. View state is a simple union type. |
| V. Test-First Imperative | PASS | Tests for new hook behavior, contract tests for save invocation, integration tests for view transitions. |
| VI. Docker-Only Execution | PASS | No new tooling. Tests run in existing Docker pipeline. |
| Domain Language: Text | PASS | "Text" used consistently. Raw input saved via existing aggregate. |
| Domain Language: Word | N/A | No Word creation in this feature (deferred to LLM integration). |

## Project Structure

### Documentation (this feature)

```text
specs/015-text-input-ui/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   └── tauri-commands.md
└── tasks.md             # Phase 2 output (via /speckit.tasks)
```

### Source Code (repository root)

```text
src/
├── components/
│   ├── EmptyState.tsx        # NEW — first-launch welcome + CTA
│   ├── TextInputView.tsx     # NEW — textarea + submit/cancel
│   ├── SavedState.tsx        # NEW — "awaiting processing" confirmation
│   ├── TextDisplay.tsx       # MODIFIED — remove empty-segments fallback text
│   └── TitleBar.tsx          # MODIFIED — add edit button (conditional)
├── hooks/
│   └── useTextLoader.ts      # MODIFIED — return null when empty, add saveText + app view state
├── data/
│   └── sample-text.ts        # DELETED
├── types/
│   └── domain.ts             # UNCHANGED
└── App.tsx                   # MODIFIED — view state routing

src-tauri/src/
├── commands.rs               # UNCHANGED
├── database.rs               # UNCHANGED
├── domain.rs                 # UNCHANGED
├── state.rs                  # UNCHANGED
└── error.rs                  # UNCHANGED

tests/
├── contract/
│   └── text-commands.test.ts     # UNCHANGED (contracts already cover save/load)
├── integration/
│   └── text-input-flow.test.tsx  # NEW — full input→save→confirmation flow
└── unit/
    (existing tests updated for sample text removal)
```

**Structure Decision**: Frontend-only changes. The existing Tauri backend (save_text/load_text) is sufficient. No new Rust code, no schema migrations, no new dependencies.
