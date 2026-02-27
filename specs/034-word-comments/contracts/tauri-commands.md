# Tauri Command Contracts: Word Comments

**Feature Branch**: `034-word-comments` | **Date**: 2026-02-27

## New Commands

### `update_word_comment`

Save or delete a comment on a specific Word segment.

**Direction**: Frontend → Backend (Command / write operation)

**Parameters**:
```typescript
invoke("update_word_comment", {
  textId: number,        // Text ID
  segmentIndex: number,  // Index in the segments array
  comment: string | null // Comment text (null = delete)
})
```

**Returns**: `Result<(), AppError>`

**Backend logic**:
1. Load the text by ID (fail if not found)
2. Check if the text is locked (fail with `AppError::Validation` if locked)
3. Load and parse the segments JSON
4. Validate segment index is in bounds and is a Word segment
5. If `comment` is non-null and non-empty:
   - Validate length <= 5000 characters
   - Set `word.comment = Some(comment)`
6. If `comment` is null or empty:
   - Set `word.comment = None`
7. Serialize segments back to JSON
8. UPDATE the text's segments and modified_at columns

**Error cases**:
- Text not found → `AppError::Database`
- Text is locked → `AppError::Validation("Cannot modify comments on a locked text")`
- Segment index out of bounds → `AppError::Validation`
- Segment is not a Word → `AppError::Validation`
- Comment exceeds 5000 characters → `AppError::Validation`

---

## Modified Commands

### `split_segment` (existing)

**Change**: Add validation to reject split if the target Word has a comment.

**New error case**:
- Word has a comment → `AppError::Validation("Cannot split a word that has a comment. Delete the comment first.")`

### `merge_segments` (existing)

**Change**: Add validation to reject merge if either involved Word has a comment.

**New error case**:
- Either word has a comment → `AppError::Validation("Cannot merge words that have comments. Delete the comment(s) first.")`

---

## Component Contract: WordCommentDialog

**Props**:
```typescript
interface WordCommentDialogProps {
  open: boolean;
  word: Word | null;             // The Word being commented (null = dialog closed)
  segmentIndex: number;          // Segment index for the save operation
  textId: number;                // Text ID for the save operation
  onSave: (segmentIndex: number, comment: string | null) => void;
  onClose: () => void;
}
```

**Behavior**:
- When `open=true` and `word` is provided, show a modal dialog
- Pre-fill textarea with `word.comment` if it exists, empty otherwise
- "Save" button: calls `onSave(segmentIndex, commentText)` — if text is empty, passes `null` (delete)
- "Delete" button (visible only when editing existing comment): calls `onSave(segmentIndex, null)`
- "Cancel" button / Escape / click outside: calls `onClose()`
- Character counter: shows `{length}/5000`
- Auto-focus the textarea on open

---

## Component Contract: CommentsPanel

**Props**:
```typescript
interface CommentsPanelProps {
  segments: TextSegment[];       // All segments of the current Text
  isOpen: boolean;               // Panel visibility state
  onToggle: () => void;          // Toggle open/closed
  onCommentClick: (segmentIndex: number) => void; // Open dialog for this comment
  locked: boolean;               // If true, clicking a comment does nothing
}
```

**Behavior**:
- Renders a fixed-width panel on the right side of the reading view
- When `isOpen=true`: shows all Words that have a `comment`, in document order
- Each entry shows: Word characters + comment text
- When `isOpen=false`: shows only the toggle button (collapsed state)
- Toggle button: calls `onToggle()`
- Clicking a comment entry: calls `onCommentClick(segmentIndex)` if not locked
- Empty state: when open with no comments, show "No comments" message
