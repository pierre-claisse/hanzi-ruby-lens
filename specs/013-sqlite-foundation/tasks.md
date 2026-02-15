# Tasks: SQLite Foundation

**Input**: Design documents from `specs/013-sqlite-foundation/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Included — the constitution requires extensive tests (Principle V), and the project enforces 100% vitest coverage. Rust unit tests use in-memory SQLite for isolation. Contract, integration, and unit levels all covered.

**Organization**: Tasks grouped by user story. US1 is the MVP — all real implementation. US2/US3 are verification layers confirming guarantees through additional tests.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Dependencies & Types)

**Purpose**: Add Rust dependencies and create foundational type modules

- [X] T001 Add `rusqlite = { version = "0.38", features = ["bundled"] }` and `thiserror = "2"` to `src-tauri/Cargo.toml`
- [X] T002 [P] Create Rust domain types (Word, TextSegment tagged enum, Text) with serde derives in `src-tauri/src/domain.rs`
- [X] T003 [P] Create AppError enum (Database, Io variants) with thiserror derive + Serialize impl in `src-tauri/src/error.rs`
- [X] T004 [P] Create AppState struct (`Mutex<Option<Connection>>`) and ServiceAccess trait (`db()`, `db_mut()`) on AppHandle in `src-tauri/src/state.rs`

---

## Phase 2: Foundational (Database Infrastructure)

**Purpose**: Database initialization and wiring — MUST complete before any user story

**CRITICAL**: No user story work can begin until this phase is complete

- [X] T005 Implement `initialize(db_path: PathBuf)` in `src-tauri/src/database.rs` — open connection at given path, WAL mode, CREATE TABLE IF NOT EXISTS texts (id CHECK=1, raw_input, segments). The function takes a path (not AppHandle) so Rust unit tests and US3 file tests can call it directly with temp directories. The setup hook in lib.rs resolves `app_data_dir` and passes the path.
- [X] T006 Update `src-tauri/src/lib.rs` — declare modules (domain, database, commands, state, error), register AppState via manage(), add setup hook that resolves `app_handle.path().app_data_dir()`, creates the directory, and calls `database::initialize(db_path)`, add invoke_handler placeholder
- [X] T007 Add optional `rawInput?: string` field to Text interface in `src/types/domain.ts`

**Checkpoint**: Database initializes on app startup, schema exists, modules compile

---

## Phase 3: User Story 1 — Text Persists Across Sessions (Priority: P1) MVP

**Goal**: Save a Text with segments and pinyin, close the app, reopen it, see the same Text rendered identically

**Independent Test**: Save a Text with known segments via Rust unit test, call load, verify 100% data fidelity. On frontend, mock invoke to return saved text, verify App renders it.

### Rust Backend (US1)

- [X] T008 [US1] Implement `save_text()` in `src-tauri/src/database.rs` — transaction: DELETE FROM texts + INSERT (id=1, raw_input, segments as JSON)
- [X] T009 [US1] Implement `load_text()` in `src-tauri/src/database.rs` — SELECT raw_input, segments WHERE id=1, deserialize JSON, return Option\<Text\> (None if no rows)
- [X] T010 [US1] Create Tauri command handlers `save_text` and `load_text` using ServiceAccess trait in `src-tauri/src/commands.rs`
- [X] T011 [US1] Register save_text and load_text in `generate_handler![]` in `src-tauri/src/lib.rs`

### Rust Tests (US1)

- [X] T012 [US1] Rust unit tests in `src-tauri/src/database.rs` — test save/load round-trip with mixed Word+Plain segments (verify characters, pinyin, segment order, raw_input); test load on empty DB returns None; test initialize creates schema; test opening a non-SQLite file (corrupted DB) returns error not panic (FR-010)

### Contract Tests (US1)

- [X] T013 [US1] Create `tests/contract/text-commands.test.ts` — contract tests for the Tauri command interface: verify save_text accepts a Text object with segments and rawInput via invoke("save_text", { text }); verify load_text returns Text | null via invoke("load_text"); mock `@tauri-apps/api/core` invoke and validate command names and payload shapes match the contracts in contracts/save-text.md and contracts/load-text.md

### Frontend (US1)

- [X] T014 [P] [US1] Create `src/hooks/useTextLoader.ts` — invoke("load_text"), return `{ text, isLoading }`; default state is sampleText; on success with non-null response, update text; on null or error, keep sampleText
- [X] T015 [P] [US1] Create `src/hooks/useTextLoader.test.ts` — mock `@tauri-apps/api/core` invoke; test: returns sampleText initially (isLoading=true), then loaded text on success; returns sampleText on null response (first launch); returns sampleText on invoke error (corrupted DB)
- [X] T016 [US1] Update `src/App.tsx` — replace `import { sampleText }` + `text={sampleText}` with `useTextLoader()` hook; pass `text` to TextDisplay
- [X] T017 [US1] Update `src/App.test.tsx` — add mock for `@tauri-apps/api/core` invoke (return null by default = first launch fallback); verify existing assertions still pass (rubies > 0, 7 buttons, theme toggle)
- [X] T018 [US1] Create `tests/integration/text-persistence.test.tsx` — mock invoke to return a specific Text object; render App; verify the loaded text's words appear in the document (not just sampleText)

**Checkpoint**: Full save/load pipeline works. App loads persisted text or falls back to sample. All existing tests still pass.

---

## Phase 4: User Story 2 — Save Text Replaces Previous (Priority: P2)

**Goal**: When a new Text is saved, it fully replaces the previous one. Atomic — failure preserves old data.

**Independent Test**: Save Text A, save Text B, load returns only B. Save empty Text, load returns empty.

### Rust Tests (US2)

- [X] T019 [US2] Rust unit test in `src-tauri/src/database.rs` — save Text A (with segments), save Text B (different segments), load returns only Text B with correct data
- [X] T020 [US2] Rust unit test in `src-tauri/src/database.rs` — save empty Text (0 segments, empty raw_input), load returns Some(Text) with empty segments vec

**Checkpoint**: Replace semantics verified. Empty Text save verified. Combined with US1, the full save/load/replace contract is proven.

---

## Phase 5: User Story 3 — Database File Accessible for Backup (Priority: P3)

**Goal**: The database file is a standard SQLite file at a known location, inspectable by external tools

**Independent Test**: After initialize + save, verify the file exists and is valid SQLite (openable by a fresh connection, texts table queryable).

### Rust Tests (US3)

- [X] T021 [US3] Rust unit test in `src-tauri/src/database.rs` — call `initialize(temp_dir.join("test.db"))` then `save_text`, verify the .db file exists at the expected path (uses the path-parameterized initialize from T005)
- [X] T022 [US3] Rust unit test in `src-tauri/src/database.rs` — open the saved DB file with a fresh `rusqlite::Connection` (no app state), query texts table, verify data is readable by an external connection

**Checkpoint**: Database file portability verified. A user can copy the file and inspect it with sqlite3 or DB Browser.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Full-stack verification and build validation

- [X] T023 Run all tests via `npm run test` (Docker) — verify all existing 202+ tests pass alongside new tests (SC-006)
- [X] T024 Run `npm run build` — verify Docker build succeeds with rusqlite bundled feature compiling SQLite from source

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 (T001 must complete for Rust compilation; T002-T004 provide types used by T005-T006)
- **US1 (Phase 3)**: Depends on Phase 2 — database infrastructure must exist
- **US2 (Phase 4)**: Depends on US1 T008-T009 (save/load functions must exist to test replace behavior)
- **US3 (Phase 5)**: Depends on Phase 2 T005 (initialize must exist to test file creation)
- **Polish (Phase 6)**: Depends on all previous phases

### Within Each Phase

- **Phase 1**: T001 first (dependencies must resolve), then T002/T003/T004 in parallel
- **Phase 2**: T005 depends on T004 (uses Connection type); T006 depends on T002-T005 (declares all modules); T007 independent
- **Phase 3 Rust**: T008/T009 sequential (same file), then T010 (uses both), then T011
- **Phase 3 Tests**: T012 after T008-T009; T013 after T010 (tests command interface)
- **Phase 3 Frontend**: T014/T015 parallel (different files), then T016 (uses hook), then T017/T018
- **Phase 3 Backend + Frontend**: Can proceed in parallel until T016 (frontend integration point)

### Parallel Opportunities

```text
# After T001 completes:
Parallel: T002, T003, T004 (three independent Rust modules)

# After Phase 2 completes:
Parallel: T007 (TypeScript types) alongside T008/T009 (Rust database ops)

# Within US1 frontend work:
Parallel: T014 (hook), T015 (hook test) — different files

# US2 and US3 can start as soon as their dependencies are met:
US2 (T019-T020) can start after T008-T009
US3 (T021-T022) can start after T005
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (4 tasks)
2. Complete Phase 2: Foundational (3 tasks)
3. Complete Phase 3: US1 (11 tasks)
4. **STOP and VALIDATE**: Run `npm run test` — all 202+ existing tests pass, new tests pass
5. Build with `npm run build` — verify rusqlite compiles in Docker

### Incremental Delivery

1. Setup + Foundational → Database initializes, schema exists
2. US1 → Full save/load pipeline + frontend integration + contract tests (MVP!)
3. US2 → Replace semantics verified through tests
4. US3 → File portability verified through tests
5. Polish → Full Docker test + build validation

---

## Summary

| Phase | Tasks | Story |
|-------|-------|-------|
| Setup | 4 (T001–T004) | — |
| Foundational | 3 (T005–T007) | — |
| US1 (P1) MVP | 11 (T008–T018) | Text Persists Across Sessions |
| US2 (P2) | 2 (T019–T020) | Save Replaces Previous |
| US3 (P3) | 2 (T021–T022) | Database File Accessible |
| Polish | 2 (T023–T024) | — |
| **Total** | **24** | |

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Rust unit tests use in-memory SQLite (`Connection::open_in_memory()`) except US3 which tests file creation via `initialize(path)`
- Frontend tests mock `@tauri-apps/api/core` invoke — no Tauri runtime needed in vitest/happy-dom
- Contract tests validate the Tauri command interface shapes match the spec contracts
- The `save_text` command is built and tested but NOT wired to any UI — it's infrastructure for future features
- `database::initialize(db_path)` is path-parameterized for testability — the Tauri setup hook resolves the actual app data path
- Commit after each completed phase or logical group
