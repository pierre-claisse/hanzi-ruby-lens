# Research: SQLite Foundation

**Feature**: 013-sqlite-foundation | **Date**: 2026-02-15

## Decision 1: SQLite Integration Crate

**Decision**: Use `rusqlite` 0.38 with `bundled` feature.

**Rationale**: The `bundled` feature compiles SQLite from source via `cc`, eliminating system library dependency. This is essential for the Windows Docker build environment (VS Build Tools already present). No need for async (the app has one user, one connection) so `rusqlite` over `sqlx`.

**Alternatives considered**:
- `sqlx` — async, compile-time query checking. Overkill for single-user desktop app with two queries. Adds complexity (async runtime) for no benefit.
- `diesel` — full ORM. Way too heavy for a single table with JSON blobs.
- `tauri-plugin-sql` — Tauri community plugin wrapping sqlx. Adds plugin abstraction layer we don't need; less control over schema and error handling.

## Decision 2: Connection Management

**Decision**: Wrap `rusqlite::Connection` in `std::sync::Mutex<Option<Connection>>` as Tauri managed state.

**Rationale**: `Connection` is `Send` but not `Sync`. Tauri's `manage()` requires `Send + Sync + 'static`. `Mutex` provides `Sync`. `Option` because the state struct is registered before the setup hook creates the connection. This is the established pattern from the Tauri community (RandomEngy/tauri-sqlite reference implementation).

**Alternatives considered**:
- Bare `Connection` — won't compile (`!Sync`).
- `tokio::Mutex` — unnecessary; SQLite operations are fast and synchronous. `std::sync::Mutex` is simpler and avoids async overhead.
- Connection pool (`r2d2`) — single-user app, single connection. Pool adds complexity for zero benefit.

## Decision 3: Data Storage Strategy

**Decision**: Single row with JSON blob for segments. Table `texts` with columns: `id INTEGER PRIMARY KEY CHECK (id = 1)`, `raw_input TEXT`, `segments TEXT` (JSON array).

**Rationale**: The app holds exactly one Text (constitutional invariant). The Text is always loaded/saved as a whole — no partial queries, no segment-level operations. JSON preserves the discriminated union structure (`type: "word"` / `type: "plain"`) naturally via serde's tagged enum serialization. The `CHECK (id = 1)` constraint enforces the single-Text invariant at the database level.

**Alternatives considered**:
- Normalized tables (texts + segments + words) — requires joins, position columns, polymorphic schema. All this to store one document that's always replaced atomically. YAGNI.
- Key-value store (single blob) — loses the ability to inspect raw_input vs segments separately in external tools. Slightly less readable.

## Decision 4: App Data Directory

**Decision**: Use `app_handle.path().app_data_dir()` from Tauri 2 core (`tauri::Manager` trait). No plugin needed.

**Rationale**: Built into Tauri 2. Resolves to `%APPDATA%\com.hanzirubylens.app\` on Windows. The directory is created by the app if it doesn't exist (`std::fs::create_dir_all`). Database file: `hanzi-ruby-lens.db`.

**Alternatives considered**:
- Hardcoded path — fragile, non-portable, violates platform conventions.
- `app_local_data_dir()` — puts data in `AppData\Local` instead of `AppData\Roaming`. Either works; `Roaming` is the standard for user data that should follow the user profile.

## Decision 5: Atomic Save Strategy

**Decision**: SQLite transaction wrapping DELETE + INSERT. WAL journal mode for reliability.

**Rationale**: Transaction guarantees FR-006 (atomic save). If INSERT fails, DELETE is rolled back, previous data preserved. WAL mode allows concurrent reads during writes (not critical for single-user, but is the modern SQLite default and improves crash resilience).

**Alternatives considered**:
- REPLACE INTO / INSERT OR REPLACE — simpler syntax but less explicit about the replace semantics. DELETE + INSERT in a transaction is clearer about the single-Text contract.
- Write to temp file + rename — file-level atomicity. Unnecessary when SQLite transactions already provide this.

## Decision 6: Error Handling

**Decision**: Custom `AppError` enum with `thiserror` derive. Implements `Serialize` for Tauri command return types.

**Rationale**: Tauri commands must return `Result<T, E>` where `E: Serialize`. `thiserror` provides ergonomic `From` conversions for `rusqlite::Error` and `std::io::Error`. The serialized form is a string message (sufficient for logging/fallback, no frontend error UI in this feature).

**Alternatives considered**:
- `.map_err(|e| e.to_string())` on every command — works but loses type information and is repetitive.
- `anyhow` — great for applications but doesn't implement `Serialize` without a wrapper. `thiserror` is the correct choice for library-style error types.

## Decision 7: Frontend Integration

**Decision**: Add `useTextLoader` hook that calls `invoke("load_text")` on mount. App falls back to `sampleText` if the command returns `null` or fails.

**Rationale**: Follows existing hook pattern (useTheme, useTextZoom, etc.). The hook handles the async Tauri invoke, loading state, and error fallback. App.tsx remains clean — it just uses the hook's return value.

**Alternatives considered**:
- Call invoke directly in App.tsx useEffect — works but mixes concerns. A hook is more testable and consistent with the codebase pattern.
- Tauri setup event — have the backend push the text on startup via an event. More complex wiring for no benefit; the frontend pulling on mount is simpler.

## Decision 8: TypeScript Domain Type Update

**Decision**: Add `rawInput?: string` (optional) to the `Text` interface. The Rust type has `raw_input: String` (required, defaults to `""`).

**Rationale**: The spec defines Text as containing "the raw input string." Making it optional in TypeScript preserves backward compatibility — existing test data and the sample text don't need updating. The Rust type always has it (empty string for the sample fallback). `serde(rename_all = "camelCase")` handles the naming convention difference.

**Alternatives considered**:
- Required in TypeScript — breaks all existing test fixtures and sample data. Unnecessary churn for a field that isn't used yet.
- Omit entirely — violates FR-001 ("persist the active Text (raw input string and all segments)").
