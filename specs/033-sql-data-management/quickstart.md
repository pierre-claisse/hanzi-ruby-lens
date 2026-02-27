# Quickstart: SQL Data Management

**Feature Branch**: `033-sql-data-management`
**Date**: 2026-02-27

## Prerequisites

- Node.js and npm installed on host
- Docker for test/build execution
- Project cloned and on branch `033-sql-data-management`

## New Dependency

This feature requires the Tauri dialog plugin for native file save/open dialogs and confirmation messages.

**Rust** (`src-tauri/Cargo.toml`):
```toml
tauri-plugin-dialog = "2"
```

**Frontend** (`package.json`):
```json
"@tauri-apps/plugin-dialog": "^2.0.0"
```

**Plugin registration** (`src-tauri/src/lib.rs`):
```rust
.plugin(tauri_plugin_dialog::init())
```

**Tauri config** (`src-tauri/tauri.conf.json` or `capabilities/`):
- Add `dialog:default` capability for file dialogs
- Add `dialog:allow-save` and `dialog:allow-open` permissions

## Files to Create

| File | Purpose |
|------|---------|
| `src/components/DataManagementDropdown.tsx` | Dropdown component with Export/Import/Reset actions |

## Files to Modify

| File | Change |
|------|--------|
| `src-tauri/Cargo.toml` | Add `tauri-plugin-dialog` dependency |
| `package.json` | Add `@tauri-apps/plugin-dialog` dependency |
| `src-tauri/src/lib.rs` | Register dialog plugin + 3 new commands |
| `src-tauri/src/commands.rs` | Add `export_database`, `import_database`, `reset_database` commands |
| `src-tauri/src/database.rs` | Add `export_all`, `import_all`, `reset_all` functions |
| `src-tauri/src/domain.rs` | Add `ExportPayload`, `ExportResult`, `ImportResult` structs |
| `src/components/TitleBar.tsx` | Add DataManagementDropdown between tags and palette buttons |
| `src/hooks/useTextLoader.ts` | Add refresh callback for post-import/reset state update |

## Key Patterns to Follow

1. **Rust commands**: Follow existing `commands.rs` pattern — `app_handle.db()` / `app_handle.db_mut()`
2. **Dropdown UI**: Follow `PaletteSelector.tsx` pattern — accessible listbox, keyboard nav, click-outside
3. **Error handling**: Use existing `AppError` enum (Database, Io, Validation variants)
4. **Frontend invoke**: Use `invoke<T>("command_name", { params })` pattern from `useTextLoader.ts`
5. **Transactions**: Use `conn.transaction()` for atomicity (existing pattern in `insert_text`)

## Testing Approach

- **Contract tests**: Verify Tauri command invocations with expected parameters
- **Unit tests (Rust)**: Test `export_all`, `import_all`, `reset_all` database functions with in-memory SQLite
- **Unit tests (Frontend)**: Test DataManagementDropdown rendering and interaction
- **Integration tests**: Test full export → import round-trip preserves all data
