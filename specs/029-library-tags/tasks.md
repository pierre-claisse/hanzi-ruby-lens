# Tasks: Library Tags

**Input**: Design documents from `/specs/029-library-tags/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, quickstart.md

**Tests**: Included — Constitution V (Test-First Imperative) requires test coverage.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Database schema, domain types, tag color palette, and shared Tauri commands needed by all stories.

- [x] T001 Add `PRAGMA foreign_keys = ON` and create `tags` and `text_tags` tables (with CASCADE deletes, COLLATE NOCASE on label) in the `initialize()` function of `src-tauri/src/database.rs`
- [x] T002 [P] Add `Tag` and `TextPreviewWithTags` structs (with `#[serde(rename_all = "camelCase")]`) to `src-tauri/src/domain.rs`
- [x] T003 [P] Add `Tag` interface and extend `TextPreview` with `tags: Tag[]` field in `src/types/domain.ts`
- [x] T004 [P] Create predefined tag color palette (10 colors with key, label, bg, text) in `src/data/tagColors.ts`
- [x] T005 Implement `list_tags` database query (SELECT all tags ordered by label) and `list_all_tags` Tauri command in `src-tauri/src/database.rs` and `src-tauri/src/commands.rs`
- [x] T006 Update `list_all_texts` in `src-tauri/src/database.rs` to accept `tag_ids: Vec<i64>` and `sort_asc: bool` parameters. When `tag_ids` is empty, return all texts; when non-empty, filter via JOIN on `text_tags`. Include each text's assigned tags in the result as `Vec<TagSummary>`. Update the `list_texts` Tauri command in `src-tauri/src/commands.rs` accordingly.
- [x] T007 Register all new Tauri commands in `src-tauri/src/lib.rs` `generate_handler![]` macro

**Checkpoint**: Database schema ready, domain types defined, list commands working with tag data. Existing behavior preserved (empty tag_ids + sort_asc=false = current behavior).

---

## Phase 2: User Story 1 — Tag CRUD in the Library (Priority: P1) 🎯 MVP

**Goal**: Users can create, rename, recolor, and delete Tags via a modal dialog opened from the title bar.

**Independent Test**: Open library → click "Manage Tags" → create/edit/delete Tags → verify persistence across app restart.

### Tests for User Story 1

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [x] T008 [P] [US1] Write unit tests for tag CRUD database functions (create, update, delete, list, duplicate label rejection, empty label rejection) in `tests/unit/tagCrud.test.ts` — mock Tauri invoke to test the expected command signatures and return types
- [x] T009 [P] [US1] Write unit tests for tag color palette in `tests/unit/tagColors.test.ts` — validate all 10 colors have unique keys, non-empty bg/text values, and the palette is immutable

### Implementation for User Story 1

- [x] T010 [P] [US1] Implement `create_tag(label, color)` database function in `src-tauri/src/database.rs` — validate non-empty label, validate color key exists (optional: leave to frontend), INSERT with UNIQUE constraint handling (return `AppError::Validation` on duplicate). Add corresponding `create_tag` Tauri command in `src-tauri/src/commands.rs`.
- [x] T011 [P] [US1] Implement `update_tag(tag_id, label, color)` database function in `src-tauri/src/database.rs` — validate non-empty label, UPDATE with UNIQUE constraint handling. Add corresponding `update_tag` Tauri command in `src-tauri/src/commands.rs`.
- [x] T012 [P] [US1] Implement `delete_tag(tag_id)` database function in `src-tauri/src/database.rs` — DELETE (CASCADE handles junction cleanup). Add corresponding `delete_tag` Tauri command in `src-tauri/src/commands.rs`.
- [x] T013 [US1] Create `ManageTagsDialog` component in `src/components/ManageTagsDialog.tsx` — modal overlay listing all Tags with: inline label editing, color picker (grid of 10 predefined colors from `tagColors.ts`), delete button per Tag, "New tag" creation row at bottom, Close button. Uses `invoke("list_tags")`, `invoke("create_tag")`, `invoke("update_tag")`, `invoke("delete_tag")`.
- [x] T014 [US1] Add "Manage Tags" button (Tag/Tags icon from lucide-react) to the left section of the title bar in `src/components/TitleBar.tsx`, visible only when `showAddButton` is true (library view). Wire it to open `ManageTagsDialog`.
- [x] T015 [US1] Add tag state management to `src/hooks/useTextLoader.ts` — add `tags: Tag[]` state, `refreshTags()` function calling `invoke("list_tags")`, expose tags and refresh in the returned object. Call `refreshTags()` on initial load.
- [x] T016 [US1] Run `npm test` in Docker to verify all US1 tests pass

**Checkpoint**: Tag CRUD works end-to-end via the Manage Tags dialog. Tags persist across restarts.

---

## Phase 3: User Story 2 — Assigning and Removing Tags on Texts (Priority: P2)

**Goal**: Users can assign/remove Tags on Texts via right-click context menu. Tag chips visible on library cards.

**Independent Test**: Create Tags (US1) → right-click a Text card → check/uncheck Tags in submenu → verify chips appear/disappear on the card.

### Tests for User Story 2

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [x] T017 [P] [US2] Write unit tests for tag assignment database functions (assign_tag, remove_tag, idempotent assign, bulk assign/remove) in `tests/unit/tagAssignment.test.ts` — mock Tauri invoke to test command signatures

### Implementation for User Story 2

- [x] T018 [P] [US2] Implement `assign_tag(text_ids, tag_id)` database function in `src-tauri/src/database.rs` — INSERT OR IGNORE into `text_tags` for each text_id (idempotent). Add corresponding `assign_tag` Tauri command in `src-tauri/src/commands.rs`.
- [x] T019 [P] [US2] Implement `remove_tag(text_ids, tag_id)` database function in `src-tauri/src/database.rs` — DELETE from `text_tags` for each text_id. Add corresponding `remove_tag` Tauri command in `src-tauri/src/commands.rs`.
- [x] T020 [US2] Display tag chips on `TextPreviewCard` in `src/components/TextPreviewCard.tsx` — render `preview.tags` as small colored badges (label text on colored background from `tagColors.ts`). Handle overflow gracefully (e.g., truncate with "+N" if more than 3 Tags).
- [x] T021 [US2] Extend right-click context menu in `src/components/LibraryScreen.tsx` — add "Tags ▸" entry that opens a submenu listing all Tags with checkboxes. Checked state reflects which Tags are currently assigned to the right-clicked card. Checking/unchecking calls `invoke("assign_tag")` or `invoke("remove_tag")` and refreshes previews.
- [x] T022 [US2] Add multi-selection state to `src/components/LibraryScreen.tsx` — Ctrl+Click toggles card selection, selected cards show visual highlight (ring/border). Right-clicking a selected card applies the Tags submenu to all selected cards (bulk operation). Clicking without Ctrl clears selection.
- [x] T023 [US2] Run `npm test` in Docker to verify all US2 tests pass

**Checkpoint**: Tags can be assigned/removed via context menu (single and bulk). Cards display tag chips.

---

## Phase 4: User Story 3 — Filtering Texts by Tag (Priority: P3)

**Goal**: Users can filter the library grid by selecting Tags in a multiselect dropdown in the title bar.

**Independent Test**: Assign Tags to several Texts → select Tag(s) in filter dropdown → verify only matching Texts appear → clear filter → all Texts reappear.

### Implementation for User Story 3

- [x] T024 [US3] Create `TagFilterDropdown` component in `src/components/TagFilterDropdown.tsx` — multiselect dropdown showing all Tags as colored chips. Supports selecting multiple Tags (OR logic). Shows "Filter by tag..." placeholder when nothing selected. Includes a "Clear" action to deselect all.
- [x] T025 [US3] Add filter state to `src/hooks/useTextLoader.ts` — add `filterTagIds: number[]` state and `setFilterTagIds` setter. Pass `filterTagIds` to `invoke("list_texts", { tagIds, sortAsc })` in `refreshPreviews()`. Refresh previews when filter changes.
- [x] T026 [US3] Add `TagFilterDropdown` to the center of the title bar in `src/components/TitleBar.tsx` (same position as `textTitle` in reading view), visible only in library view. Wire it to `filterTagIds` state and `tags` list from `useTextLoader`.
- [x] T027 [US3] Update empty state in `src/components/LibraryScreen.tsx` — when filter is active and matches no Texts, show "No texts match the selected tags." message instead of the default empty state.
- [x] T028 [US3] Handle edge case: when a Tag is deleted (via ManageTagsDialog) while it is active in the filter, remove it from the active `filterTagIds` set and refresh. Wire this cleanup in the ManageTagsDialog close/delete callbacks.
- [x] T029 [US3] Run `npm test` in Docker to verify all US3 tests pass

**Checkpoint**: Tag filtering works end-to-end. Deleting a filtered Tag refreshes correctly.

---

## Phase 5: User Story 4 — Sorting Texts by Creation Date (Priority: P4)

**Goal**: Users can toggle sort order (ascending/descending by creation date) via a button in the title bar.

**Independent Test**: Add several Texts → click sort toggle → verify order flips → verify it combines with active tag filter.

### Implementation for User Story 4

- [x] T030 [US4] Add sort state to `src/hooks/useTextLoader.ts` — add `sortAsc: boolean` state (default `false` for descending). Pass to `invoke("list_texts", { tagIds, sortAsc })` in `refreshPreviews()`. Refresh previews when sort changes.
- [x] T031 [US4] Add sort toggle button to the title bar in `src/components/TitleBar.tsx` — a small icon button (ArrowUp when ascending, ArrowDown when descending from lucide-react) placed near the filter dropdown, visible only in library view. Clicking toggles `sortAsc`.
- [x] T032 [US4] Run `npm test` in Docker to verify all US4 tests pass

**Checkpoint**: Sort toggle works. Combines correctly with tag filtering.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final validation across all stories.

- [x] T033 Run full test suite with `npm test` in Docker — all existing and new tests must pass
- [x] T034 Run `npm run build` in Docker — verify build succeeds with no errors
- [ ] T035 Manual verification: create Tags, assign to Texts, filter, sort, delete Tags, verify all operations persist across app restart and combine correctly

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **US1 (Phase 2)**: Depends on Phase 1 (schema + types + list commands)
- **US2 (Phase 3)**: Depends on Phase 2 (Tags must exist to assign them)
- **US3 (Phase 4)**: Depends on Phase 2 (needs tags) and benefits from Phase 3 (needs assigned tags to filter meaningfully)
- **US4 (Phase 5)**: Depends on Phase 1 only (sort is independent of tags) — can run in parallel with US1–US3
- **Polish (Phase 6)**: Depends on all previous phases

### Parallel Opportunities

- **T002 + T003 + T004**: All create new files, no dependencies on each other
- **T008 + T009**: Test files can be written in parallel
- **T010 + T011 + T012**: Tag CRUD operations are independent (different functions in same file, but non-conflicting)
- **T018 + T019**: Assign and remove are independent functions
- **US4 (T030–T032)** can run in parallel with **US2** or **US3** since sort is tag-independent

---

## Parallel Example

```bash
# After Phase 1, launch US1 tests in parallel:
Task: "T008 — Write tag CRUD unit tests in tests/unit/tagCrud.test.ts"
Task: "T009 — Write tag color palette tests in tests/unit/tagColors.test.ts"

# US1 CRUD implementations in parallel:
Task: "T010 — Implement create_tag in database.rs + commands.rs"
Task: "T011 — Implement update_tag in database.rs + commands.rs"
Task: "T012 — Implement delete_tag in database.rs + commands.rs"

# US4 can run in parallel with US2/US3:
Task: "T030 — Add sort state to useTextLoader.ts"
Task: "T031 — Add sort toggle button to TitleBar.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Schema + types + list commands
2. Complete Phase 2: Tag CRUD + Manage Tags dialog
3. **STOP and VALIDATE**: Create/edit/delete Tags, verify persistence
4. Ready for demo

### Incremental Delivery

1. Phase 1 → Foundation with no behavior change
2. Phase 2 (US1) → Tag CRUD → Test → Validate (MVP!)
3. Phase 3 (US2) → Tag assignment + card chips → Test → Validate
4. Phase 4 (US3) → Tag filtering → Test → Validate
5. Phase 5 (US4) → Sort toggle → Test → Validate
6. Phase 6 → Full validation pass

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Commit after each phase
- `list_texts` command is extended (not replaced) — empty `tag_ids` + `sort_asc=false` preserves current behavior
- `PRAGMA foreign_keys = ON` must be set per connection (in `initialize()`)
- Tag color is stored as a key string (e.g., `"red"`), resolved to hex on the frontend via `tagColors.ts`
