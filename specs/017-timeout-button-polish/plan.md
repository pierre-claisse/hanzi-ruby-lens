# Implementation Plan: CLI Timeout & Button Focus Polish

**Branch**: `017-timeout-button-polish` | **Date**: 2026-02-17 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/017-timeout-button-polish/spec.md`

## Summary

Two small fixes: (1) increase CLI processing timeout from 120s to 300s per attempt to accommodate long texts with Opus, and (2) add consistent focus ring styles to all action buttons to match the title bar buttons.

## Technical Context

**Language/Version**: Rust stable (backend), TypeScript 5.5 (frontend)
**Primary Dependencies**: Tauri 2, React 18.3, Tailwind CSS 3.4
**Storage**: N/A (no data changes)
**Testing**: Vitest (frontend), cargo test (backend)
**Target Platform**: Windows
**Project Type**: Tauri desktop app (Rust backend + React frontend)
**Performance Goals**: Long texts (~1000+ chars) must not timeout during processing
**Constraints**: Constitution mandates Claude CLI with Opus model — cannot switch to faster model
**Scale/Scope**: 2 files changed (1 Rust, 3 React components)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Content-First Design | PASS | Focus ring polish improves UI consistency |
| II. Offline-First Data | N/A | No data changes |
| III. DDD with CQRS | N/A | No domain logic changes |
| IV. Principled Simplicity | PASS | Minimal changes, no abstractions added |
| V. Test-First Imperative | PASS | Existing tests cover affected components |
| VI. Docker-Only Execution | KNOWN DEVIATION | Tests run locally (established pattern) |
| Domain Language | N/A | No domain entity changes |
| Technology Stack | PASS | Keeps Opus model per constitution; timeout increase only |

No violations. No research needed.

## Project Structure

### Documentation (this feature)

```text
specs/017-timeout-button-polish/
├── plan.md              # This file
└── checklists/
    └── requirements.md  # Spec quality checklist
```

### Source Code (files to modify)

```text
src-tauri/src/commands.rs          # Timeout: 120s → 300s (lines 99, 117)
src/components/ProcessingState.tsx  # Add focus ring to Retry, Edit, Process buttons
src/components/TextInputView.tsx    # Add focus ring to Cancel, Submit buttons
src/components/EmptyState.tsx       # Add focus ring to Enter Text button
```

**Structure Decision**: No new files. All changes are in-place modifications to existing files.

## Implementation Details

### US1: Generous Processing Timeout

Single change in `src-tauri/src/commands.rs`:
- Line 99: `Duration::from_secs(120)` → `Duration::from_secs(300)`
- Line 117: `Duration::from_secs(120)` → `Duration::from_secs(300)` (retry attempt)

5 minutes per attempt gives Opus ample time for texts up to ~2000 characters. With the retry mechanism, the theoretical maximum wait is 10 minutes (extremely unlikely).

### US2: Consistent Button Focus States

Reference style from title bar buttons (e.g., `ZoomInButton.tsx`):
```
focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2
```

Buttons to update:
- **ProcessingState.tsx**: 5 buttons (Retry ×1, Edit ×2, Process ×1) — all use the same base class
- **TextInputView.tsx**: Cancel button, Submit button
- **EmptyState.tsx**: Enter Text button

Each button gets `focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2` appended to its existing className.

## Complexity Tracking

No constitution violations to justify. This is a minimal bugfix/polish feature.
