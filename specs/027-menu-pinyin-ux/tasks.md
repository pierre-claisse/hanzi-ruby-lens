# Tasks: Adaptive Menu Positioning & Numbered Pinyin Input

**Input**: Design documents from `/specs/027-menu-pinyin-ux/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/pinyin-conversion.md, quickstart.md

**Tests**: Unit tests for pinyin conversion utilities (pure functions, ideal for TDD per constitution principle V).

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Create the utility module that US2 and US3 both depend on

- [x] T001 Create `src/utils/` directory and `src/utils/pinyinConversion.ts` with the tone mark mapping tables (TONE_MARKS object mapping plain vowel + tone number → diacritical character, and reverse lookup), the `hasToneMarks` helper (regex `/[āáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ]/`), and export stubs for `diacriticalToNumbered` and `numberedToDiacritical`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Unit tests for pinyin conversion — written first so they FAIL before implementation

**⚠️ CRITICAL**: Tests must exist and fail before implementing conversion logic

- [x] T002 Write unit tests for `diacriticalToNumbered` in `tests/unit/pinyinConversion.test.ts` covering: standard conversion ("xǐhuān" → "xi3huan1"), single syllable ("rén" → "ren2"), ü→v mapping ("nǚ" → "nv3"), neutral tone passthrough ("de" → "de"), multi-syllable ("zhōngguó" → "zhong1guo2"), empty string ("" → "")
- [x] T003 Write unit tests for `numberedToDiacritical` in `tests/unit/pinyinConversion.test.ts` covering: standard conversion ("xi3huan1" → "xǐhuān"), single syllable ("ren2" → "rén"), v→ü mapping ("nv3" → "nǚ"), neutral tone no-digit ("de" → "de"), explicit tone 5 ("de5" → "de"), multi-syllable ("zhong1guo2" → "zhōngguó"), tone on 'a' ("hao3" → "hǎo"), tone on 'e' ("mei2" → "méi"), tone on 'o' in 'ou' ("gou3" → "gǒu"), tone on last vowel ("gui4" → "guì"), already-diacritical passthrough ("xǐhuān" → "xǐhuān"), empty string ("" → "")
- [x] T004 Write unit test for `hasToneMarks` in `tests/unit/pinyinConversion.test.ts` covering: returns true for "xǐhuān", returns false for "xi3huan1", returns false for "de", returns false for ""

**Checkpoint**: Tests written and failing — ready for implementation

---

## Phase 3: User Story 1 — Adaptive Context Menu Positioning (Priority: P1) 🎯 MVP

**Goal**: Context menu opens above words in the lower half of the viewport, and below words in the upper half

**Independent Test**: Open a long text, right-click a word near the bottom of the viewport → menu appears above the word. Right-click a word near the top → menu appears below.

### Implementation for User Story 1

- [x] T005 [US1] Modify `getMenuPosition` callback in `src/components/TextDisplay.tsx` to compare the word's vertical center (`wordRect.top + wordRect.height / 2`) against the viewport midpoint (`window.innerHeight / 2`). If word center > midpoint, compute `top` as `wordRect.top - containerRect.top - menuHeight - 4` (above); otherwise keep existing `wordRect.bottom - containerRect.top + 4` (below). Use a hardcoded menu height estimate (e.g., entries.length × 36 + 8 for py-1 padding). Return a `direction` field ("above" | "below") alongside `top` and `left`.
- [x] T006 [US1] Update `WordContextMenu` in `src/components/WordContextMenu.tsx` to accept an optional `direction` prop ("above" | "below") and apply `flex-direction: column-reverse` when direction is "above" so entries render bottom-to-top visually (or just position normally since top is already computed). Update the `WordContextMenuProps` interface to include `direction?: "above" | "below"`.
- [x] T007 [US1] Wire the `direction` value from `getMenuPosition` through to `WordContextMenu` in `src/components/TextDisplay.tsx` where `<WordContextMenu>` is rendered (pass `direction` prop from the position object).

**Checkpoint**: Menu positioning is adaptive — US1 is fully functional and testable independently

---

## Phase 4: User Story 2 — Numbered Pinyin in Correction Input (Priority: P2)

**Goal**: Pinyin edit input displays numbered format ("xi3huan1") instead of diacritical ("xǐhuān")

**Independent Test**: Right-click any word, select "Edit Pinyin" → input shows numbered tones. Press Escape → diacritical display is unchanged.

**Dependency**: Requires T001 (tone mapping tables) to be complete

### Implementation for User Story 2

- [x] T008 [US2] Implement `diacriticalToNumbered` function body in `src/utils/pinyinConversion.ts`: iterate character-by-character, replace each tone-marked vowel with its plain equivalent + record tone number, emit tone number at next consonant boundary or end of string. Handle ü→v replacement. Per research.md Decision 3.
- [x] T009 [US2] Modify the `editPinyin` case in `handleMenuAction` in `src/components/TextDisplay.tsx` to call `diacriticalToNumbered(segment.word.pinyin)` instead of using `segment.word.pinyin` directly when setting `editValue`. Import `diacriticalToNumbered` from `src/utils/pinyinConversion.ts`.

**Checkpoint**: Edit input shows numbered pinyin — US2 is fully functional and testable independently

---

## Phase 5: User Story 3 — Diacritical Display After Numbered Input (Priority: P3)

**Goal**: After submitting numbered pinyin (e.g., "hao3"), the reading view displays diacritical ("hǎo")

**Independent Test**: Edit pinyin of a word to "zhong1guo2", press Enter → ruby annotation shows "zhōngguó"

**Dependency**: Requires T001 (tone mapping tables) to be complete

### Implementation for User Story 3

- [x] T010 [US3] Implement `numberedToDiacritical` function body in `src/utils/pinyinConversion.ts`: split input on tone digits 1-5 as syllable terminators, for each syllable replace "v" with "ü", apply tone mark to the correct vowel per placement rules (a/e first; then o in "ou"; then last vowel), handle tone 5 and no-digit as neutral. Use `hasToneMarks` to detect already-diacritical input and passthrough. Per research.md Decisions 2, 5, 6.
- [x] T011 [US3] Modify `handleEditConfirm` in `src/components/TextDisplay.tsx` to call `numberedToDiacritical(trimmed)` on the trimmed input value before passing it to `onPinyinEdit`. Import `numberedToDiacritical` from `src/utils/pinyinConversion.ts`.

**Checkpoint**: Numbered input is converted to diacritical on submission — US3 is fully functional

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Validation, round-trip fidelity, and final cleanup

- [x] T012 Run all unit tests (`npm test`) and verify T002–T004 tests pass after T008 and T010 implementations
- [x] T013 Manual validation of quickstart.md scenarios 1–6 (adaptive positioning, numbered display, conversion on submit, v/ü handling, diacritical paste passthrough, neutral tone)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on T001 (needs type stubs to import) — BLOCKS US2/US3 implementation
- **US1 (Phase 3)**: Independent of Phase 2 — can start after Phase 1
- **US2 (Phase 4)**: Depends on T001 (mapping tables) + T002 tests written
- **US3 (Phase 5)**: Depends on T001 (mapping tables) + T003 tests written
- **Polish (Phase 6)**: Depends on all user stories being complete

### User Story Dependencies

- **US1 (P1)**: Fully independent — no shared code with US2/US3. Only touches `TextDisplay.tsx` (getMenuPosition) and `WordContextMenu.tsx`
- **US2 (P2)**: Depends on `pinyinConversion.ts` (Phase 1). Touches `TextDisplay.tsx` (handleMenuAction editPinyin case)
- **US3 (P3)**: Depends on `pinyinConversion.ts` (Phase 1). Touches `TextDisplay.tsx` (handleEditConfirm)
- **US2 and US3 are independent of each other** — they modify different callbacks in TextDisplay.tsx

### Within Each User Story

- Tests (Phase 2) written FIRST, must FAIL before implementation
- Utility functions before component integration
- Core implementation before wiring

### Parallel Opportunities

- T002, T003, T004 can all be written in parallel (same test file but different describe blocks)
- US1 (T005–T007) can run in parallel with US2 (T008–T009) after Phase 1
- US3 (T010–T011) can run in parallel with US1 and US2

---

## Parallel Example: After Phase 1

```bash
# US1 and US2/US3 can start simultaneously:
# Stream A: T005 → T006 → T007  (menu positioning)
# Stream B: T008 → T009          (diacritical→numbered + input display)
# Stream C: T010 → T011          (numbered→diacritical + submission)
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001)
2. Complete Phase 3: User Story 1 (T005–T007)
3. **STOP and VALIDATE**: Right-click words in upper/lower viewport halves

### Incremental Delivery

1. T001 → Foundation ready
2. T002–T004 → Tests written and failing
3. T005–T007 → US1 complete (adaptive menu)
4. T008–T009 → US2 complete (numbered display in input)
5. T010–T011 → US3 complete (diacritical conversion on submit)
6. T012–T013 → All tests pass + manual validation

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story
- No Rust/backend changes in this feature
- No new IPC commands — existing `update_pinyin` is reused
- Storage format stays diacritical; numbered is UI-only (transient in edit input)
- Commit after each phase or logical group
