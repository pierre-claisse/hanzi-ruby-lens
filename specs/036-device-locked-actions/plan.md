# Implementation Plan: Device-Locked Actions

**Branch**: `036-device-locked-actions` | **Date**: 2026-04-04 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/036-device-locked-actions/spec.md`

## Summary

Restrict risky actions (Delete text, Import/Export/Reset database) to the authorized device only by comparing a hardware identifier against a build-time constant. On unauthorized devices, these UI elements are hidden entirely. The Reset entry is also restyled in red to match the Delete entry.

## Technical Context

**Language/Version**: TypeScript 5.9 (frontend), Rust stable (backend)
**Primary Dependencies**: React 19, Tailwind CSS 3.4, Tauri 2, machine-uid (new Rust crate for device identification)
**Storage**: SQLite (no schema changes)
**Testing**: Vitest + @testing-library/react (frontend), cargo test (Rust)
**Target Platform**: Windows (Tauri desktop)
**Project Type**: Desktop app (Tauri: Rust backend + React frontend)
**Performance Goals**: Device check must complete in <10ms (simple string comparison)
**Constraints**: Identifier must survive reboots and app reinstalls. Fail-safe to unauthorized if identifier unavailable.
**Scale/Scope**: 1 new Rust command, 1 new crate dependency, 4 existing components modified

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Content-First Design | PASS | No visual changes for authorized device. On unauthorized devices, fewer UI elements = less chrome. |
| II. Offline-First Data | PASS | Device identification uses local registry — no network needed. |
| III. DDD with CQRS | PASS | New query: `is_authorized_device`. Returns boolean. No domain model changes. |
| IV. Principled Simplicity | PASS | Single crate, single command, simple equality check. No over-engineering. |
| V. Test-First Imperative | PASS | Unit tests for Rust command (mock identifier), integration tests for conditional UI rendering. |
| Technology Stack | PASS | Rust backend + React frontend. machine-uid is a Rust crate accessed from backend. |
| Visual Identity | PASS | Reset red styling uses existing `text-red-500` pattern. |

No violations. Gate passed.

## Project Structure

### Documentation (this feature)

```text
specs/036-device-locked-actions/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output (minimal — no model changes)
├── spec.md              # Feature specification
└── checklists/
    └── requirements.md  # Spec quality checklist
```

### Source Code (repository root)

```text
src-tauri/src/
├── commands.rs          # MODIFY: add is_authorized_device command
├── lib.rs               # MODIFY: register new command
└── Cargo.toml           # MODIFY: add machine-uid dependency

src/
├── App.tsx              # MODIFY: call is_authorized_device at startup, pass flag down
├── components/
│   ├── TitleBar.tsx              # MODIFY: conditionally render DataManagementDropdown
│   ├── LibraryScreen.tsx         # MODIFY: conditionally render Delete entry
│   └── DataManagementDropdown.tsx # MODIFY: style Reset entry in red

tests/
├── unit/                # Device authorization tests
└── integration/         # Conditional UI rendering tests
```

**Structure Decision**: Modifications to existing files across both Rust backend and React frontend. One new Rust dependency. No new source files.

## Complexity Tracking

No violations to justify.
