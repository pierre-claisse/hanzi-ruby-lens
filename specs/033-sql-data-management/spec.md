# Feature Specification: SQL Data Management

**Feature Branch**: `033-sql-data-management`
**Created**: 2026-02-27
**Status**: Draft
**Input**: User description: "Je veux ajouter la fonctionnalité d'export SQL, d'import SQL et de reset SQL. Un même bouton dans la barre de titre, en vue bibliothèque uniquement, entre le bouton des tags et le bouton des palettes, ouvre un menu déroulant contenant le reset intégral SQL, l'import SQL (écrasement total) et l'export (tags, textes taggés avec pinyin, bref toutes les données SQL)."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Export All Data (Priority: P1)

As a user, I want to export all my library data (texts with their pinyin annotations, tags, and tag assignments) into a single file so that I can create a backup or transfer my data to another machine.

**Why this priority**: Export is the most critical operation because it enables data safety. Without export, the other operations (import, reset) are either dangerous or incomplete. Export is the foundation for backup and restore workflows.

**Independent Test**: Can be fully tested by clicking the data management button in the library title bar, selecting "Export", choosing a save location, and verifying the resulting file contains all texts, tags, and tag assignments.

**Acceptance Scenarios**:

1. **Given** the user is in the library view with at least one text saved, **When** the user clicks the data management button and selects "Export", **Then** a file save dialog opens allowing the user to choose where to save the export file.
2. **Given** the user has selected a save location, **When** the export completes, **Then** the file contains all texts (with title, raw input, segments/pinyin, creation date, modification date, locked status), all tags (with label and color), and all tag-to-text assignments.
3. **Given** the user is in the library view with no texts saved, **When** the user clicks the data management button and selects "Export", **Then** the export still succeeds, producing a valid file representing an empty library.
4. **Given** the export is in progress, **When** the operation completes successfully, **Then** the user sees a confirmation message indicating the export succeeded and how many texts were exported.

---

### User Story 2 - Import Data (Priority: P2)

As a user, I want to import a previously exported file to restore my library data, fully replacing the current database contents (total overwrite).

**Why this priority**: Import enables the restore half of the backup/restore workflow. Combined with export, it gives users full data portability. It depends on having a valid export file, hence P2.

**Independent Test**: Can be tested by importing a valid export file and verifying that the library now contains exactly the data from that file, with no remnants of previous data.

**Acceptance Scenarios**:

1. **Given** the user is in the library view, **When** the user clicks the data management button and selects "Import", **Then** a file selection dialog opens for choosing an export file.
2. **Given** the user has selected a valid export file, **When** the user confirms the import, **Then** a confirmation dialog warns that all current data will be permanently replaced by the imported data.
3. **Given** the user confirms the overwrite warning, **When** the import completes, **Then** the entire current database is replaced with the imported data (texts, tags, tag assignments) and the library view refreshes to show the imported content.
4. **Given** the user selects an invalid or corrupted file, **When** the import is attempted, **Then** the system displays an error message and the current data remains untouched.
5. **Given** the user cancels at the confirmation dialog, **When** the dialog closes, **Then** no changes are made to the current data.

---

### User Story 3 - Reset All Data (Priority: P3)

As a user, I want to completely reset (delete) all data in the database to start fresh with an empty library.

**Why this priority**: Reset is the least common operation and the most destructive. It is useful for starting over but carries the highest risk. Placing it at P3 ensures export/import are solid before reset is available.

**Independent Test**: Can be tested by triggering a reset and verifying that the library is completely empty afterward (no texts, no tags, no tag assignments).

**Acceptance Scenarios**:

1. **Given** the user is in the library view, **When** the user clicks the data management button and selects "Reset", **Then** a confirmation dialog warns that all data will be permanently deleted.
2. **Given** the user confirms the reset, **When** the reset completes, **Then** all texts, tags, and tag assignments are deleted and the library view refreshes to show an empty state.
3. **Given** the user cancels the reset confirmation, **When** the dialog closes, **Then** no data is modified.

---

### User Story 4 - Data Management Button & Dropdown (Priority: P1)

As a user, I want a single data management button in the library title bar (positioned between the tags manager button and the palette selector) that opens a dropdown menu listing all three operations: Reset, Import, and Export.

**Why this priority**: The button is the entry point for all three operations. Without it, none of the data management features are accessible. It shares P1 with Export as both are required for a minimal viable feature.

**Independent Test**: Can be tested by verifying the button appears only in library view, is positioned between tags and palette buttons, and opens a dropdown with three clearly labeled menu items.

**Acceptance Scenarios**:

1. **Given** the user is in the library view, **When** the title bar renders, **Then** a data management button is visible between the tags manager button and the palette selector button.
2. **Given** the user is in the reading view, **When** the title bar renders, **Then** the data management button is not visible.
3. **Given** the user is in the library view, **When** the user clicks the data management button, **Then** a dropdown menu appears with three items in this order: "Export", "Import", and "Reset" (safe-first ordering).
4. **Given** the dropdown is open, **When** the user clicks outside the dropdown, **Then** the dropdown closes.
5. **Given** the dropdown is open, **When** the user selects an option, **Then** the dropdown closes and the corresponding operation begins.

---

### Edge Cases

- What happens when the user attempts to export while the database is empty? The export should succeed and produce a valid file representing an empty dataset.
- What happens if the export file write fails (e.g., disk full, permission denied)? The system displays an error message and no partial file is left behind.
- What happens if the user selects a file that is not a valid export file for import? The system rejects the file with a clear error message and the current data remains unchanged.
- What happens if the import file was exported from a different version of the application? The system should validate the file format and reject incompatible versions with a descriptive error.
- What happens if the reset or import fails midway? The operation should be atomic: either it completes fully or no changes are applied (rollback).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST display a data management button in the title bar only when the library view is active.
- **FR-002**: The data management button MUST be positioned between the tags manager button and the palette selector button in the title bar.
- **FR-003**: Clicking the data management button MUST open a dropdown menu with three options in safe-first order: "Export", "Import", and "Reset".
- **FR-004**: The dropdown MUST close when the user clicks outside of it or selects an option.
- **FR-005**: The "Export" option MUST export all application data: texts (with all fields including title, raw input, segments, creation date, modification date, locked status), tags (label and color), and tag-to-text assignments.
- **FR-006**: The "Export" option MUST open a native file save dialog for the user to choose the destination and file name.
- **FR-007**: The export file format MUST be a `.json` file, self-contained and portable (a single file that can be copied between machines).
- **FR-008**: The "Import" option MUST open a native file selection dialog filtered to `.json` files to choose an export file.
- **FR-009**: The "Import" option MUST display a confirmation dialog warning that all current data will be permanently replaced before proceeding.
- **FR-010**: On import confirmation, the system MUST completely replace all existing data (texts, tags, tag assignments) with the contents of the imported file.
- **FR-011**: The "Import" operation MUST validate the file format before applying any changes and reject invalid files with an error message.
- **FR-012**: The "Reset" option MUST display a confirmation dialog warning that all data will be permanently deleted before proceeding.
- **FR-013**: On reset confirmation, the system MUST delete all texts, tags, and tag assignments, returning the library to an empty state.
- **FR-014**: Import and reset operations MUST be atomic: they either complete fully or leave the existing data unchanged.
- **FR-015**: After a successful import or reset, the library view MUST refresh automatically to reflect the new state.
- **FR-016**: After a successful export, the system MUST display a confirmation message indicating success and the number of texts exported.

### Key Entities

- **Export File**: A portable, self-contained file representing a complete snapshot of the user's library data. Contains all texts with their full metadata and pinyin segments, all tags with labels and colors, and all tag-to-text assignment relationships.
- **Data Management Menu**: A dropdown UI element accessible from the library title bar that groups the three data operations (Reset, Import, Export) under a single access point.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can export their entire library to a file in under 5 seconds for libraries of up to 500 texts.
- **SC-002**: Users can import a previously exported file and see their restored library within 10 seconds for files containing up to 500 texts.
- **SC-003**: Users can reset their library to an empty state within 3 seconds.
- **SC-004**: 100% of data round-trips (export then import) preserve all texts, tags, and assignments without any data loss.
- **SC-005**: Invalid import files are rejected 100% of the time with a user-understandable error message, with no data corruption.
- **SC-006**: Users can access the data management dropdown in 1 click from the library view.

## Clarifications

### Session 2026-02-27

- Q: What order should dropdown menu items appear? → A: Safe-first order: Export, Import, Reset (safest action first, destructive last)
- Q: What file extension should the export file use? → A: `.json` (standard, universally recognized, human-inspectable)

## Assumptions

- The application is single-user; there are no concurrent access concerns during import/reset operations.
- The export file format uses JSON (`.json` extension), a standard human-inspectable format, to facilitate debugging and transparency.
- The user understands that "Import" is a total overwrite operation (not a merge), as reinforced by the confirmation dialog.
- The confirmation dialogs for destructive operations (import overwrite, reset) require an explicit user action to proceed and cannot be bypassed.
- The data management button icon will be visually consistent with the existing title bar button style (same size, hover states, etc.).
- The file save/open dialogs use the operating system's native file picker.
