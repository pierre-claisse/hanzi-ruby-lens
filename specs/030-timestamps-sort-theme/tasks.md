# Tasks: Timestamps, Sort Persistence & System Theme

**Input**: Design documents from `/specs/030-timestamps-sort-theme/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, quickstart.md

**Tests**: Included — Constitution V (Test-First Imperative) requires test coverage.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3, US4)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Schema migration and domain type extensions shared by US1 and US2.

- [X] T001 Add `modified_at TEXT` column to the `texts` table via `ALTER TABLE` in the `initialize()` function of `src-tauri/src/database.rs`. Use a safe migration pattern (e.g., try ALTER, ignore "duplicate column" error) so it is idempotent.
- [X] T002 [P] Add `modified_at: Option<String>` field to `TextPreviewWithTags` and `Text` structs (with `#[serde(rename_all = "camelCase")]`) in `src-tauri/src/domain.rs`
- [X] T003 [P] Add `modifiedAt: string | null` field to `TextPreview` and `Text` interfaces in `src/types/domain.ts`
- [X] T004 Update `list_all_texts()` in `src-tauri/src/database.rs` to SELECT the `modified_at` column and populate the new field in `TextPreviewWithTags`. Update `load_text()` similarly for the `Text` struct.

**Checkpoint**: Schema migrated, domain types extended. Existing behavior preserved (`modified_at` is NULL for all existing texts).

---

## Phase 2: User Story 1 — Full Timestamps via Details Tooltip (Priority: P1) 🎯 MVP

**Goal**: Preview cards show only title + tags. An Info icon reveals a tooltip on hover with the creation date in YYYY-MM-DD HH:mm format.

**Independent Test**: Hover over the Info icon on a card → tooltip shows creation date with hours and minutes. No date visible on the card surface.

### Tests for User Story 1

- [X] T005 [P] [US1] Write unit tests for the `formatDateTime` helper function in `tests/unit/formatDateTime.test.ts` — test ISO-to-"YYYY-MM-DD HH:mm" conversion, legacy date-only strings, and edge cases (midnight, invalid input).

### Implementation for User Story 1

- [X] T006 [US1] Create a `formatDateTime(iso: string): string` helper (can be inline in `TextPreviewCard.tsx` or a shared util) that converts an ISO string to `"YYYY-MM-DD HH:mm"` format. Handle legacy date-only strings gracefully (e.g., append `00:00`).
- [X] T007 [US1] Modify `src/components/TextPreviewCard.tsx`: remove the existing `<p>{formatDate(preview.createdAt)}</p>` date line from the card surface. Add an Info icon (from lucide-react) with a CSS tooltip (using Tailwind `group`/`group-hover`) that displays `"Created: YYYY-MM-DD HH:mm"` on hover. The card surface shows only the title and tags.
- [X] T008 [US1] Update existing tests that reference TextPreview mock data to include `modifiedAt: null` — files: `src/App.test.tsx`, `src/hooks/useTextLoader.test.ts`, `tests/hooks/useTextLoader.test.ts`, `tests/contract/text-commands.test.ts`, `tests/integration/text-persistence.test.tsx`, `tests/integration/text-input-flow.test.tsx`, `tests/integration/pinyin-toggle.test.tsx`, `tests/integration/text-keyboard-nav.test.tsx`.
- [X] T009 [US1] Run `npm test` in Docker to verify all US1 tests pass

**Checkpoint**: Cards show title + tags only. Info icon hover shows creation date with time. All existing tests pass.

---

## Phase 3: User Story 2 — Last Modified Date (Priority: P2)

**Goal**: The details tooltip also shows a "Modified" date (when applicable). Correction commands (pinyin update, split, merge) update `modified_at` in the database.

**Independent Test**: Correct a word's pinyin → return to library → hover Info icon → tooltip shows both "Created" and "Modified" dates. For uncorrected texts, only "Created" is shown.

### Tests for User Story 2

- [X] T010 [P] [US2] Write unit tests for the `modified_at` update behavior in `tests/unit/modifiedAt.test.ts` — mock Tauri invoke for `update_pinyin`, `split_segment`, `merge_segments` and verify the backend is called; verify the frontend reloads and updates `modifiedAt`.

### Implementation for User Story 2

- [X] T011 [US2] Update `update_segments()` in `src-tauri/src/database.rs` to SET `modified_at` to the current timestamp (`Local::now().format("%Y-%m-%dT%H:%M:%S")`) after updating segments.
- [X] T012 [P] [US2] Update `split_segment_db()` in `src-tauri/src/database.rs` to SET `modified_at` to the current timestamp after splitting.
- [X] T013 [P] [US2] Update `merge_segments_db()` in `src-tauri/src/database.rs` to SET `modified_at` to the current timestamp after merging.
- [X] T014 [US2] Update the tooltip in `src/components/TextPreviewCard.tsx` to conditionally show a second line `"Modified: YYYY-MM-DD HH:mm"` when `preview.modifiedAt` is not null.
- [X] T015 [US2] Run `npm test` in Docker to verify all US2 tests pass

**Checkpoint**: Correction operations update `modified_at`. Tooltip shows "Modified" date only for corrected texts.

---

## Phase 4: User Story 3 — Persist Sort Order Preference (Priority: P3)

**Goal**: The sort order toggle (ascending/descending) is persisted in localStorage so it survives app restarts.

**Independent Test**: Toggle sort to ascending → close app → reopen → library is sorted ascending.

### Implementation for User Story 3

- [X] T016 [US3] Modify `src/hooks/useTextLoader.ts` — change `useState(false)` for `sortAsc` to read from `localStorage.getItem("sortAsc")` in a lazy initializer (following the `useColorPalette` pattern). Add a `useEffect` that writes `sortAsc` to localStorage whenever it changes. Default to `false` (descending) when no stored value exists.
- [X] T017 [US3] Run `npm test` in Docker to verify all US3 tests pass

**Checkpoint**: Sort order persists across restarts. Default is descending.

---

## Phase 5: User Story 4 — System Theme Sync (Priority: P4)

**Goal**: Theme follows OS at startup and reacts live to OS theme changes. Manual toggle still works but OS changes override it. Theme is no longer persisted in localStorage.

**Independent Test**: Set OS to light → app opens light. Change OS to dark while app is running → app switches to dark immediately. Close and reopen → follows OS.

### Tests for User Story 4

- [X] T018 [P] [US4] Write unit tests for the updated `useTheme` hook in `src/hooks/useTheme.test.ts` — mock `window.matchMedia` to test: initial theme from OS, live change detection, manual toggle, OS override of manual toggle. Verify `localStorage.getItem("theme")` is never read.

### Implementation for User Story 4

- [X] T019 [US4] Rewrite `src/hooks/useTheme.ts` — remove all `localStorage.getItem("theme")` and `localStorage.setItem("theme")` calls. Initialize theme from `window.matchMedia("(prefers-color-scheme: dark)").matches`. Add a `useEffect` with `matchMedia.addEventListener("change", callback)` that re-syncs theme on OS change (overriding any manual toggle). Keep the manual `toggleTheme` function for in-session use. Ensure `document.documentElement.classList.toggle("dark", ...)` still applies the class.
- [X] T020 [US4] Run `npm test` in Docker to verify all US4 tests pass

**Checkpoint**: Theme follows OS at startup and on live changes. Manual toggle works within a session. No localStorage persistence for theme.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final validation across all stories.

- [X] T021 Run full test suite with `npm test` in Docker — all existing and new tests must pass
- [X] T022 Run `npm run build` in Docker — verify build succeeds with no errors or warnings
- [ ] T023 Manual verification: create text, hover Info icon (see creation date), correct pinyin (see modified date), toggle sort (persists across restart), theme follows OS at startup and live

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **US1 (Phase 2)**: Depends on Phase 1 (types must be extended first)
- **US2 (Phase 3)**: Depends on Phase 1 (needs `modified_at` column) and Phase 2 (tooltip must exist to add "Modified" line)
- **US3 (Phase 4)**: Independent of US1/US2 — only depends on Phase 1 (needs no schema changes, just localStorage)
- **US4 (Phase 5)**: Fully independent — can run in parallel with all other phases
- **Polish (Phase 6)**: Depends on all previous phases

### Parallel Opportunities

- **T002 + T003**: Domain type changes in separate languages (Rust vs TypeScript)
- **T005 + T006 + T007**: Test, helper, and component work for US1 (different files)
- **T012 + T013**: Split and merge functions are independent
- **US3 (T016-T017)** can run in parallel with **US2** since they touch different files
- **US4 (T018-T020)** can run in parallel with **US1, US2, US3** since theme is completely independent

---

## Parallel Example

```bash
# Phase 1 — domain types in parallel:
Task: "T002 — Add modified_at to Rust structs in domain.rs"
Task: "T003 — Add modifiedAt to TypeScript interfaces in domain.ts"

# US4 can run fully in parallel with everything else:
Task: "T018 — Write useTheme tests"
Task: "T019 — Rewrite useTheme with matchMedia"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Schema + types
2. Complete Phase 2: US1 — Info icon + tooltip with creation date
3. **STOP and VALIDATE**: Cards show title+tags only, hover reveals creation date with time
4. Ready for demo

### Incremental Delivery

1. Phase 1 → Schema migration + type extensions
2. Phase 2 (US1) → Tooltip with creation date → Test → Validate (MVP!)
3. Phase 3 (US2) → Modified date in tooltip → Test → Validate
4. Phase 4 (US3) → Sort persistence → Test → Validate
5. Phase 5 (US4) → System theme sync → Test → Validate
6. Phase 6 → Full validation pass

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Commit after each phase
- `created_at` already stores time in ISO format — only the display changes (no DB migration for creation date)
- `modified_at` is nullable — NULL means "never corrected"
- Sort persistence follows the existing `useColorPalette` localStorage pattern
- Theme uses `window.matchMedia("(prefers-color-scheme: dark)")` with event listener for live OS changes
- Tailwind `darkMode: "selector"` means the `.dark` class on `<html>` is still the mechanism
