# Research: Multi-Text Library

**Feature**: 024-multi-text-library
**Date**: 2026-02-23

## R-001: SQLite Schema Migration Strategy

**Decision**: Drop-and-recreate (fresh schema, no data migration)

**Rationale**: The local database was explicitly wiped before this feature. The existing singleton schema (`CHECK (id = 1)`) is incompatible with multi-text. Since there is no user data to preserve and this is a single-user desktop app with no deployed user base, a clean schema start is the simplest and safest approach. The `initialize_database` function in `database.rs` will create the new multi-row schema directly.

**Alternatives considered**:
- **ALTER TABLE migration**: Would require removing the `CHECK (id = 1)` constraint, adding `title` and `created_at` columns. SQLite's limited ALTER TABLE support makes constraint removal complex (requires table recreation). Rejected as unnecessary given the clean slate.
- **Versioned migration system** (e.g., `schema_version` table): Over-engineering for a single schema change with no existing data. Could be introduced later if needed.

## R-002: Text Identity Strategy

**Decision**: SQLite `INTEGER PRIMARY KEY AUTOINCREMENT` for Text ID

**Rationale**: Provides stable, monotonically increasing identifiers. AUTOINCREMENT ensures IDs are never reused after deletion (important for referential integrity if the schema grows). The ID is the Text's domain identity, used in all IPC calls.

**Alternatives considered**:
- **UUID**: Unnecessary for a single-user desktop app. Adds complexity, is larger in storage, and slower to index.
- **ROWID without AUTOINCREMENT**: SQLite reuses rowids after deletion. While unlikely to cause issues in practice, AUTOINCREMENT prevents this class of bugs entirely at negligible cost.

## R-003: Timestamps Format and Storage

**Decision**: ISO 8601 strings (`YYYY-MM-DDTHH:MM:SS`) stored as TEXT in SQLite, generated in Rust via `chrono::Local::now()`

**Rationale**: SQLite has no native datetime type; TEXT with ISO 8601 is the recommended approach. Sorting by `created_at DESC` works correctly with ISO 8601 string comparison. The `chrono` crate is the standard Rust datetime library — lightweight and well-maintained. Local time (not UTC) is used because this is a personal desktop app with no timezone coordination needs; the display format matches user expectations.

**Alternatives considered**:
- **Unix timestamps (INTEGER)**: Compact but requires conversion for display. ISO 8601 is human-readable in the database and in IPC payloads.
- **UTC with conversion**: Adds complexity (timezone conversion in frontend) with no benefit for a single-machine app.

## R-004: Frontend View State Management

**Decision**: Extend the existing `AppView` union type to include `"library"`, replacing `"empty"`. The `useTextLoader` hook is rewritten to manage both the `TextPreview[]` list and the active `Text | null`.

**Rationale**: The current architecture centralizes all text state and view transitions in `useTextLoader`. This pattern works well and should be preserved. Adding `"library"` as a view state and `TextPreview[]` as a new state field is a natural extension. The hook remains the single source of truth for navigation and data.

**Alternatives considered**:
- **React Router or separate routing library**: Over-engineering for 4 views with no URL semantics. The existing union-type state machine is simpler and sufficient.
- **Separate hooks for library and reading**: Would split the state machine across hooks, making transitions harder to coordinate. A single hook avoids this.
- **React Context for global state**: The hook is already lifted to `App.tsx` and passed down via props. Context adds indirection without benefit for this component tree depth.

## R-005: Right-Click Context Menu Implementation

**Decision**: Native `onContextMenu` event handler on `TextPreviewCard`, rendering a custom React context menu component positioned at click coordinates.

**Rationale**: The app already implements a custom context menu pattern for `WordContextMenu` in `TextDisplay.tsx` (positioned at element coordinates, with click-outside dismissal). Reusing this proven pattern for the delete context menu ensures consistency and avoids new dependencies. The menu has a single entry ("Delete") plus a confirmation step.

**Alternatives considered**:
- **Tauri native context menu** (`tauri-plugin-context-menu`): Would provide OS-native look but adds a plugin dependency. The existing app already uses custom menus, so visual consistency favors the React approach.
- **Browser `contextmenu` event with `<menu>` element**: Poor cross-platform support and limited styling. Not viable.

## R-006: Atomic Text Creation (Process + Save)

**Decision**: The `create_text` IPC command atomically processes the raw input and inserts the full Text (with segments) in a single database transaction.

**Rationale**: The current flow has a two-step process: `save_text` (stores raw input with empty segments) then `process_text` (processes and updates). This was designed for the single-text model where the text could exist in a "saved but not processed" state. In the multi-text model, a Text must never exist without its segments (it would appear in the library as a broken entry). Atomic creation eliminates this invalid state.

**Alternatives considered**:
- **Two-step creation (save draft, then process)**: Matches the current flow but introduces a risk of orphaned drafts. Adds complexity for no user benefit.
- **Optimistic UI (show in library before processing completes)**: Would require a "processing" state per text in the library. Over-engineering for a sub-second processing time on texts ≤1500 chars.

## R-007: Pinyin Update Strategy

**Decision**: Targeted segment update via `update_pinyin(text_id, segment_index, new_pinyin)` instead of re-saving the entire Text.

**Rationale**: The current `updatePinyin` in `useTextLoader` patches the full in-memory `Text` object and calls `save_text(entireText)`. With multi-text and potentially larger datasets, re-serializing and writing the entire segments JSON on every pinyin correction is wasteful. A targeted update (`UPDATE texts SET segments = json_set(segments, ...) WHERE id = ?`) is more efficient and aligns with the CQRS command pattern. However, since SQLite stores segments as a JSON blob, the actual implementation will load segments, patch in Rust, and write back — still scoped to a single row rather than the entire table.

**Alternatives considered**:
- **Full text re-save on each correction**: Simple but increasingly costly as text count grows. The current approach already works this way, but scaling it to multi-text is suboptimal.
- **Separate `words` table with per-word rows**: Would enable true single-row updates but requires a major schema redesign (normalized form). Over-engineering given the max 1500-char text size.

## R-008: Chrono Crate Dependency

**Decision**: Add `chrono` crate to `src-tauri/Cargo.toml` for timestamp generation.

**Rationale**: `chrono` is the de facto standard Rust datetime library. It's already widely used in the Rust ecosystem and provides `Local::now().format(...)` for ISO 8601 formatting. The alternative (`time` crate) has a more complex API for this use case.

**Alternatives considered**:
- **`time` crate**: Viable but requires more boilerplate for local time formatting.
- **Manual formatting via `std::time::SystemTime`**: Error-prone and verbose. Not worth avoiding a well-established dependency.
