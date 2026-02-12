# Implementation Plan: Pinyin Toggle & Title Bar Improvements

**Branch**: `006-pinyin-toggle` | **Date**: 2026-02-12 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/006-pinyin-toggle/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

This feature implements four complementary improvements to the title bar and text display:

1. **Pinyin Visibility Toggle (P1)**: Add a toggle button to show/hide Pinyin ruby annotations, enabling learners to test character recognition without phonetic hints. The preference persists via localStorage and defaults to visible.

2. **Title Bar Dragging Fix (P2)**: Fix window dragging to work when clicking on the title text or empty space in the title bar, not just on designated drag regions.

3. **Title Bar Button Sizing (P3)**: Reduce title bar button sizes by 20-30% to be proportional to the small title text, maintaining the "Chinese characters are the star" principle.

4. **Cursor State Simplification (P4)**: Remove grab/grabbing cursor states from the drag region, keeping cursors neutral (default arrow) everywhere except clickable buttons (pointer).

**Technical Approach**: Create a `usePinyinVisibility` hook following the existing `useTheme` pattern for localStorage persistence. Add a `PinyinToggle` component to the title bar. Use CSS `visibility: hidden/visible` to toggle Pinyin `<rt>` visibility in `RubyWord` without layout shift (Chinese characters never move). Remove drag cursor CSS rules. Reduce button padding/sizing in TitleBar buttons. Ensure `data-tauri-drag-region` works correctly on title text.

## Technical Context

**Language/Version**: TypeScript 5.5 (frontend), Rust stable (Tauri backend - no changes)
**Primary Dependencies**: React 18.3, Tailwind CSS 3.4, lucide-react 0.563, @tauri-apps/api 2.0
**Storage**: Browser localStorage for Pinyin visibility preference (boolean)
**Testing**: Vitest 2.0 + @testing-library/react 16.0 + happy-dom 15.0
**Target Platform**: Windows desktop (Tauri 2 frameless window)
**Project Type**: Single (Tauri desktop app with React frontend)
**Performance Goals**:
- Toggle visibility in <1 second (FR-006, SC-001)
- No UI flicker or layout shift during toggle
- Immediate localStorage persistence (<50ms)

**Constraints**:
- **CRITICAL**: Chinese characters MUST NOT move vertically when toggling Pinyin (use CSS visibility, not conditional rendering)
- **CRITICAL**: Line height MUST remain constant when toggling Pinyin (ruby space always reserved)
- Must work with existing `TextDisplay` → `RubyWord` component hierarchy
- Must not break existing theme toggle, fullscreen toggle, or close button
- Button sizing must maintain minimum 32×32px touch target (FR-012)
- Tab order must be: Pinyin → Theme → Fullscreen → Close (FR-017)
- Pinyin default: visible on first run (FR-004)

**Scale/Scope**:
- Single view (main text display)
- 4 new/modified components
- 1 new custom hook
- ~200-300 lines of new code
- 5-8 new test suites

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### I. Content-First Design
- ✅ **Pinyin toggle supports learning**: Hiding Pinyin keeps Chinese characters as the star, enabling active recall practice
- ✅ **Smaller buttons**: Reduces UI chrome prominence, reinforcing "Chinese text is the visual focus"
- ✅ **Neutral cursor**: Removes visual noise (grab/grabbing) that distracts from content
- ✅ **Gentle transitions**: Toggle visibility should use gentle CSS transition (200-300ms ease) per constitution

### II. Offline-First Data
- ✅ **No network required**: Pinyin visibility is a local UI preference only, no LLM involvement
- ✅ **localStorage**: Browser localStorage (not SQLite) is acceptable for UI preferences per constitution

### III. Domain-Driven Design with CQRS
- ⚠️ **Not applicable**: This is purely a UI/UX feature with no domain model changes
- ✅ **No domain violations**: Does not modify Text or Word entities, respects domain language

### IV. Principled Simplicity
- ✅ **YAGNI**: No keyboard shortcuts (user chose Tab navigation over custom Ctrl+P)
- ✅ **KISS**: Reuses existing patterns (`useTheme` → `usePinyinVisibility`, `ThemeToggle` → `PinyinToggle`)
- ✅ **DRY**: Shared localStorage persistence pattern, shared button styling pattern
- ✅ **No premature abstraction**: Single toggle for Pinyin visibility, no "layers" system

### V. Test-First Imperative
- ✅ **Docker-exclusive testing**: All tests run via `npm run test` (Docker Compose)
- ✅ **Coverage levels**: Will include unit tests (component + hook), integration tests (toggle persistence), contract tests (localStorage API)
- ✅ **TDD**: Write tests before implementation per constitution SHOULD

### VI. Docker-Only Execution
- ✅ **No local execution**: Tests and builds run in Docker containers only
- ✅ **No dev dependencies on host**: Only Node.js + npm + Docker Desktop required

**GATE RESULT (Pre-Design)**: ✅ **PASS** - All constitutional requirements satisfied, no violations to justify

**GATE RESULT (Post-Design)**: ✅ **PASS** - Design artifacts confirm all constitutional compliance:
- research.md confirms YAGNI, KISS, DRY principles applied
- data-model.md confirms no domain model violations
- quickstart.md confirms TDD approach with comprehensive test coverage
- contracts/localStorage.md confirms error handling and graceful degradation
- All design decisions align with "Chinese characters are the star" principle

## Project Structure

### Documentation (this feature)

```text
specs/006-pinyin-toggle/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
│   └── localStorage.md  # localStorage API contract
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
src/
├── components/
│   ├── PinyinToggle.tsx          # NEW: Pinyin visibility toggle button
│   ├── PinyinToggle.test.tsx     # NEW: Pinyin toggle tests
│   ├── RubyWord.tsx               # MODIFIED: Conditional rt rendering
│   ├── RubyWord.test.tsx          # MODIFIED: Add visibility tests
│   ├── TextDisplay.tsx            # MODIFIED: Pass visibility prop
│   ├── TextDisplay.test.tsx       # MODIFIED: Add visibility tests
│   ├── TitleBar.tsx               # MODIFIED: Add PinyinToggle, adjust button spacing
│   ├── ThemeToggle.tsx            # MODIFIED: Reduce button size (CSS only)
│   ├── FullscreenToggle.tsx       # MODIFIED: Reduce button size (CSS only)
│   └── CloseButton.tsx            # MODIFIED: Reduce button size (CSS only)
├── hooks/
│   ├── usePinyinVisibility.ts    # NEW: Pinyin visibility state + persistence
│   └── usePinyinVisibility.test.ts # NEW: Hook tests
├── types/
│   └── domain.ts                  # NO CHANGE: No domain model changes
├── data/
│   └── sample-text.ts             # NO CHANGE: Sample data unchanged
├── index.css                       # MODIFIED: Remove grab/grabbing cursor rules
└── App.tsx                         # MODIFIED: Wire up Pinyin visibility state

tests/
├── integration/
│   └── pinyin-toggle.test.tsx    # NEW: End-to-end toggle + persistence
└── contract/
    └── localStorage.test.ts       # NEW: localStorage contract tests
```

**Structure Decision**: Single project (Tauri + React frontend). This is a pure frontend feature with no backend changes. All new code follows existing patterns in `src/components/` and `src/hooks/`. Integration tests verify cross-component behavior. Contract tests ensure localStorage API compliance.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

N/A - No constitutional violations detected.
