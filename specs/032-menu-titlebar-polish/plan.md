# Implementation Plan: Menu Positioning & Title Bar Polish

**Branch**: `032-menu-titlebar-polish` | **Date**: 2026-02-25 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/032-menu-titlebar-polish/spec.md`

## Summary

Unify context menu positioning across the application by applying the existing quadrant-based `computeMenuPosition()` algorithm to the library view's context menu and tags submenu. Replace the static "Hanzi Ruby Lens" title with view-aware text: "Library" in library view, and the text's title (left-aligned before zoom indicator) in reading view.

## Technical Context

**Language/Version**: TypeScript 5.9 (frontend), Rust stable (backend — no backend changes needed)
**Primary Dependencies**: React 19, Tailwind CSS 3.4, lucide-react
**Storage**: N/A (no data model changes)
**Testing**: Vitest + @testing-library/react (Docker-only)
**Target Platform**: Windows (Tauri 2 desktop app)
**Project Type**: Desktop (Tauri: Rust backend + React frontend)
**Performance Goals**: N/A (UI-only changes, no performance-sensitive logic)
**Constraints**: Menu positioning must use the same algorithm as reading view; no new dependencies
**Scale/Scope**: 3 files modified (LibraryScreen.tsx, TitleBar.tsx, App.tsx), 1 utility extraction (computeMenuPosition → shared module), test updates

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Content-First Design | PASS | Menu positioning serves content access; title bar change reduces chrome (removes static app name). |
| II. Offline-First Data | PASS | No data/network changes. |
| III. Domain-Driven Design with CQRS | PASS | No domain model changes. Pure UI layer. |
| IV. Principled Simplicity | PASS | Reusing existing `computeMenuPosition()` rather than inventing new logic. Minimal code changes. |
| V. Test-First Imperative | PASS | Tests will be written for menu positioning logic and title bar rendering. Docker execution. |
| VI. Docker-Only Execution | PASS | All tests and builds run in Docker. |
| Domain Language | PASS | Using "Text" and "Word" consistently. No new entities. |
| Technology Stack | PASS | No new dependencies. Using existing React + Tailwind + lucide-react. |

All gates pass. No violations to justify.

## Project Structure

### Documentation (this feature)

```text
specs/032-menu-titlebar-polish/
├── plan.md              # This file
├── research.md          # Design decisions
├── quickstart.md        # Integration test scenarios
└── tasks.md             # Implementation tasks (via /speckit.tasks)
```

### Source Code (affected files)

```text
src/
├── App.tsx                         # Wire title text to TitleBar
├── utils/
│   └── menuPositioning.ts          # NEW — extracted from TextDisplay.tsx
├── components/
│   ├── TitleBar.tsx                # View-aware title, layout changes
│   ├── LibraryScreen.tsx           # Quadrant-positioned context menu + submenu
│   └── TextDisplay.tsx             # Import menuPositioning from shared util

tests/
├── unit/
│   ├── menuPositioning.test.ts     # NEW — unit tests for positioning utility
│   └── titleBar.test.tsx           # NEW — title bar view-aware rendering
```

**Structure Decision**: Single Tauri project (existing). New utility file `src/utils/menuPositioning.ts` extracts the `computeMenuPosition()` function from `TextDisplay.tsx` so both `TextDisplay` and `LibraryScreen` can import it.

## Architecture Decisions

### 1. Extract `computeMenuPosition()` into a shared utility

The quadrant-based positioning function currently lives in `TextDisplay.tsx`. Since `LibraryScreen.tsx` now needs the same algorithm, extract it to `src/utils/menuPositioning.ts`. Both components import from the shared location.

### 2. Library context menu: use `position: fixed` with computed coordinates

The library context menu currently uses `position: fixed` with raw `clientX/clientY` coordinates. The change:
- After computing the raw click position, apply quadrant logic to decide which direction the menu opens.
- For the main context menu: if click is in the right half, position menu to the left of the click point; if click is in the bottom half, position menu above the click point.
- For the tags submenu: if the main menu is in the right half of the viewport, open submenu to the left of the main menu; if in the bottom half, align the submenu upward.

The library context menu uses `position: fixed` (viewport-relative), unlike the reading view which uses `position: absolute` (container-relative). The positioning function will be adapted to handle both cases: when used with fixed positioning, `containerRect` is `{ top: 0, left: 0 }`.

### 3. Tags submenu positioning

The tags submenu currently opens statically to the right (`left-full`). The change:
- Calculate submenu position based on the main menu's position in the viewport.
- Horizontal: open left (`right-full` equivalent) if main menu center X > viewport midpoint, else open right (`left-full`).
- Vertical: if the submenu would overflow below the viewport, shift it upward. Clamp to viewport bounds.

### 4. TitleBar view-aware title

The TitleBar currently always shows "Hanzi Ruby Lens". The change:
- Accept a new prop `titleText: string` that determines what the `<h1>` displays.
- In library view: `App.tsx` passes `titleText="Library"`.
- In reading view: `App.tsx` passes `titleText={activeText?.title ?? ""}`.
- The text title that was previously centered (`absolute left-1/2 -translate-x-1/2`) is removed since the title now appears in the left-aligned `<h1>`.
- In reading view, the `<h1>` is followed by the zoom indicator in the same flex row — the title simply appears before it, truncated with ellipsis if too long.

## Complexity Tracking

No constitution violations — this section is not applicable.
