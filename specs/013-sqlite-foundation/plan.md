# Implementation Plan: SQLite Foundation

**Branch**: `013-sqlite-foundation` | **Date**: 2026-02-15 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `specs/013-sqlite-foundation/spec.md`

## Summary

Add rusqlite to the Tauri backend to persist the active Text (segments + raw input) in a local SQLite database. Implement save and load Tauri commands with atomic save semantics. On startup, load the persisted Text; fall back to the hardcoded sample text on first launch, missing database, or corruption. The frontend App component uses a new `useTextLoader` hook to call the load command at mount.

## Technical Context

**Language/Version**: Rust stable (backend), TypeScript 5.5 (frontend)
**Primary Dependencies**: rusqlite 0.38 (bundled), thiserror 2, serde/serde_json (existing)
**Storage**: SQLite — single file in `%APPDATA%\com.hanzirubylens.app\hanzi-ruby-lens.db`
**Testing**: cargo test (Rust unit), vitest (frontend unit + integration)
**Target Platform**: Windows (Tauri 2 desktop)
**Project Type**: Tauri hybrid (Rust backend + React frontend)
**Performance Goals**: Load persisted Text <1s (SC-002), save 10k chars <500ms (SC-003)
**Constraints**: Offline-only, single-Text model, atomic saves
**Scale/Scope**: One SQLite table, two Tauri commands, one frontend hook

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Content-First Design | PASS | No UI chrome changes; text remains focal |
| II. Offline-First Data | PASS | Implements "All data MUST reside in a local SQLite database" |
| III. DDD with CQRS | PASS | Separate save (command) and load (query); domain types independent of infrastructure |
| IV. Principled Simplicity | PASS | JSON blob for single-Text model; no normalized tables (YAGNI); no migration framework |
| V. Test-First Imperative | PASS | Rust unit tests (in-memory SQLite) + frontend tests; all in Docker |
| VI. Docker-Only Execution | PASS | rusqlite `bundled` compiles SQLite inside Docker; no local toolchain |
| Domain Language: Text | PASS | Text is aggregate root; single-Text constraint enforced at DB level (`CHECK (id = 1)`) |
| Domain Language: Word | PASS | Word segments stored as JSON; pinyin as single unit per Word |
| Technology: SQLite | PASS | Constitutional technology choice fulfilled |
| Exportable DB file | PASS | Standard SQLite file at known path; directly copyable and inspectable |

**Post-Phase 1 re-check**: All gates still pass. JSON blob approach avoids DDD/YAGNI tension — no unnecessary aggregate ceremony for single-document CRUD.

## Project Structure

### Documentation (this feature)

```text
specs/013-sqlite-foundation/
├── plan.md              # This file
├── research.md          # Phase 0: technology decisions
├── data-model.md        # Phase 1: domain types + SQLite schema
├── quickstart.md        # Phase 1: implementation reference
├── contracts/
│   ├── save-text.md     # Phase 1: save command contract
│   └── load-text.md     # Phase 1: load command contract
└── tasks.md             # Phase 2 output (/speckit.tasks)
```

### Source Code (repository root)

```text
src-tauri/src/
├── main.rs               (unchanged — delegates to lib.rs)
├── lib.rs                (MODIFIED — register state, commands, setup hook)
├── domain.rs             (NEW — Rust mirror of TypeScript domain types)
├── database.rs           (NEW — SQLite init via path param, schema creation, save/load ops)
├── commands.rs           (NEW — #[tauri::command] handlers: save_text, load_text)
├── state.rs              (NEW — AppState struct, ServiceAccess trait)
└── error.rs              (NEW — AppError enum with thiserror derive)

src/
├── App.tsx               (MODIFIED — use useTextLoader instead of hardcoded sampleText)
├── hooks/
│   ├── useTextLoader.ts  (NEW — invoke load_text, fallback to sampleText)
│   └── useTextLoader.test.ts  (NEW — mock invoke, test load + fallback)
└── types/
    └── domain.ts         (MODIFIED — add optional rawInput to Text)

tests/
├── contract/
│   └── text-commands.test.ts    (NEW — Tauri command interface contract tests)
└── integration/
    └── text-persistence.test.tsx  (NEW — App renders loaded text + fallback)
```

**Structure Decision**: Tauri hybrid project. Backend modules follow DDD layering: `domain.rs` (domain, no infrastructure dependency) → `database.rs` (infrastructure) → `commands.rs` (application/interface). `state.rs` and `error.rs` are cross-cutting support. Frontend adds one hook following the established pattern (useTheme, useTextZoom, etc.).

## Design Decisions

### 1. JSON Blob over Normalized Tables

The `segments` column stores a JSON array of `TextSegment` objects. This is correct because:
- The app holds exactly one Text (constitutional invariant)
- Text is always loaded/saved as a whole — no partial segment queries
- The discriminated union maps naturally to serde's tagged enum
- DELETE + INSERT in a transaction provides atomic replacement

See [research.md](research.md) Decision 3 for alternatives considered.

### 2. Optional rawInput in TypeScript

The `Text` interface gains `rawInput?: string`. Optional to preserve backward compatibility with all existing test fixtures and the sample text. The Rust type always includes `raw_input: String` (empty string when not applicable). See [data-model.md](data-model.md) for the full type definitions.

### 3. ServiceAccess Trait for Ergonomic DB Access

Rather than passing `State<AppState>` to every command and manually unlocking, the `ServiceAccess` trait on `AppHandle` provides `db()` and `db_mut()` methods. This keeps command functions clean and testable. See [research.md](research.md) Decision 2.

### 4. Graceful Degradation

Every failure path falls back to the sample text:
- First launch (no DB) → create DB, show sample
- Corrupted DB → log error, show sample
- Deleted DB file → recreate, show sample
- Load deserialization failure → show sample

The frontend hook handles this: `invoke("load_text")` returns null or throws → keep `sampleText` as default state.

### 5. No UI for Save

The `save_text` command is implemented and tested but **not exposed in the UI**. No save button, no autosave hook. The command exists as infrastructure for future features (text input, LLM processing). This satisfies FR-011 without adding speculative UI.

## Complexity Tracking

No constitution violations to justify. All gates pass.
