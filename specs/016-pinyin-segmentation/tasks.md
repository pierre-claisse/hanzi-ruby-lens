# Tasks: Pinyin Segmentation

**Input**: Design documents from `/specs/016-pinyin-segmentation/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/tauri-commands.md, quickstart.md

**Tests**: Included — constitution mandates Test-First Imperative (V); contracts define backend and frontend test expectations.

**Organization**: Tasks grouped by user story. US1 (Text Processing) is the MVP.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Foundational (Blocking Prerequisites)

**Purpose**: Rust processing module, error type extension, and AppView state change that ALL user stories depend on.

**CRITICAL**: No user story work can begin until this phase is complete.

- [X] T001 [P] Add `Processing(String)` variant to `AppError` enum with `#[error("Processing error: {0}")]` in `src-tauri/src/error.rs`
- [X] T002 [P] Create `src-tauri/src/processing.rs` with: `SYSTEM_PROMPT` constant (Chinese text segmentation instructions), `JSON_SCHEMA` constant (TextSegment[] schema for `--json-schema` flag), `build_prompt(raw_input: &str) -> String` function, and `parse_claude_response(stdout: &str) -> Result<Vec<TextSegment>, AppError>` function (extracts `structured_output` from CLI JSON envelope)
- [X] T003 Add `#[cfg(test)]` module in `src-tauri/src/processing.rs` with tests: `build_prompt` contains the raw input text; `parse_claude_response` with valid JSON returns correct `Vec<TextSegment>`; `parse_claude_response` with malformed JSON returns `Err(AppError::Processing(...))`; `parse_claude_response` with missing `structured_output` returns error
- [X] T004 Add `mod processing;` declaration in `src-tauri/src/lib.rs`
- [X] T005 [P] Update `AppView` type from `"saved"` to `"processing"` and update `deriveView()` to return `"processing"` instead of `"saved"` in `src/hooks/useTextLoader.ts`

**Checkpoint**: Foundation ready — Rust processing module exists with tested pure functions, AppView reflects new state machine.

---

## Phase 2: User Story 1 — Text Processing (Priority: P1) MVP

**Goal**: User submits Chinese text, system processes it via Claude CLI, and displays reading view with pinyin ruby annotations.

**Independent Test**: Submit "今天天氣很好" → after processing → reading view shows ruby annotations with correct pinyin.

### Backend Implementation

- [X] T006 [US1] Implement async `process_text` Tauri command in `src-tauri/src/commands.rs`: accept `raw_input: String`, handle empty input (return empty Text), build prompt via `processing::build_prompt`, spawn Claude CLI via `tokio::process::Command` (`claude -p --model opus --output-format json --max-turns 1 --no-session-persistence --system-prompt "..." --json-schema "..." "<raw_input>"`), enforce 120s timeout via `tokio::time::timeout`, parse stdout via `processing::parse_claude_response`, save Text with segments to DB via `database::save_text`, return processed Text
- [X] T007 [US1] Register `commands::process_text` in Tauri invoke_handler in `src-tauri/src/lib.rs`

### Frontend Implementation

- [X] T008 [P] [US1] Add `processText(rawInput: string) -> Promise<Text>` async function to `useTextLoader` hook (invokes `"process_text"` command, updates `text` state on success) and export it in the return interface in `src/hooks/useTextLoader.ts`
- [X] T009 [P] [US1] Create `src/components/ProcessingState.tsx` with loading spinner (CSS animation), "Processing text..." status message, centered layout matching existing SavedState style
- [X] T010 [US1] Wire ProcessingState into `src/App.tsx`: replace `SavedState` import with `ProcessingState`, replace `case "saved"` with `case "processing"` in `renderContent()`, update `handleSubmit` to call `processText` after `saveText` (set view to "processing" for non-empty input), update `showEdit` to include `"processing"` state
- [X] T011 [US1] Delete `src/components/SavedState.tsx`

### Test Updates

- [X] T012 [US1] Update `tests/integration/text-input-flow.test.tsx`: replace all "saved state" references with "processing state", update `screen.getByText(/text saved/i)` assertions to match new ProcessingState content, add mock for `invoke("process_text")` that resolves with processed Text, add test for submit → processing → reading transition
- [X] T013 [US1] Add `tests/contract/process-text-command.test.ts`: mock `invoke("process_text", { rawInput })` success (returns `{ rawInput, segments: [...] }`), mock failure (rejects with error string), test empty input returns `{ rawInput: "", segments: [] }`

**Checkpoint**: US1 complete — submit text → processing spinner → Claude CLI → reading view with pinyin. Happy path works end-to-end.

---

## Phase 3: User Story 2 — Processing Errors (Priority: P2)

**Goal**: When processing fails, user sees clear error message with retry option. Raw text is never lost.

**Independent Test**: Simulate processing failure → error message displayed → retry button available → raw text preserved.

- [X] T014 [US2] Add error state to `src/components/ProcessingState.tsx`: accept optional `error: string | null` and `onRetry: () => void` props, when error is set display error message text + "Retry" button + "Edit" button, keep spinner/status for non-error state
- [X] T015 [US2] Add `processingError` state and `retryProcessing()` function to `useTextLoader` hook in `src/hooks/useTextLoader.ts`: `processText` catches errors and sets `processingError`, `retryProcessing` clears error and re-invokes `processText` with current `text.rawInput`, export `processingError` and `retryProcessing` in return interface
- [X] T016 [US2] Wire error handling in `src/App.tsx`: pass `processingError` and `retryProcessing` to ProcessingState, pass `handleEdit` as onEdit prop for the edit button in processing error state
- [X] T017 [US2] Add error flow tests in `tests/integration/text-input-flow.test.tsx`: test that processing failure shows error message, test retry button re-invokes `process_text`, test edit button navigates to input view with preserved rawInput

**Checkpoint**: US1 + US2 complete — happy path and error handling both work. User always has a path forward.

---

## Phase 4: User Story 3 — Re-Processing on Edit (Priority: P2)

**Goal**: User edits previously processed text, re-submits, and system regenerates all Words from scratch.

**Independent Test**: Submit text → reading view → edit → modify text → re-submit → new reading view with updated pinyin.

- [X] T018 [US3] Ensure `handleSubmit` in `src/App.tsx` always saves rawInput with empty segments before calling `processText` (full regeneration — old segments cleared before new processing)
- [X] T019 [US3] Add re-processing tests in `tests/integration/text-input-flow.test.tsx`: test that editing from reading view → re-submitting triggers new processing, test that new segments completely replace old segments, test that shorter text produces only new Words (old ones gone)

**Checkpoint**: All user stories complete — submit, error/retry, and edit/re-process all functional.

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Final validation across all stories.

- [X] T020 Run all tests (`npm run test`) and fix any failures across frontend and backend
- [X] T021 Validate quickstart scenarios 1-7 from `specs/016-pinyin-segmentation/quickstart.md` against implementation (manual verification checklist; spot-check pinyin accuracy against SC-002)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Foundational (Phase 1)**: No dependencies — can start immediately. BLOCKS all user stories.
- **US1 (Phase 2)**: Depends on Foundational completion. MVP delivery point.
- **US2 (Phase 3)**: Depends on US1 completion (needs ProcessingState and processText to exist).
- **US3 (Phase 4)**: Depends on US1 completion (needs the full submit→process→reading flow).
- **Polish (Phase 5)**: Depends on all user stories being complete.

### Within Each Phase

- Backend before frontend (command must exist before frontend invokes it)
- Tests updated alongside implementation (not separate TDD phase — existing test suite adapted)
- Same-file tasks are sequential; different-file tasks marked [P] are parallel

### Parallel Opportunities

**Phase 1** (3 parallel streams):
- Stream A: T001 (error.rs) — independent
- Stream B: T002 → T003 → T004 (processing.rs → lib.rs) — sequential chain
- Stream C: T005 (useTextLoader.ts) — independent

**Phase 2** (2 parallel streams after T006→T007):
- Stream A: T006 → T007 (backend: commands.rs → lib.rs)
- Stream B: T008 + T009 (frontend: useTextLoader.ts + ProcessingState.tsx — parallel, different files)
- Then: T010 → T011 → T012 + T013 (wiring → cleanup → tests)

---

## Implementation Strategy

### MVP First (US1 Only)

1. Complete Phase 1: Foundational
2. Complete Phase 2: User Story 1
3. **STOP and VALIDATE**: Submit Chinese text, verify pinyin appears in reading view
4. If working → proceed to US2 and US3

### Incremental Delivery

1. Foundational → processing.rs tested, AppView updated
2. US1 → Happy path works (MVP!)
3. US2 → Error handling + retry
4. US3 → Edit + re-process
5. Polish → All tests green, quickstart scenarios verified

---

## Notes

- [P] tasks = different files, no dependencies on incomplete tasks
- [Story] label maps task to specific user story for traceability
- Claude CLI flags: `--model opus --output-format json --max-turns 1 --no-session-persistence --system-prompt --json-schema`
- 120s timeout for CLI invocation (tokio::time::timeout)
- Empty input → no CLI invocation, return `{ rawInput: "", segments: [] }`
- Constitution V (Test-First): pure functions tested in Rust; frontend tests mock invoke
- Constitution VI (Docker-Only): justified violation — CLI requires auth/network, pure functions tested in Docker
