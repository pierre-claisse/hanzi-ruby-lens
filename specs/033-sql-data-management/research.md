# Research: SQL Data Management

**Feature Branch**: `033-sql-data-management`
**Date**: 2026-02-27

## Decision 1: Export File Format

**Decision**: JSON (`.json` extension)

**Rationale**: User explicitly chose JSON during spec clarification. JSON is human-inspectable, universally recognized, and requires no special tooling to read or debug. It also avoids coupling the export to SQLite's internal binary format, making it more resilient to future schema changes.

**Alternatives Considered**:
- **Raw SQLite file copy**: Constitution Principle II envisions this (`"The database file MUST be directly exportable and importable as an SQLite file"`). However, raw SQLite copies are binary, opaque to the user, and tightly coupled to the internal schema. A raw `.db` file is already accessible via the app data folder for power users. The JSON export adds a structured, human-readable layer on top.
- **Custom `.hrl` extension**: Would clearly identify app-specific files but loses the universal recognition of `.json`. Rejected for discoverability reasons.

**Constitution Note**: This deviates from Principle II's letter ("as an SQLite file") but satisfies its spirit ("easily accessible to the user"). The raw SQLite file remains accessible at `%APPDATA%\com.hanzirubylens.app\hanzi-ruby-lens.db` for direct manual export. The JSON export provides a more user-friendly, structured alternative. Documented as justified deviation.

## Decision 2: File Dialog Plugin

**Decision**: Add `tauri-plugin-dialog` v2 for native file save/open dialogs.

**Rationale**: The project already uses Tauri 2 plugins (`tauri-plugin-opener`, `tauri-plugin-clipboard-manager`). The dialog plugin provides cross-platform native file pickers with file type filters, following the same pattern.

**Alternatives Considered**:
- **Custom file path input**: Would require building a custom UI for file selection. Rejected as inferior UX compared to native OS dialogs.
- **Fixed export location**: Auto-save to a known directory without user choice. Rejected because users need control over where backup files are saved.

## Decision 3: Import Atomicity Strategy

**Decision**: Use SQLite transactions for atomic import and reset operations.

**Rationale**: The existing codebase already uses `conn.transaction()` for `insert_text()`. The same pattern extends naturally to import (delete all + insert all in one transaction) and reset (delete all in one transaction). If any step fails, the entire transaction rolls back automatically.

**Alternatives Considered**:
- **Backup-then-replace**: Copy the DB file before modifying, restore on failure. More complex, requires file system operations, and the transaction approach already provides the needed guarantees.
- **WAL checkpoint + file copy**: Checkpoint the WAL, then operate. Unnecessary complexity given SQLite's transaction support.

## Decision 4: Export JSON Schema

**Decision**: Versioned JSON envelope containing three arrays: `texts`, `tags`, and `text_tags`.

**Rationale**: Maps 1:1 to the database tables. The version field enables future schema evolution and import validation. Each array contains all rows from the corresponding table with all fields preserved.

**Schema**:
```json
{
  "version": 1,
  "exported_at": "2026-02-27T14:30:00",
  "texts": [
    {
      "id": 1,
      "title": "...",
      "created_at": "...",
      "modified_at": "...",
      "raw_input": "...",
      "segments": "...",
      "locked": 0
    }
  ],
  "tags": [
    { "id": 1, "label": "...", "color": "..." }
  ],
  "text_tags": [
    { "text_id": 1, "tag_id": 1 }
  ]
}
```

**Alternatives Considered**:
- **Nested structure** (texts with embedded tags): Denormalizes the many-to-many relationship, making it harder to reconstruct on import and risking data duplication. Rejected.
- **CSV per table**: Multiple files, harder to handle as a single portable unit. Rejected.

## Decision 5: Confirmation Dialog Implementation

**Decision**: Use native Tauri dialog plugin for confirmation dialogs (message dialog with Yes/No buttons).

**Rationale**: The `tauri-plugin-dialog` already provides `message()` and `confirm()` functions with native OS styling. Using native dialogs is consistent with the native file picker and requires no custom React modal components.

**Alternatives Considered**:
- **Custom React modal**: More control over styling but adds UI complexity. The existing codebase does not have a modal component. Native dialogs are more trustworthy for destructive operations.
- **Inline confirmation**: Replace the menu item with a confirmation state. Unconventional UX for destructive operations.

## Decision 6: Dropdown UI Pattern

**Decision**: Follow the PaletteSelector pattern (accessible listbox dropdown with keyboard navigation).

**Rationale**: PaletteSelector already provides a fully accessible dropdown in the title bar with ARIA roles, keyboard navigation (arrow keys, enter), and click-outside handling. The data management dropdown should follow the same established pattern for consistency.

**Alternatives Considered**:
- **Context menu pattern**: Used in LibraryScreen but positioned via pointer coordinates, not fixed in the title bar. Not appropriate for a title bar button.
- **TagFilterDropdown pattern**: Uses checkboxes for multi-select. Not appropriate for a single-action menu.
