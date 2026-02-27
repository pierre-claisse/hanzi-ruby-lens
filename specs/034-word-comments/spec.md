# Feature Specification: Word Comments

**Feature Branch**: `034-word-comments`
**Created**: 2026-02-27
**Status**: Draft
**Input**: User description: "Ajouter la possibilite d'ajouter des notes/commentaires a un texte (par mot), avec panneau lateral retractable en vue lecture."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Add a Comment to a Word (Priority: P1)

While reading a Chinese text, the user wants to annotate a specific Word with a personal note (grammar explanation, mnemonic, cultural context, etc.). The user right-clicks a Word, selects "Comment" from the context menu, and types their comment in a dialog. The comment is saved and persisted across sessions.

**Why this priority**: This is the core interaction — without the ability to create comments, no other feature (panel, display) has value. It delivers immediate utility: the user can annotate any Word.

**Independent Test**: Open an unlocked Text in reading view, right-click a Word, select "Comment", type a note, confirm. Reload the text and verify the comment persists.

**Acceptance Scenarios**:

1. **Given** an unlocked Text in reading view, **When** the user right-clicks a Word and selects "Comment", **Then** a dialog opens with an empty text area for entering a comment.
2. **Given** the comment dialog is open with text entered, **When** the user confirms, **Then** the comment is saved and the dialog closes.
3. **Given** a Word already has a comment, **When** the user right-clicks it and selects "Comment", **Then** the dialog opens pre-filled with the existing comment, allowing the user to edit or delete it.
4. **Given** a locked Text, **When** the user opens the context menu, **Then** the "Comment" entry is disabled (grayed out with lock icon), just like Edit Pinyin and other editing actions.

---

### User Story 2 - View Comments in a Side Panel (Priority: P2)

While reading an annotated text, the user wants to see all their comments at a glance without right-clicking each word individually. A collapsible side panel on the right of the reading view lists all comments for the current Text, each clearly associated with its Word.

**Why this priority**: Viewing comments is the primary read-back mechanism. Without it, comments are hidden behind individual right-clicks, severely limiting their usefulness.

**Independent Test**: Open a Text that has comments in reading view. Verify the comments panel is visible, lists all comments in reading order, and each comment shows which Word it belongs to.

**Acceptance Scenarios**:

1. **Given** a Text with one or more comments, **When** the user opens it in reading view, **Then** the comments panel is open by default, showing all comments in document order.
2. **Given** a Text with no comments, **When** the user opens it in reading view, **Then** the comments panel is closed by default.
3. **Given** the comments panel is closed, **When** the user opens it on a Text with no comments, **Then** the panel displays a clear empty-state message indicating there are no comments.
4. **Given** the comments panel is open, **When** the user clicks the panel toggle, **Then** the panel collapses. Clicking again re-opens it.
5. **Given** the comments panel is open, **Then** each comment entry shows the associated Word's characters so the user can identify which Word the comment refers to.
6. **Given** the comments panel is open on an unlocked Text, **When** the user clicks a comment entry, **Then** the comment dialog opens pre-filled with that comment for editing or deleting.

---

### User Story 3 - Delete a Comment (Priority: P3)

The user wants to remove a comment they previously added to a Word. This can be done either from the comment dialog (clearing the text and confirming) or from the side panel.

**Why this priority**: Deletion is important for maintenance but less urgent than creation and viewing. Users can always overwrite with empty text, but an explicit delete action provides a cleaner experience.

**Independent Test**: Add a comment to a Word, then delete it via the dialog. Verify the comment no longer appears in the side panel and the Word is no longer marked as commented.

**Acceptance Scenarios**:

1. **Given** a Word with an existing comment on an unlocked Text, **When** the user opens the comment dialog, clears the text, and confirms, **Then** the comment is deleted.
2. **Given** a Word with an existing comment on an unlocked Text, **When** the user clicks a delete button in the comment dialog, **Then** the comment is deleted and the dialog closes.
3. **Given** the last comment on a Text is deleted, **Then** the comments panel remains open (does not auto-close) but shows the empty-state message.

---

### Edge Cases

- What happens when a Word with a comment is split? The split is blocked — the user must delete the comment first.
- What happens when a merge involves a Word that has a comment? The merge is blocked — the user must delete the comment(s) first.
- What is the maximum length of a comment? Comments are limited to 5000 characters.
- What happens to comments on export/import? Comments MUST be included in the JSON export payload and restored on import, preserving word-to-comment associations.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Each Word in a Text MUST support at most one comment (a free-text note).
- **FR-002**: The context menu for a Word MUST include a "Comment" entry, positioned between "Copy" and "Edit Pinyin".
- **FR-003**: The "Comment" menu entry MUST be disabled (with lock icon) when the Text is locked, consistent with other editing actions.
- **FR-004**: Selecting "Comment" from the context menu MUST open a modal dialog with a text area for entering or editing the comment.
- **FR-005**: The comment dialog MUST pre-fill the existing comment when editing, or show an empty text area when creating.
- **FR-006**: The comment dialog MUST provide a confirm action (save) and a cancel action (discard changes).
- **FR-007**: The comment dialog MUST provide a delete action when editing an existing comment.
- **FR-008**: Comments MUST be persisted in the database and survive application restarts.
- **FR-009**: Comments MUST be limited to 5000 characters.
- **FR-010**: In reading view, a collapsible side panel on the right MUST display all comments for the current Text.
- **FR-011**: Comments in the side panel MUST appear in document order (same order as the Words in the Text).
- **FR-012**: Each comment entry in the side panel MUST display the associated Word's Chinese characters for identification.
- **FR-013**: The side panel MUST be open by default when the Text has at least one comment, and closed by default when the Text has no comments.
- **FR-014**: The user MUST be able to manually toggle the side panel open or closed at any time.
- **FR-015**: When the side panel is open on a Text with no comments, it MUST display an empty-state message.
- **FR-016**: A Word that has a comment MUST NOT be split. The split context menu entries MUST be disabled for that Word until the comment is deleted.
- **FR-017**: A merge operation MUST be blocked if any of the involved Words has a comment. The merge context menu entries MUST be disabled until the relevant comment(s) are deleted.
- **FR-018**: Comments MUST be included in the data export payload and restored faithfully on import.
- **FR-019**: Words that have a comment MUST display a subtle visual indicator (e.g., small dot or underline in the accent color) in reading view, so commented Words are discoverable at a glance without opening the side panel.
- **FR-020**: Clicking a comment entry in the side panel MUST open the comment dialog pre-filled with that comment, allowing the user to edit or delete it (subject to the Text's locked state).

### Key Entities

- **Comment**: A free-text note (up to 5000 characters) attached to a specific Word within a Text. Each Word may have zero or one Comment. A Comment belongs to exactly one Word.
- **Word** (existing entity, extended): A Word MAY now have an associated Comment.
- **Text** (existing entity): A Text has zero or more Comments across its Words.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can add a comment to a Word in under 10 seconds (right-click, select "Comment", type, confirm).
- **SC-002**: The comments side panel displays all comments for a Text within 1 second of opening the reading view.
- **SC-003**: Comments survive a full export-then-import round-trip with no data loss.
- **SC-004**: 100% of comment operations (create, edit, delete) are correctly blocked on locked Texts.
- **SC-005**: The side panel correctly defaults to open when comments exist and closed when they do not, on every text navigation.

## Clarifications

### Session 2026-02-27

- Q: Should Words with a comment have a visual indicator in the reading view? → A: Yes, a subtle visual indicator (e.g., small dot or underline in the accent color) on commented Words.
- Q: Should clicking a comment in the side panel allow editing it? → A: Yes, clicking a comment entry opens the comment dialog for editing/deleting.

## Assumptions

- Comments are plain text only (no rich text, no markdown rendering).
- The side panel width is fixed and does not interfere with the existing text reading area on standard desktop viewports (1280px+).
- The comment dialog follows the same visual styling (bg-surface, border-content/20, text-content) as existing dialogs in the application.
- The "Comment" context menu entry uses the same disabled/lock pattern as "Edit Pinyin", "Split", and "Merge" for locked Texts.
- One comment per Word means the relationship is 1:1 — updating a comment replaces it entirely.
- The panel toggle state (open/closed) is not persisted across sessions; it resets based on whether the Text has comments each time the reading view is entered.
