# Tasks: Context Menu Actions

**Input**: Design documents from `/specs/012-context-menu-actions/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, quickstart.md

**Tests**: Included — written alongside implementation. Constitution V requires extensive test coverage.

**Organization**: Tasks grouped by user story for independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Plugin Infrastructure)

**Purpose**: Install and configure the two Tauri plugins required for menu actions (opener for browser launch, clipboard-manager for clipboard write).

- [X] T001 [P] Add tauri-plugin-opener = "2" and tauri-plugin-clipboard-manager = "2" to [dependencies] in src-tauri/Cargo.toml
- [X] T002 [P] Register both plugins (.plugin(tauri_plugin_opener::init()) and .plugin(tauri_plugin_clipboard_manager::init())) in the Tauri builder in src-tauri/src/lib.rs
- [X] T003 [P] Add opener:allow-open-url (with https scope) and clipboard-manager:allow-write-text permissions to the main-window capability in src-tauri/tauri.conf.json
- [X] T004 [P] Add @tauri-apps/plugin-opener and @tauri-apps/plugin-clipboard-manager to dependencies in package.json

**Checkpoint**: Tauri plugins installed and configured. Build should compile with new dependencies.

---

## Phase 2: User Story 1 — Dictionary Lookup (Priority: P1) — MVP

**Goal**: Selecting "MOE Dictionary" (with BookSearch icon) in the contextual menu opens the focused word in the MOE Revised Chinese Dictionary in the default browser. The action framework is established: menu entries have icons and labels, clicking or pressing Enter on a focused entry triggers an action, and the menu closes after execution.

**Independent Test**: Focus a word → open menu → press Enter on "MOE Dictionary" → verify openUrl is called with correct dictionary URL → menu closes.

### Implementation for User Story 1

- [X] T007 [US1] Update WordContextMenu: change MENU_ENTRIES to 3 entries ("MOE Dictionary", "Google Translate", "Copy") with lucide-react icons (BookSearch, Languages, Copy), render icon + label in each entry div in src/components/WordContextMenu.tsx
- [X] T008 [US1] Update useWordNavigation: change MENU_ENTRY_COUNT from 2 to 3 in src/hooks/useWordNavigation.ts
- [X] T009 [US1] Update TextDisplay: add Google Translate action (index 1) with hardcoded zh-TW, shift Copy to index 2 in src/components/TextDisplay.tsx
- [X] T010 [P] [US1] Update useWordNavigation unit tests: adjust wrapping tests for 3-entry menu (ArrowDown from index 2 wraps to 0, ArrowUp from 0 wraps to 2) in tests/unit/useWordNavigation.test.ts
- [X] T011 [P] [US1] Update integration tests: change menu entry assertions to expect 3 entries ("MOE Dictionary", "Google Translate", "Copy"), update existing dictionary lookup and copy tests to use new indices, verify icons render in tests/integration/text-keyboard-nav.test.tsx

**Checkpoint**: "MOE Dictionary" action works via keyboard and mouse click. Menu has 3 entries with icons. Menu closes after action. Existing navigation tests still pass.

---

## Phase 3: User Story 2 — Google Translate (Priority: P2)

**Goal**: Selecting "Google Translate" in the contextual menu opens Google Translate with the focused word, always using zh-TW (Traditional Chinese) as the source language, translating to English. The menu closes after execution.

**Independent Test**: Focus a word → open menu → navigate to "Google Translate" → press Enter → verify openUrl is called with correct Google Translate URL using zh-TW.

### Implementation for User Story 2

- [X] T012 [P] [US2] Add integration tests for Google Translate: verify clicking "Google Translate" calls openUrl with zh-TW URL, verify pressing Enter on focused "Google Translate" entry works, verify menu closes after action in tests/integration/text-keyboard-nav.test.tsx

**Checkpoint**: Google Translate action opens correct URL with zh-TW. Tests pass.

---

## Phase 4: User Story 3 — Copy to Clipboard (Priority: P3)

**Goal**: Selecting "Copy" in the contextual menu copies the focused word's Chinese characters (not pinyin) to the system clipboard. The menu closes after execution. Copy is now the third entry (index 2).

**Independent Test**: Focus a word → open menu → navigate to "Copy" (third entry) → press Enter → verify writeText is called with the word's characters (not pinyin) → menu closes.

### Implementation for User Story 3

- [X] T013 [P] [US3] Update integration tests for copy action: adjust existing copy tests for new index (2 instead of 1), verify ArrowDown twice reaches Copy entry in tests/integration/text-keyboard-nav.test.tsx

**Checkpoint**: All three menu actions fully functional. Menu closes after every action. All tests pass.

---

## Phase 5: Polish & Verification

**Purpose**: Ensure all changes work together, existing tests pass, production build succeeds.

- [X] T014 Run full test suite via npm run test (all existing + new tests must pass)
- [X] T015 Run production build via npm run build (verify no compilation errors)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Already complete — no work needed
- **US1 (Phase 2)**: No dependencies — can start immediately
- **US2 (Phase 3)**: Depends on US1 completion (needs action framework with 3 entries)
- **US3 (Phase 4)**: Depends on US1 completion (needs 3-entry menu with shifted indices)
- **Polish (Phase 5)**: Depends on all user stories being complete

### Parallel Opportunities

**Within US1:**
```
T005 (WordContextMenu) ─┐
T006 (useWordNavigation) ├── T007 (TextDisplay integration) ── T008 (unit tests) [P]
                         ┘                                      T009 (integration tests) [P]
```

---

## Notes

- [P] tasks = different files, no dependencies on incomplete tasks
- [Story] label maps task to specific user story
- Phase 1 (plugin setup) already complete from previous implementation
- Menu entries now: "MOE Dictionary" (BookSearch), "Google Translate" (Languages), "Copy" (Copy)
- MENU_ENTRY_COUNT changes from 2 to 3
- Entry indices: 0 = MOE Dictionary, 1 = Google Translate, 2 = Copy
- Google Translate URL: `https://translate.google.com/?sl=zh-TW&tl=en&text={encodeURIComponent(characters)}` (always zh-TW)
- Dictionary URL pattern: `https://dict.revised.moe.edu.tw/search.jsp?md=1&word={encodeURIComponent(characters)}&qMd=0&qCol=1&sound=1#radio_sound_1`
