# Implementation Plan: Disable Context Menu

**Branch**: `010-disable-context-menu` | **Date**: 2026-02-13 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/010-disable-context-menu/spec.md`

## Summary

Suppress the default browser context menu on right-click across the entire Tauri application window. Implemented as a single document-level `contextmenu` event listener in App.tsx, following the same pattern as the existing Space key suppression (FR-028 from 009-color-palettes).

## Technical Context

**Language/Version**: TypeScript 5.5 (frontend), Rust stable (Tauri backend — no changes)
**Primary Dependencies**: React 18.3, Tauri 2 (no new dependencies)
**Storage**: N/A (no persistence)
**Testing**: Vitest + @testing-library/react (existing setup)
**Target Platform**: Windows (Tauri desktop app)
**Project Type**: Single Tauri project (frontend only change)
**Performance Goals**: N/A (single event listener, negligible overhead)
**Constraints**: Must not interfere with existing interactions
**Scale/Scope**: 1 file modified (App.tsx), ~5 lines added

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Content-First Design | Compliant | No visual changes; suppresses irrelevant chrome |
| II. Offline-First Data | N/A | No data involved |
| III. DDD with CQRS | N/A | No domain logic |
| IV. Principled Simplicity | Compliant | Single event listener, minimal code, no abstractions |
| V. Test-First Imperative | SHOULD deviation | See Complexity Tracking below |
| VI. Docker-Only Execution | Compliant | Tests run via existing Docker pipeline |
| Domain Language | N/A | No Text/Word entities |
| Tech Stack | Compliant | React + TypeScript + Tauri |
| Visual Identity | N/A | No visual changes |
| Git-Flow | Compliant | Feature branch `010-disable-context-menu` |

**Gate result**: PASS (one justified SHOULD deviation)

## Project Structure

### Documentation (this feature)

```text
specs/010-disable-context-menu/
├── plan.md              # This file
├── research.md          # Phase 0 output (minimal — no unknowns)
├── quickstart.md        # Phase 1 output
└── checklists/
    └── requirements.md  # Spec quality checklist
```

No data-model.md or contracts/ needed — no entities, no interfaces.

### Source Code (repository root)

```text
src/
└── App.tsx              # Add contextmenu event listener (sole change)
```

**Structure Decision**: Single file modification in existing project structure. No new files, no new directories.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| V. Test-First (SHOULD): No dedicated unit test for context menu suppression | The existing Space key suppression (identical pattern, same file, same `useEffect` structure) has no dedicated test. Adding a test for `document.addEventListener("contextmenu", ...)` would test browser DOM event plumbing, not application logic. Manual verification in build is sufficient. | A unit test would mock `document.addEventListener` and `preventDefault` — testing the DOM API rather than meaningful behavior. Consistent with existing project practice. |
