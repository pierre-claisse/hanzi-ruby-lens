# Tasks: Text Lock

**Input**: Design documents from `/specs/031-text-lock/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, quickstart.md

**Tests**: Included — Constitution V (Test-First Imperative) requires test coverage.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Schema migration and domain type extensions shared by US1 and US2.

- [X] T001 Add `locked INTEGER NOT NULL DEFAULT 0` column to the `texts` table via `ALTER TABLE` in the `initialize()` function of `src-tauri/src/database.rs`. Use the same idempotent migration pattern as `modified_at` (try ALTER, ignore "duplicate column" error).
- [X] T002 [P] Add `pub locked: bool` field to `Text` and `TextPreviewWithTags` structs in `src-tauri/src/domain.rs`. Both structs already have `#[serde(rename_all = "camelCase")]`.
- [X] T003 [P] Add `locked: boolean` field to `Text` and `TextPreview` interfaces in `src/types/domain.ts`.
- [X] T004 Update `list_all_texts()` in `src-tauri/src/database.rs` to SELECT the `locked` column and populate the new field in `TextPreviewWithTags`. Update `load_text_by_id()` similarly for the `Text` struct. Update `insert_text()` to set `locked: false` in the returned `Text`.

**Checkpoint**: Schema migrated, domain types extended. Existing behavior preserved (`locked` defaults to false for all texts).

---

## Phase 2: User Story 1 — Lock/Unlock Toggle on Library Cards (Priority: P1) 🎯 MVP

**Goal**: Each library card has a discreet lock toggle button near the Info icon. Clicking it toggles the lock state, which is persisted in the database.

**Independent Test**: Click the lock toggle on a card → icon changes to locked padlock. Restart the app → the text is still locked. Click again → unlocked. Restart → unlocked.

### Tests for User Story 1

- [X] T005 [P] [US1] Write unit tests for the `toggle_lock` Tauri command contract in `tests/contract/text-commands.test.ts` — mock Tauri invoke for `toggle_lock` with a text_id, verify it returns a boolean.
- [X] T006 [P] [US1] Write unit tests for the lock toggle UI in `tests/unit/textLock.test.ts` — test that TextPreviewCard renders a lock toggle button, that clicking it calls the toggle handler, and that the icon reflects the locked state (Lock vs Unlock icon).

### Implementation for User Story 1

- [X] T007 [US1] Add `toggle_lock_db()` function in `src-tauri/src/database.rs` — execute `UPDATE texts SET locked = NOT locked WHERE id = ?1` and return the new locked state by querying `SELECT locked FROM texts WHERE id = ?1`. Handle "not found" error.
- [X] T008 [US1] Add `toggle_lock` Tauri command in `src-tauri/src/commands.rs` — accept `text_id: i64`, call `toggle_lock_db()`, return `Result<bool, AppError>`.
- [X] T009 [US1] Register the `toggle_lock` command in `src-tauri/src/lib.rs` — add it to the existing `invoke_handler` list.
- [X] T010 [US1] Modify `src/components/TextPreviewCard.tsx` — add a lock toggle button in the card header row (between the title and the Info icon). Use `Lock` icon (locked) / `Unlock` icon (unlocked) from lucide-react. Use the same `w-4 h-4 text-content/30 hover:text-content/60 transition-colors` styling as the Info icon. The button must call `onToggleLock` prop and stop event propagation. Add `onToggleLock` to the component props interface.
- [X] T011 [US1] Wire the lock toggle in `src/components/LibraryScreen.tsx` — add a `handleToggleLock(textId)` function that invokes `toggle_lock` via Tauri, then refreshes the text list. Pass `onToggleLock` prop to each `TextPreviewCard`.
- [X] T012 [US1] Update existing tests that reference `TextPreview` or `Text` mock data to include `locked: false` — files: `src/App.test.tsx`, `src/hooks/useTextLoader.test.ts`, `tests/hooks/useTextLoader.test.ts`, `tests/contract/text-commands.test.ts`, `tests/contract/process-text-command.test.ts`, `tests/integration/text-persistence.test.tsx`, `tests/integration/text-input-flow.test.tsx`, `tests/integration/pinyin-toggle.test.tsx`, `tests/integration/text-keyboard-nav.test.tsx`, `src/components/TextDisplay.test.tsx`.
- [X] T013 [US1] Run `npm test` in Docker to verify all US1 tests pass.

**Checkpoint**: Cards show lock toggle near Info icon. Clicking it toggles lock state (persisted). All existing tests pass.

---

## Phase 3: User Story 2 — Correction Enforcement in Reading Mode (Priority: P2)

**Goal**: When a locked text is open in reading mode, context menu correction entries (Edit Pinyin, Split, Merge) appear greyed out with padlock icons and are non-clickable.

**Independent Test**: Lock a text → open in reading mode → right-click a word → correction entries greyed out with padlock icons. Unlock → reopen → corrections work normally.

### Tests for User Story 2

- [X] T014 [P] [US2] Write unit tests for context menu disabled state in `tests/unit/textLock.test.ts` (append to existing file) — test that `buildMenuEntries` marks correction entries as disabled when `locked=true`, and that disabled entries have the `Lock` icon. Test that non-correction entries (dictionary, translate, copy) remain enabled.

### Implementation for User Story 2

- [X] T015 [US2] Extend the `MenuEntry` interface in `src/components/WordContextMenu.tsx` — add optional `disabled?: boolean` field. Update the menu item rendering: when `disabled` is true, apply `opacity-40 cursor-not-allowed` classes, replace the icon with `Lock` from lucide-react, and prevent the `onAction` callback from firing.
- [X] T016 [US2] Update `buildMenuEntries()` in `src/components/TextDisplay.tsx` — add a `locked: boolean` parameter. When `locked` is true, mark "Edit Pinyin", all "Split after X", "Merge with previous word", and "Merge with next word" entries with `disabled: true`. Non-correction entries (MOE Dictionary, Google Translate, Copy) remain unaffected.
- [X] T017 [US2] Thread the `locked` state through `TextDisplay.tsx` — the component receives `text.locked` from props (already available via the loaded `Text` object). Pass `locked` to `buildMenuEntries()` in the existing call site. Also skip the action handler for disabled entries in `handleMenuAction`.
- [X] T018 [US2] Run `npm test` in Docker to verify all US2 tests pass.

**Checkpoint**: Correction entries greyed out with padlock icons on locked texts. Non-correction actions remain functional. All tests pass.

---

## Phase 4: Polish & Cross-Cutting Concerns

**Purpose**: Final validation across all stories.

- [X] T019 Run full test suite with `npm test` in Docker — all existing and new tests must pass.
- [X] T020 Run `npm run build` in Docker — verify build succeeds with no errors or warnings.
- [X] T021 Manual verification: lock a text from library (icon changes), reopen app (lock persists), open locked text in reading mode (correction entries greyed out with padlock), unlock and verify corrections work.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **US1 (Phase 2)**: Depends on Phase 1 (types must be extended first)
- **US2 (Phase 3)**: Depends on Phase 1 (needs `locked` column) and US1 (needs `toggle_lock` command to lock texts for testing)
- **Polish (Phase 4)**: Depends on all previous phases

### Parallel Opportunities

- **T002 + T003**: Domain type changes in separate languages (Rust vs TypeScript)
- **T005 + T006**: Test files are independent (contract vs unit)
- **T014**: Can be written in parallel with US1 implementation (test file is independent)

---

## Parallel Example

```bash
# Phase 1 — domain types in parallel:
Task: "T002 — Add locked to Rust structs in domain.rs"
Task: "T003 — Add locked to TypeScript interfaces in domain.ts"

# US1 tests in parallel:
Task: "T005 — Contract test for toggle_lock command"
Task: "T006 — Unit test for lock toggle UI"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Schema + types
2. Complete Phase 2: US1 — Lock toggle on cards
3. **STOP and VALIDATE**: Cards show lock toggle, state persists
4. Ready for demo

### Incremental Delivery

1. Phase 1 → Schema migration + type extensions
2. Phase 2 (US1) → Lock toggle on library cards → Test → Validate (MVP!)
3. Phase 3 (US2) → Context menu enforcement → Test → Validate
4. Phase 4 → Full validation pass

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Commit after each phase
- `locked` column uses `INTEGER NOT NULL DEFAULT 0` — SQLite standard boolean
- Toggling lock does NOT update `modified_at` — lock is metadata, not a content correction
- Lock is UI-only (advisory) — no backend enforcement on correction commands
- The `Lock` and `Unlock` icons from lucide-react are already available (library is a project dependency)
