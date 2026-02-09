# Implementation Plan: UI Polish & Theme Toggle

**Branch**: `003-ui-polish-theme-toggle` | **Date**: 2026-02-09 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/003-ui-polish-theme-toggle/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

This feature adds a dark/light theme toggle button and refines visual spacing for improved reading comfort. The theme toggle will be positioned in the top-right corner with sun/moon iconography, persisting preferences via localStorage. Visual spacing adjustments include reducing line height (from `leading-[2.8]` to a more comfortable value), adding horizontal word padding, increasing hover highlight opacity (from 8% to 12-16%), and ensuring adequate ruby annotation vertical spacing. The dark mode CSS foundation already exists in Tailwind config; this feature adds the toggle UI component, React state management with localStorage persistence, and CSS refinements.

## Technical Context

**Language/Version**: TypeScript 5.x (frontend), Rust stable (Tauri backend - no changes for this feature)
**Primary Dependencies**: React 18, Tailwind CSS 3.x, @fontsource-variable/noto-sans-tc, @fontsource-variable/inter
**Storage**: Browser localStorage for theme preference persistence (no SQLite involvement for this feature)
**Testing**: vitest + @testing-library/react + happy-dom (Docker-based execution)
**Target Platform**: Windows desktop (Tauri 2), rendered in webview
**Project Type**: Desktop application with web frontend (React/Tailwind)
**Performance Goals**: < 100ms perceived theme toggle latency, smooth 200-300ms hover transitions
**Constraints**: Must maintain 60 fps during transitions, theme toggle must be keyboard accessible (Tab/Enter/Space), silent localStorage failure fallback
**Scale/Scope**: Single-page application with minimal UI chrome (1 new component: ThemeToggle, CSS tweaks to existing components)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Core Principles Alignment

| Principle | Status | Notes |
|-----------|--------|-------|
| **I. Content-First Design** | ✅ PASS | Theme toggle will be minimal (small icon button, top-right corner). Spacing adjustments directly support reading comfort. All changes enhance content focus. |
| **II. Offline-First Data** | ✅ PASS | localStorage is browser-local persistence. No network calls. Graceful silent fallback if persistence fails. |
| **III. Domain-Driven Design with CQRS** | ✅ N/A | This feature is purely presentational (UI/CSS). No domain logic, aggregates, or commands involved. |
| **IV. Principled Simplicity** | ✅ PASS | Minimal scope: 1 new component (ThemeToggle), CSS variable updates, no abstractions. YAGNI respected - no OS theme detection, no animated transitions, no preset system. |
| **V. Test-First Imperative** | ✅ PASS | Tests required for ThemeToggle component (toggle behavior, localStorage persistence, keyboard accessibility). Existing component tests need updates for spacing/hover changes. Docker-based execution unchanged. |
| **VI. Docker-Only Execution** | ✅ PASS | No changes to test/build infrastructure. Tests run via `npm run test` (docker-compose). |

### Technical Constraints Alignment

| Constraint | Status | Notes |
|------------|--------|-------|
| **Technology Stack** | ✅ PASS | React + TypeScript + Tailwind CSS (no new dependencies). Tauri backend untouched. |
| **Visual Identity** | ✅ PASS | No font changes. Using existing Ink & Vermillion palette. Dark mode palette already defined in constitution-compliant colors (deep ink background, cream text). |

### Development Workflow Alignment

| Workflow | Status | Notes |
|----------|--------|-------|
| **Git-Flow** | ✅ PASS | Feature branch `003-ui-polish-theme-toggle` follows `NNN-feature-name` convention. |
| **Specification-Driven** | ✅ PASS | Spec ratified, clarifications complete. This plan follows `/speckit.plan` workflow. |
| **Documentation Policy** | ✅ PASS | Plan artifacts generated via Spec Kit. No manual documentation interference. |

### Gate Result: ✅ ALL PASS - Proceed to Phase 0

---

### Post-Design Constitution Check (Phase 1 Complete)

**Re-evaluation Date**: 2026-02-09 (after research, data-model, quickstart generated)

| Principle | Status | Post-Design Notes |
|-----------|--------|-------------------|
| **I. Content-First Design** | ✅ PASS | Theme toggle positioned top-right with fixed positioning (non-intrusive). Spacing refinements enhance reading comfort. Design artifacts confirm minimal UI chrome. |
| **II. Offline-First Data** | ✅ PASS | localStorage persistence confirmed. No network dependencies. Silent fallback documented in quickstart.md. |
| **III. Domain-Driven Design with CQRS** | ✅ PASS | data-model.md confirms no domain entities involved. Pure presentation layer feature. |
| **IV. Principled Simplicity** | ✅ PASS | Inline SVG approach chosen (zero dependencies). Single hook, single component. No speculative features (OS detection, animations, presets all out of scope). |
| **V. Test-First Imperative** | ✅ PASS | Comprehensive test plan in quickstart.md. ThemeToggle.test.tsx covers all acceptance scenarios. |
| **VI. Docker-Only Execution** | ✅ PASS | No changes to test infrastructure. npm run test continues using Docker. |

### Gate Result: ✅ ALL PASS - Proceed to Phase 2 (Tasks)

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
src/
├── components/
│   ├── ThemeToggle.tsx          # NEW: Theme toggle button component
│   ├── ThemeToggle.test.tsx     # NEW: Tests for theme toggle
│   ├── RubyWord.tsx              # MODIFIED: Update hover opacity, add padding
│   ├── RubyWord.test.tsx         # MODIFIED: Update tests for spacing changes
│   ├── TextDisplay.tsx           # MODIFIED: Update line height
│   ├── TextDisplay.test.tsx      # MODIFIED: Update tests for spacing changes
│   ├── MinWidthOverlay.tsx       # UNCHANGED
│   └── MinWidthOverlay.test.tsx  # UNCHANGED
├── hooks/
│   ├── useTheme.ts               # NEW: Theme state management hook
│   └── useMinWidth.ts            # UNCHANGED
├── types/
│   └── domain.ts                 # UNCHANGED (Word, Text remain unchanged)
├── data/
│   └── sample-text.ts            # UNCHANGED
├── test/
│   └── setup.ts                  # UNCHANGED
├── App.tsx                       # MODIFIED: Integrate ThemeToggle component
├── App.test.tsx                  # MODIFIED: Update tests for ThemeToggle presence
├── main.tsx                      # UNCHANGED
└── index.css                     # MODIFIED: Update dark mode CSS variables if needed

tailwind.config.ts                # MODIFIED: Add hover opacity utility if needed
```

**Structure Decision**: This is a single-project desktop application with React frontend. The Tauri Rust backend (`src-tauri/`) is not involved in this feature - all changes are frontend-only (React components, CSS, hooks). Tests are colocated with source files following the established pattern (`*.test.tsx` alongside `*.tsx`).

## Complexity Tracking

No constitutional violations detected. This section is not applicable.

---

## Planning Summary

### Phases Completed

**Phase 0: Outline & Research** ✅
- Generated [research.md](./research.md) with comprehensive findings on:
  - React theme toggle patterns (custom hooks, localStorage persistence)
  - CSS spacing values (line height, word padding, hover opacity, ruby vertical gap)
  - Icon implementation strategies (inline SVG vs libraries)
- All technical unknowns resolved
- All design decisions documented with rationale

**Phase 1: Design & Contracts** ✅
- Generated [data-model.md](./data-model.md) confirming no domain model changes
- Skipped contracts/ directory (no API calls - browser-local only)
- Generated [quickstart.md](./quickstart.md) with step-by-step implementation guide
- Updated agent context (CLAUDE.md) with new patterns
- Re-evaluated Constitution Check: All gates pass

**Phase 2: Tasks** ⏳
- Pending: Run `/speckit.tasks` to generate actionable task list
- Will generate [tasks.md](./tasks.md) with dependency-ordered implementation steps

---

## Key Design Decisions

| Decision Area | Choice | Rationale |
|---------------|--------|-----------|
| **Theme State Management** | Custom hook with useState + useEffect | Clean, testable, aligns with existing patterns |
| **Icon Strategy** | Inline SVG components | Zero dependencies, YAGNI principle |
| **Line Height** | Reduce from 2.8 to 2.5 | Addresses user feedback while staying in optimal range (2.5-3.0 for ruby text) |
| **Word Padding** | Add px-0.5 (2px per side) | Subtle separation without disrupting CJK conventions |
| **Hover Opacity** | Increase 8% → 12% + add focus ring | 50% visibility increase, WCAG keyboard compliance |
| **Ruby Spacing** | No changes (line-height handles it) | No CSS property exists, current implementation correct |

---

## Implementation Readiness

- ✅ All research complete
- ✅ All design artifacts generated
- ✅ Constitution compliance verified (pre and post-design)
- ✅ Agent context updated
- ✅ Implementation guide comprehensive (quickstart.md)
- ⏳ Ready for task breakdown (Phase 2)

**Next Command**: `/speckit.tasks` to generate actionable task list
