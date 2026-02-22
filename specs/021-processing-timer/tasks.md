# Tasks: Processing Elapsed Timer

**Input**: Design documents from `specs/021-processing-timer/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, quickstart.md

**Tests**: Included — constitution mandates Test-First Imperative (Principle V).

**Organization**: Tasks grouped by user story for independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2)
- Includes exact file paths in descriptions

---

## Phase 1: Setup

**Purpose**: Create the new hook file and test file scaffolds

- [x] T001 [P] Create `useElapsedTime` hook scaffold with `formatElapsed` function and `useElapsedTime` hook signature in `src/hooks/useElapsedTime.ts`
- [x] T002 [P] Create `useElapsedTime` test file scaffold with vitest imports and `vi.useFakeTimers` setup in `src/hooks/useElapsedTime.test.ts`

**Checkpoint**: Both files exist; tests compile but may not pass yet

---

## Phase 2: User Story 1 — Elapsed Time During Processing (Priority: P1) 🎯 MVP

**Goal**: Display a live "(Xs)" or "(Xm Ys)" counter next to "Processing text..." that ticks every second

**Independent Test**: Submit any Chinese text → processing screen shows "Processing text... (0s)" and increments each second

### Tests for User Story 1 ⚠️

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [x] T003 [P] [US1] Test `formatElapsed`: 0→"0s", 1→"1s", 59→"59s", 60→"1m 0s", 75→"1m 15s", 605→"10m 5s" in `src/hooks/useElapsedTime.test.ts`
- [x] T004 [P] [US1] Test `useElapsedTime` starts at 0 when `isRunning=true`, increments to 1 after 1s, to 2 after 2s (using `vi.useFakeTimers` + `vi.advanceTimersByTime`) in `src/hooks/useElapsedTime.test.ts`
- [x] T005 [P] [US1] Test `useElapsedTime` does not increment when `isRunning=false` (elapsed stays 0, no interval running) in `src/hooks/useElapsedTime.test.ts`
- [x] T006 [P] [US1] Test `useElapsedTime` stops incrementing when `isRunning` changes from `true` to `false` in `src/hooks/useElapsedTime.test.ts`
- [x] T007 [P] [US1] Test interval cleanup on unmount (no lingering timers after component unmount) in `src/hooks/useElapsedTime.test.ts`

### Implementation for User Story 1

- [x] T008 [US1] Implement `formatElapsed(seconds: number): string` — returns `"Xs"` for <60s, `"Xm Ys"` for ≥60s in `src/hooks/useElapsedTime.ts`
- [x] T009 [US1] Implement `useElapsedTime(isRunning: boolean)` hook — `setInterval` at 1s, returns `{ elapsed, formatted }`, cleans up interval when `isRunning=false` or on unmount in `src/hooks/useElapsedTime.ts`
- [x] T010 [US1] Add `elapsedTime?: string` prop to `ProcessingState` and render it inline as "Processing text... ({elapsedTime})" when `isProcessing=true` in `src/components/ProcessingState.tsx`
- [x] T011 [US1] Wire `useElapsedTime(isProcessing)` in `App.tsx` and pass `formatted` as `elapsedTime` prop to `ProcessingState` in `src/App.tsx`

**Checkpoint**: Timer visible during processing, ticks every second, stops on completion/error. All US1 tests pass.

---

## Phase 3: User Story 2 — Timer Resets on Retry (Priority: P2)

**Goal**: Timer restarts from 0s when user retries or resubmits text

**Independent Test**: Trigger error → observe timer stops → click Retry → timer restarts from "0s"

### Tests for User Story 2 ⚠️

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [x] T012 [US2] Test `useElapsedTime` resets to 0 when `isRunning` transitions `false→true` (simulating retry) in `src/hooks/useElapsedTime.test.ts`

### Implementation for User Story 2

- [x] T013 [US2] Add reset-on-restart logic to `useElapsedTime` — detect `false→true` transition via `useRef` and reset elapsed to 0 in `src/hooks/useElapsedTime.ts`

**Checkpoint**: Timer resets to 0s on retry. All US1 + US2 tests pass.

---

## Phase 4: Polish & Cross-Cutting Concerns

- [x] T014 Run full test suite via `npm test` — verify all existing + new tests pass
- [ ] T015 Manual smoke test: submit text, observe timer, wait for completion, retry on error

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — T001 and T002 run in parallel
- **Phase 2 (US1)**: Depends on Phase 1. Tests (T003–T007) run in parallel, then implementation (T008→T009→T010→T011) runs sequentially
- **Phase 3 (US2)**: Depends on Phase 2 (US1 must be complete)
- **Phase 4 (Polish)**: Depends on Phase 3

### User Story Dependencies

- **US1 (P1)**: Independent — can start after setup
- **US2 (P2)**: Depends on US1 (uses the same hook, extends its behavior)

### Within Each User Story

- Tests written FIRST (red phase)
- `formatElapsed` before `useElapsedTime` (pure function first)
- Hook before component integration
- Component before App wiring

### Parallel Opportunities

```text
# Phase 1 — both files in parallel:
T001 (hook scaffold) || T002 (test scaffold)

# Phase 2 tests — all 5 test groups in parallel:
T003 (formatElapsed tests) || T004 (start+increment) || T005 (idle) || T006 (stop) || T007 (cleanup)
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001–T002)
2. Complete Phase 2: US1 tests then implementation (T003–T011)
3. **STOP and VALIDATE**: Timer works during processing
4. Proceed to Phase 3 (US2) for retry reset behavior

### Incremental Delivery

1. Phase 1 → scaffolds ready
2. Phase 2 → timer visible and ticking (MVP!)
3. Phase 3 → timer resets on retry (complete feature)
4. Phase 4 → full validation

---

## Notes

- [P] tasks = different files or independent test cases, no dependencies
- [Story] label maps task to specific user story
- Total: 15 tasks (2 setup, 9 US1, 2 US2, 2 polish)
- No backend/Rust changes required
- No database changes required
- No new npm dependencies required
