# Tasks: Multi-Text Library

**Input**: Design documents from `/specs/024-multi-text-library/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup

**Purpose**: Add the `chrono` dependency and update domain types across both layers

- [x] T001 Add `chrono` crate dependency to `src-tauri/Cargo.toml`
- [x] T002 [P] Update Rust domain types: add `id: i64`, `title: String`, `created_at: String` to `Text` struct, add `TextPreview` struct with `id`, `title`, `created_at` in `src-tauri/src/domain.rs`
- [x] T003 [P] Update TypeScript domain types: add `id: number`, `title: string`, `createdAt: string` to `Text` interface, add `TextPreview` interface in `src/types/domain.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Rewrite Rust backend — new schema, new database operations, new IPC commands

**CRITICAL**: No user story work can begin until this phase is complete

- [x] T004 Rewrite `initialize_database` in `src-tauri/src/database.rs`: replace singleton schema (`CHECK (id = 1)`) with multi-row schema (`INTEGER PRIMARY KEY AUTOINCREMENT`, `title TEXT NOT NULL`, `created_at TEXT NOT NULL`, `raw_input TEXT NOT NULL`, `segments TEXT NOT NULL DEFAULT '[]'`)
- [x] T005 Implement `insert_text(conn, title, raw_input, segments) -> Result<Text>` in `src-tauri/src/database.rs`: insert row with `chrono::Local::now()` timestamp, return full `Text` with generated `id` and `created_at`
- [x] T006 Implement `list_all_texts(conn) -> Result<Vec<TextPreview>>` in `src-tauri/src/database.rs`: query `SELECT id, title, created_at FROM texts ORDER BY created_at DESC`
- [x] T007 Implement `load_text_by_id(conn, id) -> Result<Option<Text>>` in `src-tauri/src/database.rs`: query full row by id, deserialize segments JSON
- [x] T008 Implement `update_segments(conn, id, segments) -> Result<()>` in `src-tauri/src/database.rs`: load segments, patch pinyin at given index, write back updated JSON
- [x] T009 Implement `delete_text(conn, id) -> Result<()>` in `src-tauri/src/database.rs`: delete row by id
- [x] T010 Rewrite `src-tauri/src/commands.rs`: replace `save_text`, `load_text`, `process_text` with 5 new commands — `create_text(title, raw_input)` (process + insert atomically), `list_texts()`, `load_text(text_id)`, `update_pinyin(text_id, segment_index, new_pinyin)`, `delete_text(text_id)` — per contracts/tauri-ipc.md
- [x] T011 Update command registration in `src-tauri/src/lib.rs`: replace old `generate_handler!` with `create_text`, `list_texts`, `load_text`, `update_pinyin`, `delete_text`

**Checkpoint**: Rust backend compiles with new IPC surface. All 5 commands registered.

---

## Phase 3: User Story 1 — Browse the Library at Launch (Priority: P1) MVP

**Goal**: Library screen is the entry point showing all texts (title + date) or an empty state with add button

**Independent Test**: Launch the app → library screen appears with text previews or empty state with visible add button

### Implementation for User Story 1

- [x] T012 [US1] Rewrite `useTextLoader` hook in `src/hooks/useTextLoader.ts`: replace single `Text | null` with `previews: TextPreview[]` + `activeText: Text | null`, replace `AppView = "empty" | "input" | "processing" | "reading"` with `"library" | "input" | "processing" | "reading"`, call `list_texts()` on mount to load previews, initial view is always `"library"`
- [x] T013 [US1] Create `TextPreviewCard` component in `src/components/TextPreviewCard.tsx`: display title and formatted creation date, clickable to open text (onClick prop), apply content-first styling (minimal chrome, consistent spacing)
- [x] T014 [US1] Create `LibraryScreen` component in `src/components/LibraryScreen.tsx`: render list of `TextPreviewCard` items from `previews` prop, show empty state message when no texts exist, include fixed-position add button (always visible regardless of scroll), add button triggers `onAddText` callback
- [x] T015 [US1] Update `src/App.tsx`: add `"library"` view case rendering `LibraryScreen`, remove `"empty"` view case and `EmptyState` import, wire `LibraryScreen` props (`previews`, `onAddText`, `onOpenText`) from `useTextLoader`

**Checkpoint**: App launches to library screen. Empty state shows add button. (No texts can be added yet — that's US2.)

---

## Phase 4: User Story 2 — Add a New Text (Priority: P1)

**Goal**: User can add a text with title + Chinese content from library, text is processed and saved atomically

**Independent Test**: Click add button → enter title + content → confirm → text appears in library with title and date

### Implementation for User Story 2

- [x] T016 [US2] Modify `TextInputView` in `src/components/TextInputView.tsx`: add a title input field above the textarea, update `onSubmit` signature to pass both `title` and `rawInput`, validate that title is non-empty and content contains at least one Chinese character before enabling submit
- [x] T017 [US2] Add `createText(title, rawInput)` operation to `useTextLoader` in `src/hooks/useTextLoader.ts`: call `invoke("create_text", { title, rawInput })`, on success add returned `TextPreview` to `previews` list, set `activeText` to returned `Text`, transition to `"reading"` view
- [x] T018 [US2] Add processing state management to `useTextLoader` in `src/hooks/useTextLoader.ts`: set `isProcessing = true` during `createText`, transition through `"processing"` view while IPC is in flight, handle errors with `processingError` state
- [x] T019 [US2] Update `src/App.tsx`: wire `"input"` view to pass title+content submit to `createText`, wire `"processing"` view to show `ProcessingState` during text creation, handle cancel (return to library)

**Checkpoint**: Full add-text flow works: library → input (title + content) → processing → reading. New text visible in library.

---

## Phase 5: User Story 3 — Read an Existing Text (Priority: P1)

**Goal**: User can open a text from library and read it with title header and pinyin annotations, with back button to return

**Independent Test**: Click text preview in library → reading screen shows title header + annotated text → click back → return to library

### Implementation for User Story 3

- [x] T020 [US3] Add `openText(id)` operation to `useTextLoader` in `src/hooks/useTextLoader.ts`: call `invoke("load_text", { textId: id })`, set `activeText` to result, transition to `"reading"` view
- [x] T021 [US3] Modify `TitleBar` in `src/components/TitleBar.tsx`: remove `onEdit`, `showEdit` props and the Edit button, add `onBack` callback prop and a back-arrow button (visible when `showBack` is true), keep all other controls (pinyin toggle, zoom, palette, theme, fullscreen, close)
- [x] T022 [US3] Update reading view in `src/App.tsx`: display the text's `title` as a header above `TextDisplay`, pass `onBack` to `TitleBar` that calls `setView("library")` and refreshes previews via `list_texts()`, wire `onOpenText(id)` from `LibraryScreen` to `openText(id)` in `useTextLoader`

**Checkpoint**: Full navigation works: library → click preview → reading (with title header) → back → library. No data loss.

---

## Phase 6: User Story 4 — Correct Pinyin Annotations (Priority: P2)

**Goal**: Pinyin corrections work per-text via targeted `update_pinyin` command, corrections persist across sessions

**Independent Test**: Open text → correct a pinyin → navigate away → reopen text → correction is still there

### Implementation for User Story 4

- [x] T023 [US4] Rewrite `updatePinyin` in `useTextLoader` in `src/hooks/useTextLoader.ts`: call `invoke("update_pinyin", { textId: activeText.id, segmentIndex, newPinyin })` instead of re-saving entire text, patch local `activeText.segments` in memory for immediate UI update
- [x] T024 [US4] Verify `TextDisplay` pinyin editing still works in `src/components/TextDisplay.tsx`: ensure `onPinyinEdit(segmentIndex, newPinyin)` callback is wired through `App.tsx` to the new `updatePinyin` in `useTextLoader`, confirm edit/regenerate button is absent (FR-014)

**Checkpoint**: Pinyin corrections persist per-text. No edit/regenerate button visible anywhere.

---

## Phase 7: User Story 5 — Delete a Text (Priority: P2)

**Goal**: User can delete a text via right-click context menu on its library preview, with confirmation

**Independent Test**: Right-click text preview → select delete → confirm → text disappears from library permanently

### Implementation for User Story 5

- [x] T025 [US5] Add right-click context menu to `TextPreviewCard` in `src/components/TextPreviewCard.tsx`: handle `onContextMenu` event, render a positioned context menu with "Delete" option (reuse pattern from `WordContextMenu`), include click-outside dismissal
- [x] T026 [US5] Implement deletion confirmation dialog in `src/components/LibraryScreen.tsx`: when delete is triggered, show a confirmation prompt before proceeding, on confirm call `onDeleteText(id)` callback
- [x] T027 [US5] Add `deleteText(id)` operation to `useTextLoader` in `src/hooks/useTextLoader.ts`: call `invoke("delete_text", { textId: id })`, on success remove the text from `previews` list
- [x] T028 [US5] Wire deletion in `src/App.tsx`: pass `onDeleteText` from `useTextLoader` through to `LibraryScreen`

**Checkpoint**: Full delete flow works: right-click → context menu → "Delete" → confirm → text removed from library.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Cleanup and final verification

- [x] T029 Remove `EmptyState` component: delete `src/components/EmptyState.tsx`, remove all imports and references across codebase
- [x] T030 Verify dark mode and all 6 color palettes render correctly on both library and reading screens
- [x] T031 Verify all existing keyboard shortcuts still work (zoom, pinyin toggle, fullscreen, word navigation)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — start immediately
- **Phase 2 (Foundational)**: Depends on Phase 1 (domain types must exist for database and commands)
- **Phase 3 (US1 — Library)**: Depends on Phase 2 (needs `list_texts` command)
- **Phase 4 (US2 — Add Text)**: Depends on Phase 3 (needs library screen to navigate from)
- **Phase 5 (US3 — Read Text)**: Depends on Phase 4 (needs texts to exist in library to open)
- **Phase 6 (US4 — Pinyin Correction)**: Depends on Phase 5 (needs reading screen functional)
- **Phase 7 (US5 — Delete)**: Depends on Phase 3 (needs library screen with text cards)
- **Phase 8 (Polish)**: Depends on all user story phases

### User Story Dependencies

- **US1 (Library)**: Foundational only — MVP entry point
- **US2 (Add Text)**: US1 (needs library to launch input from)
- **US3 (Read Text)**: US2 (needs texts to exist to open them)
- **US4 (Pinyin)**: US3 (needs reading screen)
- **US5 (Delete)**: US1 (needs library with text cards; can run in parallel with US3/US4 after US2)

### Within Each User Story

- Hook changes before component changes
- Component creation before App.tsx wiring
- All tasks within a story are sequential (shared files)

### Parallel Opportunities

- T002 and T003 can run in parallel (Rust domain.rs vs TypeScript domain.ts)
- T013 and T014 can run in parallel within US1 (different component files), but T012 must complete first
- US5 (Delete) can start in parallel with US3/US4 after US2 completes (only needs library, not reading screen)

---

## Implementation Strategy

### MVP First (User Stories 1 + 2)

1. Complete Phase 1: Setup (T001–T003)
2. Complete Phase 2: Foundational (T004–T011)
3. Complete Phase 3: US1 — Library (T012–T015)
4. Complete Phase 4: US2 — Add Text (T016–T019)
5. **STOP and VALIDATE**: App launches to library, user can add texts, new texts appear in library

### Incremental Delivery

1. Setup + Foundational → Backend ready
2. US1 (Library) → App has entry point with empty state
3. US2 (Add Text) → Users can create texts (functional MVP)
4. US3 (Read Text) → Users can open and read texts with navigation
5. US4 (Pinyin) → Full annotation correction workflow
6. US5 (Delete) → Text management complete
7. Polish → Production-ready

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story is independently testable at its checkpoint
- Commit after each completed phase
- The Rust backend (Phase 2) is the largest single phase — all 5 IPC commands and 5 database operations
- `processing.rs` requires zero changes (stateless pipeline)
- `EmptyState.tsx` removal deferred to Polish to avoid breaking anything during US1 development
