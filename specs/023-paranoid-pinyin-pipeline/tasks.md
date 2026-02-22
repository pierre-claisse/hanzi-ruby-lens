# Tasks: Paranoid Pinyin Pipeline

**Input**: Design documents from `/specs/023-paranoid-pinyin-pipeline/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/process-text.md, quickstart.md

**Tests**: Tests are included — the spec mandates validation of the paranoid pipeline.

**Organization**: Tasks are grouped by user story. Since all changes target exactly 2 files (`src-tauri/Cargo.toml` and `src-tauri/src/processing.rs`), parallelism is limited but phases remain independent.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup

**Purpose**: Enable the `heteronym` feature on the pinyin crate (R7 decision)

- [x] T001 Enable `heteronym` feature on pinyin crate in `src-tauri/Cargo.toml`: change `pinyin = "0.11"` to `pinyin = { version = "0.11", features = ["heteronym"] }`
- [x] T002 Add `use pinyin::ToPinyinMulti;` import and verify compilation in `src-tauri/src/processing.rs`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Internal helper functions that ALL user stories depend on

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T003 Implement `is_valid_reading_for_char(ch: char, syllable: &str) -> bool` in `src-tauri/src/processing.rs` — returns true if `syllable` is among `ch.to_pinyin_multi()` readings (or true if char has no pinyin data). Include test `test_is_valid_reading_for_char` in same commit: verify "jué" is valid for 覺, "jiào" is valid for 覺, "hǎo" is NOT valid for 覺
- [x] T004 Implement `lookup_pinyin_char(ch: char) -> String` in `src-tauri/src/processing.rs` — single-character pinyin via Tier 2 (CC-CEDICT char lookup with cross-validation), Tier 3 (pinyin crate default), Tier 4 (identity fallback). Include test `test_lookup_pinyin_char_basic` in same commit: verify single-char lookup returns correct pinyin for 好, 覺, and a rare character

**Checkpoint**: Foundation ready — helper functions tested and usable by all stories

---

## Phase 3: User Story 1 — Accurate Pinyin for Every Word (Priority: P1) 🎯 MVP

**Goal**: Replace `lookup_pinyin` with `lookup_pinyin_paranoid` — 4-tier validated pinyin lookup with syllable-count parity and cross-validation

**Independent Test**: Process "覺得睡覺" and verify correct polyphonic disambiguation plus syllable-count match

### Implementation for User Story 1

- [x] T005 [US1] Implement `validate_and_cross_check_entry(word: &str, entry: &WordEntry) -> Option<String>` in `src-tauri/src/processing.rs` — validate syllable count matches CJK char count, cross-validate each syllable with `is_valid_reading_for_char`, return concatenated lowercase pinyin on success or None on failure
- [x] T006 [US1] Implement `lookup_pinyin_paranoid(word: &str) -> String` in `src-tauri/src/processing.rs` — Tier 1: iterate all CC-CEDICT entries via `query_by_chinese(word)`, validate each with `validate_and_cross_check_entry`, accept first passing entry; Tier 2-4: fall back to `lookup_pinyin_char` for each character and concatenate
- [x] T007 [US1] Replace `lookup_pinyin(word)` call on line 69 of `process_text_native` with `lookup_pinyin_paranoid(word)` in `src-tauri/src/processing.rs`
- [x] T008 [US1] Write test `test_syllable_count_validation` in `src-tauri/src/processing.rs` — process "覺得睡覺" and verify syllable count matches character count for each word (2 syllables for 覺得, 2 for 睡覺). Also assert pinyin is lowercase with tone marks (FR-006 coverage)
- [x] T009 [US1] Write test `test_cross_validation_rejects_wrong_reading` in `src-tauri/src/processing.rs` — call `validate_and_cross_check_entry` with a fabricated entry where syllable doesn't match character readings, verify it returns None
- [x] T010 [US1] Write test `test_cedict_iterates_entries` in `src-tauri/src/processing.rs` — process a word where the first CC-CEDICT entry has wrong syllable count and verify the system still returns valid pinyin (not the first entry blindly)
- [x] T011 [US1] Verify all 15 existing tests still pass after replacing `lookup_pinyin` with `lookup_pinyin_paranoid` in `src-tauri/src/processing.rs` — specifically confirm `test_mixed_simplified_traditional` passes (FR-008 coverage)

**Checkpoint**: Pinyin accuracy guaranteed — every word has validated, cross-checked pinyin with syllable-count parity

---

## Phase 4: User Story 2 — Better Word Segmentation (Priority: P2)

**Goal**: Replace single `jieba.cut(text, true)` with dual segmentation — run both precise (no HMM) and HMM modes, pick best by CC-CEDICT coverage

**Independent Test**: Process "今天天氣很好" and verify words are "今天", "天氣", "很", "好" (not "今", "天天", "氣", "很", "好")

### Implementation for User Story 2

- [x] T012 [US2] Implement `score_segmentation(words: &[&str]) -> usize` in `src-tauri/src/processing.rs` — count how many words in the segmentation are found in CC-CEDICT via `query_by_chinese`
- [x] T013 [US2] Implement `segment_chinese_run(jieba: &Jieba, run: &str) -> Vec<String>` in `src-tauri/src/processing.rs` — run `jieba.cut(run, false)` and `jieba.cut(run, true)`, score both, return winner (prefer precise on tie)
- [x] T014 [US2] Replace `jieba.cut(&chinese_run, true)` on line 67 of `process_text_native` with `segment_chinese_run(jieba, &chinese_run)` in `src-tauri/src/processing.rs`, update the loop to iterate over owned Strings
- [x] T015 [US2] Write test `test_dual_segmentation_prefers_precise` in `src-tauri/src/processing.rs` — verify "今天天氣很好" segments into "今天", "天氣", "很", "好" (not HMM-noise output)
- [x] T016 [US2] Verify all existing tests and US1 tests still pass after dual segmentation change in `src-tauri/src/processing.rs`

**Checkpoint**: Segmentation quality improved — dictionary-preferred word boundaries with HMM fallback

---

## Phase 5: User Story 3 — Graceful Handling of Rare Characters (Priority: P3)

**Goal**: Ensure no Chinese character ever produces empty pinyin — multi-tier fallback guarantees non-empty output

**Independent Test**: Process "龘" and other rare CJK Extension characters, verify non-empty pinyin for all

### Implementation for User Story 3

- [x] T017 [US3] Write test `test_rare_char_never_empty_pinyin` in `src-tauri/src/processing.rs` — process a set of rare characters (龘, 𠀀, 𪜀) and verify every word has non-empty pinyin
- [x] T018 [US3] Write test `test_identity_fallback_for_unknown_char` in `src-tauri/src/processing.rs` — verify that a character with no pinyin data at all returns itself as pinyin (Tier 4 identity fallback)
- [x] T019 [US3] Verify `lookup_pinyin_char` handles all Tier 2→3→4 fallback transitions correctly by testing edge cases in `src-tauri/src/processing.rs`

**Checkpoint**: Rare character handling complete — zero empty pinyin outputs guaranteed

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Performance validation, cleanup, and comprehensive testing

- [x] T020 Update performance test `test_performance_500_chars` threshold from 2s to 5s in `src-tauri/src/processing.rs` (per relaxed SC-003)
- [x] T021 Update performance test `test_performance_5000_chars` threshold from 10s to 30s in `src-tauri/src/processing.rs` (per relaxed SC-004)
- [x] T022 Remove old `lookup_pinyin` function from `src-tauri/src/processing.rs` (replaced by `lookup_pinyin_paranoid`)
- [x] T023 Update `tests/contract/process-text-command.test.ts` — remove stale Claude CLI error references (lines 71, 77: "Claude CLI not found") and replace with current native processing error messages (Constitution §V: contract test coverage)
- [x] T024 Run full test suite (`npm test`) and verify all tests pass (existing + new)
- [x] T025 Run `npm run build` and verify successful compilation

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Setup completion — BLOCKS all user stories
- **US1 (Phase 3)**: Depends on Foundational — implements 4-tier pinyin lookup
- **US2 (Phase 4)**: Depends on Foundational — implements dual segmentation (independent of US1)
- **US3 (Phase 5)**: Depends on Foundational — tests rare char fallback (independent of US1/US2)
- **Polish (Phase 6)**: Depends on all user stories being complete

### User Story Dependencies

- **US1 (P1)**: Can start after Phase 2. Uses `is_valid_reading_for_char` and `lookup_pinyin_char` from foundational.
- **US2 (P2)**: Can start after Phase 2. Independent of US1 — modifies segmentation, not pinyin lookup.
- **US3 (P3)**: Can start after Phase 2. Tests and validates `lookup_pinyin_char` from foundational. Independent of US1/US2.

> **Note**: Although US1-US3 are technically independent, they all modify the same file (`processing.rs`). Sequential execution in priority order (P1 → P2 → P3) is recommended to avoid merge conflicts.

### Within Each User Story

- Functions and their tests are implemented together (Rust `#[cfg(test)]` inline tests require the function to exist in the same file for compilation — TDD red-green-refactor is applied within each task, not across tasks)
- Core functions before wiring into `process_text_native`
- Regression check after each story completes

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (Cargo.toml feature flag)
2. Complete Phase 2: Foundational (helper functions)
3. Complete Phase 3: User Story 1 (4-tier paranoid pinyin)
4. **STOP and VALIDATE**: Run `npm test` — all tests pass, polyphonic disambiguation works
5. Pinyin quality dramatically improved at this point

### Incremental Delivery

1. Setup + Foundational → Helpers ready
2. Add US1 (paranoid pinyin) → Test → Pinyin accuracy guaranteed (MVP!)
3. Add US2 (dual segmentation) → Test → Word boundaries improved
4. Add US3 (rare chars) → Test → Zero empty pinyin
5. Polish → Performance thresholds updated, cleanup, full validation

---

## Notes

- All implementation happens in exactly 2 files: `src-tauri/Cargo.toml` and `src-tauri/src/processing.rs` (+ 1 contract test file)
- No new source files created, no structural changes
- 15 existing tests must continue to pass at every checkpoint
- Performance budgets: 5s/500 chars, 30s/5000 chars (relaxed from 2s/10s)
