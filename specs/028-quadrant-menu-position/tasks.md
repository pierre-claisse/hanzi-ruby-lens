# Tasks: Quadrant-Based Context Menu Positioning

**Input**: Design documents from `/specs/028-quadrant-menu-position/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, quickstart.md

**Tests**: Included — Constitution V (Test-First Imperative) requires test coverage.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Extract reusable constants and the pure positioning function that all stories depend on.

- [x] T001 Define MENU_WIDTH_PX (192) and MENU_ITEM_HEIGHT_PX (36) constants at the top of `src/components/TextDisplay.tsx`, replacing the inline magic numbers in the existing `getMenuPosition()` callback
- [x] T002 Extract a pure `computeMenuPosition()` function from the existing `getMenuPosition()` callback in `src/components/TextDisplay.tsx` — it takes `wordRect`, `containerRect`, `menuEntryCount`, `viewportWidth`, and `viewportHeight` as parameters and returns `{ top, left, direction }`. Wire the existing `getMenuPosition()` to call it. Behavior must be identical to current (vertical-only positioning, left aligned to word left edge).

**Checkpoint**: Existing menu positioning works exactly as before, with logic extracted into a testable pure function.

---

## Phase 2: User Story 1 — Quadrant-Aware Menu Positioning (Priority: P1) 🎯 MVP

**Goal**: Menu opens in the opposite quadrant to the word's position — combining horizontal and vertical rules for 4-way adaptive positioning.

**Independent Test**: Right-click words in each of the 4 screen quadrants and verify the menu appears in the expected position.

### Tests for User Story 1

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [x] T003 [US1] Write unit tests for `computeMenuPosition()` in `tests/unit/menuPosition.test.ts` — test all 4 quadrants: (1) top-left word → menu below-right, (2) top-right word → menu below-left, (3) bottom-left word → menu above-right, (4) bottom-right word → menu above-left. Also test midpoint tie-breaking (word exactly at midpoint → treated as top-left quadrant → below-right).
- [x] T004 [US1] Write unit tests for viewport clamping in `tests/unit/menuPosition.test.ts` — test that computed `left` is clamped to `[0, containerWidth - MENU_WIDTH_PX]` and `top` is clamped to `[0, containerHeight - menuHeight]` when the menu would overflow.

### Implementation for User Story 1

- [x] T005 [US1] Extend `computeMenuPosition()` in `src/components/TextDisplay.tsx` to compute horizontal midpoint (`viewportWidth / 2`), compare word center X against it, and branch on both axes to produce 4 quadrant positions. For left-half words: `left = wordRect.right - containerRect.left + 4`. For right-half words: `left = wordRect.left - containerRect.left - MENU_WIDTH_PX - 4`. Midpoint tie-break: treat as top-left (below-right).
- [x] T006 [US1] Add viewport overflow clamping at the end of `computeMenuPosition()` in `src/components/TextDisplay.tsx` — clamp `left` to `[0, containerWidth - MENU_WIDTH_PX]` and `top` to `[0, containerHeight - menuHeight]`.
- [x] T007 [US1] Run `npm test` in Docker to verify all unit tests pass in `tests/unit/menuPosition.test.ts`.

**Checkpoint**: Quadrant-based positioning works for right-click. All unit tests green.

---

## Phase 3: User Story 2 — Consistent Positioning Across Navigation Methods (Priority: P2)

**Goal**: Keyboard-triggered menu uses the same quadrant positioning as right-click.

**Independent Test**: Use keyboard to navigate to words in different quadrants, trigger the menu, and verify position matches quadrant rules.

### Implementation for User Story 2

- [x] T008 [US2] Verify in `src/components/TextDisplay.tsx` that keyboard-triggered menu opening (via `useWordNavigation` hook) calls the same `getMenuPosition()` path as right-click. If they share the same code path (expected), document this in a code comment. If not, refactor to share the `computeMenuPosition()` function.

**Checkpoint**: Keyboard and right-click menu positioning use identical quadrant logic.

---

## Phase 4: User Story 3 — Uniform Menu Icon Sizes (Priority: P3)

**Goal**: All context menu icons render at the same visual size and stroke weight.

**Independent Test**: Right-click a word with both merge options and visually compare icon weights.

### Implementation for User Story 3

- [x] T009 [US3] Add `strokeWidth={1.5}` to the `<Icon>` render in `src/components/WordContextMenu.tsx` (line 46: change `<Icon size={16} />` to `<Icon size={16} strokeWidth={1.5} />`).

**Checkpoint**: All menu icons appear at uniform stroke weight, including both merge icons.

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Final validation across all stories.

- [x] T010 Run full test suite with `npm test` in Docker — all existing and new tests must pass.
- [ ] T011 Manual verification: open context menu on words in all 4 quadrants (top-left, top-right, bottom-left, bottom-right) via both right-click and keyboard, confirm correct positioning and uniform icon appearance.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **US1 (Phase 2)**: Depends on Phase 1 (extracted pure function)
- **US2 (Phase 3)**: Depends on Phase 2 (quadrant logic must exist to verify keyboard path)
- **US3 (Phase 4)**: No dependency on other stories — can run in parallel with Phase 2 or 3
- **Polish (Phase 5)**: Depends on all previous phases

### Parallel Opportunities

- **T003 + T004**: Both test files can be written in parallel (same file but independent test suites)
- **T009 (US3)** can run in parallel with **T005–T007 (US1)** — different files, no dependencies
- After Phase 1, US1 and US3 can proceed simultaneously

---

## Parallel Example

```bash
# After Phase 1 setup, launch US1 tests and US3 icon fix in parallel:
Task: "T003 — Write quadrant unit tests in tests/unit/menuPosition.test.ts"
Task: "T009 — Add strokeWidth to icons in src/components/WordContextMenu.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Extract pure function + constants
2. Complete Phase 2: Quadrant positioning + tests
3. **STOP and VALIDATE**: Test quadrant positioning manually in all 4 quadrants
4. Ready for demo

### Incremental Delivery

1. Phase 1 → Refactor with no behavior change
2. Phase 2 (US1) → Quadrant positioning → Test → Validate (MVP!)
3. Phase 3 (US2) → Verify keyboard consistency → Validate
4. Phase 4 (US3) → Icon fix → Validate
5. Phase 5 → Full validation pass

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Commit after each phase
- MENU_WIDTH_PX = 192 (Tailwind `w-48` = 12rem at default 16px base)
- MENU_ITEM_HEIGHT_PX = 36 (existing convention)
- Menu gap = 4px (existing convention)
