# Tasks: Library Context Menu Refinement

**Input**: Design documents from `/specs/035-library-menu-refine/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, quickstart.md

**Tests**: Required per Constitution V (Test-First Imperative). Included as unit and integration tasks.

**Organization**: Tasks grouped by user story. All three stories are P1 but have natural implementation order: US3 (remove icons) and US1 (metadata header) can proceed in parallel, then US2 (Lock/Unlock entry) builds on both.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup

**Purpose**: No setup needed — no new files, no new dependencies, no schema changes.

(Skipped — all work happens in existing files.)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Pass the right data to the context menu so all stories can use it.

- [x] T001 Pass the right-clicked preview object to the context menu state: update `contextMenu` state type from `{ ids: number[]; x: number; y: number }` to also include `preview: TextPreview` for the right-clicked card, in `src/components/LibraryScreen.tsx`

**Checkpoint**: Context menu now has access to per-card metadata (createdAt, modifiedAt, locked) needed by US1 and US2.

---

## Phase 3: User Story 3 - Cleaner Library Card Appearance (Priority: P1) MVP

**Goal**: Remove the info icon/tooltip and lock toggle icon from cards. Add locked-card tint styling.

**Independent Test**: View Library cards — no info or lock icons visible. Locked cards show a subtle background tint.

### Implementation for User Story 3

- [x] T002 [US3] Remove the lock toggle icon (`<span role="button">` with `LockIcon`) and info icon/tooltip (`<div className="relative group">` block) from `src/components/TextPreviewCard.tsx`
- [x] T003 [US3] Remove the `onToggleLock` prop from the `TextPreviewCardProps` interface and the component signature in `src/components/TextPreviewCard.tsx`
- [x] T004 [US3] Add conditional locked-card background tint: apply `bg-content/5` class to the card's root `<button>` when `preview.locked` is true, in `src/components/TextPreviewCard.tsx`
- [x] T005 [US3] Remove the `onToggleLock` prop from the `<TextPreviewCard>` usage in the grid map in `src/components/LibraryScreen.tsx`
- [x] T006 [US3] Remove unused imports (`Info`, `Lock`, `Unlock` from lucide-react, `formatDateTime`) from `src/components/TextPreviewCard.tsx`

**Checkpoint**: Cards are visually clean — no icons, locked cards have subtle tint. Context menu not yet updated.

### Tests for User Story 3

- [x] T019 [US3] Unit test: TextPreviewCard renders without info icon and without lock toggle icon in `tests/unit/TextPreviewCard.test.tsx`
- [x] T020 [US3] Unit test: TextPreviewCard applies `bg-content/5` class when `preview.locked` is true, and omits it when false, in `tests/unit/TextPreviewCard.test.tsx`

---

## Phase 4: User Story 1 - View Text Metadata via Context Menu (Priority: P1)

**Goal**: Display Created/Modified dates as a non-interactive footer section at the bottom of the context menu.

**Independent Test**: Right-click a card — see Created (and Modified if present) dates at bottom of menu, separated by a divider from Delete.

### Implementation for User Story 1

- [x] T007 [US1] Add a metadata footer section at the bottom of the context menu (after the Delete entry) in `src/components/LibraryScreen.tsx`: render `Created: {formatDateTime(preview.createdAt)}` and conditionally `Modified: {formatDateTime(preview.modifiedAt)}` as `text-xs text-content/50 px-3 py-1.5` non-interactive divs
- [x] T008 [US1] Add a visual divider (`border-t border-content/10 my-1`) above the metadata section and below the Delete entry in `src/components/LibraryScreen.tsx`
- [x] T009 [US1] Import `formatDateTime` from `../utils/formatDateTime` in `src/components/LibraryScreen.tsx`
- [x] T010 [US1] Update `menuEntryCount` calculation to account for the metadata section height (add 2 to the count for the header lines + divider) in `src/components/LibraryScreen.tsx`

**Checkpoint**: Context menu shows dates at top with divider. Lock/Unlock entry not yet added.

### Tests for User Story 1

- [x] T021 [US1] Integration test: context menu displays Created date for right-clicked card in `tests/integration/LibraryContextMenu.test.tsx`
- [x] T022 [US1] Integration test: context menu displays Modified date only when present, omits it when null, in `tests/integration/LibraryContextMenu.test.tsx`

---

## Phase 5: User Story 2 - Lock/Unlock Text via Context Menu (Priority: P1)

**Goal**: Add a Lock/Unlock entry to the context menu below Tags.

**Independent Test**: Right-click a card — select Lock/Unlock — card state changes and tint updates.

### Implementation for User Story 2

- [x] T011 [US2] Add a Lock/Unlock menu entry between the Tags trigger and the Delete entry in `src/components/LibraryScreen.tsx`: render a `<div role="menuitem">` with Lock or Unlock icon + label, using `hover:bg-content/10` styling
- [x] T012 [US2] Implement lock label logic: if any text in `contextMenu.ids` is unlocked, show "Lock" with Lock icon; if all are locked, show "Unlock" with Unlock icon — derive from `previews` array in `src/components/LibraryScreen.tsx`
- [x] T013 [US2] Wire the Lock/Unlock entry's onClick to call `onToggleLock` for each id in `contextMenu.ids`, then close the context menu, in `src/components/LibraryScreen.tsx`
- [x] T014 [US2] Import `Lock`, `Unlock` from lucide-react in `src/components/LibraryScreen.tsx`
- [x] T015 [US2] Update `menuEntryCount` to add 1 for the new Lock/Unlock entry in `src/components/LibraryScreen.tsx`

**Checkpoint**: Full context menu works — metadata header, Tags, Lock/Unlock, Delete. Cards are icon-free with locked tint.

### Tests for User Story 2

- [x] T023 [US2] Integration test: context menu shows "Lock" when right-clicked card is unlocked, "Unlock" when locked, in `tests/integration/LibraryContextMenu.test.tsx`
- [x] T024 [US2] Integration test: context menu shows "Lock" when multi-selected cards have mixed lock states, "Unlock" when all locked, in `tests/integration/LibraryContextMenu.test.tsx`
- [x] T025 [US2] Integration test: context menu Lock/Unlock entry appears in correct position (after Tags, before Delete) in `tests/integration/LibraryContextMenu.test.tsx`

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Verify theme compatibility and clean up.

- [x] T016 Manually verify locked card tint (`bg-content/5`) renders correctly across all 12 theme combinations (6 palettes x light/dark) — document any adjustments needed
- [x] T017 Verify context menu positioning still works correctly with the added entries (metadata header + Lock/Unlock) — test with cards near viewport edges
- [x] T018 Verify `onToggleLock` remains in `LibraryScreenProps` (still needed by T013 context menu handler) and confirm it is no longer referenced in `TextPreviewCardProps` in `src/components/TextPreviewCard.tsx`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Foundational (Phase 2)**: No dependencies — start immediately
- **US3 (Phase 3)**: Can start after T001 (needs context menu state update for later phases, but card cleanup itself is independent)
- **US1 (Phase 4)**: Depends on T001 (needs `preview` in context menu state)
- **US2 (Phase 5)**: Depends on T001 (needs `preview.locked`) and T005 (lock toggle removed from card)
- **Polish (Phase 6)**: Depends on all story phases complete

### User Story Dependencies

- **US3**: Independent — can start immediately (card changes don't depend on context menu state)
- **US1**: Depends on T001 (foundational) — needs preview data in context menu
- **US2**: Depends on T001 (foundational) — needs locked state in context menu

### Within Each User Story

- US3 in TextPreviewCard: T002 → T003 → T004 → T006 (sequential in same file)
- US3 in LibraryScreen: T005 (single task, runs in Stream B after T001)
- US1: T009 → T007 → T008 → T010 (sequential in same file; import first)
- US2: T014 → T011 → T012 → T013 → T015 (sequential in same file; import first)

### Parallel Opportunities

- T002-T006 (US3, TextPreviewCard) can run in parallel with T007-T010 (US1, LibraryScreen) since they modify different files
- T009 and T014 (imports) can be batched with their respective story tasks

---

## Parallel Example: US3 + US1

```text
# These two streams modify different files and can run in parallel:

# Stream A (TextPreviewCard.tsx):
T002 → T003 → T004 → T006  (US3: remove icons, add tint)

# Stream B (LibraryScreen.tsx):
T001 → T005 → T007 → T008 → T009 → T010  (Foundational + US3 LibraryScreen cleanup + US1: metadata header)
# Note: T005 (remove onToggleLock prop from <TextPreviewCard> usage) is in US3 but modifies LibraryScreen.tsx

# Then sequential (LibraryScreen.tsx):
T011 → T012 → T013 → T014 → T015  (US2: Lock/Unlock entry)
```

---

## Implementation Strategy

### MVP First (US3 + US1)

1. Complete T001 (foundational)
2. Complete US3 (T002-T006) — cards cleaned up
3. Complete US1 (T007-T010) — metadata in context menu
4. **STOP and VALIDATE**: Cards have no icons, right-click shows dates
5. Complete US2 (T011-T015) — lock/unlock via menu
6. Polish (T016-T018) — theme verification

### Incremental Delivery

1. T001 → Foundation ready
2. US3 → Clean cards (locked tint visible)
3. US1 → Dates accessible via context menu
4. US2 → Lock/Unlock accessible via context menu
5. Each increment is independently functional

---

## Notes

- All implementation happens in 2 existing files: `TextPreviewCard.tsx` and `LibraryScreen.tsx`
- No new files, no Rust changes, no database changes
- The `onToggleLock` prop/callback is already wired in the parent (`App.tsx`) — it just needs to be called from the context menu instead of the card
- Commit after each user story phase for clean git history
