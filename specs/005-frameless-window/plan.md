# Implementation Plan: Frameless Window with Custom Title Bar

**Branch**: `005-frameless-window` | **Date**: 2026-02-11 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/005-frameless-window/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Hide native Windows window chrome and implement a custom title bar with window dragging, three control buttons (theme toggle, fullscreen toggle, close), keyboard navigation, and fullscreen state persistence. Window resizing will be handled through native Windows resize zones with a thin border (1-2px), and minimum window dimensions (800×600) will be enforced at the OS level.

## Technical Context

**Language/Version**: TypeScript 5.x (frontend), Rust stable (Tauri backend)
**Primary Dependencies**: React 18, Tauri 2, Tailwind CSS 3.x, lucide-react (icons - to be added)
**Storage**: Browser localStorage (fullscreen preference persistence only)
**Testing**: Vitest, @testing-library/react, @testing-library/user-event
**Target Platform**: Windows desktop (Tauri 2 native window)
**Project Type**: Desktop application (Tauri 2 with React frontend)
**Performance Goals**: Window drag operations must feel native (no lag), fullscreen toggle <200ms, cursor feedback instantaneous
**Constraints**: Must preserve native Windows resize behavior, maintain accessibility (Tab navigation, Enter activation, Escape handling), all styling must match existing ThemeToggle patterns
**Scale/Scope**: 1 custom TitleBar component, 2 new button components (FullscreenToggle, CloseButton), 1 custom hook (useFullscreen), removal of 2 obsolete components (MinWidthOverlay, useMinWidth)

**Research Findings**: All technical unknowns resolved in [research.md](research.md):
- Frameless window: `decorations: false` + `shadow: true` in tauri.conf.json
- Drag region: `data-tauri-drag-region` HTML attribute (declarative approach)
- Fullscreen: `getCurrentWindow().setFullscreen(boolean)` with localStorage persistence
- Window close: `getCurrentWindow().close()` for graceful shutdown
- Icons: lucide-react (Maximize, Minimize, X, Sun, Moon)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Principle I: Content-First Design
- ✅ **PASS**: Custom title bar design is minimal (48px height, 14px title text) and does not compete with main Chinese text content
- ✅ **PASS**: Window controls follow existing ThemeToggle patterns (subtle, consistent styling)
- ✅ **PASS**: No visual changes to the main content area where Chinese text and ruby annotations display

### Principle II: Offline-First Data
- ✅ **PASS**: Fullscreen preference uses localStorage (local, no network dependency)
- ✅ **PASS**: No server-side persistence or network calls introduced

### Principle III: Domain-Driven Design with CQRS
- ✅ **PASS**: This is a UI-only feature with no domain model changes
- ✅ **PASS**: No new aggregates, entities, or value objects introduced
- ⚠️ **NOTE**: Window state (fullscreen) is UI concern, not domain data - localStorage is appropriate

### Principle IV: Principled Simplicity
- ✅ **PASS**: Feature implements only specified requirements (no speculative additions)
- ✅ **PASS**: Removes obsolete MinWidthOverlay component (FR-024) - reducing code complexity
- ✅ **PASS**: Reuses existing ThemeToggle styling patterns instead of creating new abstractions

### Principle V: Test-First Imperative
- ✅ **PASS**: Testing approach follows existing pattern (Vitest + @testing-library/react)
- ✅ **PASS**: All tests will run inside Docker containers per project standard
- 📋 **TODO**: Contract tests must verify title bar drag behavior, button interactions, keyboard navigation

### Principle VI: Docker-Only Execution
- ✅ **PASS**: No changes to build/test execution model
- ✅ **PASS**: All development/testing remains inside Docker containers

### Domain Language Compliance
- ✅ **PASS**: This feature does not touch Text or Word domain entities
- ✅ **PASS**: No domain language terms misused or redefined

### Technical Constraints
- ✅ **PASS**: Uses Tauri 2 (constitutional requirement)
- ✅ **PASS**: Windows platform (constitutional requirement)
- ✅ **PASS**: React + TypeScript frontend (constitutional requirement)
- ✅ **PASS**: Tailwind CSS styling (constitutional requirement)
- ✅ **PASS**: No changes to SQLite or LLM integration layers

### Development Workflow
- ✅ **PASS**: Feature branch follows convention: `005-frameless-window`
- ✅ **PASS**: Using Spec Kit workflow (specify → clarify → plan → tasks → implement)

**GATE STATUS**: ✅ **PASSED** - No constitutional violations detected. Proceed to Phase 0 research.

---

## Post-Design Constitution Re-Check

*Re-evaluated after Phase 1 design completion*

### Principle I: Content-First Design
- ✅ **PASS**: Title bar design finalized at 48px height with 14px title text
- ✅ **PASS**: All three buttons use consistent, minimal styling (p-2, rounded-lg, subtle borders)
- ✅ **PASS**: Main content area gets 48px padding-top, preserving full text visibility
- ✅ **PASS**: No interference with ruby annotations or Chinese text display

### Principle II: Offline-First Data
- ✅ **PASS**: Only localStorage used (no network dependency)
- ✅ **PASS**: Fullscreen preference is UI state, not domain data (appropriate for localStorage)
- ✅ **PASS**: No changes to SQLite database or data persistence layer

### Principle III: Domain-Driven Design with CQRS
- ✅ **PASS**: No domain model changes introduced
- ✅ **PASS**: No commands or queries added to domain layer
- ✅ **PASS**: All changes isolated to presentation layer (components + hooks)

### Principle IV: Principled Simplicity
- ✅ **PASS**: useFullscreen hook is simple, single-purpose (~66 lines)
- ✅ **PASS**: Components are small, focused (TitleBar: ~20 lines, buttons: ~15 lines each)
- ✅ **PASS**: Removed obsolete code (MinWidthOverlay, useMinWidth) - net reduction in codebase size
- ✅ **PASS**: No premature abstractions - direct Tauri API usage where appropriate

### Principle V: Test-First Imperative
- ✅ **PASS**: Test strategy defined in research.md (contract, integration, unit tests)
- ✅ **PASS**: All tests will run in Docker via existing Vitest setup
- ✅ **PASS**: Component contracts defined in contracts/component-props.md
- ✅ **PASS**: API contracts defined in contracts/window-api.md

### Principle VI: Docker-Only Execution
- ✅ **PASS**: No changes to build/test execution model
- ✅ **PASS**: lucide-react added via npm (standard dependency, Docker-compatible)

### Domain Language Compliance
- ✅ **PASS**: No Text or Word entities touched
- ✅ **PASS**: No domain language terms used in UI layer (appropriate separation)

### Technical Constraints
- ✅ **PASS**: Tauri 2 API used correctly (@tauri-apps/api/window)
- ✅ **PASS**: React 18 + TypeScript patterns followed
- ✅ **PASS**: Tailwind CSS used for all styling
- ✅ **PASS**: lucide-react chosen for icons (consistent with shadcn/ui ecosystem)

### Development Workflow
- ✅ **PASS**: All artifacts generated via Spec Kit workflow
- ✅ **PASS**: Design artifacts complete (research.md, data-model.md, contracts/*, quickstart.md)
- ✅ **PASS**: Ready for /speckit.tasks phase

**FINAL GATE STATUS**: ✅ **PASSED** - Design upholds all constitutional principles. Ready for task generation.

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
src/                          # React frontend
├── components/
│   ├── TitleBar.tsx         # NEW: Custom title bar component
│   ├── FullscreenToggle.tsx # NEW: Fullscreen toggle button
│   ├── CloseButton.tsx      # NEW: Close button
│   ├── ThemeToggle.tsx      # MODIFIED: Move from fixed positioning to title bar
│   └── MinWidthOverlay.tsx  # REMOVE: Obsolete (FR-024)
├── hooks/
│   ├── useFullscreen.ts     # NEW: Fullscreen state management hook
│   └── useMinWidth.ts       # REMOVE: Obsolete (FR-024)
├── App.tsx                  # MODIFIED: Add TitleBar, remove MinWidthOverlay
├── App.test.tsx             # MODIFIED: Update tests for new structure
└── index.css                # MODIFIED: Add title bar cursor styles

src-tauri/                   # Rust backend
├── tauri.conf.json          # MODIFIED: Enable frameless window, set min/default sizes
└── src/
    └── lib.rs               # MODIFIED: May need window management commands

tests/                       # Vitest tests (run in Docker)
└── [existing test structure preserved]
```

**Structure Decision**: This is a Tauri 2 desktop application with React frontend. Changes are focused on the `src/` directory (React components) and `src-tauri/tauri.conf.json` (window configuration). The existing test structure using Vitest + @testing-library/react is preserved.

## Complexity Tracking

**No constitutional violations detected** - this section is not applicable for this feature.
