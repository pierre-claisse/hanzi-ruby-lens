# Tasks: UI Polish

**Input**: Design documents from `/specs/025-ui-polish/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, quickstart.md

**Tests**: No new test files. Existing tests in `tests/integration/text-input-flow.test.tsx` will be updated to reflect the new add button location and removed title heading.

**Organization**: Tasks are grouped by user story. All 4 stories are P1 and touch overlapping files (TitleBar.tsx, App.tsx), so they execute sequentially.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3, US4)
- Include exact file paths in descriptions

---

## Phase 1: Setup

**Purpose**: No setup needed — all changes are to existing files, no new dependencies.

*(No tasks in this phase)*

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Font size changes that are independent and can be applied first without breaking anything.

- [X] T001 [P] Increase app title font from `text-sm` to `text-base` on `<h1>` in src/components/TitleBar.tsx
- [X] T002 [P] Increase card title font from `text-base` to `text-lg` on `<h3>` in src/components/TextPreviewCard.tsx

**Checkpoint**: Font sizes updated — visual readability improved.

---

## Phase 3: User Story 1 — Add Button in Title Bar (Priority: P1)

**Goal**: Move the add-text button from the floating action button (FAB) in LibraryScreen to the TitleBar, visible only in library view.

**Independent Test**: Open app to library view. Verify Plus button appears in title bar before palette selector. Verify no FAB exists at bottom-right.

### Implementation for User Story 1

- [X] T003 [US1] Add `onAddText` and `showAddButton` props to TitleBar interface, render Plus icon button (`aria-label="Add text"`) before PaletteSelector (visible when `showAddButton` is true) in src/components/TitleBar.tsx
- [X] T004 [US1] Pass `onAddText={handleAddText}` and `showAddButton={appView === "library"}` props to TitleBar in src/App.tsx
- [X] T005 [US1] Remove FAB button and `onAddText` prop from LibraryScreen in src/components/LibraryScreen.tsx
- [X] T006 [US1] Remove `onAddText={handleAddText}` prop from LibraryScreen usage in src/App.tsx

**Checkpoint**: Add button lives in title bar, FAB removed. Library and reading views both functional.

---

## Phase 4: User Story 2 — Grid Layout for Library Previews (Priority: P1)

**Goal**: Switch library preview cards from single-column flex list to responsive CSS grid with equal-width cards.

**Independent Test**: Open library with 5+ texts. Verify multi-column grid with equal-width cards. Resize window to verify responsive behavior.

### Implementation for User Story 2

- [X] T007 [US2] Change preview list from `flex flex-col gap-2` to `grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-4` and widen container from `max-w-3xl` to `max-w-5xl` to allow more grid columns in src/components/LibraryScreen.tsx
- [X] T008 [US2] Remove `w-full` from card button since grid controls width in src/components/TextPreviewCard.tsx

**Checkpoint**: Library shows responsive grid layout with equal-width cards.

---

## Phase 5: User Story 3 — Improved Font Readability (Priority: P1)

**Goal**: Already completed in Phase 2 (T001, T002). No additional tasks needed.

*(Font size tasks handled in Foundational phase since they were independent prerequisites.)*

---

## Phase 6: User Story 4 — Reading View Title in Title Bar (Priority: P1)

**Goal**: Display the active text's title centered in the title bar during reading view. Remove the `<h2>` heading from above the text content area.

**Independent Test**: Open a text in reading view. Verify title appears centered in title bar. Verify no heading above text content. Verify long titles truncate with ellipsis.

### Implementation for User Story 4

- [X] T009 [US4] Add `relative` to `<header>`, add `textTitle` prop to TitleBar interface, render centered title element with `absolute left-1/2 -translate-x-1/2 max-w-[40%] truncate select-none cursor-default` (visible when `textTitle` is provided) in src/components/TitleBar.tsx
- [X] T010 [US4] Remove zoom indicator `({zoomLevel}%)` from the left group and relocate it into the right group inside the `{showBack && (...)}` conditional, next to the zoom buttons, in src/components/TitleBar.tsx
- [X] T011 [US4] Pass `textTitle={activeText?.title}` to TitleBar in src/App.tsx
- [X] T012 [US4] Remove `<h2>` title heading from reading view content area in src/App.tsx

**Checkpoint**: Text title centered in title bar, no heading above content. Long titles truncate.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Update tests and reduce bottom padding now that FAB is removed.

- [X] T013 Update test assertion for add button location (now in title bar, not FAB) in tests/integration/text-input-flow.test.tsx
- [X] T014 Reduce `pb-24` to `pb-12` in LibraryScreen container since FAB is removed in src/components/LibraryScreen.tsx
- [X] T015 Run quickstart.md manual validation scenarios

---

## Dependencies & Execution Order

### Phase Dependencies

- **Foundational (Phase 2)**: No dependencies — font size changes are safe standalone edits
- **US1 (Phase 3)**: No dependencies on other stories — touches TitleBar, App, LibraryScreen
- **US2 (Phase 4)**: No dependencies — touches LibraryScreen (after US1 removes FAB) and TextPreviewCard
- **US3 (Phase 5)**: Already done in Phase 2
- **US4 (Phase 6)**: No dependencies — touches TitleBar and App (after US1 adds new props)
- **Polish (Phase 7)**: Depends on all stories being complete

### Within Each User Story

- US1: TitleBar props first (T003) → App wiring (T004) → LibraryScreen cleanup (T005, T006)
- US2: Grid layout (T007) → Card width cleanup (T008) — can run in parallel
- US4: TitleBar centered title (T009, T010) → App wiring (T011) → Remove heading (T012)

### Parallel Opportunities

- T001 and T002 can run in parallel (different files, no dependencies)
- T007 and T008 can run in parallel (different files within US2)
- T005 and T006 modify different files but are logically coupled (remove prop from both sides)

---

## Implementation Strategy

### Sequential Delivery

1. Complete Phase 2: Font sizes (T001, T002) — immediate visual improvement
2. Complete Phase 3: US1 — add button in title bar (T003-T006)
3. Complete Phase 4: US2 — grid layout (T007-T008)
4. Complete Phase 6: US4 — centered title (T009-T012)
5. Complete Phase 7: Polish (T013-T015)
6. **VALIDATE**: Run all tests, verify quickstart scenarios

### Total: 15 tasks across 6 active phases

---

## Notes

- All changes are pure frontend (TypeScript/React/Tailwind). No backend or data model changes.
- No new files are created — all tasks modify existing files.
- The `relative` class must be added to the TitleBar `<header>` for absolute positioning of the centered title to work correctly.
- Tests will need minor updates where they assert on add button location (was FAB, now title bar button).
