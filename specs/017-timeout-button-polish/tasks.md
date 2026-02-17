# Tasks: CLI Timeout & Button Focus Polish

**Input**: Design documents from `/specs/017-timeout-button-polish/`
**Prerequisites**: plan.md, spec.md

**Tests**: No test tasks — this is a bugfix/polish feature with no new logic to test.

**Organization**: Tasks grouped by user story (US1: timeout, US2: focus states).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2)
- Include exact file paths in descriptions

---

## Phase 1: User Story 1 - Generous Processing Timeout (Priority: P1)

**Goal**: Increase CLI processing timeout so long texts (~1000+ characters) complete without timing out.

**Independent Test**: Submit a long Chinese text (~1000 chars) in the app and verify processing completes without a timeout error.

- [X] T001 [US1] Increase timeout from 120s to 300s for first attempt in src-tauri/src/commands.rs (line 99)
- [X] T002 [US1] Increase timeout from 120s to 300s for retry attempt in src-tauri/src/commands.rs (line 117)

**Checkpoint**: Long texts process without hitting the timeout.

---

## Phase 2: User Story 2 - Consistent Button Focus States (Priority: P2)

**Goal**: Add focus ring styles to all action buttons to match the title bar button reference style (`focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2`).

**Independent Test**: Tab through all buttons in every view (empty, input, processing, reading) and verify a consistent focus ring appears.

- [X] T003 [P] [US2] Add focus ring to "Enter Text" button in src/components/EmptyState.tsx
- [X] T004 [P] [US2] Add focus ring to all buttons (Retry, Edit, Process) in src/components/ProcessingState.tsx
- [X] T005 [P] [US2] Add focus ring to "Cancel" and "Submit" buttons in src/components/TextInputView.tsx

**Checkpoint**: All action buttons display the same focus ring as title bar buttons.

---

## Phase 3: Polish & Validation

- [X] T006 Run frontend tests (`npm run test`) to verify no regressions
- [X] T007 Run Rust tests (`cargo test`) to verify no regressions
- [X] T008 Build the app (`npm run build`) for manual testing

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (US1)**: No dependencies — can start immediately
- **Phase 2 (US2)**: No dependencies — can start immediately, independent of US1
- **Phase 3 (Polish)**: Depends on Phase 1 and Phase 2 completion

### Parallel Opportunities

- T001 and T002 are sequential (same file, same function)
- T003, T004, T005 are all parallel (different files, no dependencies)
- US1 and US2 are fully independent (different files: Rust vs React)

---

## Implementation Strategy

### MVP First (User Story 1)

1. Complete T001 + T002 → timeout fix done
2. **VALIDATE**: Existing tests still pass

### Full Delivery

1. T001 + T002 (timeout fix)
2. T003 + T004 + T005 in parallel (focus rings)
3. T006 + T007 (test validation)
4. T008 (build for manual testing)

---

## Notes

- Total tasks: 8
- US1 tasks: 2 (timeout)
- US2 tasks: 3 (focus rings, all parallel)
- Polish tasks: 3 (tests + build)
- Reference focus style: `focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2`
