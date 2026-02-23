# Quickstart: Multi-Text Library

**Feature**: 024-multi-text-library
**Date**: 2026-02-23

## Prerequisites

- Node.js and npm installed on host
- Docker running (for tests and builds)
- On branch `024-multi-text-library`

## Key Files to Understand

Before implementation, read these files in order:

1. **Domain types** — understand what changes:
   - `src/types/domain.ts` (current: no id/title/createdAt)
   - `src-tauri/src/domain.rs` (Rust mirror)

2. **Database** — understand the singleton pattern being replaced:
   - `src-tauri/src/database.rs` (current: `CHECK (id = 1)`)

3. **Commands** — understand current IPC surface:
   - `src-tauri/src/commands.rs` (current: save_text, load_text, process_text)

4. **Frontend state** — understand the view state machine:
   - `src/hooks/useTextLoader.ts` (current: single Text, 4 views)
   - `src/App.tsx` (current: view routing)

5. **Feature spec and contracts** — understand what to build:
   - `specs/024-multi-text-library/spec.md`
   - `specs/024-multi-text-library/contracts/tauri-ipc.md`
   - `specs/024-multi-text-library/data-model.md`

## Implementation Order

### Layer 1: Rust Backend (no frontend dependency)

1. Update `domain.rs` — add `id`, `title`, `created_at` to `Text`; add `TextPreview`
2. Rewrite `database.rs` — new schema, new operations (insert, list, load_by_id, update_segments, delete)
3. Rewrite `commands.rs` — new IPC surface (create_text, list_texts, load_text, update_pinyin, delete_text)
4. Update `lib.rs` — register new commands
5. Add `chrono` dependency to `Cargo.toml`
6. Run `cargo test` to verify backend

### Layer 2: TypeScript Types (bridge)

7. Update `domain.ts` — add `id`, `title`, `createdAt` to `Text`; add `TextPreview` interface

### Layer 3: Frontend (depends on types)

8. Rewrite `useTextLoader.ts` — multi-text state: `previews: TextPreview[]`, `activeText: Text | null`, new operations
9. Create `LibraryScreen.tsx` — grid of previews, add button, empty state
10. Create `TextPreviewCard.tsx` — title + date display, right-click context menu for delete
11. Modify `TextInputView.tsx` — add title input field
12. Modify `TitleBar.tsx` — remove Edit button, add Back button
13. Modify `TextDisplay.tsx` — show title header (or handle in App.tsx reading view)
14. Rewrite `App.tsx` — new view state machine (library → input → processing → reading)
15. Remove `EmptyState.tsx` (or leave unused)

### Layer 4: Tests

16. Update contract tests for new IPC commands
17. Update integration tests for library → input → processing → reading flow
18. Update unit tests for view derivation and navigation logic

## Running Tests

```sh
npm test              # All tests (frontend + Rust) in Docker
cargo test            # Rust tests only (inside Docker)
```

## Key Design Decisions

- **Atomic text creation**: `create_text` processes + inserts in one transaction (no draft state)
- **Targeted pinyin update**: `update_pinyin(textId, segmentIndex, newPinyin)` instead of full-text re-save
- **TextPreview projection**: Library loads only `id, title, created_at` — never full segments
- **No migration**: Clean schema start (database was wiped)
- **Right-click delete**: Context menu on preview cards, matching existing WordContextMenu pattern
