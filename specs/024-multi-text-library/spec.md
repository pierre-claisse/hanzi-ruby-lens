# Feature Specification: Multi-Text Library

**Feature Branch**: `024-multi-text-library`
**Created**: 2026-02-23
**Status**: Draft
**Input**: User description: "Support multiple texts with a library screen, immutable texts with titles, text deletion, and navigation between library and reading views."

## Clarifications

### Session 2026-02-23

- Q: Le titre du texte doit-il être affiché sur l'écran de lecture ? → A: Oui, le titre est affiché en en-tête sur l'écran de lecture.
- Q: Où l'action de suppression est-elle déclenchée dans la bibliothèque ? → A: Via un clic droit (menu contextuel) sur l'aperçu du texte, pour préserver la pureté visuelle de l'interface.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Browse the Library at Launch (Priority: P1)

As a user, when I open the application I see a library screen listing all my saved texts. Each text appears as a preview showing its title and creation date. If I have no texts yet, the library is empty but still fully functional with the add button visible.

**Why this priority**: The library screen is the new entry point of the application. Without it, no other feature is accessible.

**Independent Test**: Can be fully tested by launching the app and verifying the library screen appears with existing texts listed (or empty state). Delivers the foundation for all navigation.

**Acceptance Scenarios**:

1. **Given** the user has 3 saved texts, **When** the application launches, **Then** the library screen displays 3 text previews, each showing its title and creation date.
2. **Given** the user has no saved texts, **When** the application launches, **Then** the library screen displays an empty state with the add button still visible and accessible.
3. **Given** the user has saved texts, **When** the library screen is displayed, **Then** texts are listed in a consistent order (most recently created first).

---

### User Story 2 - Add a New Text (Priority: P1)

As a user, I can add a new text from the library screen. The add button is always visible and does not move regardless of the number of texts. Adding a text requires entering a title and Chinese content, which are then processed and permanently saved.

**Why this priority**: Without the ability to add texts, the library has no content. This is co-equal with the library screen itself.

**Independent Test**: Can be fully tested by clicking the add button, entering a title and Chinese content, confirming, and verifying the new text appears in the library.

**Acceptance Scenarios**:

1. **Given** the user is on the library screen, **When** they click the add button, **Then** they are presented with an input view to enter a title and Chinese content.
2. **Given** the user has entered a title and valid Chinese content, **When** they confirm, **Then** the text is processed (segmented with pinyin annotations) and saved permanently.
3. **Given** the user has added a new text, **When** they return to the library, **Then** the new text appears in the list with its title and creation date.
4. **Given** the add button is displayed, **When** the library contains 0, 1, or many texts, **Then** the add button remains in the same fixed position.

---

### User Story 3 - Read an Existing Text (Priority: P1)

As a user, I can open any text from the library by clicking on its preview. This takes me to the reading screen where I see the text's title as a header and the full annotated text with pinyin below it. A back button allows me to return to the library.

**Why this priority**: Reading texts is the core purpose of the application. Navigation between library and reading is essential.

**Independent Test**: Can be fully tested by clicking on a text preview in the library, verifying the reading screen shows the full annotated text, then clicking back to return to the library.

**Acceptance Scenarios**:

1. **Given** the user is on the library screen with existing texts, **When** they click on a text preview, **Then** the reading screen displays the text's title as a header and the full annotated text with pinyin annotations below it.
2. **Given** the user is on the reading screen, **When** they click the back button, **Then** they return to the library screen.
3. **Given** the user returns to the library from reading, **When** the library is displayed, **Then** all texts are still listed (no data loss from navigation).

---

### User Story 4 - Correct Pinyin Annotations (Priority: P2)

As a user, I can still correct pinyin annotations on any word in a text. The corrections persist permanently. The text content itself (Chinese characters) remains immutable — there is no edit button to modify or regenerate the text.

**Why this priority**: Pinyin correction is a key existing feature that must continue to work in the multi-text context, but it depends on the reading screen being functional first.

**Independent Test**: Can be fully tested by opening a text, correcting a pinyin annotation, navigating away, reopening the text, and verifying the correction persists.

**Acceptance Scenarios**:

1. **Given** the user is reading a text, **When** they correct a word's pinyin, **Then** the correction is saved and immediately visible.
2. **Given** the user has corrected a pinyin annotation, **When** they close and reopen the text, **Then** the correction is still present.
3. **Given** the user is on the reading screen, **When** they look for an edit/regenerate button, **Then** no such button exists — the text content is immutable.

---

### User Story 5 - Delete a Text (Priority: P2)

As a user, I can delete a text from my library via a right-click context menu on the text's preview in the library. Deletion is permanent and removes the text and all its data.

**Why this priority**: Text management requires the ability to remove unwanted texts, but it is less critical than adding and reading.

**Independent Test**: Can be fully tested by deleting a text and verifying it no longer appears in the library.

**Acceptance Scenarios**:

1. **Given** the user is on the library screen, **When** they right-click a text preview and select the delete option, **Then** a confirmation is requested before deletion proceeds.
2. **Given** the user confirms deletion, **When** the deletion completes, **Then** the text and all its associated data (words, pinyin corrections) are permanently removed.
3. **Given** the user has deleted a text, **When** the library is displayed, **Then** the deleted text no longer appears.

---

### Edge Cases

- What happens when the user tries to add a text with no Chinese characters? The system must reject it (a Text must contain at least one Chinese character per constitution).
- What happens when the user tries to add a text with an empty title? The system must require a non-empty title.
- What happens when the user deletes the last remaining text? The library displays its empty state with the add button still accessible.
- What happens when the user cancels during text addition? No text is created, the user returns to the library.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The application MUST display a library screen as the initial view at launch.
- **FR-002**: The library screen MUST list all saved texts, each showing only its title and creation date as a preview.
- **FR-003**: The library screen MUST display texts ordered by creation date (most recent first).
- **FR-004**: An add-text button MUST be permanently visible and in a fixed position on the library screen, regardless of the number of texts.
- **FR-005**: Adding a text MUST require the user to provide both a title and Chinese content.
- **FR-006**: A Text title MUST be non-empty and MUST be immutable after creation.
- **FR-007**: A Text's Chinese content MUST contain at least one Chinese character and MUST be immutable after creation.
- **FR-008**: Upon text creation, the Chinese content MUST be processed (segmented and pinyin-annotated) before being saved.
- **FR-009**: The user MUST be able to navigate from the library to the reading screen by clicking a text's preview.
- **FR-010**: The reading screen MUST display the text's title as a header and the full annotated text with pinyin ruby annotations below it.
- **FR-011**: A back button MUST be available on the reading screen to return to the library.
- **FR-012**: Pinyin annotations MUST remain individually correctable by the user on the reading screen.
- **FR-013**: Pinyin corrections MUST persist permanently across sessions.
- **FR-014**: The edit/regenerate text button MUST be removed — text content is immutable.
- **FR-015**: The user MUST be able to delete a text from the library via a right-click context menu on the text's preview.
- **FR-016**: Text deletion MUST require user confirmation before proceeding.
- **FR-017**: Text deletion MUST permanently remove the text and all associated data (words, corrections).
- **FR-018**: Each Text MUST have a creation date recorded at the time of creation.

### Key Entities

- **Text**: The aggregate root. Represents a complete Chinese document with a title, creation date, raw Chinese content, and its processed segments (Words). Immutable after creation except for pinyin corrections on its Words.
- **Word**: A segment within a Text, consisting of one or more Chinese characters and a pinyin string. The pinyin is correctable by the user.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can create, browse, read, and delete multiple texts without data loss or corruption.
- **SC-002**: The library screen loads and displays all text previews within 1 second of application launch.
- **SC-003**: Navigation between library and reading screen completes within 300 milliseconds.
- **SC-004**: Pinyin corrections made on any text persist permanently and are visible when the text is reopened.
- **SC-005**: Deleting a text fully removes it and its data — it never reappears in the library.
- **SC-006**: The add button remains visible and accessible at all times on the library screen, regardless of scroll position or text count.

## Assumptions

- Text previews in the library show only the title and creation date — no content preview or word count.
- The title has no maximum length constraint beyond what is reasonable for display (a single-line display with ellipsis for overflow is assumed).
- Deletion confirmation uses a simple dialog (e.g., a confirmation prompt) rather than a complex undo mechanism.
- The existing processing flow (input → processing → reading) is adapted: the input and processing phases become part of the "add text" workflow, and the reading phase becomes the standalone reading screen.
- The library screen replaces the current "empty" view as the application's initial state.
