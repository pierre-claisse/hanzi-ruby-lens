# Implementation Plan: Quadrant-Based Context Menu Positioning

**Branch**: `028-quadrant-menu-position` | **Date**: 2026-02-24 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/028-quadrant-menu-position/spec.md`

## Summary

Extend the existing adaptive context menu positioning from vertical-only (top/bottom half) to full quadrant-based positioning (4 quadrants). The menu opens in the direction opposite to the word's quadrant — away from the screen edge — combining horizontal and vertical rules. Additionally, fix the visual inconsistency where the "Merge with next word" icon appears bolder than "Merge with previous word".

## Technical Context

**Language/Version**: TypeScript 5.9, React 19
**Primary Dependencies**: lucide-react (icons), Tailwind CSS 3.4
**Storage**: N/A (no data changes)
**Testing**: Vitest + @testing-library/react (Docker)
**Target Platform**: Windows (Tauri 2 WebView)
**Project Type**: Desktop app (Tauri: Rust backend + React frontend)
**Performance Goals**: No perceptible latency — positioning is a synchronous DOM rect calculation
**Constraints**: Menu must remain within viewport bounds; no layout shifts
**Scale/Scope**: 2 files modified (TextDisplay.tsx, WordContextMenu.tsx), ~30 lines changed

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Content-First Design | PASS | Menu positioning is UI chrome that serves the text. Gentle transitions preserved. |
| II. Offline-First Data | N/A | No data changes. |
| III. DDD with CQRS | N/A | Pure UI logic, no domain model impact. |
| IV. Principled Simplicity | PASS | Extending existing `getMenuPosition()` callback — no new abstractions. |
| V. Test-First Imperative | PASS | Unit tests for quadrant detection logic will run in Docker. |
| VI. Docker-Only Execution | PASS | All tests via `npm test` in Docker. |
| Domain Language | PASS | Uses "Word" and "Text" correctly throughout. |

No violations. Gate passed.

## Project Structure

### Documentation (this feature)

```text
specs/028-quadrant-menu-position/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── spec.md              # Feature specification
└── checklists/
    └── requirements.md  # Spec quality checklist
```

### Source Code (files affected)

```text
src/
├── components/
│   ├── TextDisplay.tsx      # MODIFY: getMenuPosition() — add horizontal midpoint logic
│   └── WordContextMenu.tsx  # MODIFY: accept horizontal direction, add strokeWidth to icons
└── (no new files)

tests/
└── unit/
    └── menuPosition.test.ts # ADD: unit tests for quadrant positioning logic
```

**Structure Decision**: No new files except a unit test. Changes are confined to the existing `getMenuPosition()` callback in TextDisplay.tsx and icon rendering in WordContextMenu.tsx.
