# Quickstart: Word Comments

**Feature Branch**: `034-word-comments` | **Date**: 2026-02-27

## Dependencies

No new dependencies required. This feature uses only existing packages.

## Files to Modify

### Backend (Rust)

| File | Change |
|------|--------|
| `src-tauri/src/domain.rs` | Add optional `comment: Option<String>` field to `Word` struct with `skip_serializing_if` |
| `src-tauri/src/database.rs` | Add `update_word_comment()` function; add comment checks to `split_segment_db()` and `merge_segments_db()` |
| `src-tauri/src/commands.rs` | Add `update_word_comment` Tauri command |
| `src-tauri/src/lib.rs` | Register `update_word_comment` in invoke handler |

### Frontend (TypeScript/React)

| File | Change |
|------|--------|
| `src/types/domain.ts` | Add optional `comment?: string` field to `Word` interface |
| `src/components/WordContextMenu.tsx` | Add `"comment"` to `MenuAction` union type |
| `src/components/TextDisplay.tsx` | Add "Comment" menu entry in `buildMenuEntries()`; add comment checks to split/merge disabled flags; handle "comment" action |
| `src/components/RubyWord.tsx` | Add visual indicator (dot) for Words with comments |
| `src/App.tsx` | Adjust reading view layout for side panel; add comment dialog state and handlers |
| `src/hooks/useTextLoader.ts` | Add `updateComment` function that calls `update_word_comment` and refreshes text |

### New Files

| File | Purpose |
|------|---------|
| `src/components/WordCommentDialog.tsx` | Modal dialog for creating/editing/deleting a comment |
| `src/components/CommentsPanel.tsx` | Collapsible side panel listing all comments for current Text |

## Patterns to Follow

- **Tauri command**: Follow `update_segments` pattern in `database.rs` (load → validate → mutate → serialize → UPDATE)
- **Dialog component**: Follow `ManageTagsDialog` pattern (overlay + centered modal + header/body/footer)
- **Context menu entry**: Follow existing disabled/lock pattern in `buildMenuEntries()`
- **Side panel**: New pattern — fixed-width div alongside `max-w-5xl` text container

## Integration Scenarios

1. **Add comment**: Right-click Word → "Comment" → type in dialog → Save → comment persisted, visual indicator appears, panel shows comment
2. **Edit comment**: Right-click Word or click in panel → dialog pre-filled → edit → Save → comment updated
3. **Delete comment**: Dialog → Delete button or clear text + Save → comment removed, indicator removed
4. **Locked text**: "Comment" menu entry disabled, panel entries not clickable for editing
5. **Split blocked**: Word with comment → split entries disabled in menu, backend rejects if somehow called
6. **Merge blocked**: Either word has comment → merge entries disabled, backend rejects if somehow called
7. **Export/import**: Comments travel inside segments JSON — no special handling needed
