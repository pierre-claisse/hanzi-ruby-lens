# Tasks: Segment Correction

**Input**: Design documents from `/specs/026-segment-correction/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/ipc-commands.md

**Tests**: Included per constitution Principle V (Test-First Imperative). Rust unit tests for core logic; frontend tests per existing patterns.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Rust backend**: `src-tauri/src/`
- **Frontend**: `src/`
- **Tests (frontend)**: `tests/`
- **Tests (Rust)**: inline in `src-tauri/src/*.rs` via `#[cfg(test)]` modules

---

## Phase 1: Foundational (Blocking Prerequisites)

**Purpose**: Pinyin syllable tokenizer and dynamic context menu architecture — both MUST be complete before any user story can be implemented.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [x] T001 Implement `tokenize_pinyin(pinyin: &str, expected_count: usize) -> Result<Vec<String>, AppError>` in `src-tauri/src/processing.rs`. Build a static table of valid pinyin syllables (without tone marks). Greedy longest-match tokenizer that strips tone marks for matching but preserves originals in output. Returns error if syllable count ≠ expected_count. Make function `pub`. See research.md Decision 1 for algorithm details.

- [x] T002 Add Rust unit tests for `tokenize_pinyin` in `src-tauri/src/processing.rs` `#[cfg(test)]` module. Test cases: "fǎguórén" → ["fǎ", "guó", "rén"]; "nǐhǎo" → ["nǐ", "hǎo"]; "xiànzài" → ["xiàn", "zài"]; "shuìjiào" → ["shuì", "jiào"]; "ér" → ["ér"]; single syllable "rén" → ["rén"]; wrong expected_count → error; empty string → error.

- [x] T003 Define `MenuAction` type and `MenuEntry` interface in `src/components/WordContextMenu.tsx`. Refactor component from hardcoded `MENU_ENTRIES` array to accept `entries: MenuEntry[]` via props, where each `MenuEntry` has `{ label: string; icon: LucideIcon; action: MenuAction }`. Replace `onAction(index: number)` with `onAction(action: MenuAction)`. See research.md Decision 2 for type definitions.

- [x] T004 Refactor `src/components/TextDisplay.tsx` to build a dynamic `MenuEntry[]` array for the current word. Start with the 4 existing entries (dictionary, translate, editPinyin, copy) using the new `MenuAction` type. Replace `handleMenuAction(entryIndex: number)` with `handleMenuAction(action: MenuAction)` dispatching on `action.type`. Pass computed entries to `WordContextMenu`.

- [x] T005 Update `src/hooks/useWordNavigation.ts` to accept dynamic menu entry count instead of hardcoded 4. Add `menuEntryCount: number` to `UseWordNavigationProps`. Use it for arrow-key bounds in menu navigation (`menuFocusedIndex` wraps at `menuEntryCount`).

**Checkpoint**: Pinyin tokenizer works with unit tests. Context menu renders dynamic entries. Existing functionality (dictionary, translate, edit pinyin, copy) works identically.

---

## Phase 2: User Story 1 — Split a Word into Two (Priority: P1) 🎯 MVP

**Goal**: Right-click a multi-character word → select "Split after X" → word splits into two with correct pinyin partitioning → persisted to database.

**Independent Test**: Right-click any multi-character word, split it, verify two words with correct pinyin appear, reload text to confirm persistence.

### Tests for User Story 1 ⚠️

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [x] T006 [P] [US1] Add Rust unit tests for `split_segment_db` in `src-tauri/src/database.rs` `#[cfg(test)]` module. Test: split "你好" at index 0 → "你" + "好" with correct pinyin; split 3-char word at each boundary; split point out of range → error; segment is Plain → error; index out of bounds → error; pinyin tokenization failure → error.

- [x] T007 [P] [US1] Add contract test for `split_segment` IPC command in `tests/contract/`. Mock `invoke("split_segment", { textId, segmentIndex, splitAfterCharIndex })` and verify it calls with correct parameters and handles errors.

### Implementation for User Story 1

- [x] T008 [US1] Implement `split_segment_db(conn: &mut Connection, id: i64, segment_index: usize, split_after_char_index: usize) -> Result<(), AppError>` in `src-tauri/src/database.rs`. Follow existing `update_segments` pattern: load segments JSON, parse, validate (index bounds, is Word, split point range), call `tokenize_pinyin` from processing.rs, create two new Word segments, replace original, serialize, UPDATE. See data-model.md Split Segment for preconditions/postconditions.

- [x] T009 [US1] Add `split_segment` Tauri command in `src-tauri/src/commands.rs`. Parameters: `text_id: i64, segment_index: usize, split_after_char_index: usize`. Validate inputs, delegate to `database::split_segment_db`. Register command in `src-tauri/src/lib.rs` invoke_handler. See contracts/ipc-commands.md for error contract.

- [x] T010 [US1] Add `splitSegment(segmentIndex: number, splitAfterCharIndex: number)` function to `src/hooks/useTextLoader.ts`. Call `invoke("split_segment", ...)`, then reload full text via `invoke("load_text", ...)` and `setActiveText`. Export in hook return. See contracts/ipc-commands.md for calling pattern.

- [x] T011 [US1] Add split menu entries to `src/components/TextDisplay.tsx`. When building the dynamic `MenuEntry[]` for a word with ≥ 2 characters, append one entry per internal character boundary: label "Split after X" (where X is the character at that position), icon Scissors (from lucide-react), action `{ type: "split", splitAfterIndex: i }`. Handle `action.type === "split"` in `handleMenuAction` by calling `onSplitSegment?.(segIndex, action.splitAfterIndex)`.

- [x] T012 [US1] Wire `splitSegment` callback from `src/App.tsx` through to `TextDisplay`. Add `onSplitSegment` prop to `TextDisplayProps`. Destructure `splitSegment` from `useTextLoader()` and pass it to `<TextDisplay onSplitSegment={splitSegment} />`.

**Checkpoint**: User can right-click a multi-character word, see split options, click one, and see the word split into two with correct pinyin. Reloading confirms persistence. Single-character words show no split options.

---

## Phase 3: User Story 2 — Merge a Word with Its Neighbor (Priority: P1)

**Goal**: Right-click a word → select "Merge with previous/next word" → two words become one with concatenated pinyin → persisted to database.

**Independent Test**: Right-click a word adjacent to another word, merge them, verify single combined word with correct pinyin appears, reload to confirm persistence.

### Tests for User Story 2 ⚠️

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [x] T013 [P] [US2] Add Rust unit tests for `merge_segments_db` in `src-tauri/src/database.rs` `#[cfg(test)]` module. Test: merge "你" + "好" → "你好" with concatenated pinyin; merge result exceeds 12 chars → error; left is Plain → error; right is Plain → error; no right segment → error; index out of bounds → error.

- [x] T014 [P] [US2] Add contract test for `merge_segments` IPC command in `tests/contract/`. Mock `invoke("merge_segments", { textId, segmentIndex })` and verify correct parameters and error handling.

### Implementation for User Story 2

- [x] T015 [US2] Implement `merge_segments_db(conn: &mut Connection, id: i64, segment_index: usize) -> Result<(), AppError>` in `src-tauri/src/database.rs`. Follow `update_segments` pattern: load, parse, validate (index bounds, both are Words, combined chars ≤ 12), concatenate characters and pinyin, remove right segment, serialize, UPDATE. See data-model.md Merge Segments for preconditions/postconditions.

- [x] T016 [US2] Add `merge_segments` Tauri command in `src-tauri/src/commands.rs`. Parameters: `text_id: i64, segment_index: usize`. Validate inputs, delegate to `database::merge_segments_db`. Register command in `src-tauri/src/lib.rs` invoke_handler. See contracts/ipc-commands.md for error contract.

- [x] T017 [US2] Add `mergeSegments(segmentIndex: number)` function to `src/hooks/useTextLoader.ts`. Call `invoke("merge_segments", ...)`, then reload full text via `invoke("load_text", ...)` and `setActiveText`. Export in hook return.

- [x] T018 [US2] Add merge menu entries to `src/components/TextDisplay.tsx`. When building the dynamic `MenuEntry[]`, check adjacent segments: if previous segment (at `segIndex - 1`) is a Word and combined chars ≤ 12, add "Merge with previous word" (icon Combine from lucide-react, action `{ type: "mergeWithPrevious" }`). If next segment (at `segIndex + 1`) is a Word and combined chars ≤ 12, add "Merge with next word" (action `{ type: "mergeWithNext" }`). Handle actions in `handleMenuAction`: for `mergeWithPrevious` call `onMergeSegments?.(segIndex - 1)` (left segment index); for `mergeWithNext` call `onMergeSegments?.(segIndex)`.

- [x] T019 [US2] Wire `mergeSegments` callback from `src/App.tsx` through to `TextDisplay`. Add `onMergeSegments` prop to `TextDisplayProps`. Destructure `mergeSegments` from `useTextLoader()` and pass it to `<TextDisplay onMergeSegments={mergeSegments} />`.

**Checkpoint**: User can right-click a word, see applicable merge options (only when adjacent word exists, only when result ≤ 12 chars), click one, and see the merged word with concatenated pinyin. Merge options hidden for first/last words and next to punctuation. Reloading confirms persistence.

---

## Phase 4: User Story 3 — Context Menu Presents Correct Options (Priority: P2)

**Goal**: The context menu dynamically shows exactly the right set of split and merge options alongside existing actions — no inapplicable options are ever visible.

**Independent Test**: Right-click words in various positions (first, last, single-char, multi-char, next to punctuation, near 12-char limit) and verify exactly the correct options appear each time.

### Implementation for User Story 3

- [x] T020 [US3] Add integration test in `tests/integration/` that verifies the full menu entry computation: render a TextDisplay with a text containing varied segments (single-char word, multi-char word, words adjacent to plain text, words at boundaries), simulate right-click on each, and assert the correct menu entries appear. Cover all 4 acceptance scenarios from spec.md US3.

- [x] T021 [US3] Review and harden menu entry computation in `src/components/TextDisplay.tsx` for edge cases: verify no split options for single-char words (FR-008); no merge toward non-adjacent word segments or plain text (FR-005, FR-006); no merge when result > 12 chars (FR-012); keyboard navigation wraps correctly with variable entry count (FR-010). Fix any gaps found during T020 testing.

**Checkpoint**: All context menu acceptance scenarios pass. Menu shows only applicable options — no disabled, greyed-out, or inapplicable entries.

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Final validation and cleanup

- [x] T022 Run quickstart.md validation: follow all 5 testing sections in `specs/026-segment-correction/quickstart.md` manually and verify each step passes.

- [x] T023 Run full test suite via `npm test` (Vitest + cargo test in Docker). Fix any failures.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Foundational (Phase 1)**: No dependencies — can start immediately. BLOCKS all user stories.
- **US1 - Split (Phase 2)**: Depends on Phase 1 completion (needs tokenizer + dynamic menu).
- **US2 - Merge (Phase 3)**: Depends on Phase 1 completion (needs dynamic menu). Independent of US1.
- **US3 - Menu Integration (Phase 4)**: Depends on Phase 2 AND Phase 3 (tests combined behavior).
- **Polish (Phase 5)**: Depends on all phases being complete.

### User Story Dependencies

- **US1 (P1)**: Can start after Phase 1. No dependency on US2.
- **US2 (P1)**: Can start after Phase 1. No dependency on US1. **Can run in parallel with US1** (different backend functions, different menu entry types).
- **US3 (P2)**: Can start after US1 AND US2 are complete (tests combined behavior).

### Within Each User Story

- Tests MUST be written and FAIL before implementation
- Database function before Tauri command
- Tauri command before frontend IPC hook
- Frontend hook before UI integration
- UI integration before App.tsx wiring

### Parallel Opportunities

- T001 and T003 can run in parallel (Rust vs TypeScript, different files)
- T006 and T007 can run in parallel (Rust tests vs frontend contract tests)
- T013 and T014 can run in parallel (Rust tests vs frontend contract tests)
- US1 (Phase 2) and US2 (Phase 3) can run in parallel after Phase 1

---

## Parallel Example: Foundational Phase

```bash
# These two tasks can run in parallel (different languages, different files):
Task T001: "Implement tokenize_pinyin in src-tauri/src/processing.rs"
Task T003: "Define MenuAction types and refactor WordContextMenu in src/components/WordContextMenu.tsx"
```

## Parallel Example: US1 Tests

```bash
# These two test tasks can run in parallel (Rust vs frontend):
Task T006: "Rust unit tests for split_segment_db in src-tauri/src/database.rs"
Task T007: "Contract test for split_segment IPC in tests/contract/"
```

---

## Implementation Strategy

### MVP First (US1 — Split Only)

1. Complete Phase 1: Foundational (tokenizer + dynamic menu)
2. Complete Phase 2: US1 — Split
3. **STOP and VALIDATE**: User can split words with correct pinyin, persistence works
4. This alone delivers significant value — split is the most common segmentation correction

### Incremental Delivery

1. Phase 1: Foundational → Dynamic menu works, existing features unbroken
2. Phase 2: US1 — Split → User can fix over-segmentation (MVP!)
3. Phase 3: US2 — Merge → User can fix under-segmentation
4. Phase 4: US3 — Integration → All edge cases validated
5. Phase 5: Polish → Full test suite passes, quickstart validated

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- T001+T002 are grouped: implement tokenizer then immediately test it
- T008+T009 are tightly coupled: command creation + registration in one task
- T011/T018 modify the same file (TextDisplay.tsx) so they cannot be parallel
- T012/T019 modify the same file (App.tsx) so they cannot be parallel
- After each split/merge IPC call, full text reload is used (not optimistic update) per research.md Decision 3
