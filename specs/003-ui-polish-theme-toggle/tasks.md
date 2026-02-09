# Tasks: UI Polish & Theme Toggle

**Input**: Design documents from `/specs/003-ui-polish-theme-toggle/`
**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [quickstart.md](./quickstart.md)

**Tests**: Test tasks are included per Test-First Imperative (Constitution V). All tests must be written FIRST and FAIL before implementation.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

This is a single-project desktop application (Tauri + React):
- Frontend source: `src/` (components, hooks, types)
- Tests: Colocated `*.test.tsx` alongside source files
- Configuration: Root-level `tailwind.config.ts`, `index.html`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Prepare project for theme toggle and spacing refinements

- [X] T001 Verify Tailwind CSS has opacity-12 utility in tailwind.config.ts (add if missing: `opacity: { "12": "0.12" }`)
- [X] T002 Verify dark mode CSS variables are present in src/index.css (already exists from feature 002, no changes needed)

**Checkpoint**: Configuration ready for theme toggle implementation

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T003 Add FOUC prevention script to index.html in `<head>` before React script (synchronous theme initialization from localStorage)

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Theme Toggle Control (Priority: P1) 🎯 MVP

**Goal**: Users can toggle between light and dark modes with a single click, with theme preference persisting across app restarts

**Independent Test**: Launch the app, click the theme toggle button in the top-right corner, verify the app switches between light mode (rice paper background, ink text) and dark mode (deep ink background, cream text), close and reopen the app, verify theme persists

### Tests for User Story 1

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [X] T004 [P] [US1] Create ThemeToggle.test.tsx with test: "renders with moon icon in light mode by default"
- [X] T005 [P] [US1] Add test to ThemeToggle.test.tsx: "toggles to dark mode on click and persists to localStorage"
- [X] T006 [P] [US1] Add test to ThemeToggle.test.tsx: "is keyboard accessible with Tab, Enter, and Space keys"
- [X] T007 [P] [US1] Add test to ThemeToggle.test.tsx: "handles localStorage unavailable gracefully (silent fallback)"
- [X] T008 [P] [US1] Add test to ThemeToggle.test.tsx: "initializes from localStorage if dark theme is stored"

### Implementation for User Story 1

- [X] T009 [US1] Create useTheme hook in src/hooks/useTheme.ts with lazy initialization, localStorage persistence, and document.documentElement class toggling
- [X] T010 [US1] Create ThemeToggle component in src/components/ThemeToggle.tsx with inline SVG icons (sun/moon), keyboard accessibility (aria-label, aria-pressed, focus-visible ring)
- [X] T011 [US1] Integrate ThemeToggle in src/App.tsx with fixed top-right positioning (fixed top-6 right-6 z-10)
- [X] T012 [US1] Update src/App.test.tsx to verify ThemeToggle button is rendered

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently. Theme toggle works, persists across restarts, keyboard accessible.

---

## Phase 4: User Story 2 - Visual Spacing Refinements (Priority: P2)

**Goal**: Lines of text have comfortable vertical spacing, Words have horizontal breathing room, and ruby annotations have adequate vertical separation from characters

**Independent Test**: Launch the app and verify that: (a) lines of text have comfortable vertical spacing (not too far apart), (b) individual Words have horizontal breathing room (visible padding), and (c) ruby annotations have adequate vertical separation from characters

### Tests for User Story 2

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [X] T013 [P] [US2] Update src/components/RubyWord.test.tsx: Add test "applies padding class for breathing room" (expect px-0.5)
- [X] T014 [P] [US2] Update src/components/TextDisplay.test.tsx: Add test "applies line height for comfortable reading" (verify leading-[2.5])
- [X] T014b [US2] Add edge case test to src/components/TextDisplay.test.tsx: Test long-pinyin words (乘風破浪/chéngfēngpòlàng) for overflow or misalignment with new spacing

### Implementation for User Story 2

- [X] T015 [P] [US2] Add horizontal padding to RubyWord component in src/components/RubyWord.tsx (add px-0.5 class)
- [X] T016 [P] [US2] Update line height in src/components/TextDisplay.tsx from leading-[2.8] to leading-[2.5] (addresses user feedback while staying in optimal 2.5-3.0 range)
- [X] T017 [US2] Verify ruby vertical spacing in src/index.css (no changes needed - browser defaults with line-height 2.8 are adequate per research)

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently. Theme toggle + improved spacing both functional.

---

## Phase 5: User Story 3 - Enhanced Hover Visibility (Priority: P3)

**Goal**: Hover highlight is clearly visible in both light and dark modes when user hovers over Words

**Independent Test**: Launch the app, hover over any Word, and verify a clearly visible highlight appears (distinctly more visible than the previous 8% opacity vermillion wash)

### Tests for User Story 3

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [X] T018 [US3] Update src/components/RubyWord.test.tsx: Add test "applies hover styles with increased opacity" (expect hover:bg-vermillion/12)
- [X] T019 [US3] Update src/components/RubyWord.test.tsx: Add test "applies focus-visible ring for keyboard accessibility"

### Implementation for User Story 3

- [X] T020 [US3] Update hover opacity in src/components/RubyWord.tsx: Change hover:bg-vermillion/8 to hover:bg-vermillion/12
- [X] T021 [US3] Add keyboard focus ring in src/components/RubyWord.tsx: Add focus-visible:ring-2 focus-visible:ring-vermillion classes

**Checkpoint**: All user stories should now be independently functional. Theme toggle + spacing + hover visibility all working.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final verification and edge case testing

- [X] T022 Run full test suite via npm run test (Docker-based execution) and verify all tests pass
- [X] T023 [P] Execute manual testing checklist from quickstart.md Phase 4 (theme persistence, keyboard navigation, visual spacing, hover visibility, edge cases)
- [X] T024 [P] Verify no regressions: Feature 002 ruby text display still works, MinWidthOverlay still appears, no console errors
- [X] T025 Build verification: Run npm run build and verify Tauri app builds successfully with theme toggle functional in production build

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-5)**: All depend on Foundational phase completion
  - User stories can then proceed in parallel (if staffed)
  - Or sequentially in priority order (P1 → P2 → P3)
- **Polish (Phase 6)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories ✅ Independent
- **User Story 2 (P2)**: Can start after Foundational (Phase 2) - No dependencies on US1 ✅ Independent
- **User Story 3 (P3)**: Can start after Foundational (Phase 2) - Modifies same component as US2 (RubyWord.tsx) but can be done independently ⚠️ File overlap with US2

**Note**: US2 and US3 both modify RubyWord.tsx, so if working in parallel, US3 should wait for US2's T015 (padding) to complete before starting T020 (hover opacity). Alternatively, combine these changes in a single edit.

### Within Each User Story

- Tests MUST be written and FAIL before implementation
- Multiple tests for a story can run in parallel (all marked [P])
- Implementation tasks follow logical order (hooks → components → integration)
- Each story should be complete and independently testable before moving to next priority

### Parallel Opportunities

- **Phase 1 (Setup)**: Both T001 and T002 can run in parallel (different files)
- **Phase 2 (Foundational)**: Only 1 task (T003)
- **Phase 3 (US1 Tests)**: T004, T005, T006, T007, T008 can all run in parallel (all add to same test file, but independent test cases)
- **Phase 4 (US2 Tests)**: T013 and T014 can run in parallel (different test files)
- **Phase 4 (US2 Implementation)**: T015, T016, T017 can run in parallel (different files)
- **Phase 5 (US3 Tests)**: T018 and T019 both update same file (sequential)
- **Phase 5 (US3 Implementation)**: T020 and T021 modify same component (sequential or combined)
- **Phase 6 (Polish)**: T023 and T024 can run in parallel (independent verification tasks)

---

## Parallel Example: User Story 1

```bash
# Launch all tests for User Story 1 together:
Task: "Create ThemeToggle.test.tsx with test: renders with moon icon" (T004)
Task: "Add test: toggles to dark mode on click" (T005)
Task: "Add test: keyboard accessible with Tab/Enter/Space" (T006)
Task: "Add test: handles localStorage unavailable" (T007)
Task: "Add test: initializes from localStorage" (T008)

# Then implement sequentially (hook before component before integration):
Task: "Create useTheme hook" (T009) → FIRST
Task: "Create ThemeToggle component" (T010) → SECOND (depends on T009)
Task: "Integrate ThemeToggle in App" (T011) → THIRD (depends on T010)
Task: "Update App tests" (T012) → FOURTH (depends on T011)
```

---

## Parallel Example: User Story 2

```bash
# Launch tests together:
Task: "Update RubyWord.test.tsx: padding test" (T013)
Task: "Update TextDisplay.test.tsx: line height test" (T014)

# Launch implementation together (different files/components):
Task: "Add padding to RubyWord" (T015)
Task: "Verify line height in TextDisplay" (T016)
Task: "Verify ruby spacing in index.css" (T017)
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001-T002) → ~5 minutes
2. Complete Phase 2: Foundational (T003) → ~5 minutes
3. Complete Phase 3: User Story 1 (T004-T012) → ~1.5 hours
4. **STOP and VALIDATE**: Test theme toggle independently, verify persistence, keyboard accessibility
5. Optional: Commit and demo MVP (basic theme toggle working)

**Result**: Fully functional theme toggle with tests, ready for production.

---

### Incremental Delivery (All User Stories)

1. Complete Setup + Foundational (T001-T003) → Foundation ready
2. Add User Story 1 (T004-T012) → Test independently → **Deploy/Demo (MVP!)**
3. Add User Story 2 (T013-T017) → Test independently → **Deploy/Demo (MVP + Spacing)**
4. Add User Story 3 (T018-T021) → Test independently → **Deploy/Demo (Complete Feature)**
5. Polish (T022-T025) → Final verification → **Production Ready**

Each story adds value without breaking previous stories. Can stop at any checkpoint.

---

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together (T001-T003)
2. Once Foundational is done:
   - **Developer A**: User Story 1 (T004-T012) - Theme toggle
   - **Developer B**: User Story 2 (T013-T017) - Spacing refinements
   - **Developer C**: User Story 3 (wait for US2 T015, then T018-T021) - Hover visibility
3. Stories integrate without conflicts (US2 and US3 share RubyWord.tsx - coordinate or merge)

---

## Task Count Summary

- **Total Tasks**: 26 tasks
- **Setup**: 2 tasks
- **Foundational**: 1 task (CRITICAL blocker)
- **User Story 1 (P1)**: 9 tasks (5 tests + 4 implementation)
- **User Story 2 (P2)**: 6 tasks (3 tests + 3 implementation)
- **User Story 3 (P3)**: 4 tasks (2 tests + 2 implementation)
- **Polish**: 4 tasks (verification and validation)

**Parallelizable Tasks**: 14 tasks marked [P] (54% can run in parallel)

**Suggested MVP Scope**: Phase 1 + Phase 2 + Phase 3 (User Story 1 only) = 12 tasks = Theme toggle with tests

---

## Format Validation

✅ All tasks follow checklist format: `- [ ] [TaskID] [P?] [Story?] Description with file path`
✅ Task IDs sequential (T001-T025, plus T014b for edge case)
✅ [P] markers present for parallelizable tasks (14 tasks)
✅ [Story] labels present for all user story phase tasks (US1, US2, US3)
✅ File paths included in all task descriptions
✅ Tests marked as FIRST within each story phase
✅ Independent test criteria defined for each user story
✅ Edge case coverage added (T014b for long-pinyin overflow testing per FR-010)

---

## Notes

- [P] tasks = different files/independent test cases, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Tests must FAIL before implementing (TDD red-green-refactor)
- Commit after completing each user story phase
- Stop at any checkpoint to validate story independently
- US2 and US3 both modify RubyWord.tsx - coordinate if working in parallel
- Research findings confirm: line height 2.8 optimal (no change), ruby spacing adequate (no change)
- Constitution compliance verified in plan.md - all gates pass
