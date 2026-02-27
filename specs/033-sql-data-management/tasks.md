# Tasks: SQL Data Management

**Input**: Design documents from `/specs/033-sql-data-management/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/

**Tests**: Not explicitly requested in the feature specification. Test tasks are omitted.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Add the `tauri-plugin-dialog` dependency and register it. This unblocks all stories that need native file/confirm dialogs.

- [x] T001 Add `tauri-plugin-dialog = "2"` dependency in `src-tauri/Cargo.toml`
- [x] T002 Add `@tauri-apps/plugin-dialog` dependency in `package.json` and run `npm install`
- [x] T003 Register dialog plugin (`.plugin(tauri_plugin_dialog::init())`) and add dialog permissions in `src-tauri/src/lib.rs` and `src-tauri/capabilities/default.json`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Domain structs and database functions shared across all three operations. MUST complete before any user story.

**CRITICAL**: No user story work can begin until this phase is complete.

- [x] T004 [P] Add `ExportPayload` struct (version, exported_at, texts, tags, text_tags arrays) with Serialize/Deserialize derives in `src-tauri/src/domain.rs`
- [x] T005 [P] Add `ExportResult` struct (text_count, tag_count) with Serialize derive in `src-tauri/src/domain.rs`
- [x] T006 [P] Add `ImportResult` struct (text_count, tag_count) with Serialize derive in `src-tauri/src/domain.rs`
- [x] T007 [P] Add `ExportText` struct (id, title, created_at, modified_at, raw_input, segments, locked — all fields from texts table) with Serialize/Deserialize derives in `src-tauri/src/domain.rs`
- [x] T008 [P] Add `ExportTag` struct (id, label, color) with Serialize/Deserialize derives in `src-tauri/src/domain.rs`
- [x] T009 [P] Add `ExportTextTag` struct (text_id, tag_id) with Serialize/Deserialize derives in `src-tauri/src/domain.rs`

**Checkpoint**: Foundation ready — domain structs available for all database functions and Tauri commands.

---

## Phase 3: User Story 4 + User Story 1 — Dropdown Button & Export (Priority: P1) MVP

**Goal**: Display the data management dropdown in the library title bar with three menu items (Export, Import, Reset). The Export action is fully functional: opens a native save dialog, writes all data to a `.json` file, and shows a success message. Import and Reset show placeholder "not implemented" messages.

**Independent Test**: Open library view → click the data management button → verify dropdown shows 3 items in order (Export, Import, Reset). Click Export → choose a save path → verify the `.json` file contains all texts, tags, and text_tags. Verify the button is hidden in reading view.

### Implementation

- [x] T010 [US1] Implement `export_all` function in `src-tauri/src/database.rs`: query all rows from texts, tags, and text_tags tables; build and return an `ExportPayload` with version=1 and current timestamp. Use `&Connection` (read-only, Query per CQRS).
- [x] T011 [US1] Implement `export_database` Tauri command in `src-tauri/src/commands.rs`: accept `file_path: String`, call `export_all` via `app_handle.db()`, serialize payload to JSON with `serde_json::to_string_pretty`, write to file, return `ExportResult` with counts. Handle `AppError::Io` for write failures.
- [x] T012 [US1] Register `export_database` command in the invoke handler in `src-tauri/src/lib.rs`
- [x] T013 [P] [US4] Create `DataManagementDropdown` component in `src/components/DataManagementDropdown.tsx`: button with `Database` icon from lucide-react, dropdown with 3 menu items ("Export", "Import", "Reset") in safe-first order. Follow `PaletteSelector.tsx` pattern for accessible listbox with ARIA roles, keyboard navigation (arrow keys, enter), click-outside close, and `onPointerDown` with `stopPropagation()` to prevent title bar drag. Accept props: `onExportComplete`, `onImportComplete`, `onResetComplete`.
- [x] T014 [US4] Integrate `DataManagementDropdown` into `src/components/TitleBar.tsx`: add it in the right section between the tags manager button and `PaletteSelector`, visible only when `showAddButton` is true (library view). Add `onDataExportComplete`, `onDataImportComplete`, `onDataResetComplete` props to TitleBarProps.
- [x] T015 [US1] Wire Export action in `DataManagementDropdown`: on "Export" click, call `save` from `@tauri-apps/plugin-dialog` with filter `[{name: "JSON", extensions: ["json"]}]` and default filename `hanzi-ruby-lens-export.json`. If path returned, call `invoke<ExportResult>("export_database", { filePath })`. On success, call `message` from `@tauri-apps/plugin-dialog` showing count of exported texts. On error, show error via `message`. Update `src/components/DataManagementDropdown.tsx`.
- [x] T016 [US4] Wire `onDataExportComplete` / `onDataImportComplete` / `onDataResetComplete` callbacks in `src/App.tsx` (or wherever TitleBar is rendered) to trigger library list refresh via `useTextLoader`. Add a `refreshList` function to `src/hooks/useTextLoader.ts` that re-calls `list_texts` and updates previews.

**Checkpoint**: User Story 4 (dropdown button) and User Story 1 (export) are fully functional. The dropdown appears in library view only, positioned correctly. Export produces a valid `.json` file. Import and Reset items exist in the dropdown but are not yet wired.

---

## Phase 4: User Story 2 — Import Data (Priority: P2)

**Goal**: The "Import" menu item opens a native file picker filtered to `.json`, shows a confirmation dialog warning about total overwrite, then replaces all database data with the imported file contents. The library view refreshes automatically.

**Independent Test**: Create a known export file → click Import → select it → confirm overwrite → verify library shows exactly the imported data with no remnants of previous data. Also test: cancel confirmation (no change), select invalid file (error message, no change).

### Implementation

- [x] T017 [US2] Implement `validate_export_payload` function in `src-tauri/src/database.rs`: check version==1, check texts/tags/text_tags arrays exist, validate referential integrity (all text_tags reference valid text and tag IDs), validate unique tag labels. Return `Result<(), AppError::Validation>` with descriptive error messages.
- [x] T018 [US2] Implement `import_all` function in `src-tauri/src/database.rs`: accept `&mut Connection` and `ExportPayload`. Use `conn.transaction()` for atomicity (Command per CQRS). Inside the transaction: DELETE all from text_tags, tags, texts (in order). Then INSERT all texts, tags, text_tags from payload preserving original IDs. On any error, transaction rolls back automatically. Return `ImportResult` with counts.
- [x] T019 [US2] Implement `import_database` Tauri command in `src-tauri/src/commands.rs`: accept `file_path: String`, read file contents, parse JSON into `ExportPayload` (return `AppError::Validation` on parse failure), call `validate_export_payload`, call `import_all` via `app_handle.db_mut()`, return `ImportResult`.
- [x] T020 [US2] Register `import_database` command in the invoke handler in `src-tauri/src/lib.rs`
- [x] T021 [US2] Wire Import action in `DataManagementDropdown`: on "Import" click, call `open` from `@tauri-apps/plugin-dialog` with filter `[{name: "JSON", extensions: ["json"]}]`. If path returned, call `confirm` from `@tauri-apps/plugin-dialog` with warning message about permanent data replacement. If confirmed, call `invoke<ImportResult>("import_database", { filePath })`. On success, call `onImportComplete` prop to trigger library refresh. On error, show error via `message`. Update `src/components/DataManagementDropdown.tsx`.

**Checkpoint**: User Stories 1, 2, and 4 are functional. Export and Import work end-to-end. Full round-trip (export → import) preserves all data.

---

## Phase 5: User Story 3 — Reset All Data (Priority: P3)

**Goal**: The "Reset" menu item shows a confirmation dialog warning about permanent deletion, then deletes all texts, tags, and tag assignments. The library view refreshes to show the empty state.

**Independent Test**: With data in library → click Reset → confirm → verify library is completely empty (no texts, no tags). Also test: cancel confirmation (no change).

### Implementation

- [x] T022 [US3] Implement `reset_all` function in `src-tauri/src/database.rs`: accept `&mut Connection`, use `conn.transaction()` for atomicity (Command per CQRS). DELETE all from text_tags, tags, texts (in order). Return `Result<(), AppError>`.
- [x] T023 [US3] Implement `reset_database` Tauri command in `src-tauri/src/commands.rs`: no parameters, call `reset_all` via `app_handle.db_mut()`, return `Result<(), AppError>`.
- [x] T024 [US3] Register `reset_database` command in the invoke handler in `src-tauri/src/lib.rs`
- [x] T025 [US3] Wire Reset action in `DataManagementDropdown`: on "Reset" click, call `confirm` from `@tauri-apps/plugin-dialog` with warning message about permanent deletion of all data. If confirmed, call `invoke("reset_database")`. On success, call `onResetComplete` prop to trigger library refresh. On error, show error via `message`. Update `src/components/DataManagementDropdown.tsx`.

**Checkpoint**: All user stories (1, 2, 3, 4) are fully functional. Export, Import, and Reset all work end-to-end.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final validation and cleanup across all stories.

- [ ] T026 Verify export → import round-trip: export a library with multiple texts, tags, and tag assignments, then import the file into a reset database and confirm all data matches exactly. Manual validation against SC-004.
- [ ] T027 Verify edge cases: export with empty database (produces valid JSON), import invalid file (error message, no data change), import file with wrong version (descriptive error). Manual validation against SC-005.
- [ ] T028 Verify dropdown is hidden in reading view and visible in library view. Verify button position is between tags manager and palette selector. Manual validation against FR-001, FR-002, SC-006.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Setup (Phase 1) completion — BLOCKS all user stories
- **US4+US1 (Phase 3)**: Depends on Foundational (Phase 2) — delivers MVP
- **US2 (Phase 4)**: Depends on Phase 3 (reuses ExportPayload struct and DataManagementDropdown)
- **US3 (Phase 5)**: Depends on Phase 3 (reuses DataManagementDropdown). Can run in parallel with Phase 4.
- **Polish (Phase 6)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 4 (Dropdown)**: Can start after Foundational — no dependencies on other stories
- **User Story 1 (Export)**: Can start after Foundational — needs dropdown shell from US4 (co-developed in Phase 3)
- **User Story 2 (Import)**: Needs ExportPayload struct from Phase 2 and dropdown from US4. Can start after Phase 3.
- **User Story 3 (Reset)**: Needs dropdown from US4. Can start after Phase 3. Independent of US2.

### Within Each User Story

- Database function before Tauri command
- Tauri command before frontend wiring
- Command registration alongside command implementation

### Parallel Opportunities

- T004–T009 (foundational structs) can all run in parallel (separate struct definitions)
- T010–T012 (export backend) and T013 (dropdown component) can run in parallel (different files: Rust vs TypeScript)
- US2 (Phase 4) and US3 (Phase 5) can run in parallel after Phase 3

---

## Parallel Example: Phase 3

```bash
# Backend (Rust) and Frontend (TypeScript) can be developed in parallel:
# Stream 1: Rust backend
Task: T010 — export_all database function in src-tauri/src/database.rs
Task: T011 — export_database command in src-tauri/src/commands.rs
Task: T012 — register command in src-tauri/src/lib.rs

# Stream 2: React frontend (can start simultaneously)
Task: T013 — DataManagementDropdown component in src/components/DataManagementDropdown.tsx

# Then sequential integration:
Task: T014 — Integrate dropdown into TitleBar
Task: T015 — Wire export action in dropdown
Task: T016 — Wire callbacks in App.tsx + refreshList in useTextLoader
```

---

## Implementation Strategy

### MVP First (Phase 1 + 2 + 3)

1. Complete Phase 1: Setup (add tauri-plugin-dialog)
2. Complete Phase 2: Foundational (domain structs)
3. Complete Phase 3: US4 + US1 (dropdown + export)
4. **STOP and VALIDATE**: Dropdown visible in library view, Export produces valid `.json`
5. This is a usable feature — users can back up their data

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add US4 + US1 → Dropdown + Export working → **MVP!**
3. Add US2 → Import working → Full backup/restore cycle
4. Add US3 → Reset working → Complete feature
5. Each phase adds value without breaking previous phases

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- US4 and US1 are co-developed in Phase 3 because the dropdown shell (US4) needs at least one wired action (US1) to be testable end-to-end
- US2 and US3 can proceed in parallel after Phase 3
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
