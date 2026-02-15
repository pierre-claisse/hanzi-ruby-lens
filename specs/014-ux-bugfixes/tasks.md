# Tasks: UX Bugfixes

**Input**: Design documents from `specs/014-ux-bugfixes/`
**Prerequisites**: plan.md, spec.md, research.md, quickstart.md

**Tests**: Not explicitly requested. All existing 217+ vitest and 9 Rust tests must continue to pass. No new test files needed — these are targeted CSS/behavior fixes.

**Organization**: Tasks grouped by user story. All 4 stories are independent — they touch different files and can be implemented in any order.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3, US4)
- Include exact file paths in descriptions

---

## Phase 1: User Story 1 — Wider Reading Layout (Priority: P1)

**Goal**: Remove max-width constraint so text flows to window edges. Set default window to 1600×900.

**Independent Test**: Launch the app, verify window opens at 1600×900 and text flows edge-to-edge with padding only.

- [X] T001 [P] [US1] Update window size from 1024×768 to 1600×900 in `src-tauri/tauri.conf.json` — change `width` to 1600, `height` to 900, `minWidth` to 1600, `minHeight` to 900
- [X] T002 [P] [US1] Remove `max-w-2xl mx-auto` wrapper from the content container in `src/App.tsx` — keep side padding, remove width constraint

**Checkpoint**: App opens wider, text flows to edges. Existing tests pass (no layout assertions in vitest).

---

## Phase 2: User Story 2 — Context Menu Hover Fix (Priority: P1)

**Goal**: Context menu stays anchored when mouse crosses adjacent words while moving toward menu entries.

**Independent Test**: Right-click a word, move mouse toward menu — menu stays stable and clickable.

- [X] T003 [US2] Fix `handleWordHover` in `src/hooks/useWordNavigation.ts` — when `menuOpen` is true, return early without updating `trackedIndex` or closing the menu. The existing click-outside and keyboard handlers already close the menu properly.

**Checkpoint**: Context menu is usable at all zoom levels. Existing useWordNavigation tests pass.

---

## Phase 3: User Story 3 — Pinyin Ruby Alignment (Priority: P2)

**Goal**: Multi-character word pinyin renders as a cohesive unit without spacing artifacts.

**Independent Test**: View 埃及 in the sample text — pinyin "āijí" appears without excessive gaps.

- [X] T004 [US3] Move `ruby-align: center` from `rt` to `ruby` element in `src/index.css` — this tells the browser to center the annotation as a single unit over the entire ruby base instead of distributing across individual characters

**Checkpoint**: Pinyin for 埃及, 象形文字, and other multi-character words renders correctly. Existing tests pass.

---

## Phase 4: User Story 4 — Themed Scrollbar (Priority: P3)

**Goal**: Vertical scrollbar matches the active color palette and theme.

**Independent Test**: Scroll the page, switch palettes and themes — scrollbar colors update accordingly.

- [X] T005 [US4] Add themed scrollbar styles in `src/index.css` — add `::-webkit-scrollbar` (8px width), `::-webkit-scrollbar-track` (uses `--color-background`), `::-webkit-scrollbar-thumb` (uses `--color-text` at 0.2 opacity, rounded corners), and `::-webkit-scrollbar-thumb:hover` (0.35 opacity) inside `@layer base`

**Checkpoint**: Scrollbar is thin, rounded, and matches palette/theme. Existing tests pass.

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Full-stack verification and build validation

- [X] T006 Run all tests via `npm run test` (Docker) — verify all existing 217+ vitest and 9 Rust tests pass
- [X] T007 Run `npm run build` — verify Docker build succeeds

---

## Dependencies & Execution Order

### Phase Dependencies

- **US1 (Phase 1)**: No dependencies — can start immediately
- **US2 (Phase 2)**: No dependencies — can start immediately
- **US3 (Phase 3)**: No dependencies — can start immediately
- **US4 (Phase 4)**: No dependencies — can start immediately
- **Polish (Phase 5)**: Depends on all user stories being complete

### Parallel Opportunities

All 4 user stories are fully independent — they touch different files:

```text
# All can run in parallel:
T001 [US1] tauri.conf.json (window size)
T002 [US1] App.tsx (layout)
T003 [US2] useWordNavigation.ts (hover logic)
T004 [US3] index.css (ruby-align)
T005 [US4] index.css (scrollbar)
```

Note: T004 and T005 both modify `src/index.css` but in different sections (ruby styles vs scrollbar styles) — they should be done sequentially within the file.

---

## Implementation Strategy

### MVP First (All Stories)

Since all 4 fixes are small and independent, implement all of them in a single pass:

1. T001 + T002 (layout + window size) — parallel, different files
2. T003 (hover fix) — parallel with above
3. T004 then T005 (index.css changes) — sequential within same file
4. T006 + T007 (test + build validation)

### Total: 7 tasks

---

## Notes

- All tasks are modifications to existing files — no new files created
- No new tests needed — existing test suite validates no regressions
- T004 and T005 both touch `src/index.css` — apply sequentially to avoid conflicts
- The pinyin fix (T004) may need a fallback if `ruby-align: center` on `ruby` doesn't fully resolve in Chromium — verify in the Docker build
- Window size change (T001) also implicitly tests that `minWidth`/`minHeight` don't conflict (current min is 1024×768, which is fine)
