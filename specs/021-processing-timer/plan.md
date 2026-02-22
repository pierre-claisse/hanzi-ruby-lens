# Implementation Plan: Processing Elapsed Timer

**Branch**: `021-processing-timer` | **Date**: 2026-02-22 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `specs/021-processing-timer/spec.md`

## Summary

Add a live elapsed-time counter to the "Processing text..." screen. The counter displays "(0s)", "(1s)", ..., "(1m 0s)", "(1m 1s)" etc., ticking every second while the Claude CLI processes pinyin. The timer resets on retry or new submission and stops on completion or error. This is a frontend-only change requiring one new hook (`useElapsedTime`) and a minor update to the `ProcessingState` component.

## Technical Context

**Language/Version**: TypeScript 5.9, React 19
**Primary Dependencies**: React (useState, useEffect, useRef) — no new dependencies
**Storage**: N/A — ephemeral UI state only, no persistence
**Testing**: Vitest + @testing-library/react (renderHook, act, vi.useFakeTimers)
**Target Platform**: Windows (Tauri 2 desktop)
**Project Type**: Desktop (Tauri: Rust backend + React frontend)
**Performance Goals**: Timer accurate to ±1s; no visible jank or memory leaks
**Constraints**: Timer interval must be cleaned up on unmount/stop to prevent leaks
**Scale/Scope**: 2 files modified, 1 file created, 1 test file created

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Content-First Design | PASS | Timer is subtle, same style as existing label — does not compete with text |
| II. Offline-First Data | PASS | No data persistence involved; purely ephemeral UI state |
| III. DDD with CQRS | PASS | No domain model changes; UI-only presentation concern |
| IV. Principled Simplicity | PASS | Single hook, minimal logic, no speculative features |
| V. Test-First Imperative | PASS | Hook will have dedicated unit tests; tests run in Docker |
| VI. Docker-Only Execution | PASS | All tests execute inside Docker containers via `npm test` |
| Domain Language | PASS | No new domain terms introduced |
| Technology Stack | PASS | No new dependencies; React + TypeScript only |
| Visual Identity | PASS | Timer uses existing text styling (color, size, font) |

All gates pass. No violations.

## Project Structure

### Documentation (this feature)

```text
specs/021-processing-timer/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output (minimal — no data model changes)
├── quickstart.md        # Phase 1 output
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
src/
├── components/
│   └── ProcessingState.tsx       # MODIFIED — display elapsed time from prop
├── hooks/
│   ├── useElapsedTime.ts         # NEW — elapsed timer hook
│   └── useElapsedTime.test.ts    # NEW — unit tests for the hook
└── App.tsx                       # MODIFIED — wire useElapsedTime into ProcessingState
```

**Structure Decision**: Frontend-only change. New hook follows the existing pattern in `src/hooks/` (co-located test file). No backend, database, or infrastructure changes.
