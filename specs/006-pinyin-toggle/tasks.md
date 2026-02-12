# Tasks: Pinyin Toggle & Title Bar Improvements

**Input**: Design documents from `specs/006-pinyin-toggle/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/localStorage.md, quickstart.md

**Tests**: Following TDD approach per constitution - tests written BEFORE implementation

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3, US4)
- Include exact file paths in descriptions

## Path Conventions

Single project structure (Tauri + React):
- Frontend source: `src/`
- Tests: `tests/` (integration, contract)
- Component tests: co-located with components in `src/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

**Status**: ✅ Project already exists - No setup tasks needed

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**Status**: ✅ No foundational tasks needed - All user stories can proceed independently after US1 completes

---

## Phase 3: User Story 1 - Pinyin Visibility Toggle (Priority: P1) 🎯 MVP

**Goal**: Enable users to toggle Pinyin annotations on/off to test character recognition without visual hints. Preference persists across sessions.

**Independent Test**: Load text with Pinyin, click toggle button, verify Pinyin hides/shows with NO layout shift (Chinese characters never move). Close and reopen app, verify preference persists.

### Tests for User Story 1 (TDD Approach)

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [X] T001 [P] [US1] Create usePinyinVisibility hook test file in src/hooks/usePinyinVisibility.test.ts - Test: Returns [true, function] on first run (no saved preference)
- [X] T002 [P] [US1] Add usePinyinVisibility localStorage persistence test in src/hooks/usePinyinVisibility.test.ts - Test: Writes to localStorage on state change
- [X] T003 [P] [US1] Add usePinyinVisibility restoration test in src/hooks/usePinyinVisibility.test.ts - Test: Restores from localStorage on subsequent runs
- [X] T004 [P] [US1] Add usePinyinVisibility error handling test in src/hooks/usePinyinVisibility.test.ts - Test: Handles localStorage errors gracefully (returns default true)
- [X] T005 [P] [US1] Create PinyinToggle component test file in src/components/PinyinToggle.test.tsx - Test: Renders Eye icon when visible=true
- [X] T006 [P] [US1] Add PinyinToggle icon toggle test in src/components/PinyinToggle.test.tsx - Test: Renders EyeClosed icon when visible=false
- [X] T007 [P] [US1] Add PinyinToggle click handler test in src/components/PinyinToggle.test.tsx - Test: Calls onToggle(!visible) on click
- [X] T008 [P] [US1] Add PinyinToggle ARIA labels test in src/components/PinyinToggle.test.tsx - Test: Has correct ARIA labels ("Hide Pinyin" when visible, "Show Pinyin" when hidden)
- [X] T009 [P] [US1] Add PinyinToggle ARIA pressed test in src/components/PinyinToggle.test.tsx - Test: Has aria-pressed matching visibility state
- [X] T010 [P] [US1] Add RubyWord visibility test in src/components/RubyWord.test.tsx - Test: Always renders <ruby> and <rt> regardless of showPinyin prop
- [X] T011 [P] [US1] Add RubyWord opacity class test (visible) in src/components/RubyWord.test.tsx - Test: When showPinyin=true, <rt> has opacity-100 class (or equivalent opacity: 1)
- [X] T012 [P] [US1] Add RubyWord opacity class test (hidden) in src/components/RubyWord.test.tsx - Test: When showPinyin=false, <rt> has opacity-0 class (or equivalent opacity: 0)
- [X] T012a [P] [US1] Add RubyWord transition test in src/components/RubyWord.test.tsx - Test: <rt> has transition-opacity duration-200 ease-in-out classes for smooth 200ms fade animation
- [X] T013 [P] [US1] Add RubyWord Chinese characters test in src/components/RubyWord.test.tsx - Test: Always renders Chinese characters
- [X] T014 [P] [US1] Add TextDisplay showPinyin prop test in src/components/TextDisplay.test.tsx - Test: Passes showPinyin prop to all RubyWord components
- [X] T015 [P] [US1] Update App.test.tsx button count test in src/App.test.tsx - Test: Renders 4 title bar buttons (Pinyin, Theme, Fullscreen, Close)
- [X] T016 [P] [US1] Create integration test file for pinyin toggle in tests/integration/pinyin-toggle.test.tsx - Test: End-to-end toggle flow (click → hide → click → show)
- [X] T017 [P] [US1] Add persistence integration test in tests/integration/pinyin-toggle.test.tsx - Test: Preference persists after simulated page reload
- [X] T018 [P] [US1] Add rapid toggle test in tests/integration/pinyin-toggle.test.tsx - Test: Multiple rapid toggles work correctly (no UI flicker)
- [X] T019 [P] [US1] Create localStorage contract test file in tests/contract/localStorage.test.ts - Test: Writing "true" and reading returns "true"
- [X] T020 [P] [US1] Add localStorage false value test in tests/contract/localStorage.test.ts - Test: Writing "false" and reading returns "false"
- [X] T021 [P] [US1] Add localStorage missing key test in tests/contract/localStorage.test.ts - Test: Reading non-existent key returns null
- [X] T022 [P] [US1] Add localStorage error handling test in tests/contract/localStorage.test.ts - Test: localStorage error handling (mock QuotaExceededError)

### Implementation for User Story 1

- [X] T023 [P] [US1] Create usePinyinVisibility custom hook in src/hooks/usePinyinVisibility.ts following useTheme pattern - Lazy initialization, default to true, localStorage persistence with error handling
- [X] T024 [P] [US1] Create PinyinToggle component in src/components/PinyinToggle.tsx - Clone ThemeToggle pattern, use Eye/EyeClosed icons from lucide-react, add onPointerDown stopPropagation, ARIA labels and aria-pressed
- [X] T025 [US1] Modify RubyWord component in src/components/RubyWord.tsx - Add showPinyin prop, use CSS classes with opacity transition on <rt> element: className={`text-vermillion transition-opacity duration-200 ease-in-out ${showPinyin ? 'opacity-100' : 'opacity-0'}`} (CRITICAL: always render <rt>, never conditional rendering; 200ms transition matches existing hover pattern and complies with Constitution I)
- [X] T026 [US1] Modify TextDisplay component in src/components/TextDisplay.tsx - Add showPinyin prop, pass to all RubyWord components
- [X] T027 [US1] Modify App component in src/App.tsx - Import usePinyinVisibility, call hook, pass pinyinVisible to TextDisplay and PinyinToggle
- [X] T028 [US1] Modify TitleBar component in src/components/TitleBar.tsx - Import PinyinToggle, add as first button in button group (order: Pinyin, Theme, Fullscreen, Close)
- [X] T029 [US1] Run all tests for User Story 1 - Execute npm run test, verify all US1 tests pass

**Checkpoint**: ✅ At this point, User Story 1 is fully functional and testable independently. Pinyin toggle works, preference persists, Chinese characters never move when toggling.

---

## Phase 4: User Story 2 - Title Bar Dragging Fix (Priority: P2)

**Goal**: Fix window dragging to work when clicking on title text or empty space in title bar, not just designated drag regions. Buttons must not trigger dragging.

**Independent Test**: Click and drag on "Hanzi Ruby Lens" title text → window moves. Click and drag on empty space between title and buttons → window moves. Click any button → button action fires, window does NOT move.

**Dependencies**: US1 must be complete (TitleBar.tsx structure includes PinyinToggle)

### Tests for User Story 2 (TDD Approach)

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [X] T029a [P] [US2] Add ThemeToggle stopPropagation test in src/components/ThemeToggle.test.tsx - Test: Calls e.stopPropagation() on pointerDown event
- [X] T029b [P] [US2] Add FullscreenToggle stopPropagation test in src/components/FullscreenToggle.test.tsx - Test: Calls e.stopPropagation() on pointerDown event
- [X] T029c [P] [US2] Add CloseButton stopPropagation test in src/components/CloseButton.test.tsx - Test: Calls e.stopPropagation() on pointerDown event

### Implementation for User Story 2

- [X] T030 [P] [US2] Modify ThemeToggle component in src/components/ThemeToggle.tsx - Add onPointerDown={(e) => e.stopPropagation()} to button element (prevents window dragging when clicking button)
- [X] T031 [P] [US2] Modify FullscreenToggle component in src/components/FullscreenToggle.tsx - Add onPointerDown={(e) => e.stopPropagation()} to button element
- [X] T032 [P] [US2] Modify CloseButton component in src/components/CloseButton.tsx - Add onPointerDown={(e) => e.stopPropagation()} to button element
- [X] T033 [US2] Verify TitleBar component in src/components/TitleBar.tsx - Ensure data-tauri-drag-region attribute remains on <header> element, ensure <h1> title text has NO pointer-events: none or click handlers
- [ ] T034 [US2] Manual test: Title bar dragging functionality - Verify: (1) Drag on title text works, (2) Drag on empty space works, (3) Click button triggers action without dragging

**Checkpoint**: At this point, User Story 2 is complete. Window dragging works from all non-button areas of title bar.

---

## Phase 5: User Story 3 - Title Bar Button Sizing (Priority: P3)

**Goal**: Reduce title bar button sizes by 20-30% to be proportional to small title text, maintaining "Chinese characters are the star" principle. All buttons must remain easily clickable (minimum 32×32px).

**Independent Test**: Visual inspection of title bar - buttons are noticeably smaller than before, all buttons have consistent size, still easily clickable (approximately 32×32px total size).

**Dependencies**: US2 must be complete (buttons have stopPropagation)

### Tests for User Story 3 (TDD Approach)

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [X] T034a [P] [US3] Add ThemeToggle sizing test in src/components/ThemeToggle.test.tsx - Test: Button has p-1.5 padding class and cursor-pointer class
- [X] T034b [P] [US3] Add FullscreenToggle sizing test in src/components/FullscreenToggle.test.tsx - Test: Button has p-1.5 padding class and cursor-pointer class
- [X] T034c [P] [US3] Add CloseButton sizing test in src/components/CloseButton.test.tsx - Test: Button has p-1.5 padding class and cursor-pointer class
- [X] T034d [P] [US3] Add PinyinToggle sizing test in src/components/PinyinToggle.test.tsx - Test: Button has p-1.5 padding class and cursor-pointer class

### Implementation for User Story 3

- [X] T035 [P] [US3] Modify ThemeToggle button sizing in src/components/ThemeToggle.tsx - Change padding from p-2 to p-1.5, add cursor-pointer class
- [X] T036 [P] [US3] Modify FullscreenToggle button sizing in src/components/FullscreenToggle.tsx - Change padding from p-2 to p-1.5, add cursor-pointer class
- [X] T037 [P] [US3] Modify CloseButton button sizing in src/components/CloseButton.tsx - Change padding from p-2 to p-1.5, add cursor-pointer class
- [X] T038 [P] [US3] Modify PinyinToggle button sizing in src/components/PinyinToggle.tsx - Verify/ensure padding is p-1.5 (not p-2), add cursor-pointer class
- [X] T039 [US3] Modify TitleBar button spacing in src/components/TitleBar.tsx - Change button container gap from gap-2 to gap-1
- [ ] T040 [US3] Manual test: Button sizing verification - Verify: (1) All buttons are ~32×32px, (2) All buttons have consistent size, (3) Buttons are visibly smaller than before, (4) Buttons are still easily clickable

**Checkpoint**: At this point, User Story 3 is complete. Buttons are proportionally sized to title text.

---

## Phase 6: User Story 4 - Cursor State Simplification (Priority: P4)

**Goal**: Remove grab/grabbing cursor states from drag region, keeping cursors neutral (default arrow) everywhere except clickable buttons (pointer).

**Independent Test**: Hover over title bar drag region → cursor is default arrow (not grab). Drag window → cursor remains default arrow (not grabbing). Hover over buttons → cursor changes to pointer.

**Dependencies**: None (independent of other stories)

### Tests for User Story 4 (TDD Approach)

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [X] T040a [US4] Create CSS cursor rules test in tests/unit/index.css.test.ts - Test: Verify src/index.css does NOT contain cursor: grab or cursor: grabbing rules for [data-tauri-drag-region] selector (use file read and regex/string match)

### Implementation for User Story 4

- [X] T041 [US4] Modify global CSS in src/index.css - Delete lines 32-40 (drag region cursor rules: [data-tauri-drag-region] { cursor: grab; } and [data-tauri-drag-region]:active { cursor: grabbing; })
- [ ] T042 [US4] Manual test: Cursor state verification - Verify: (1) Hover over title bar shows default cursor (not grab), (2) Dragging window shows default cursor (not grabbing), (3) Hover over buttons shows pointer cursor, (4) No grab/grabbing cursors anywhere

**Checkpoint**: At this point, User Story 4 is complete. No grab/grabbing cursors appear in the application.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories and final validation

- [X] T043 [P] Keyboard navigation test - Verify Tab key cycles through buttons in correct order (Pinyin → Theme → Fullscreen → Close), Enter key activates focused button (FR-017)
- [X] T044 [P] Run full test suite - Execute npm run test and verify all tests pass (unit, integration, contract)
- [X] T045 Build application - Execute npm run build and verify build succeeds with no errors
- [ ] T046 Manual testing session following quickstart.md Phase 10 checklist - Test all user stories end-to-end in built application
- [ ] T047 [P] Update feature documentation - Mark quickstart.md tasks as complete, update any implementation notes discovered during development

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: ✅ Already complete (project exists)
- **Foundational (Phase 2)**: ✅ No blocking tasks needed
- **User Story 1 (Phase 3)**: Can start immediately - No dependencies
  - ✅ **MVP Delivery Point**: Complete this phase for minimum viable product
- **User Story 2 (Phase 4)**: Depends on User Story 1 completion (TitleBar structure must exist)
- **User Story 3 (Phase 5)**: Depends on User Story 2 completion (same files modified sequentially)
- **User Story 4 (Phase 6)**: Independent - Can start after Foundational (or run in parallel with US2/US3 since it modifies different files)
- **Polish (Phase 7)**: Depends on all user stories being complete

### User Story Dependencies

```
US1 (Pinyin Toggle - P1) → US2 (Dragging Fix - P2) → US3 (Button Sizing - P3)
                                                    ↘
                          US4 (Cursor Simplification - P4) ↗
```

- **US1**: No dependencies - Can start immediately
- **US2**: Depends on US1 (TitleBar must include PinyinToggle)
- **US3**: Depends on US2 (modifies same button files)
- **US4**: Independent (different file: index.css)

### Within Each User Story

#### US1 - Pinyin Toggle
1. **Tests first** (T001-T022): All test files created with failing tests
2. **Parallel hook and component creation** (T023-T024): Hook and PinyinToggle can be built in parallel
3. **Sequential component modifications** (T025-T028): RubyWord → TextDisplay → App → TitleBar (each depends on previous)
4. **Test validation** (T029): Verify all tests pass

#### US2 - Dragging Fix
1. **Parallel button modifications** (T030-T032): All three existing buttons can be modified in parallel
2. **Verification** (T033): Ensure TitleBar structure is correct
3. **Manual testing** (T034): Validate dragging behavior

#### US3 - Button Sizing
1. **Parallel button modifications** (T035-T038): All four buttons can be resized in parallel
2. **TitleBar spacing** (T039): Adjust gap between buttons
3. **Manual testing** (T040): Validate sizing

#### US4 - Cursor Simplification
1. **CSS modification** (T041): Remove cursor rules
2. **Manual testing** (T042): Validate cursor states

### Parallel Opportunities

- **Within US1 Tests**: T001-T022 can all be created in parallel (different test files)
- **Within US1 Implementation**: T023-T024 can run in parallel (hook + component)
- **Within US2**: T030-T032 can run in parallel (different component files)
- **Within US3**: T035-T038 can run in parallel (different component files)
- **US4 + US2/US3**: US4 (T041-T042) can run in parallel with US2 or US3 since it modifies index.css while US2/US3 modify component files
- **Polish phase**: T043-T044, T047 can run in parallel (different types of validation)

---

## Parallel Example: User Story 1 - Tests

```bash
# Launch all test file creation tasks together (T001-T022):
Task: "Create usePinyinVisibility hook test file in src/hooks/usePinyinVisibility.test.ts"
Task: "Create PinyinToggle component test file in src/components/PinyinToggle.test.tsx"
Task: "Create integration test file in tests/integration/pinyin-toggle.test.tsx"
Task: "Create localStorage contract test file in tests/contract/localStorage.test.ts"
# All test assertions can be written in parallel

# Launch hook and component creation together (T023-T024):
Task: "Create usePinyinVisibility custom hook in src/hooks/usePinyinVisibility.ts"
Task: "Create PinyinToggle component in src/components/PinyinToggle.tsx"
```

---

## Parallel Example: User Story 2 - Button Modifications

```bash
# Launch all button stopPropagation additions together (T030-T032):
Task: "Modify ThemeToggle component in src/components/ThemeToggle.tsx"
Task: "Modify FullscreenToggle component in src/components/FullscreenToggle.tsx"
Task: "Modify CloseButton component in src/components/CloseButton.tsx"
```

---

## Parallel Example: User Story 3 - Button Sizing

```bash
# Launch all button size reductions together (T035-T038):
Task: "Modify ThemeToggle button sizing in src/components/ThemeToggle.tsx"
Task: "Modify FullscreenToggle button sizing in src/components/FullscreenToggle.tsx"
Task: "Modify CloseButton button sizing in src/components/CloseButton.tsx"
Task: "Modify PinyinToggle button sizing in src/components/PinyinToggle.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 3: User Story 1 (Pinyin Toggle)
2. **STOP and VALIDATE**: Run tests (T029), build app (npm run build), manually test toggle functionality
3. Deploy/demo if ready - Users can now toggle Pinyin visibility! 🎉

**MVP Success Criteria**:
- ✅ Pinyin toggles on/off with single button click
- ✅ Chinese characters never move (no layout shift)
- ✅ Preference persists across app restarts
- ✅ All US1 tests pass

### Incremental Delivery

1. **Foundation**: Setup + Foundational (✅ Already complete - no tasks needed)
2. **Iteration 1**: User Story 1 → Test independently → Deploy/Demo (🎯 MVP!)
3. **Iteration 2**: User Story 2 → Test independently → Deploy/Demo
4. **Iteration 3**: User Story 3 → Test independently → Deploy/Demo
5. **Iteration 4**: User Story 4 → Test independently → Deploy/Demo
6. **Polish**: Final integration testing and documentation

Each iteration adds value without breaking previous stories.

### Parallel Team Strategy

With multiple developers:

1. **All developers**: Complete Phase 3 (US1) together as foundation
2. **Once US1 is complete**:
   - Developer A: US2 (Title Bar Dragging Fix) - depends on US1
   - Developer B: US4 (Cursor Simplification) - independent, can start immediately
3. **Once US2 is complete**:
   - Developer A continues: US3 (Button Sizing) - depends on US2
   - Developer B: Helps with testing or moves to next feature
4. Integration and polish together

**Note**: US2 and US3 cannot be parallelized (same files), but US4 can run in parallel with either.

---

## Notes

- **[P] tasks**: Different files, no dependencies - safe to parallelize
- **[Story] label**: Maps task to specific user story for traceability
- **Each user story**: Independently completable and testable
- **TDD approach**: Verify tests fail before implementing (constitution requirement - every testable change has a test)
- **Critical constraint**: Use CSS opacity transition (transition-opacity duration-200 ease-in-out) for Pinyin toggle, NEVER conditional rendering (prevents layout shift, complies with Constitution I)
- **Commit strategy**: Commit after each task or logical group
- **Validation checkpoints**: Stop at each checkpoint to validate story independently
- **Avoid**: Vague tasks, same-file conflicts when parallelizing, cross-story dependencies that break independence

---

## Task Count Summary

- **Phase 1 (Setup)**: 0 tasks (project exists)
- **Phase 2 (Foundational)**: 0 tasks (no blocking infrastructure)
- **Phase 3 (US1 - Pinyin Toggle)**: 30 tasks (23 unit tests + 7 implementation)
- **Phase 4 (US2 - Dragging Fix)**: 8 tasks (3 unit tests + 4 implementation + 1 manual test)
- **Phase 5 (US3 - Button Sizing)**: 10 tasks (4 unit tests + 5 implementation + 1 manual test)
- **Phase 6 (US4 - Cursor Simplification)**: 3 tasks (1 unit test + 1 implementation + 1 manual test)
- **Phase 7 (Polish)**: 5 tasks
- **Total**: 56 tasks (31 unit tests + 17 implementation + 4 manual tests + 4 validation tasks)

**Parallel opportunities**: ~40 tasks can be parallelized (all marked with [P])
**Independent test criteria**: Each user story has clear acceptance criteria, unit tests, and manual testing steps
**TDD compliance**: Every testable implementation has a corresponding unit test written first (Constitution V)
**Suggested MVP scope**: User Story 1 only (30 tasks, ~4-6 hours estimated)
