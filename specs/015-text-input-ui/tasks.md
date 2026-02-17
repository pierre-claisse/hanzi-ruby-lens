# Tasks: Text Input UI

**Input**: Design documents from `/specs/015-text-input-ui/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/tauri-commands.md, quickstart.md

**Tests**: Included — constitution V (Test-First Imperative) recommends TDD, project has existing test coverage at 217+ vitest tests.

**Organization**: Tasks grouped by user story. US1 (Empty State) and US2 (Text Entry) are both P1 but form a sequential flow.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup

**Purpose**: No new dependencies needed. Existing stack (React 18.3, Tailwind 3.4, lucide-react 0.563.0, @tauri-apps/api 2.0) is sufficient. No Rust changes required.

No tasks in this phase — project infrastructure is already in place.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Refactor useTextLoader to support the new view state machine and remove sample text fallback. These changes MUST be complete before any user story component can be built.

**CRITICAL**: No user story work can begin until this phase is complete.

- [x] T001 Delete hardcoded sample text file `src/data/sample-text.ts`, remove its import from `src/hooks/useTextLoader.ts`, and make `rawInput` required (remove `?`) in `src/types/domain.ts` to match Rust's non-optional `raw_input: String`
- [x] T002 Modify `src/hooks/useTextLoader.ts` — return `Text | null` (null when DB returns null or on error), add `saveText(rawInput: string)` function that invokes `save_text` with `{ rawInput, segments: [] }`, add `AppView` state (`"empty" | "input" | "saved" | "reading"`) derived from loaded data, expose `setView` for transitions
- [x] T003 Update `src/hooks/useTextLoader.test.ts` — change all sampleText fallback expectations to `null`, add tests for `saveText` invocation, add tests for initial view state derivation (null→empty, empty segments→saved, segments→reading)
- [x] T004 Update `tests/integration/text-persistence.test.tsx` and any other tests importing or depending on `sampleText` — replace with explicit mock data

**Checkpoint**: useTextLoader returns null on empty DB, saveText works, all existing tests pass with updated expectations.

---

## Phase 3: User Story 1 — Empty State Welcome (Priority: P1) MVP

**Goal**: First-time user sees a clear, inviting empty state that communicates the app's purpose and provides a path to text entry.

**Independent Test**: Launch app with empty database → empty state appears with purpose message and CTA button.

### Tests for User Story 1

> **NOTE: Write test FIRST, ensure it FAILS before implementation (constitution V)**

- [x] T005 [US1] Test empty state rendering in `tests/integration/text-input-flow.test.tsx` — mock `load_text` returning null → verify EmptyState renders with purpose text and CTA button

### Implementation for User Story 1

- [x] T006 [P] [US1] Create `src/components/EmptyState.tsx` — centered layout with app purpose message ("Paste Chinese text to read with pinyin annotations"), CTA button ("Enter Text"), respects theme/palette via existing Tailwind classes (`bg-surface`, `text-content`, `text-accent`), content-first design (generous whitespace, no competing chrome)
- [x] T007 [US1] Wire EmptyState into `src/App.tsx` — render EmptyState when `appView === "empty"`, CTA button calls `setView("input")`

**Checkpoint**: App with empty DB shows EmptyState. CTA button transitions to input view (which doesn't exist yet — next phase).

---

## Phase 4: User Story 2 — Text Entry and Submission (Priority: P1)

**Goal**: User can enter/paste Chinese text in a textarea, submit to save as raw input, and see a confirmation state ("text saved, awaiting processing").

**Independent Test**: Open input view → type/paste text → submit → raw input persisted via save_text → confirmation state shown. Also: submit empty textarea → accepted. Save error → error message shown, input preserved.

### Tests for User Story 2

> **NOTE: Write tests FIRST, ensure they FAIL before implementation (constitution V)**

- [x] T008 [US2] Test submit flow in `tests/integration/text-input-flow.test.tsx` — mock `save_text` → verify invocation with `{ rawInput, segments: [] }`, verify transition to SavedState after success, verify empty submit accepted (FR-005), verify error displayed on save failure with input preserved (FR-010)

### Implementation for User Story 2

- [x] T009 [P] [US2] Create `src/components/TextInputView.tsx` — full-width textarea (multiline, font-hanzi for CJK, placeholder text), Submit button and Cancel button, error message display area, loading state during save, receives `initialValue` prop (empty string for new, rawInput for edit), `onSubmit(rawInput)` and `onCancel()` callbacks
- [x] T010 [P] [US2] Create `src/components/SavedState.tsx` — centered "Text saved, awaiting processing" confirmation message, Edit button to return to input, respects theme/palette, content-first minimal design
- [x] T011 [US2] Wire TextInputView and SavedState into `src/App.tsx` — render TextInputView when `appView === "input"` (pass initialValue from loaded text rawInput or empty), render SavedState when `appView === "saved"`, submit handler: call `saveText()` → on success set view to "saved" (or "empty" if rawInput was empty), cancel handler: return to previous view

**Checkpoint**: Full input→save→confirmation flow works. Empty submit accepted. Error handling works. All tests pass.

---

## Phase 5: User Story 3 — Edit Existing Text (Priority: P2)

**Goal**: User with saved text can trigger edit, see textarea pre-filled with previously saved raw input, modify, and re-submit.

**Independent Test**: Save text → trigger edit → textarea shows saved rawInput → modify → submit → updated rawInput saved. Cancel → original text unchanged.

### Tests for User Story 3

> **NOTE: Write test FIRST, ensure it FAILS before implementation (constitution V)**

- [x] T012 [US3] Test edit flow in `tests/integration/text-input-flow.test.tsx` — verify textarea pre-filled with saved rawInput, verify modified text replaces previous on submit, verify cancel restores previous view without changes

### Implementation for User Story 3

- [x] T013 [P] [US3] Add conditional edit button to `src/components/TitleBar.tsx` — show pencil icon (lucide-react `Pencil` or `Edit3`) when text exists, `onEdit` callback prop, button follows existing TitleBar button pattern (same size, stopPropagation for drag region)
- [x] T014 [US3] Wire edit action in `src/App.tsx` — pass `onEdit` to TitleBar (sets view to "input"), also wire edit button in SavedState to trigger input view, TextInputView receives `initialValue={text.rawInput}` when editing

**Checkpoint**: Full edit cycle works. Pre-fill correct. Cancel non-destructive. All tests pass.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Visual consistency, regression check, final validation.

- [x] T015 Verify all new components (`EmptyState`, `TextInputView`, `SavedState`) render correctly in both light and dark themes with all 12 color palettes — check `bg-surface`, `text-content`, `text-accent`, `border-content/10` classes
- [x] T016 Run full test suite (`npm run test` in Docker), fix any regressions from sample text removal or view state changes
- [x] T017 Validate against `quickstart.md` scenarios — empty DB → empty state, enter → submit → saved, edit → modify → re-save, empty submit, cancel from each state

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Nothing needed
- **Foundational (Phase 2)**: No external dependencies — blocks all user stories
- **US1 (Phase 3)**: Depends on Foundational (Phase 2)
- **US2 (Phase 4)**: Depends on Foundational (Phase 2), logically follows US1 (CTA leads to input)
- **US3 (Phase 5)**: Depends on US2 (needs saved text + input view to exist)
- **Polish (Phase 6)**: Depends on all user stories being complete

### User Story Dependencies

- **US1 (P1)**: Can start after Phase 2. Independent display component.
- **US2 (P1)**: Can start after Phase 2. US1's CTA button target. Tightly coupled with US1 in practice.
- **US3 (P2)**: Depends on US2 (needs TextInputView and saveText to exist). Adds edit entry point.

### Within Each User Story

- Tests written first (TDD red phase)
- Components ([P]) can be created in parallel
- Wiring into App.tsx depends on components existing
- Tests pass after wiring (TDD green phase)

### Parallel Opportunities

- T006 (EmptyState) and T009 (TextInputView) and T010 (SavedState) can all be created in parallel (different files)
- T013 (TitleBar edit button) can be created in parallel with T009/T010
- T003 and T004 (test updates) can run in parallel

---

## Parallel Example: Phase 2

```bash
# These can run in parallel (different files):
T003: Update useTextLoader.test.ts
T004: Update integration tests for sampleText removal
# But T001 and T002 must run first (they change the code the tests reference)
```

## Parallel Example: Components

```bash
# After Phase 2, all new components can be created in parallel:
T006: Create EmptyState.tsx
T009: Create TextInputView.tsx
T010: Create SavedState.tsx
T013: Add edit button to TitleBar.tsx
# Then wire them sequentially: T007 → T011 → T014
```

---

## Implementation Strategy

### MVP First (US1 + US2)

1. Complete Phase 2: Foundational (remove sample text, refactor hook)
2. Complete Phase 3: US1 (empty state)
3. Complete Phase 4: US2 (input + save + confirmation)
4. **STOP and VALIDATE**: Test full empty→input→saved flow
5. Build and visually verify

### Incremental Delivery

1. Phase 2 → Foundation ready (breaking change: sample text gone)
2. Phase 3 (US1) → Empty state visible → Validate
3. Phase 4 (US2) → Full input flow → Validate
4. Phase 5 (US3) → Edit flow → Validate
5. Phase 6 → Polish → Final validation

---

## Notes

- Zero Rust changes — all frontend TypeScript/React
- Existing `save_text`/`load_text` commands reused as-is
- `sample-text.ts` deletion is a breaking change — Phase 2 must update all dependents
- TextInputView textarea must use `font-hanzi` class for CJK input
- SavedState is a transitional component — will be replaced when LLM integration (016) adds segment generation
- All new components must include `data-tauri-drag-region` considerations (buttons need `stopPropagation`)
