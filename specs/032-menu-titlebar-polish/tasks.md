# Tasks: Menu Positioning & Title Bar Polish

**Input**: Design documents from `/specs/032-menu-titlebar-polish/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, quickstart.md

**Tests**: Included — Constitution V (Test-First Imperative) requires test coverage.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Extract the menu positioning utility so both reading view and library view can share the same algorithm.

- [X] T001 Create `src/utils/menuPositioning.ts` — move `computeMenuPosition()`, `MENU_WIDTH_PX`, `MENU_ITEM_HEIGHT_PX`, `MENU_PADDING_PX`, and `MENU_GAP_PX` from `src/components/TextDisplay.tsx`. Add a new `computeContextMenuPosition()` wrapper that adapts a click-point `{x, y}` into a zero-size rect for the existing algorithm (containerRect = `{top: 0, left: 0}`). Add a `computeSubmenuPosition()` function that computes a submenu's `{top, left}` given the main menu's rect, submenu dimensions, and viewport size — horizontal: open left if main menu center X > viewport midpoint, else open right; vertical: clamp to viewport bounds.
- [X] T002 Update `src/components/TextDisplay.tsx` — replace the removed constants and `computeMenuPosition` function with imports from `src/utils/menuPositioning.ts`. The `buildMenuEntries` function and all other code remain unchanged. Verify the component compiles with no errors.
- [X] T003 Update `tests/unit/menuPosition.test.ts` — change the import path from `../../src/components/TextDisplay` to `../../src/utils/menuPositioning`. All existing tests must pass without modification to test bodies.

**Checkpoint**: Positioning utility extracted. `TextDisplay` uses the shared import. All existing tests pass (no behavior change).

---

## Phase 2: User Story 1 — Consistent Menu Positioning in Library View (Priority: P1) 🎯 MVP

**Goal**: The library context menu and its tags submenu use the same quadrant-based positioning algorithm as the reading view. Menus never overflow off-screen.

**Independent Test**: Right-click text cards in each viewport quadrant. Verify the context menu opens toward the center. Hover "Tags" — submenu flips left/right and above/below as needed.

### Tests for User Story 1

- [X] T004 [P] [US1] Write unit tests for `computeContextMenuPosition()` in `tests/unit/menuPosition.test.ts` — test that a click in the bottom-right quadrant positions the menu above-left, and a click in the top-left quadrant positions it below-right. Test viewport clamping.
- [X] T005 [P] [US1] Write unit tests for `computeSubmenuPosition()` in `tests/unit/menuPosition.test.ts` — test that when the main menu is in the right half, the submenu opens to the left; when in the left half, it opens to the right. Test vertical clamping when the submenu would overflow below the viewport.

### Implementation for User Story 1

- [X] T006 [US1] Update `src/components/LibraryScreen.tsx` — import `computeContextMenuPosition` and `computeSubmenuPosition` from `src/utils/menuPositioning.ts`. Replace the raw `{ top: contextMenu.y, left: contextMenu.x }` inline style with the computed position from `computeContextMenuPosition()`. Store the computed position (including menu width/height) so the tags submenu can reference it.
- [X] T007 [US1] Update the tags submenu rendering in `src/components/LibraryScreen.tsx` — remove the static `absolute left-full top-0 ml-1` positioning. Instead, compute the submenu position using `computeSubmenuPosition()` with the main menu's bounding rect, submenu dimensions, and viewport size. Apply the computed `top`/`left` via inline styles.
- [X] T008 [US1] Run `npm test` in Docker to verify all US1 tests and existing tests pass.

**Checkpoint**: Library context menu and tags submenu use quadrant-based positioning. No clipping in any viewport quadrant. All tests pass.

---

## Phase 3: User Story 2 — Title Bar Shows "Library" in Library View (Priority: P2)

**Goal**: The title bar displays "Library" instead of "Hanzi Ruby Lens" when the library view is active.

**Independent Test**: Open the app to library view. Title bar shows "Library". Navigate away and back — still shows "Library".

### Tests for User Story 2

- [X] T009 [P] [US2] Write unit test in `tests/unit/titleBar.test.tsx` — render the TitleBar component with `titleText="Library"` and verify the `<h1>` contains "Library", not "Hanzi Ruby Lens".

### Implementation for User Story 2

- [X] T010 [US2] Add `titleText: string` prop to the `TitleBar` component in `src/components/TitleBar.tsx`. Replace the hardcoded "Hanzi Ruby Lens" `<h1>` content with `{titleText}`. Keep all other props and behavior unchanged.
- [X] T011 [US2] Update `src/App.tsx` — pass `titleText="Library"` when `appView === "library"` (and any non-reading view). For reading view, pass `titleText={activeText?.title ?? ""}` (wired in US3, but set a fallback now).
- [X] T012 [US2] Update `src/App.test.tsx` — the test `"renders TitleBar with title"` currently checks for "Hanzi Ruby Lens". Update it to check for "Library" (since the app starts in library view).
- [X] T013 [US2] Run `npm test` in Docker to verify all US2 tests and existing tests pass.

**Checkpoint**: Title bar shows "Library" in library view. All tests pass.

---

## Phase 4: User Story 3 — Title Bar Shows Text Title in Reading View (Priority: P3)

**Goal**: In reading view, the title bar shows the text's title left-aligned before the zoom indicator, replacing the app name. The previously centered text title overlay is removed.

**Independent Test**: Open a text in reading view. Title bar shows the text's title left-aligned before the zoom indicator, not "Hanzi Ruby Lens", and not centered.

### Tests for User Story 3

- [X] T014 [P] [US3] Write unit tests in `tests/unit/titleBar.test.tsx` — render TitleBar with `titleText="三國演義"` and `showBack=true`. Verify (a) the `<h1>` contains "三國演義", (b) no centered absolute-positioned title element exists, (c) the title appears before the zoom indicator in the DOM.

### Implementation for User Story 3

- [X] T015 [US3] Update `src/components/TitleBar.tsx` — remove the centered `textTitle` `<span>` element (the one with `absolute left-1/2 -translate-x-1/2`). The `titleText` prop (from US2) already renders in the `<h1>`. Add `truncate max-w-[40%]` classes to the `<h1>` to handle long titles. Ensure the zoom indicator remains immediately after the title in the same flex row.
- [X] T016 [US3] Remove the `textTitle` prop from `TitleBar` props interface in `src/components/TitleBar.tsx` — it is now replaced by `titleText` (added in T010). Remove the `textTitle` prop from the `<TitleBar>` call in `src/App.tsx`.
- [X] T017 [US3] Run `npm test` in Docker to verify all US3 tests and existing tests pass.

**Checkpoint**: Reading view title bar shows text title left-aligned before zoom indicator. Centered overlay removed. Long titles truncated. All tests pass.

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Final validation across all stories.

- [X] T018 Run full test suite with `npm test` in Docker — all existing and new tests must pass.
- [X] T019 Run `npm run build` in Docker — verify build succeeds with no errors or warnings.
- [ ] T020 Manual verification per quickstart.md: test library menu positioning in all four quadrants, tags submenu flipping, title bar "Library" in library view, text title in reading view, long title truncation, reading view menu unchanged.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **US1 (Phase 2)**: Depends on Phase 1 (needs shared utility)
- **US2 (Phase 3)**: No dependency on US1 — can start after Phase 1
- **US3 (Phase 4)**: Depends on US2 (needs `titleText` prop from T010)
- **Polish (Phase 5)**: Depends on all previous phases

### Parallel Opportunities

- **T004 + T005**: Unit tests for different functions in the same file (can be written together)
- **T009 + T014**: TitleBar tests for US2 and US3 are independent (same file, different test blocks)
- **US1 and US2**: Can be implemented in parallel after Phase 1 (different files: LibraryScreen vs TitleBar)

---

## Parallel Example

```bash
# Phase 1 complete, then US1 and US2 tests in parallel:
Task: "T004 — Unit tests for computeContextMenuPosition"
Task: "T009 — Unit test for TitleBar with Library title"

# US1 and US2 implementation can overlap (different files):
Task: "T006 — LibraryScreen quadrant positioning"
Task: "T010 — TitleBar titleText prop"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Extract positioning utility
2. Complete Phase 2: US1 — Library menu positioning
3. **STOP and VALIDATE**: Right-click in all quadrants, verify menus never clip
4. Ready for demo

### Incremental Delivery

1. Phase 1 → Shared utility extraction
2. Phase 2 (US1) → Library menu quadrant positioning → Test → Validate (MVP!)
3. Phase 3 (US2) → Title bar "Library" → Test → Validate
4. Phase 4 (US3) → Title bar text title in reading view → Test → Validate
5. Phase 5 → Full validation pass

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Commit after each phase
- `computeMenuPosition()` extraction is a pure refactor — no behavior change to reading view
- The library context menu uses `position: fixed` (viewport-relative) — pass `containerRect = {top: 0, left: 0}` to the shared function
- The `textTitle` prop on TitleBar is removed in US3 (T016) since `titleText` replaces it
- No backend/Rust changes needed — this is a frontend-only feature
