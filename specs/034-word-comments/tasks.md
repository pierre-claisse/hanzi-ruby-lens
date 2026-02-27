# Tasks: Word Comments

**Input**: Design documents from `/specs/034-word-comments/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/tauri-commands.md, quickstart.md

**Tests**: Not explicitly requested in the feature specification. No test tasks included.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup

**Purpose**: No new dependencies needed. No setup tasks required — this feature builds entirely on existing infrastructure.

_(No tasks — skip to Phase 2)_

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Domain model changes that MUST be complete before ANY user story can be implemented. Both Rust and TypeScript Word types need the optional `comment` field.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T001 [P] Add optional `comment: Option<String>` field with `#[serde(skip_serializing_if = "Option::is_none")]` to Word struct in `src-tauri/src/domain.rs`
- [x] T002 [P] Add optional `comment?: string` field to Word interface in `src/types/domain.ts`
- [x] T003 Add `"comment"` to the `MenuAction` union type in `src/components/WordContextMenu.tsx`

**Checkpoint**: Domain types updated — user story implementation can now begin

---

## Phase 3: User Story 1 — Add a Comment to a Word (Priority: P1) 🎯 MVP

**Goal**: Users can right-click a Word, select "Comment", and save a plain-text note (up to 5000 chars) via a modal dialog. Comments are persisted in the segments JSON and survive restarts.

**Independent Test**: Open an unlocked Text in reading view, right-click a Word, select "Comment", type a note, confirm. Reload the text and verify the comment persists.

### Implementation for User Story 1

- [x] T004 [US1] Add `update_word_comment_db` function in `src-tauri/src/database.rs` — load text by ID, check locked state, parse segments JSON, validate segment index is in-bounds and is a Word, validate comment length ≤5000, set or clear `word.comment`, serialize back, UPDATE segments and modified_at columns
- [x] T005 [US1] Add `update_word_comment` Tauri command in `src-tauri/src/commands.rs` — accepts `text_id: i64`, `segment_index: usize`, `comment: Option<String>`, calls `update_word_comment_db`
- [x] T006 [US1] Register `update_word_comment` command in the invoke handler in `src-tauri/src/lib.rs`
- [x] T007 [US1] Add comment validation to `split_segment_db` in `src-tauri/src/database.rs` — reject split if target Word has a comment with `AppError::Validation("Cannot split a word that has a comment. Delete the comment first.")`
- [x] T008 [US1] Add comment validation to `merge_segments_db` in `src-tauri/src/database.rs` — reject merge if either involved Word has a comment with `AppError::Validation("Cannot merge words that have comments. Delete the comment(s) first.")`
- [x] T009 [US1] Add `updateComment` function to `src/hooks/useTextLoader.ts` — calls `invoke("update_word_comment", { textId, segmentIndex, comment })` and refreshes text data
- [x] T010 [US1] Create `src/components/WordCommentDialog.tsx` — modal dialog following ManageTagsDialog pattern (overlay `fixed inset-0 z-50`, `bg-surface border border-content/20 rounded-xl`), textarea pre-filled with existing comment, character counter `{length}/5000`, Save/Delete/Cancel buttons, auto-focus textarea on open, Delete button visible only when editing existing comment
- [x] T011 [US1] Add "Comment" entry to `buildMenuEntries()` in `src/components/TextDisplay.tsx` — positioned between "Copy" and "Edit Pinyin", disabled when locked (with lock icon), disabled when segment is not a Word
- [x] T012 [US1] Add comment checks to split/merge disabled flags in `buildMenuEntries()` in `src/components/TextDisplay.tsx` — disable split entries if Word has comment, disable merge entries if either adjacent Word has comment
- [x] T013 [US1] Handle "comment" action in `src/components/TextDisplay.tsx` — when "comment" menu action is triggered, open WordCommentDialog with the selected Word and segment index
- [x] T014 [US1] Add comment dialog state and handlers in `src/App.tsx` — state for dialog open/close, selected Word/segmentIndex, onSave handler calling `updateComment`, onClose handler

**Checkpoint**: User Story 1 complete — users can add, edit comments via context menu + dialog, split/merge blocked on commented Words

---

## Phase 4: User Story 2 — View Comments in a Side Panel (Priority: P2)

**Goal**: A collapsible side panel on the right of the reading view lists all comments in document order. Each entry shows the Word's characters and comment text. Panel is open by default when comments exist, closed by default when none.

**Independent Test**: Open a Text that has comments in reading view. Verify the comments panel is visible, lists all comments in reading order, and each comment shows which Word it belongs to.

### Implementation for User Story 2

- [x] T015 [US2] Create `src/components/CommentsPanel.tsx` — fixed-width collapsible panel (280–320px), toggle button, iterates segments to find Words with comments, renders each as Word characters + comment text in document order, empty-state "No comments" message, clicking entry calls `onCommentClick(segmentIndex)` if not locked
- [x] T016 [US2] Add visual indicator (accent-colored dot) below commented Words in `src/components/RubyWord.tsx` — small dot rendered after the `<ruby>` element when `word.comment` exists, using the accent color from theme
- [x] T017 [US2] Adjust reading view layout in `src/App.tsx` for side panel — render CommentsPanel alongside the `max-w-5xl` text container, manage panel open/closed state (default: open if comments exist, closed if none), pass segments, locked state, onToggle, onCommentClick handlers

**Checkpoint**: User Stories 1 AND 2 complete — comments are created via dialog and displayed in side panel with visual indicators on Words

---

## Phase 5: User Story 3 — Delete a Comment (Priority: P3)

**Goal**: Users can delete an existing comment via the dialog (Delete button or clear text + Save). The visual indicator and panel entry are removed. Deletion is blocked on locked Texts.

**Independent Test**: Add a comment to a Word, then delete it via the dialog. Verify the comment no longer appears in the side panel and the Word is no longer marked as commented.

### Implementation for User Story 3

_(Deletion is already fully supported by the implementation in US1 — the `update_word_comment` backend command accepts `null` to delete, the dialog has a Delete button, and clearing text + Save passes `null`. No additional tasks are needed for this user story.)_

**Checkpoint**: All user stories complete — create, view, and delete comments all functional

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Validation, edge cases, and integration testing

- [x] T018 Run `npm test` and `npm run build` to validate no regressions
- [x] T019 Run quickstart.md integration scenarios manually — verify all 7 scenarios: add comment, edit comment, delete comment, locked text, split blocked, merge blocked, export/import round-trip

---

## Dependencies & Execution Order

### Phase Dependencies

- **Foundational (Phase 2)**: No dependencies — can start immediately. BLOCKS all user stories.
- **User Story 1 (Phase 3)**: Depends on Phase 2 completion.
- **User Story 2 (Phase 4)**: Depends on Phase 3 (needs comment data to exist and dialog to function for panel click-to-edit).
- **User Story 3 (Phase 5)**: No additional tasks — fully covered by US1 implementation.
- **Polish (Phase 6)**: Depends on Phases 3 and 4 being complete.

### Within Each Phase

- T001 and T002 can run in parallel (different languages, different files)
- T003 can run in parallel with T001/T002
- T004 → T005 → T006 are sequential (database function → command → registration)
- T007 and T008 can run after T004 (modify same file, run sequentially)
- T009 depends on T006 (needs backend command registered)
- T010 is independent (new file, can run in parallel with T004–T009)
- T011, T012, T013 depend on T003 and modify the same file (sequential)
- T014 depends on T010 and T013 (needs dialog component and TextDisplay handler)
- T015 is independent (new file, can start after Phase 2)
- T016 is independent (modifies RubyWord.tsx, can start after Phase 2)
- T017 depends on T015 (needs CommentsPanel component)

### Parallel Opportunities

```text
# Phase 2 — all three in parallel:
T001 (domain.rs) | T002 (domain.ts) | T003 (WordContextMenu.tsx)

# Phase 3 — backend and dialog in parallel:
T004→T005→T006→T007→T008 (Rust backend)  |  T010 (WordCommentDialog.tsx — new file)

# Phase 4 — panel and indicator in parallel:
T015 (CommentsPanel.tsx — new file)  |  T016 (RubyWord.tsx)
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 2: Foundational (domain type changes)
2. Complete Phase 3: User Story 1 (backend + dialog + context menu)
3. **STOP and VALIDATE**: Test comment creation, editing, and split/merge blocking
4. Deploy/demo if ready

### Incremental Delivery

1. Phase 2 → Domain types ready
2. Phase 3: US1 → Comment CRUD works via context menu + dialog (MVP!)
3. Phase 4: US2 → Side panel + visual indicators (full reading experience)
4. Phase 5: US3 → Already done (covered by US1 implementation)
5. Phase 6 → Polish, test, build

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- No new dependencies, no database schema changes, no migrations
- Comments stored inline in existing `segments TEXT` column as optional `comment` field on Word
- `skip_serializing_if = "Option::is_none"` ensures full backward compatibility
- Export/import works automatically — no changes needed to export/import system
- Total: 19 tasks (3 foundational + 11 US1 + 3 US2 + 0 US3 + 2 polish)
