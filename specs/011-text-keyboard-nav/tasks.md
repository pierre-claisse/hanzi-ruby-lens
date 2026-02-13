# Tasks: Text Keyboard Navigation

**Input**: Design documents from `/specs/011-text-keyboard-nav/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, quickstart.md

**Tests**: Included — written alongside implementation (not strict TDD). Constitution V requires extensive test coverage.

**Organization**: Tasks grouped by user story for independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 3: User Story 1 — Keyboard Word Navigation (Priority: P1) — MVP

**Goal**: Users can tab into the text area and navigate between words using Left/Right arrow keys. Mouse hover permanently updates the tracked word position. Space does nothing.

**Independent Test**: Tab into text area → first word highlighted → press Right arrow → next word highlighted → press Left arrow → previous word highlighted → hover mouse over word → tracked position updates.

### Implementation for User Story 1

- [x] T001 [P] [US1] Create useWordNavigation hook with word navigation state (trackedIndex, isFocused, handleFocus/handleBlur, handleWordHover, ArrowLeft/ArrowRight with boundary clamping, Space preventDefault) in src/hooks/useWordNavigation.ts
- [x] T002 [P] [US1] Modify RubyWord to accept controlled highlight props (isHighlighted?: boolean, onMouseEnter?: callback, onContextMenu?: callback); conditionally apply bg-accent/24 when isHighlighted is true, hover:bg-accent/24 only when isHighlighted is undefined in src/components/RubyWord.tsx
- [x] T003 [US1] Make TextDisplay focusable (tabIndex={0}, onKeyDown, onFocus, onBlur) and integrate useWordNavigation hook; compute word-only index array from segments, pass isHighlighted and onMouseEnter to each RubyWord based on trackedIndex and isFocused state in src/components/TextDisplay.tsx
- [x] T004 [US1] Write unit tests for useWordNavigation word navigation: ArrowRight increments index, ArrowLeft decrements, boundary clamping at 0 and wordCount-1, Space preventDefault, handleWordHover sets trackedIndex, handleFocus/handleBlur toggle isFocused in tests/unit/useWordNavigation.test.ts

**Checkpoint**: Text area is focusable, arrow keys navigate words, mouse hover updates position. All existing tests still pass.

---

## Phase 4: User Story 2 — Word Contextual Menu (Priority: P2)

**Goal**: Enter or right-click on a highlighted word opens a contextual menu with two dummy entries. Up/Down arrows navigate entries (wrapping). Menu closes on Tab-away, click-outside, or Left/Right arrow. Enter on a menu entry does nothing. Escape does nothing.

**Independent Test**: Focus a word → press Enter → menu appears with 2 entries → press Down → second entry focused → press Up → first entry focused → press Left → menu closes → press Enter → menu opens again → click outside → menu closes.

### Implementation for User Story 2

- [x] T005 [US2] Extend useWordNavigation hook with menu state (menuOpen, menuFocusedIndex, openMenuForWord, closeMenu); add menu-mode keyboard handling: ArrowUp/ArrowDown with wrapping, Enter no-op on menu entry, Escape no-op, ArrowLeft/ArrowRight close menu and resume word navigation in src/hooks/useWordNavigation.ts
- [x] T006 [P] [US2] Create WordContextMenu component with 2 dummy entries ("Option 1", "Option 2"), focused entry visual feedback (bg-content/10), role="menu" with role="menuitem" entries, positioned absolutely near the word element via style top/left from bounding rect, onPointerDown stopPropagation, onMouseDown preventDefault in src/components/WordContextMenu.tsx
- [x] T007 [US2] Integrate WordContextMenu into TextDisplay: render when menuOpen, compute position from tracked word element ref, add click-outside handler (document mousedown), add tab-away detection (onBlur with relatedTarget check), wire onContextMenu on each RubyWord to call openMenuForWord(wordIndex) — handles FR-011 and FR-018 in src/components/TextDisplay.tsx
- [x] T008 [P] [US2] Extend hook unit tests with menu state tests: openMenuForWord sets menuOpen/menuFocusedIndex, ArrowDown/Up wrapping, Enter no-op in menu mode, Escape no-op, ArrowLeft/Right close menu and navigate, closeMenu resets state in tests/unit/useWordNavigation.test.ts
- [x] T009 [P] [US2] Write integration test for full keyboard nav + contextual menu: Enter opens menu with 2 entries, Up/Down navigates entries, Tab closes menu, click-outside closes menu, Left/Right close menu and shift word, right-click on word opens menu, Escape does nothing, Enter on entry does nothing in tests/integration/text-keyboard-nav.test.tsx

**Checkpoint**: Contextual menu fully functional. All keyboard interactions match spec. Menu closes correctly on all specified triggers.

---

## Phase 5: User Story 3 — Revised Tab Order (Priority: P3)

**Goal**: Tab order is Text area > Pinyin toggle > Zoom in > Zoom out > Palette selector > Theme toggle > Fullscreen toggle > Close button.

**Independent Test**: Press Tab from page load → text area receives focus first → Tab again → Pinyin toggle → continue through all buttons in order.

### Implementation for User Story 3

- [x] T010 [US3] Reorder JSX in App.tsx: move TextDisplay wrapper div (bg-surface container) before TitleBar component. TitleBar uses fixed positioning so visual layout is unaffected. This places TextDisplay first in natural DOM tab order in src/App.tsx

**Checkpoint**: Full tab order matches spec. Visual layout unchanged (TitleBar still renders at top).

---

## Phase 6: Polish & Verification

**Purpose**: Ensure all changes work together, existing tests pass, production build succeeds.

- [x] T011 Run full test suite via npm run test (all existing + new tests must pass)
- [x] T012 Run production build via npm run build (verify no compilation errors)

---

## Dependencies & Execution Order

### Phase Dependencies

- **US1 (Phase 3)**: No dependencies — can start immediately
- **US2 (Phase 4)**: Depends on US1 completion (menu operates on tracked words from US1)
- **US3 (Phase 5)**: No dependencies on US1/US2 — can run in parallel with US1 or US2
- **Polish (Phase 6)**: Depends on all user stories being complete

### User Story Dependencies

- **US1 (P1)**: Independent — creates the hook and wires word navigation
- **US2 (P2)**: Depends on US1 — extends the hook and adds menu to TextDisplay
- **US3 (P3)**: Independent — only modifies App.tsx DOM order

### Within Each User Story

- Hook before component integration (T001 → T003, T005 → T007)
- Component creation before integration (T002 → T003, T006 → T007)
- Implementation before tests (T001-T003 → T004, T005-T007 → T008-T009)

### Parallel Opportunities

**Within US1:**
```
T001 (hook) ─┐
              ├── T003 (TextDisplay integration) ── T004 (unit tests)
T002 (RubyWord) ┘
```

**Within US2:**
```
T005 (extend hook) ─┐
                     ├── T007 (TextDisplay menu integration) ── T008 (unit tests) [P]
T006 (WordContextMenu) ┘                                        T009 (integration tests) [P]
```

**Cross-story:**
```
US3 (T010) can run in parallel with US1 or US2
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 3: US1 (T001-T004)
2. **STOP and VALIDATE**: Tab into text, arrow-navigate words, mouse hover works
3. All existing tests still pass + new unit tests pass

### Incremental Delivery

1. US1 → Word navigation works → validate
2. US2 → Context menu works → validate
3. US3 → Tab order correct → validate
4. Polish → full test suite + build → done

---

## Notes

- [P] tasks = different files, no dependencies on incomplete tasks
- [Story] label maps task to specific user story
- US2 depends on US1 but US3 is independent
- No new npm dependencies needed
- Reuse PaletteSelector patterns for menu (click-outside, tab-away, keyboard nav)
- Context menu positioning uses word element bounding rect
- Existing global contextmenu suppression (010) coexists with custom menu via React synthetic events
