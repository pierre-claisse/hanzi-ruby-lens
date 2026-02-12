---
description: "Task list for Hook Test Coverage implementation"
---

# Tasks: Hook Test Coverage

**Input**: Design documents from `/specs/007-hook-tests/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/test-interface.md, quickstart.md

**Tests**: This feature IS about creating tests. All tasks focus on establishing comprehensive test coverage for React hooks.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3, US4)
- Include exact file paths in descriptions

## Path Conventions

- **Single project**: `src/hooks/` for hook implementations, test files colocated with source
- Tests run inside Docker containers via `npm run test`

---

## Phase 1: Setup & Configuration

**Purpose**: Configure Vitest coverage thresholds to enforce 100% coverage standard

- [ ] T001 Read vitest.config.ts to check existing coverage configuration
- [ ] T002 Update vitest.config.ts with 100% thresholds for statements, branches, functions, and lines if not already configured
- [ ] T003 Read src/hooks/usePinyinVisibility.test.ts to understand reference test pattern

**Checkpoint**: Vitest configured to enforce 100% coverage thresholds

---

## Phase 2: User Story 1 - useTheme Hook Test Coverage (Priority: P1) 🎯

**Goal**: Create comprehensive tests for useTheme hook covering initialization, persistence, DOM updates, and error handling

**Independent Test**: Run `npm run test -- src/hooks/useTheme.test.ts --coverage` and verify 100% coverage across all metrics

**Contracts to verify**: C1 (Initialization), C2 (Persistence), C3 (Error Handling), C4 (DOM Manipulation), Coverage Contract

### Implementation for User Story 1

- [ ] T004 [US1] Read src/hooks/useTheme.ts to understand hook implementation
- [ ] T005 [US1] Create src/hooks/useTheme.test.ts with test suite structure (describe block, beforeEach, localStorage mock following TP-3 pattern)
- [ ] T006 [US1] Implement initialization test verifying default "light" theme (Contract C1)
- [ ] T007 [P] [US1] Implement restoration tests for "dark" and "light" themes from localStorage (Contract C2)
- [ ] T008 [P] [US1] Implement persistence test verifying theme changes are saved to localStorage (Contract C2)
- [ ] T009 [P] [US1] Implement DOM manipulation tests verifying "dark" class is added/removed correctly (Contract C4)
- [ ] T010 [P] [US1] Implement error handling test for localStorage.getItem failures (Contract C3)
- [ ] T011 [P] [US1] Implement error handling test for localStorage.setItem failures (Contract C3)
- [ ] T012 [US1] Run tests for useTheme and verify all tests pass
- [ ] T013 [US1] Generate coverage report for useTheme (npm run test -- src/hooks/useTheme.test.ts --coverage) and verify 100% coverage across all metrics

**Checkpoint**: useTheme has complete test coverage with all tests passing and 100% coverage achieved

---

## Phase 3: User Story 2 - useFullscreen Hook Test Coverage (Priority: P1)

**Goal**: Create comprehensive tests for useFullscreen hook covering initialization, persistence, Tauri APIs, keyboard events, and cleanup

**Independent Test**: Run `npm run test -- src/hooks/useFullscreen.test.ts --coverage` and verify 100% coverage across all metrics

**Contracts to verify**: C1 (Initialization), C2 (Persistence), C3 (Error Handling), C5 (Tauri APIs), C6 (Keyboard Events), C7 (Cleanup), Coverage Contract

### Implementation for User Story 2

- [ ] T014 [US2] Read src/hooks/useFullscreen.ts to understand hook implementation
- [ ] T015 [US2] Create src/hooks/useFullscreen.test.ts with test suite structure (describe block, beforeEach, localStorage mock following TP-3 pattern)
- [ ] T016 [US2] Set up Tauri window API mocks (getCurrentWindow, setFullscreen, setResizable) using vi.mock following TP-4 pattern
- [ ] T017 [US2] Implement initialization test verifying default false state (Contract C1)
- [ ] T018 [P] [US2] Implement restoration test verifying true state from localStorage and mount effect API calls (Contracts C2, C5)
- [ ] T019 [P] [US2] Implement toggle enter fullscreen test verifying setResizable(false) called before setFullscreen(true) (Contract C5)
- [ ] T020 [P] [US2] Implement toggle exit fullscreen test verifying setFullscreen(false) called before setResizable(true) (Contract C5)
- [ ] T021 [P] [US2] Implement persistence test verifying fullscreen state changes are saved to localStorage (Contract C2)
- [ ] T022 [P] [US2] Implement Escape key test verifying toggle is called when fullscreen is true (Contract C6)
- [ ] T023 [P] [US2] Implement Escape key test verifying no action when fullscreen is false (Contract C6)
- [ ] T024 [P] [US2] Implement event listener cleanup test verifying handler is not called after unmount (Contract C7)
- [ ] T025 [P] [US2] Implement error handling test for localStorage.getItem failures (Contract C3)
- [ ] T026 [P] [US2] Implement error handling test for localStorage.setItem failures (Contract C3)
- [ ] T027 [US2] Run tests for useFullscreen and verify all tests pass
- [ ] T028 [US2] Generate coverage report for useFullscreen (npm run test -- src/hooks/useFullscreen.test.ts --coverage) and verify 100% coverage across all metrics

**Checkpoint**: useFullscreen has complete test coverage with all tests passing and 100% coverage achieved

---

## Phase 4: User Story 3 - Test Pattern Uniformity (Priority: P1)

**Goal**: Verify all three hooks (usePinyinVisibility, useTheme, useFullscreen) use identical test patterns

**Independent Test**: Manual code review comparing test file structures and patterns

**Verification criteria**: All tests follow TP-1 through TP-7 patterns consistently

### Implementation for User Story 3

- [ ] T029 [US3] Compare test suite structures across usePinyinVisibility.test.ts, useTheme.test.ts, and useFullscreen.test.ts (verify TP-1 pattern)
- [ ] T030 [US3] Verify identical localStorage mocking patterns in all three test files (verify TP-3 pattern)
- [ ] T031 [US3] Verify identical error handling patterns with console.error spies in all three test files (verify TP-6 pattern)
- [ ] T032 [US3] Verify consistent test naming conventions across all three test files (verify TP-2 pattern)
- [ ] T033 [US3] Verify consistent use of @testing-library/react utilities (renderHook, act, waitFor) across all test files
- [ ] T034 [US3] Run all hook tests together (npm run test) and verify all pass

**Checkpoint**: All three hook test files follow uniform patterns - no hook left behind

---

## Phase 5: User Story 4 - Establish Frontend Testing Standard (Priority: P0)

**Goal**: Verify 100% coverage methodology is established and documented as mandatory standard for all React frontend code

**Independent Test**: Run `npm run test -- --coverage src/hooks/` and verify ALL hooks show 100% across all metrics

**Verification criteria**: Coverage report shows uniform 100% coverage, testing standard documented, remaining untested code identified

### Implementation for User Story 4

- [ ] T035 [US4] Run coverage for all three hooks (npm run test -- --coverage src/hooks/) and verify uniform 100% coverage
- [ ] T036 [US4] Verify coverage metrics show 100% for statements, branches, functions, AND lines for all hooks
- [ ] T037 [US4] Verify coverage thresholds are enforced (test suite fails if coverage drops below 100%)
- [ ] T038 [US4] Identify remaining untested frontend code and verify TitleBar.tsx is noted for future work
- [ ] T039 [US4] Verify testing standard is documented in quickstart.md with commands and verification steps
- [ ] T040 [US4] Run flakiness test (10 consecutive test runs: `for i in {1..10}; do npm run test || exit 1; done`) and verify zero failures

**Checkpoint**: 100% coverage standard established, documented, and proven achievable for all frontend code

---

## Phase 6: Final Verification & Polish

**Purpose**: Comprehensive validation of all success criteria

- [ ] T041 Verify SC-001: useTheme reaches 100% coverage (all metrics)
- [ ] T042 Verify SC-002: useFullscreen reaches 100% coverage (all metrics)
- [ ] T043 Verify SC-003: All tests pass in isolation (run each test file independently)
- [ ] T044 Verify SC-004: Test execution completes in under 5 seconds
- [ ] T045 Verify SC-005: Zero flakiness (10 consecutive runs all pass)
- [ ] T046 Verify SC-006: Each hook has at least 6 test cases
- [ ] T047 Verify SC-007: Test files follow identical structure to usePinyinVisibility
- [ ] T048 Verify SC-008: ALL three hooks achieve uniform 100% coverage - no hook left behind
- [ ] T049 Verify SC-009: Coverage methodology proven achievable
- [ ] T050 Verify SC-010: Testing standard documented and ready for future application
- [ ] T051 Generate final coverage report (npm run test -- --coverage) and verify output
- [ ] T052 Run quickstart.md validation commands to ensure all instructions work correctly

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **User Story 1 (Phase 2)**: Depends on Setup completion
- **User Story 2 (Phase 3)**: Depends on Setup completion - Can run in parallel with US1
- **User Story 3 (Phase 4)**: Depends on US1 and US2 completion
- **User Story 4 (Phase 5)**: Depends on US1, US2, and US3 completion
- **Final Verification (Phase 6)**: Depends on all previous phases

### User Story Dependencies

- **User Story 1 (P1) - useTheme**: Independent - can start after Setup
- **User Story 2 (P1) - useFullscreen**: Independent - can start after Setup
- **User Story 3 (P1) - Uniformity**: Depends on US1 and US2
- **User Story 4 (P0) - Standard**: Depends on US1, US2, and US3

### Within Each User Story

**User Story 1 (useTheme)**:
- T004 (read implementation) → T005 (create structure) → T006-T011 (parallel test cases) → T012 (run tests) → T013 (verify coverage)

**User Story 2 (useFullscreen)**:
- T014 (read implementation) → T015 (create structure) → T016 (setup mocks) → T017-T026 (parallel test cases) → T027 (run tests) → T028 (verify coverage)

**User Story 3 (Uniformity)**:
- T029-T033 can run in parallel → T034 (run all tests)

**User Story 4 (Standard)**:
- T035-T040 should run sequentially for proper verification

### Parallel Opportunities

- **Phase 1**: T001, T002, T003 must run sequentially (read before update)
- **Phase 2 (US1)**: T007-T011 can run in parallel (adding different test cases to same file)
- **Phase 3 (US2)**: T018-T026 can run in parallel (adding different test cases to same file)
- **Phase 2 and Phase 3**: Entire phases can run in parallel (different test files)
- **Phase 4 (US3)**: T029-T033 can run in parallel (reading different files)
- **Phase 5 (US4)**: Sequential verification recommended

---

## Parallel Example: User Story 1 (useTheme)

```bash
# After T005 creates the test file structure, launch all test case implementations in parallel:
Task: "Implement restoration tests for dark and light themes (T007)"
Task: "Implement persistence test (T008)"
Task: "Implement DOM manipulation tests (T009)"
Task: "Implement localStorage.getItem error handling (T010)"
Task: "Implement localStorage.setItem error handling (T011)"

# All tasks above work on different test cases in src/hooks/useTheme.test.ts
```

## Parallel Example: User Story 2 (useFullscreen)

```bash
# After T016 sets up mocks, launch all test case implementations in parallel:
Task: "Implement restoration test (T018)"
Task: "Implement toggle enter fullscreen test (T019)"
Task: "Implement toggle exit fullscreen test (T020)"
Task: "Implement persistence test (T021)"
Task: "Implement Escape key tests (T022, T023)"
Task: "Implement cleanup test (T024)"
Task: "Implement error handling tests (T025, T026)"

# All tasks above work on different test cases in src/hooks/useFullscreen.test.ts
```

## Parallel Example: User Stories 1 and 2

```bash
# After Phase 1 (Setup) completes, launch both user stories in parallel:
Task: "Complete User Story 1 (useTheme tests) - Phase 2"
Task: "Complete User Story 2 (useFullscreen tests) - Phase 3"

# These work on different files (useTheme.test.ts vs useFullscreen.test.ts)
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (Configure Vitest)
2. Complete Phase 2: User Story 1 (useTheme tests)
3. **STOP and VALIDATE**: Run `npm run test -- src/hooks/useTheme.test.ts --coverage` and verify 100% coverage
4. Confirm useTheme hook is fully tested before proceeding

### Incremental Delivery

1. Complete Setup → Vitest ready with 100% thresholds
2. Add User Story 1 (useTheme) → Test independently → 100% coverage confirmed
3. Add User Story 2 (useFullscreen) → Test independently → 100% coverage confirmed
4. Add User Story 3 (Uniformity) → Verify patterns consistent
5. Add User Story 4 (Standard) → Document and validate 100% standard established
6. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup together
2. Once Setup is done:
   - Developer A: User Story 1 (useTheme tests)
   - Developer B: User Story 2 (useFullscreen tests)
3. Developer A or B: User Story 3 (Uniformity verification)
4. Team together: User Story 4 (Final standard validation)

---

## Notes

- **[P] tasks**: Different test cases in same file (can be added in parallel), or different files entirely
- **[Story] label**: Maps task to specific user story for traceability
- **This is a test-only feature**: No production code changes except test files and Vitest config
- **100% coverage is mandatory**: Vitest thresholds will enforce this automatically
- **No hook left behind**: All three hooks (usePinyinVisibility, useTheme, useFullscreen) must achieve uniform 100% coverage
- **Test patterns are reusable**: TP-1 through TP-7 patterns will be applied to all future frontend tests
- **Behavioral contracts**: Each test must verify specific contracts (C1-C7) from contracts/test-interface.md
- **Docker execution**: All tests run inside Docker containers via `npm run test` per constitutional requirement
- **Commit strategy**: Commit after each user story phase completion
- **Verification**: Use quickstart.md commands to verify success criteria at each checkpoint
