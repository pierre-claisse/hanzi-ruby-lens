# Tasks: Native Pinyin Processing

**Input**: Design documents from `/specs/023-native-pinyin-processing/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/

**Tests**: Included per constitution (V. Test-First Imperative: "Tests MUST be extensive", "Tests SHOULD be written before implementation").

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Add new Rust dependencies and remove Claude CLI dependency

- [x] T001 Add jieba-rs, chinese_dictionary, and pinyin crate dependencies in `src-tauri/Cargo.toml`; add `jieba-rs = { version = "0.8", features = ["default-dict"] }`, `chinese_dictionary = "2.1"`, `pinyin = "0.11"`
- [x] T002 Evaluate and remove `tokio` process/time features from `src-tauri/Cargo.toml` if `process_text` was the only async command using them; check if Tauri 2 itself requires tokio or if the command can become synchronous

**Checkpoint**: Dependencies compiled successfully, project builds

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Build the core native processing pipeline in `processing.rs` that all user stories depend on

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

### Tests for Foundation ⚠️

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [x] T003 Write unit test `test_segment_simple_chinese` in `src-tauri/src/processing.rs` — input "今天天氣很好", assert produces Word segments for 今天, 天氣, 很, 好 with correct pinyin (jīntiān, tiānqì, hěn, hǎo)
- [x] T004 [P] Write unit test `test_segment_mixed_content` in `src-tauri/src/processing.rs` — input "Hello世界！2025年", assert Chinese portions become Word segments with pinyin and non-Chinese portions become Plain segments preserving original content
- [x] T005 [P] Write unit test `test_pinyin_has_tone_marks` in `src-tauri/src/processing.rs` — assert pinyin output uses tone marks (e.g., contains "ā", "é", "ǐ", "ò", "ǖ") not tone numbers
- [x] T006 [P] Write unit test `test_pinyin_concatenated_per_word` in `src-tauri/src/processing.rs` — input "現在", assert pinyin is "xiànzài" (concatenated) not "xiàn zài" (space-separated)
- [x] T007 [P] Write unit test `test_polyphonic_disambiguation` in `src-tauri/src/processing.rs` — input containing "覺得" and "睡覺", assert 覺 gets "jué" in 覺得 and "jiào" in 睡覺
- [x] T008 [P] Write unit test `test_empty_input_returns_empty_segments` in `src-tauri/src/processing.rs` — input "", assert returns empty Vec
- [x] T009 [P] Write unit test `test_punctuation_only_returns_plain_segments` in `src-tauri/src/processing.rs` — input "，。！？", assert all segments are Plain
- [x] T010 [P] Write unit test `test_single_character_input` in `src-tauri/src/processing.rs` — input "好", assert produces one Word segment with pinyin "hǎo"
- [x] T011 [P] Write unit test `test_all_characters_preserved` in `src-tauri/src/processing.rs` — for any input, assert concatenating all segment characters/text equals the original input (invariant check)
- [x] T011b [P] Write unit test `test_mixed_simplified_traditional` in `src-tauri/src/processing.rs` — input mixing simplified and traditional characters in the same text, assert both are handled correctly with appropriate pinyin (FR-004)

### Implementation for Foundation

- [x] T012 Implement `is_chinese_char(c: char) -> bool` helper function in `src-tauri/src/processing.rs` — detect CJK Unified Ideographs Unicode ranges (U+4E00–U+9FFF, U+3400–U+4DBF, U+20000–U+2A6DF, and CJK extensions)
- [x] T013 Implement `classify_and_segment(input: &str) -> Vec<Token>` in `src-tauri/src/processing.rs` — scan input character by character, group into Chinese runs and non-Chinese runs; pass Chinese runs through `Jieba::cut()` with HMM enabled; emit non-Chinese runs as-is; preserve ordering and every character
- [x] T014 Implement `lookup_pinyin(word: &str) -> String` in `src-tauri/src/processing.rs` — two-layer lookup: (1) try `chinese_dictionary::query_by_chinese(word)`, if found use `pinyin_marks` with spaces stripped; (2) fallback to `pinyin` crate character-by-character via `ToPinyin` trait, concatenate `with_tone()` results
- [x] T015 Implement `process_text_native(input: &str) -> Vec<TextSegment>` in `src-tauri/src/processing.rs` — orchestrate the full pipeline: call `classify_and_segment`, then for each token classify as Chinese or non-Chinese, look up pinyin for Chinese tokens via `lookup_pinyin`, assemble into `Vec<TextSegment>` (Word or Plain variants)
- [x] T016 Remove all Claude CLI code from `src-tauri/src/processing.rs` — delete `SYSTEM_PROMPT` constant, `build_prompt()` function, `parse_claude_response()` function, `strip_code_fences()` function, and all associated tests for removed functions

**Checkpoint**: Foundation ready — `process_text_native()` passes all unit tests, pipeline segments and annotates Chinese text correctly

---

## Phase 3: User Story 1 — Process Chinese Text Into Annotated Words (Priority: P1) 🎯 MVP

**Goal**: Wire the native processing pipeline into the `process_text` Tauri command so the app produces annotated Words from raw Chinese input

**Independent Test**: Paste a Chinese text in the app, verify it displays correctly segmented Words with pinyin ruby annotations

### Tests for User Story 1 ⚠️

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [x] T017 [US1] Write unit test `test_process_text_command_simple` in `src-tauri/src/commands.rs` or as an integration test — call `process_text` with "今天天氣很好", assert returned Text has correct `raw_input` and segments matching expected Word/Plain structure
- [x] T018 [P] [US1] Write unit test `test_process_text_command_empty_input` in `src-tauri/src/commands.rs` — call `process_text` with "", assert returns Text with empty segments (preserving existing behavior)
- [x] T019 [P] [US1] Write unit test `test_process_text_command_traditional_chars` in `src-tauri/src/commands.rs` — call with traditional Chinese text, assert segments have correct pinyin

### Implementation for User Story 1

- [x] T020 [US1] Rewrite `process_text` command in `src-tauri/src/commands.rs` — remove async Claude CLI subprocess spawning, timeout, retry logic, JSON envelope parsing; replace with synchronous call to `processing::process_text_native(&raw_input)`; keep empty input guard and database save; evaluate if `async` keyword can be removed from the function signature
- [x] T021 [US1] Update `src-tauri/src/lib.rs` if `process_text` command signature changed from async to sync — ensure `invoke_handler` registration still works; remove tokio dependency from `src-tauri/Cargo.toml` if no longer needed anywhere

**Checkpoint**: User Story 1 complete — app processes Chinese text using native libraries, displays annotated Words with pinyin, no Claude CLI dependency

---

## Phase 4: User Story 2 — Process Long Texts Reliably (Priority: P1)

**Goal**: Verify and ensure the native pipeline handles texts of 5,000–10,000+ characters without failure

**Independent Test**: Paste a 5,000+ character Chinese text, verify it processes fully without errors or truncation

### Tests for User Story 2 ⚠️

- [x] T022 [US2] Write unit test `test_process_5000_chars` in `src-tauri/src/processing.rs` — generate or use a 5,000-character Chinese text, call `process_text_native()`, assert it completes without error and all characters are preserved in output segments
- [x] T023 [P] [US2] Write unit test `test_process_10000_chars` in `src-tauri/src/processing.rs` — generate or use a 10,000-character Chinese text, call `process_text_native()`, assert it completes without error and output segment count is reasonable (FR-009)

### Implementation for User Story 2

- [x] T024 [US2] Verify no artificial length limits exist in the processing pipeline in `src-tauri/src/processing.rs` — ensure `classify_and_segment` and `process_text_native` have no buffer size caps, truncation logic, or iteration limits; if jieba-rs or chinese_dictionary impose any limits, document and work around them

**Checkpoint**: User Story 2 complete — long texts (10K+ characters) process reliably and fully

---

## Phase 5: User Story 3 — Fast Processing Feedback (Priority: P2)

**Goal**: Verify processing speed meets performance targets (<2s for 500 chars, <10s for 5,000 chars)

**Independent Test**: Time processing of various text lengths, verify they meet SC-001 and SC-002

### Tests for User Story 3 ⚠️

- [x] T025 [US3] Write benchmark test `test_performance_500_chars` in `src-tauri/src/processing.rs` — process 500-character Chinese text, assert completes in under 2 seconds (SC-001)
- [x] T026 [P] [US3] Write benchmark test `test_performance_5000_chars` in `src-tauri/src/processing.rs` — process 5,000-character Chinese text, assert completes in under 10 seconds (SC-002)

### Implementation for User Story 3

- [x] T027 [US3] Optimize Jieba initialization in `src-tauri/src/processing.rs` — ensure `Jieba::new()` is called once (lazy static or app state) not per-request; the dictionary load is the expensive operation and should happen at startup or first use, not on every `process_text` call

**Checkpoint**: User Story 3 complete — processing meets performance targets

---

## Phase 6: User Story 4 — Offline Processing (Priority: P2)

**Goal**: Confirm processing works with no network connection

**Independent Test**: Disable network, process a Chinese text, verify success

### Tests for User Story 4 ⚠️

- [x] T028 [US4] Write unit test `test_no_network_dependency` in `src-tauri/src/processing.rs` — verify that `process_text_native()` makes no network calls; this is inherently satisfied by the library-based approach but the test documents the invariant (assert no `reqwest`, `hyper`, or `std::net` usage in processing code path)

### Implementation for User Story 4

- [x] T029 [US4] Verify no network-dependent code remains in `src-tauri/src/processing.rs` and `src-tauri/src/commands.rs` — confirm all Claude CLI networking code was removed in T016/T020; ensure none of the new crate dependencies (jieba-rs, chinese_dictionary, pinyin) make network calls at runtime (they are all dictionary-bundled)

**Checkpoint**: User Story 4 complete — fully offline processing confirmed

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Edge case handling, cleanup, and cross-story validation

- [x] T030 [P] Write unit test `test_rare_characters_fallback` in `src-tauri/src/processing.rs` — input containing rare/archaic characters not in CC-CEDICT, assert the pinyin crate fallback produces a reading rather than an error
- [x] T032 Remove all obsolete Claude CLI test fixtures from `src-tauri/src/processing.rs` — delete `test_build_prompt_contains_raw_input`, `test_build_prompt_preserves_mixed_content`, `test_parse_valid_response_returns_segments`, `test_parse_response_with_code_fences`, `test_parse_malformed_json_returns_error`, `test_parse_missing_result_field_returns_error`, `test_parse_invalid_segments_json_returns_error`, `test_strip_code_fences_removes_json_fence`, `test_strip_code_fences_preserves_plain_json`
- [x] T033 Run full test suite (`cargo test` in Docker) and fix any regressions in `src-tauri/`
- [x] T034 Run frontend test suite (`npm test` in Docker) and verify no frontend regressions — the frontend should be completely unaffected since domain types and IPC contract are unchanged

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 (dependencies must compile)
- **User Story 1 (Phase 3)**: Depends on Phase 2 (pipeline must exist before wiring into command)
- **User Story 2 (Phase 4)**: Depends on Phase 2 (tests the pipeline directly); can run in parallel with Phase 3
- **User Story 3 (Phase 5)**: Depends on Phase 2 (benchmarks the pipeline); can run in parallel with Phase 3/4
- **User Story 4 (Phase 6)**: Depends on Phase 3 (verifies full command is offline); runs after command rewrite
- **Polish (Phase 7)**: Depends on all user story phases being complete

### User Story Dependencies

- **User Story 1 (P1)**: Depends on Foundational (Phase 2) — can start immediately after
- **User Story 2 (P1)**: Depends on Foundational (Phase 2) — can start in parallel with US1
- **User Story 3 (P2)**: Depends on Foundational (Phase 2) — can start in parallel with US1/US2
- **User Story 4 (P2)**: Depends on User Story 1 (needs command rewrite completed)

### Within Each User Story

- Tests MUST be written and FAIL before implementation
- Pipeline functions before command wiring
- Core implementation before optimization
- Story complete before moving to next priority

### Parallel Opportunities

- T004–T011 (foundational tests): All marked [P], can run in parallel
- T017–T019 (US1 tests): T018/T019 marked [P], can run in parallel
- T022–T023 (US2 tests): T023 marked [P]
- T025–T026 (US3 tests): T026 marked [P]
- T030–T031 (polish tests): Both marked [P]
- US1/US2/US3 implementation can proceed in parallel after Phase 2

---

## Parallel Example: Foundational Phase

```bash
# Launch all foundational tests in parallel (T003-T011):
# These all write to different test functions in the same file,
# but as test-writing tasks they are logically independent.
# T003 writes first (sets up the test module structure), then T004-T011 in parallel.

# After tests written, implementation is sequential:
# T012 (is_chinese_char) → T013 (classify_and_segment) → T014 (lookup_pinyin) → T015 (process_text_native) → T016 (cleanup)
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001–T002)
2. Complete Phase 2: Foundational (T003–T016)
3. Complete Phase 3: User Story 1 (T017–T021)
4. **STOP and VALIDATE**: Process Chinese text in the app, verify annotated Words display
5. This is the minimum viable replacement for Claude CLI

### Incremental Delivery

1. Setup + Foundational → Pipeline works in isolation
2. Add User Story 1 → App processes text natively (MVP!)
3. Add User Story 2 → Long text reliability confirmed
4. Add User Story 3 → Performance benchmarked
5. Add User Story 4 → Offline guarantee confirmed
6. Polish → Edge cases, cleanup, full regression check

---

## Notes

- [P] tasks = different files or independent test functions, no dependencies
- [Story] label maps task to specific user story for traceability
- Constitution requires `/speckit.constitution` amendment before or during implementation (remove LLM clause)
- All tests run inside Docker per constitution (VI. Docker-Only Execution)
- Domain model (Text, Word, TextSegment) is unchanged — zero frontend impact
- The `processing.rs` file is a full rewrite; the old Claude CLI code is entirely replaced
