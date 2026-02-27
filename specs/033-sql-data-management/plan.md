# Implementation Plan: SQL Data Management

**Branch**: `033-sql-data-management` | **Date**: 2026-02-27 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/033-sql-data-management/spec.md`

## Summary

Add a data management dropdown to the library title bar (between tags and palette buttons) providing three operations: Export (serialize all texts, tags, and tag assignments to a `.json` file via native save dialog), Import (replace all data from a `.json` file via native open dialog with overwrite confirmation), and Reset (delete all data with confirmation). All destructive operations are atomic (transaction-based) and use native OS dialogs for file selection and confirmation.

## Technical Context

**Language/Version**: TypeScript 5.9 + Rust (stable) via Tauri 2
**Primary Dependencies**: React 19, Tailwind CSS 3.4, rusqlite 0.38, serde/serde_json, tauri-plugin-dialog (new)
**Storage**: SQLite (local, `%APPDATA%\com.hanzirubylens.app\hanzi-ruby-lens.db`)
**Testing**: Vitest + @testing-library/react (frontend), cargo test (Rust) — all in Docker
**Target Platform**: Windows 11 (Tauri 2 desktop)
**Project Type**: Desktop app (Tauri: Rust backend + React frontend)
**Performance Goals**: Export <5s, Import <10s, Reset <3s for up to 500 texts
**Constraints**: Offline-only, single-user, atomic operations, no data loss on round-trip
**Scale/Scope**: Single user, personal library (~500 texts max), 3 new Tauri commands, 1 new component

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Content-First Design | PASS | Dropdown is minimal UI chrome; does not compete with content. Button uses same subtle style as existing title bar buttons. |
| II. Offline-First Data | PASS (with deviation) | All data stays local. Export/import use JSON instead of raw SQLite file (see Complexity Tracking). The raw `.db` file remains accessible for power users. |
| III. DDD with CQRS | PASS | Export is a Query (read all). Import and Reset are Commands (write all). Clean separation maintained. |
| IV. Principled Simplicity | PASS | No speculative features. Three focused operations, one dropdown, minimal new code. Reuses existing patterns (PaletteSelector dropdown, AppError, transaction). |
| V. Test-First Imperative | PASS | Contract, unit, and integration tests planned. Export→Import round-trip test ensures data integrity. |
| VI. Docker-Only Execution | PASS | All tests run in Docker. No local toolchain changes needed. |
| Domain Language | PASS | Uses constitutional terms: Text, Tag. ExportPayload is a transient DTO, not a domain entity. |

**Post-Phase 1 Re-check**: All gates still pass. JSON format deviation documented and justified.

## Project Structure

### Documentation (this feature)

```text
specs/033-sql-data-management/
├── plan.md              # This file
├── spec.md              # Feature specification
├── research.md          # Phase 0: decisions and alternatives
├── data-model.md        # Phase 1: entities and state transitions
├── quickstart.md        # Phase 1: setup guide
├── contracts/           # Phase 1: IPC command contracts
│   └── tauri-commands.md
├── checklists/
│   └── requirements.md  # Spec quality checklist
└── tasks.md             # Phase 2 output (via /speckit.tasks)
```

### Source Code (repository root)

```text
src-tauri/src/
├── commands.rs          # +3 commands: export_database, import_database, reset_database
├── database.rs          # +3 functions: export_all, import_all, reset_all
├── domain.rs            # +3 structs: ExportPayload, ExportResult, ImportResult
├── lib.rs               # Register dialog plugin + 3 new commands
└── Cargo.toml           # +tauri-plugin-dialog

src/
├── components/
│   ├── DataManagementDropdown.tsx  # New: dropdown with Export/Import/Reset
│   └── TitleBar.tsx               # Modified: add DataManagementDropdown
├── hooks/
│   └── useTextLoader.ts           # Modified: expose refresh for post-import/reset
└── package.json                   # +@tauri-apps/plugin-dialog

tests/
├── contract/            # New: Tauri command contract tests
├── integration/         # New: export→import round-trip test
└── unit/                # New: DataManagementDropdown component tests
```

**Structure Decision**: Follows the existing Tauri 2 desktop app structure. No new directories needed — new code integrates into existing `commands.rs`, `database.rs`, `domain.rs` files plus one new component. This is consistent with how all previous features (tags, text locking, etc.) were added.

## Complexity Tracking

> Constitution Principle II deviation:

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| JSON export instead of SQLite file | User explicitly chose JSON for human-readability and debugging transparency. The raw SQLite DB remains accessible at `%APPDATA%` for manual copy. | Raw SQLite copy is binary/opaque, tightly coupled to internal schema, and harder for users to inspect or version-control. JSON provides a structured, human-readable, and schema-versioned alternative. |
