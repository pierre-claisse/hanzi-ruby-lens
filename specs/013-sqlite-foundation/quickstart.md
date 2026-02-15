# Quickstart: SQLite Foundation

**Feature**: 013-sqlite-foundation | **Date**: 2026-02-15

## New Dependencies

### Cargo.toml additions

```toml
rusqlite = { version = "0.38", features = ["bundled"] }
thiserror = "2"
```

- `bundled`: compiles SQLite from source (no system library needed; works in Docker)
- `thiserror`: ergonomic error types with `Serialize` for Tauri commands

### No new npm packages needed

The frontend uses `@tauri-apps/api/core` (already available) for `invoke()`.

## New Rust Files

| File | Purpose |
|------|---------|
| `src-tauri/src/domain.rs` | Rust domain types: `Word`, `TextSegment`, `Text` |
| `src-tauri/src/database.rs` | SQLite init, schema creation, `save_text`, `load_text` |
| `src-tauri/src/commands.rs` | Tauri `#[tauri::command]` handlers |
| `src-tauri/src/state.rs` | `AppState` (Mutex-wrapped Connection), `ServiceAccess` trait |
| `src-tauri/src/error.rs` | `AppError` enum with thiserror |

## Modified Files

| File | Change |
|------|--------|
| `src-tauri/src/lib.rs` | Register state, commands, setup hook |
| `src-tauri/Cargo.toml` | Add rusqlite + thiserror |
| `src/types/domain.ts` | Add optional `rawInput` to `Text` |
| `src/App.tsx` | Use `useTextLoader` hook instead of hardcoded `sampleText` |

## New Frontend Files

| File | Purpose |
|------|---------|
| `src/hooks/useTextLoader.ts` | Hook: invoke `load_text`, fallback to `sampleText` |

## New Test Files

| File | Purpose |
|------|---------|
| `src-tauri/src/database.rs` (inline tests) | Rust unit tests: in-memory SQLite, save/load/replace/empty |
| `src/hooks/useTextLoader.test.ts` | Frontend: mock invoke, test load + fallback behavior |
| `tests/integration/text-persistence.test.tsx` | Integration: mock invoke, verify App renders loaded text |

## Key Patterns

### Tauri Managed State

```rust
// state.rs
pub struct AppState {
    pub db: Mutex<Option<Connection>>,
}
```

### ServiceAccess Trait

```rust
// state.rs — ergonomic DB access from AppHandle
impl ServiceAccess for AppHandle {
    fn db<F, T>(&self, op: F) -> T where F: FnOnce(&Connection) -> T { ... }
    fn db_mut<F, T>(&self, op: F) -> T where F: FnOnce(&mut Connection) -> T { ... }
}
```

### Database Initialization (setup hook)

```rust
// lib.rs
.setup(|app| {
    let handle = app.handle().clone();
    let db = database::initialize(&handle)?;
    *handle.state::<AppState>().db.lock().unwrap() = Some(db);
    Ok(())
})
```

### Frontend Hook Pattern

```typescript
// useTextLoader.ts
export function useTextLoader(): { text: Text; isLoading: boolean } {
  const [text, setText] = useState<Text>(sampleText);
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    invoke<Text | null>("load_text")
      .then((loaded) => { if (loaded) setText(loaded); })
      .catch((err) => console.error("Failed to load text:", err))
      .finally(() => setIsLoading(false));
  }, []);
  return { text, isLoading };
}
```

## Testing Commands

```bash
# Rust tests (inside Docker)
cargo test

# Frontend tests (inside Docker)
npx vitest run

# Full test suite
npm run test
```

## Database Location

Windows: `%APPDATA%\com.hanzirubylens.app\hanzi-ruby-lens.db`

Can be inspected with any SQLite tool (DB Browser for SQLite, `sqlite3` CLI, etc.).
