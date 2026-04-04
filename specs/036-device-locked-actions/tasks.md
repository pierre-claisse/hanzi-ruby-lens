# Tasks: Device-Locked Actions

**Input**: Design documents from `/specs/036-device-locked-actions/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, quickstart.md

**Tests**: Required per Constitution V (Test-First Imperative). Included as unit and integration tasks.

**Organization**: US1 (hide on unauthorized) and US2 (keep on authorized) are two sides of the same coin — implemented together via a single boolean prop. US3 (Reset red styling) is independent.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup

**Purpose**: Add the new dependency for device identification.

- [x] T001 Add `machine-uid = "0.5"` to `[dependencies]` in `src-tauri/Cargo.toml`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Implement the Rust backend command that all UI stories depend on.

- [x] T002 Add the `is_authorized_device` command in `src-tauri/src/commands.rs`: read the current device MachineGuid via `machine_uid::get()`, compare against the build-time constant from `option_env!("AUTHORIZED_MACHINE_ID")`, return `true` if they match, `false` otherwise (including on any error)
- [x] T003 Register the `is_authorized_device` command in the Tauri command list in `src-tauri/src/lib.rs`
- [x] T004 In `src/App.tsx`, call `invoke<boolean>("is_authorized_device")` at startup (alongside existing `list_texts` / `list_all_tags` calls), store the result in a state variable `isAuthorizedDevice` (default `false`)

**Checkpoint**: Backend returns authorization boolean. Frontend has the flag. No UI changes yet.

---

## Phase 3: User Story 1 & 2 - Device-Based Action Visibility (Priority: P1)

**Goal**: Hide Delete and DataManagement on unauthorized devices; keep them on authorized devices.

**Independent Test**: Run with `AUTHORIZED_MACHINE_ID` matching current device — full UI. Run without it — Delete and DataManagement hidden.

### Implementation for User Story 1 & 2

- [x] T005 [US1] Pass `isAuthorizedDevice` prop from `App.tsx` to `LibraryScreen` component (add to `LibraryScreenProps` interface) in `src/components/LibraryScreen.tsx`
- [x] T006 [US1] Conditionally render the Delete menu entry in the context menu: only show when `isAuthorizedDevice` is `true`, in `src/components/LibraryScreen.tsx`
- [x] T007 [US1] Pass `isAuthorizedDevice` prop from `App.tsx` to `TitleBar` component (add to `TitleBarProps` interface) in `src/components/TitleBar.tsx`
- [x] T008 [US1] Conditionally render the `DataManagementDropdown` in `TitleBar`: only show when both `showAddButton` and `isAuthorizedDevice` are `true`, in `src/components/TitleBar.tsx`

**Checkpoint**: Delete and DataManagement hidden on unauthorized devices, visible on authorized.

### Tests for User Story 1 & 2

- [x] T009 [US1] Unit test: `is_authorized_device` returns `true` when MachineGuid matches build-time constant, in `src-tauri/src/commands.rs` (Rust test)
- [x] T010 [US1] Unit test: `is_authorized_device` returns `false` when MachineGuid does not match, in `src-tauri/src/commands.rs` (Rust test)
- [x] T019 [US1] Unit test: `is_authorized_device` returns `false` when `AUTHORIZED_MACHINE_ID` env var was not set at build time (i.e., `option_env!()` returns `None`), in `src-tauri/src/commands.rs` (Rust test)
- [x] T011 [US1] Integration test: LibraryScreen context menu does NOT contain "Delete" when `isAuthorizedDevice={false}`, in `tests/integration/LibraryContextMenu.test.tsx`
- [x] T012 [US2] Integration test: LibraryScreen context menu contains "Delete" when `isAuthorizedDevice={true}`, in `tests/integration/LibraryContextMenu.test.tsx`
- [x] T018 [US1] Integration test: TitleBar does NOT render DataManagementDropdown when `isAuthorizedDevice={false}`, and DOES render it when `isAuthorizedDevice={true}`, in `tests/integration/TitleBarAuthorization.test.tsx`

---

## Phase 4: User Story 3 - Reset Entry Styled in Red (Priority: P2)

**Goal**: Style the Reset entry in the data management dropdown with red text and icon.

**Independent Test**: Open the data management dropdown — Reset appears in red, Export and Import remain normal.

### Implementation for User Story 3

- [x] T013 [US3] In `DataManagementDropdown.tsx`, apply `text-red-500` to the Reset entry's icon and label (conditionally based on `item.id === "reset"`), while keeping Export and Import entries with their normal `text-content/60` icon and `text-content` label styling, in `src/components/DataManagementDropdown.tsx`

**Checkpoint**: Reset entry is red, Export/Import unchanged.

### Tests for User Story 3

- [x] T014 [US3] Unit test: DataManagementDropdown renders the Reset entry with red styling and Export/Import with normal styling, in `tests/unit/DataManagementDropdown.test.tsx`

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Verify end-to-end and document build setup.

- [x] T020 Update existing tests in `tests/integration/LibraryContextMenu.test.tsx` to pass `isAuthorizedDevice={true}` in `defaultProps` so existing context menu tests continue to pass
- [x] T015 Verify that building without `AUTHORIZED_MACHINE_ID` env var results in all devices being unauthorized (no Delete, no DataManagement) — manual verification
- [x] T016 Verify that building with `AUTHORIZED_MACHINE_ID` set to the current machine's MachineGuid results in full access on this device — manual verification
- [x] T017 Run full test suite (`npm test`) and confirm all existing + new tests pass

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 (needs `machine-uid` crate)
- **US1 & US2 (Phase 3)**: Depends on T004 (needs `isAuthorizedDevice` state in App.tsx)
- **US3 (Phase 4)**: Independent of Phase 3 — can run in parallel
- **Polish (Phase 5)**: Depends on all story phases complete

### Within Each Phase

- T001 (single task)
- T002 → T003 (same Rust codebase, sequential)
- T004 (depends on T003 — command must exist before frontend calls it)
- T005 → T006 (sequential in LibraryScreen)
- T007 → T008 (sequential in TitleBar)
- T013 (single task in DataManagementDropdown)

### Parallel Opportunities

- T005-T006 (LibraryScreen) can run in parallel with T007-T008 (TitleBar) — different files
- T013 (US3, DataManagementDropdown) can run in parallel with T005-T008 (US1/US2)
- T009-T010 (Rust tests) can run in parallel with T011-T012 (frontend tests)

---

## Parallel Example: US1/US2 + US3

```text
# These modify different files and can run in parallel:

# Stream A (LibraryScreen.tsx):
T005 → T006  (US1: conditional Delete)

# Stream B (TitleBar.tsx):
T007 → T008  (US1: conditional DataManagement)

# Stream C (DataManagementDropdown.tsx):
T013  (US3: Reset red styling)

# Then tests (can also run in parallel across files):
T009, T010  (Rust tests)
T011, T012  (frontend integration tests)
T014  (frontend unit test)
```

---

## Implementation Strategy

### MVP First (US1 + US2)

1. Complete Phase 1 (T001) — dependency added
2. Complete Phase 2 (T002-T004) — backend command + frontend state
3. Complete Phase 3 (T005-T008) — conditional UI rendering
4. **STOP and VALIDATE**: Build with and without env var, verify behavior
5. Complete Phase 4 (T013) — Reset red styling
6. Tests (T009-T014) + Polish (T015-T017)

### Incremental Delivery

1. T001-T003 → Backend ready
2. T004 → Frontend has authorization flag
3. T005-T008 → Actions hidden/shown correctly
4. T013 → Reset styled red
5. Each increment is independently verifiable

---

## Notes

- The `AUTHORIZED_MACHINE_ID` env var must be set at build time. To find your machine's ID, run `machine_uid::get()` in a Rust snippet or check the Windows registry at `HKLM\SOFTWARE\Microsoft\Cryptography\MachineGuid`.
- The `option_env!()` macro returns `Option<&str>` — if not set, the comparison always fails (safe default: unauthorized).
- Existing tests for LibraryScreen context menu (from feature 035) are updated in T020 to pass the new `isAuthorizedDevice` prop.
