# Implementation Plan: Text Keyboard Navigation

**Branch**: `011-text-keyboard-nav` | **Date**: 2026-02-13 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/011-text-keyboard-nav/spec.md`

## Summary

Add keyboard-driven word navigation to the text area. The text area becomes the first focusable element (Tab order before title bar). When focused, arrow keys move a highlight between words; mouse hover overrides and permanently sets the tracked position. Enter or right-click on a highlighted word opens a contextual menu with two dummy entries, navigable via Up/Down arrows. The menu closes on Tab-away, click-outside, or Left/Right arrow.

## Technical Context

**Language/Version**: TypeScript 5.5 (frontend), Rust stable (Tauri backend — no changes)
**Primary Dependencies**: React 18.3, Tailwind CSS 3.4, lucide-react 0.563.0, @tauri-apps/api 2.0
**Storage**: N/A (no persistence for this feature)
**Testing**: Vitest + @testing-library/react (run via `npm run test` → Docker)
**Target Platform**: Windows (Tauri 2 desktop app)
**Project Type**: Single Tauri desktop app
**Performance Goals**: Smooth transitions (200ms ease-in-out, matching existing patterns)
**Constraints**: No new dependencies. Reuse existing palette selector patterns for menu.
**Scale/Scope**: ~30 words in sample text; single user, single text

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Content-First Design | ✅ PASS | Highlight uses existing accent/24 style. Transitions 200ms. Context menu minimal, appears on demand. |
| II. Offline-First Data | ✅ N/A | No data persistence in this feature. |
| III. DDD with CQRS | ⚠️ SHOULD deviation | Pure UI interaction feature — no domain logic, commands, or queries involved. Word entity used as-is. |
| IV. Principled Simplicity | ✅ PASS | One new hook, one new component. No speculative features. Dummy entries explicitly requested. |
| V. Test-First Imperative | ⚠️ SHOULD deviation | Tests written alongside implementation, not strict TDD order. Tests run in Docker via `npm run test`. Unit + integration coverage planned. |
| VI. Docker-Only Execution | ✅ PASS | All tests/builds via `npm run test` and `npm run build` (Docker). |
| Domain Language | ✅ PASS | Word used per constitutional definition. Text aggregate unchanged. |

## Project Structure

### Documentation (this feature)

```text
specs/011-text-keyboard-nav/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── quickstart.md        # Phase 1 output
└── tasks.md             # Phase 2 output (via /speckit.tasks)
```

### Source Code (repository root)

```text
src/
├── App.tsx                          # Modified: reorder DOM (TextDisplay before TitleBar)
├── components/
│   ├── TextDisplay.tsx              # Modified: focusable container, keyboard handlers, word tracking
│   ├── RubyWord.tsx                 # Modified: controlled highlight prop, mouse/context events
│   └── WordContextMenu.tsx          # New: floating context menu with 2 dummy entries
├── hooks/
│   └── useWordNavigation.ts         # New: word navigation + menu state management
└── types/
    └── domain.ts                    # Unchanged

tests/
├── unit/
│   └── useWordNavigation.test.ts    # New: hook unit tests (navigation, menu state, boundaries)
└── integration/
    └── text-keyboard-nav.test.tsx   # New: full keyboard navigation + context menu integration
```

**Structure Decision**: Follows existing project layout. New hook in `src/hooks/` (matches `usePinyinVisibility`, `useTextZoom`, `useTheme`, `useColorPalette` pattern). New component in `src/components/` (matches `PaletteSelector` dropdown pattern). No new directories created.

### Key Design Decisions

**1. Tab order via DOM reordering (not tabIndex values)**
Move the TextDisplay wrapper div before TitleBar in App.tsx JSX. TitleBar uses `fixed` positioning so visual layout is unaffected. This avoids positive tabIndex values (accessibility anti-pattern) and gives TextDisplay natural first-in-tab-order position.

**2. Controlled highlight replaces CSS hover in focus mode**
When TextDisplay is focused, RubyWord receives an `isHighlighted` boolean prop. The CSS `hover:bg-accent/24` class is conditionally omitted to prevent double-highlight conflicts. When TextDisplay is NOT focused, existing CSS hover behavior works unchanged.

**3. Mouse hover permanently updates tracked position**
Per spec correction: mouse hover sets the `trackedIndex` to the hovered word. When mouse leaves, the highlight stays on the last mouse-set word. No revert behavior.

**4. Context menu reuses PaletteSelector patterns**
Click-outside handler (mousedown on document), tab-away detection (onBlur with relatedTarget check), keyboard navigation (ArrowUp/Down with wrapping). Positioned absolutely near the highlighted word using its bounding rect.

**5. Right-click handling coexists with global suppression**
The global `contextmenu` event listener (from 010-disable-context-menu) continues to call `e.preventDefault()`, suppressing the browser's native context menu. The word's `onContextMenu` React handler fires before the document-level handler and triggers our custom menu via state.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| III. DDD with CQRS — no CQRS pattern | Feature is pure UI keyboard interaction with no domain mutations, no persistence, no commands/queries | Adding a command/query layer for UI state (highlight index, menu open) would violate IV. Principled Simplicity (YAGNI) |
| V. Test-First — not strict TDD | Navigation hook has complex state interactions (keyboard + mouse + menu). Tests written alongside implementation to validate behavior incrementally | Strict red-green-refactor would require predicting exact state transitions before understanding the interaction model; integration tests more valuable here |
