# Tasks: Reading Experience Refinements

**Input**: Design documents from `/specs/004-reading-experience-refinements/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, quickstart.md

**Tests**: Tests are included as this is a presentation-layer refinement requiring visual and interaction validation.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each refinement.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3, US4)
- Include exact file paths in descriptions

## Path Conventions

- Single project: `src/`, `tests/` at repository root
- All tests run in Docker containers via `npm run test`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Verify environment and establish baseline

- [ ] T001 Verify Docker Desktop is running and in Windows container mode per quickstart.md
- [ ] T002 [P] Read current RubyWord component implementation in src/components/RubyWord.tsx
- [ ] T003 [P] Read current TextDisplay component implementation in src/components/TextDisplay.tsx

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T004 Verify Tailwind opacity-24 utility exists in tailwind.config.ts, add if missing
- [ ] T005 Read existing RubyWord test file in src/components/RubyWord.test.tsx to understand test patterns
- [ ] T006 Check if TextDisplay.test.tsx exists; create if missing following existing test patterns

**Checkpoint**: Foundation ready - user story implementation can now begin sequentially

---

## Phase 3: User Story 1 - Enhanced Hover Visibility (Priority: P1) 🎯 MVP

**Goal**: Increase hover background opacity from 12% to 24% for clearer visual feedback on Word elements

**Independent Test**: Hover over any Word element and visually confirm the background color is clearly visible at 24% opacity in both light and dark themes

### Tests for User Story 1

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [ ] T007 [US1] Write test for hover opacity in src/components/RubyWord.test.tsx - verify className contains `hover:bg-vermillion/24`

### Implementation for User Story 1

- [ ] T008 [US1] Modify RubyWord className in src/components/RubyWord.tsx - change `hover:bg-vermillion/12` to `hover:bg-vermillion/24` and verify `transition-colors duration-200 ease-in-out` is retained
- [ ] T009 [US1] Run tests in Docker via `npm run test` - verify T007 test now passes
- [ ] T010 [US1] Visual validation per quickstart.md Section "1. Hover Visibility (P1)" in both light and dark modes

**Checkpoint**: At this point, User Story 1 should be fully functional - hover backgrounds are clearly visible at 24% opacity

---

## Phase 4: User Story 2 - Complete Pinyin Background Coverage (Priority: P2)

**Goal**: Add vertical padding to ensure hover background fully encompasses pinyin annotations without clipping

**Independent Test**: Hover over Words with pinyin annotations and visually confirm the background extends fully to cover the pinyin text without clipping at the top

### Tests for User Story 2

- [ ] T011 [US2] Write test for vertical padding in src/components/RubyWord.test.tsx - verify className contains `pt-6` and `pb-1.5`

### Implementation for User Story 2

- [ ] T012 [US2] Modify RubyWord className in src/components/RubyWord.tsx - add `pt-6 pb-1.5` to className string
- [ ] T013 [US2] Run tests in Docker via `npm run test` - verify T011 test now passes
- [ ] T014 [US2] Visual validation per quickstart.md Section "2. Pinyin Coverage (P2)" - confirm full coverage of long pinyin

**Checkpoint**: At this point, User Stories 1 AND 2 should both work - hover backgrounds are visible AND fully cover pinyin

---

## Phase 5: User Story 3 - Remove Artificial Word Spacing (Priority: P3)

**Goal**: Remove horizontal padding to eliminate false word spacing that violates authentic Chinese typography

**Independent Test**: View text with multiple consecutive Words and confirm there is no visible horizontal gap or spacing between adjacent character groups

### Tests for User Story 3

- [ ] T015 [US3] Write test for horizontal padding absence in src/components/RubyWord.test.tsx - verify className does NOT contain any `px-` pattern

### Implementation for User Story 3

- [ ] T016 [US3] Modify RubyWord className in src/components/RubyWord.tsx - remove `px-0.5` from className string
- [ ] T017 [US3] Run tests in Docker via `npm run test` - verify T015 test now passes
- [ ] T018 [US3] Visual validation per quickstart.md Section "3. Word Spacing (P3)" - confirm continuous character flow

**Checkpoint**: All three visual refinements to RubyWord are complete - opacity increased, pinyin covered, spacing removed

---

## Phase 6: User Story 4 - Disable Text Selection (Priority: P4)

**Goal**: Disable text selection for all reading content (Words and punctuation) and ensure cursor remains default throughout

**Independent Test**: Attempt to click-and-drag to select text (Chinese characters, pinyin, punctuation) and confirm that no text becomes highlighted; verify cursor remains default arrow

### Tests for User Story 4

- [ ] T019 [P] [US4] Write test for selection prevention in src/components/TextDisplay.test.tsx - verify container className contains `select-none`
- [ ] T020 [P] [US4] Write test for cursor state in src/components/TextDisplay.test.tsx - verify container className contains `cursor-default`

### Implementation for User Story 4

- [ ] T021 [US4] Modify TextDisplay container in src/components/TextDisplay.tsx - add `select-none cursor-default` to className for non-empty case (line ~20)
- [ ] T022 [US4] Modify TextDisplay container in src/components/TextDisplay.tsx - add `select-none cursor-default` to className for empty case (line ~12)
- [ ] T023 [US4] Run tests in Docker via `npm run test` - verify T019 and T020 tests now pass
- [ ] T024 [US4] Visual validation per quickstart.md Section "4. Text Selection (P4)" - test mouse, keyboard (within reading area), and touch selection prevention (Note: Full keyboard shortcut interception is future work per FR-006)

**Checkpoint**: All four user stories are complete and independently functional - all refinements applied

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Validation and testing that affects all user stories

- [ ] T025 [P] Cross-theme validation - verify all four refinements work correctly in both light and dark themes
- [ ] T026 [P] Browser compatibility validation per quickstart.md - test in Edge/Chrome/Firefox (modern browsers)
- [ ] T027 Run full test suite in Docker via `npm run test` - ensure all tests pass with no regressions
- [ ] T028 Visual regression check - compare final implementation against quickstart.md "Expected output" for all four test scenarios
- [ ] T029 Build production app via `npm run build` - verify no TypeScript or Tailwind errors

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-6)**: All depend on Foundational phase completion
  - **SHOULD proceed sequentially (recommended)** (P1 → P2 → P3 → P4) because US1-US3 modify the same RubyWord className incrementally
  - Each story builds on the previous story's className changes
- **Polish (Phase 7)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P2)**: DEPENDS on US1 completion - adds to the same RubyWord className
- **User Story 3 (P3)**: DEPENDS on US2 completion - modifies the same RubyWord className
- **User Story 4 (P4)**: Can start after Foundational (Phase 2) - Independent (modifies TextDisplay, not RubyWord)

**Note**: US1, US2, US3 are NOT parallelizable because they all modify the same className string in RubyWord.tsx. US4 CAN be done in parallel with US1-3 if desired (different file), but recommended to do sequentially for clarity.

### Within Each User Story

- Tests MUST be written and FAIL before implementation
- Implementation modifies component className
- Tests run to verify className changes
- Visual validation confirms behavior
- Story complete before moving to next priority

### Parallel Opportunities

- **Phase 1**: T002 and T003 can run in parallel (reading different files)
- **Phase 2**: Limited parallelization (sequential understanding needed)
- **User Stories**: US4 CAN be parallelized with US1-3 (different files) but NOT recommended - sequential is clearer
- **Phase 7**: T025 and T026 can run in parallel (independent validation tasks)

**Recommended Approach**: Execute all phases sequentially for this feature (P1 → P2 → P3 → P4 → Polish). Parallelization offers minimal benefit given the small number of files modified.

---

## Parallel Example: User Story 4 (Only parallel opportunity)

```bash
# IF choosing to parallelize US4, launch these tests together:
Task: "Write test for selection prevention in src/components/TextDisplay.test.tsx"
Task: "Write test for cursor state in src/components/TextDisplay.test.tsx"
```

**Note**: Given the incremental nature of RubyWord className changes, parallel execution is NOT recommended for US1-3.

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (verify Tailwind config, understand test patterns)
3. Complete Phase 3: User Story 1 (increase hover opacity to 24%)
4. **STOP and VALIDATE**: Test User Story 1 independently - hover should be clearly visible
5. Optionally build and demo at this checkpoint

### Incremental Delivery (Recommended)

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Hover opacity increased to 24% ✅
3. Add User Story 2 → Test independently → Pinyin fully covered by hover background ✅
4. Add User Story 3 → Test independently → No horizontal gaps between Words ✅
5. Add User Story 4 → Test independently → Text selection disabled, cursor default ✅
6. Complete Polish → All refinements validated across themes and browsers ✅

Each story adds value incrementally without breaking previous stories.

### All-at-Once Strategy (Alternative)

Since all RubyWord changes happen in a single className string, you MAY choose to implement US1+US2+US3 together as a single edit operation, then test all three aspects. This is acceptable but loses the incremental validation benefit.

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- RubyWord className changes are incremental - each story adds/modifies the className built by previous story
- TextDisplay changes (US4) are independent and could theoretically run in parallel, but sequential is recommended
- Visual validation per quickstart.md is CRITICAL - automated tests only verify className presence, not visual behavior
- All tests run in Docker containers (`npm run test`) per constitutional requirement
- No domain logic changes - this is pure presentation layer CSS refinement
- Final RubyWord className (after all stories): `"font-hanzi rounded pt-6 pb-1.5 transition-colors duration-200 ease-in-out hover:bg-vermillion/24 focus-visible:ring-2 focus-visible:ring-vermillion"`
- Final TextDisplay className (after US4): `"font-hanzi text-2xl leading-[2.5] select-none cursor-default"`
