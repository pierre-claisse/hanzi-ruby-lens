# Feature Specification: SQLite Foundation

**Feature Branch**: `013-sqlite-foundation`
**Created**: 2026-02-13
**Status**: Draft
**Input**: User description: "SQLite foundation: Add rusqlite, create texts table, basic save/load Tauri commands"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Text Persists Across Sessions (Priority: P1)

A user has a processed Chinese text displayed in the application. They close the application and reopen it later. The same text (with all its word segments and pinyin annotations) is still displayed exactly as it was before closing. The user never has to re-process or re-enter text they've already worked with.

**Why this priority**: Persistence is the foundation for every future feature — text input, LLM processing, pinyin correction. Without durable storage, no user data survives a restart. This is the critical path.

**Independent Test**: Save a Text with known segments, restart the application, verify the same Text loads and renders identically.

**Acceptance Scenarios**:

1. **Given** a Text has been saved, **When** the application is closed and reopened, **Then** the same Text (raw input and all segments with pinyin) is displayed
2. **Given** the application is launched for the first time (no saved data), **When** the application starts, **Then** it displays the existing hardcoded sample text as a fallback
3. **Given** a Text has been saved, **When** the application starts, **Then** the saved Text loads and renders within 1 second of the application window appearing
4. **Given** a saved Text with multi-character words and mixed plain segments, **When** the application reloads it, **Then** every word's characters and pinyin are identical to what was saved, and every plain segment's text is identical

---

### User Story 2 - Save Text Replaces Previous (Priority: P2)

The application holds exactly one Text at a time (per constitution). When a new Text is saved, it fully replaces the previous one in storage. The save operation is reliable — either the full new Text is stored or the old one remains untouched.

**Why this priority**: The single-Text replacement model is the constitutional data contract. It must work correctly before any text input or LLM processing feature can be built on top.

**Independent Test**: Save Text A, then save Text B, restart the app, verify only Text B is loaded.

**Acceptance Scenarios**:

1. **Given** Text A is currently saved, **When** Text B is saved, **Then** only Text B exists in storage and is loaded on next startup
2. **Given** a save operation is in progress, **When** the save fails for any reason, **Then** the previously saved Text remains intact and loadable
3. **Given** an empty Text (no segments), **When** it is saved, **Then** the save succeeds and the application displays an empty-state placeholder on next load

---

### User Story 3 - Database File Accessible for Backup (Priority: P3)

The application stores its data in a single file within the application's standard data directory. A user (or backup tool) can locate this file and copy it for safekeeping. The file format is a standard format that can be inspected with common tools.

**Why this priority**: Data portability and backup are constitutional requirements (export/import must be easily accessible). The foundation must place the file in a predictable, user-accessible location.

**Independent Test**: After saving a Text, locate the database file in the app's data directory and open it with an external tool to verify the data is readable.

**Acceptance Scenarios**:

1. **Given** the application has saved at least one Text, **Then** a single database file exists in the application's standard data directory
2. **Given** the database file, **When** a user opens it with a standard database inspection tool, **Then** the saved Text data is readable
3. **Given** the database file is copied to another location, **When** the copy is inspected, **Then** it contains the same data as the original

---

### Edge Cases

- What happens on first launch when no database file exists? The application creates the database and its schema automatically, then falls back to the hardcoded sample text
- What happens if the database file is corrupted or unreadable? The application logs the error and falls back to the hardcoded sample text without crashing
- What happens if the database file is deleted between sessions? Same as first launch — the application recreates it and shows the sample text
- What happens when saving a very long Text (e.g., 50,000+ characters)? The save completes successfully; no practical character limit is imposed
- What happens when saving an empty Text? The save succeeds (constitutional requirement: "Saving an empty Text MUST be permitted")
- What happens if the disk is full during save? The save fails gracefully, the previous data remains intact, and no partial writes corrupt the database
- What happens if the application data directory doesn't exist? The application creates the directory structure before creating the database file

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The application MUST persist the active Text (raw input string and all segments including word pinyin) to local storage
- **FR-002**: The application MUST load the persisted Text automatically on startup and display it
- **FR-003**: When a new Text is saved, it MUST fully replace any previously saved Text (the application holds exactly one Text)
- **FR-004**: If no persisted Text exists (first launch or deleted database), the application MUST display the hardcoded sample text
- **FR-005**: The database schema MUST be created automatically on first launch without user intervention
- **FR-006**: Save operations MUST be atomic — either the full Text is saved or the previous state is preserved
- **FR-007**: The database file MUST be stored in the application's standard data directory
- **FR-008**: The database file MUST be a standard SQLite file readable by external tools
- **FR-009**: Saving an empty Text (zero segments) MUST be permitted and MUST result in an empty-state display on next load
- **FR-010**: If the database file is corrupted or unreadable, the application MUST fall back to the sample text without crashing
- **FR-011**: The application MUST provide a backend command to save a Text (raw input + segments)
- **FR-012**: The application MUST provide a backend command to load the saved Text
- **FR-013**: All existing application features (text display, navigation, context menu, pinyin toggle, zoom, palettes, theme) MUST continue to work unchanged

### Key Entities

- **Text**: The aggregate root. Contains the raw input string (the original Chinese text as entered by the user) and an ordered list of TextSegments. Exactly one Text exists in the application at any time.
- **TextSegment**: An ordered piece of a Text. Either a Word (Chinese characters + pinyin) or plain text (punctuation, spaces, numbers). Position within the Text is significant.
- **Word**: A segment type containing one or more Chinese characters and their pinyin as a single unit. Pinyin is determined at the word level due to context-dependent pronunciation.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A saved Text survives application restart with 100% data fidelity — every character, every pinyin, every segment type and order is identical after reload
- **SC-002**: The application starts and displays the persisted Text within 1 second of the window appearing
- **SC-003**: Saving a Text of up to 10,000 characters completes in under 500 milliseconds
- **SC-004**: The database file is a valid, standard-format file that can be read by any compatible inspection tool
- **SC-005**: First launch (no existing database) results in a working application showing the sample text, with no errors or manual setup required
- **SC-006**: All existing tests continue to pass after this feature is integrated

## Assumptions

- The application's standard data directory is provided by the runtime environment and is writable
- The hardcoded sample text remains available as a fallback for first-launch and error scenarios
- The current domain model (Text, Word, TextSegment) is sufficient for storage — no schema changes are needed beyond persisting the existing types
- Save and load operations are initiated by the backend (not directly by the user via UI) — the frontend calls backend commands
- The single-Text model is sufficient for the current release cycle (no text library or multi-text support needed yet)
- Database migrations are not needed for this initial schema — the schema is created once and is stable for this feature
- The database file location follows the platform's standard application data conventions
