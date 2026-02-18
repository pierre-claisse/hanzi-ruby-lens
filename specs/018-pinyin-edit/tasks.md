# Tasks: Pinyin Edit

**Input**: Design documents from `specs/018-pinyin-edit/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, quickstart.md

**Tests**: One test task added for `updatePinyin` hook function (constitution V compliance). Existing test suite covers regressions.

**Organization**: Single user story (P1). Tasks organized as foundational (data + menu plumbing) then story implementation (UI + wiring).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1)
- Include exact file paths in descriptions

---

## Phase 1: Foundational (Data Path + Menu Plumbing)

**Purpose**: Expose the persistence callback and extend the context menu infrastructure to support a 4th entry. These are blocking prerequisites for the edit UI.

- [X] T001 Add `updatePinyin(segmentIndex: number, newPinyin: string)` function to `useTextLoader` hook that clones the current `Text`, mutates `segments[segmentIndex].word.pinyin`, calls `invoke("save_text", { text })`, and updates React state in `src/hooks/useTextLoader.ts`
- [X] T002 [P] Bump `MENU_ENTRY_COUNT` from 3 to 4 in `src/hooks/useWordNavigation.ts`
- [X] T003 [P] Add "Edit Pinyin" as 4th entry in `MENU_ENTRIES` array (use `Pencil` icon from lucide-react) in `src/components/WordContextMenu.tsx`

**Checkpoint**: Context menu shows 4 entries (Edit Pinyin is visible but non-functional). `useTextLoader` exposes `updatePinyin`.

---

## Phase 2: User Story 1 - Correct a Word's Pinyin (Priority: P1)

**Goal**: User can edit any word's pinyin via context menu, with inline input, Enter/Escape/click-outside handling, persistence, and pinyin toggle interaction.

**Independent Test**: Open app with processed text, right-click a word, select "Edit Pinyin", type new pinyin, press Enter, restart app, verify corrected pinyin persists.

### Implementation for User Story 1

- [X] T004 [US1] Add inline editing mode to `RubyWord` component: accept `isEditing`, `editValue`, `onEditChange`, `onEditConfirm`, `onEditCancel` props; when `isEditing` is true, render an `<input>` element in place of the pinyin `<rt>` content (styled to match annotation size); auto-focus the input on mount; handle Enter keydown → `onEditConfirm`, Escape keydown → `onEditCancel`, blur → `onEditCancel` (FR-003, FR-004); preserve existing non-editing behavior unchanged in `src/components/RubyWord.tsx`
- [X] T005 [US1] Add pinyin edit orchestration to `TextDisplay`: add `editingWordIndex: number | null` state; in `handleMenuAction`, when `entryIndex === 3`: close menu, set `editingWordIndex` to the current tracked word index, and if pinyin is hidden call `onShowPinyin()` (FR-010); add `editValue` state pre-filled from current word's pinyin; pass `isEditing`, `editValue`, `onEditChange`, `onEditConfirm`, `onEditCancel` to the matching `RubyWord`; on confirm: reject empty/whitespace-only input (FR-007), call `onPinyinEdit(segmentIndex, newPinyin)`, clear editing state, return focus to container (FR-009); on cancel: clear editing state, return focus (FR-009); accept new props `onPinyinEdit` and `onShowPinyin` in `src/components/TextDisplay.tsx`
- [X] T006 [US1] Thread callbacks through `App.tsx`: pass `updatePinyin` from `useTextLoader` as `onPinyinEdit` prop to `TextDisplay`; pass a `onShowPinyin` callback that calls `setShowPinyin(true)` to `TextDisplay`; update `TextDisplayProps` interface accordingly in `src/App.tsx`
- [X] T007 [US1] Write unit test for `updatePinyin` in `useTextLoader`: verify it clones the text, mutates only the target segment's pinyin, calls `invoke("save_text")` with the updated text, and updates React state; test that empty/whitespace-only pinyin is rejected at the call site; mock `@tauri-apps/api/core` invoke in `tests/hooks/useTextLoader.test.ts`

**Checkpoint**: Full edit flow works end-to-end — context menu → inline input → Enter/Escape/click-outside → persistence → survives restart.

---

## Phase 3: Polish & Validation

**Purpose**: End-to-end validation against quickstart scenarios and regression check.

- [X] T008 Run all 7 quickstart.md scenarios in a Tauri build to validate feature end-to-end
- [X] T009 Run existing test suite (`npm run test`) to verify no regressions (250 passed, 0 failed)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Foundational (Phase 1)**: No dependencies — can start immediately
  - T001, T002, T003 can all run in parallel (different files)
- **User Story 1 (Phase 2)**: Depends on Phase 1 completion
  - T004 can start independently (RubyWord, different file)
  - T005 depends on T001 (needs `onPinyinEdit` prop type), T002 (menu count), T003 (menu entry), T004 (RubyWord editing props)
  - T006 depends on T001 (useTextLoader.updatePinyin) and T005 (TextDisplay new props)
  - T007 depends on T001 (tests the updatePinyin function)
- **Polish (Phase 3)**: Depends on Phase 2 completion

### Within User Story 1

- T004 (RubyWord editing) is independent — can parallel with Phase 1 tasks
- T005 (TextDisplay wiring) is the integration point — must wait for T001-T004
- T006 (App.tsx threading) is the final connection — must wait for T005
- T007 (updatePinyin test) depends on T001 — can parallel with T004-T006

### Parallel Opportunities

```text
# Phase 1 — all three tasks in parallel:
T001: useTextLoader.updatePinyin
T002: useWordNavigation MENU_ENTRY_COUNT
T003: WordContextMenu "Edit Pinyin" entry

# Phase 1 + early Phase 2 — T004 can overlap:
T004: RubyWord inline editing mode (independent file)

# Sequential after that:
T005: TextDisplay orchestration (depends on T001-T004)
T006: App.tsx threading (depends on T005)
T007: updatePinyin test (depends on T001, can parallel with T004-T006)
T008: Quickstart validation (depends on T006)
T009: Test suite (depends on T006, T007)
```

---

## Implementation Strategy

### MVP (Single Story)

1. Complete Phase 1: Foundational (T001-T003, parallel)
2. Complete Phase 2: US1 (T004 → T005 → T006 → T007, sequential)
3. **STOP and VALIDATE**: Run quickstart scenarios (T008)
4. Run test suite for regressions (T009)
5. Feature complete — ready for commit

---

## Notes

- No new Rust code — entire feature is frontend-only (research.md Decision 5)
- No schema changes — reuses existing `save_text` command (research.md Decision 1)
- Inline input replaces `<rt>` content (research.md Decision 2)
- Edit state is local to TextDisplay (research.md Decision 3)
- FR-010 (pinyin toggle) handled in T005 via `onShowPinyin` callback
