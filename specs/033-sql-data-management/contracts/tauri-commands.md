# Tauri IPC Command Contracts: SQL Data Management

**Feature Branch**: `033-sql-data-management`
**Date**: 2026-02-27

## Command: `export_database`

**Purpose**: Export all library data to a JSON file at a user-chosen path.

**Direction**: Frontend → Rust backend

**Parameters**:
| Name | Type | Required | Description |
|------|------|----------|-------------|
| file_path | string | yes | Absolute path to the destination `.json` file (from native save dialog) |

**Returns**: `Result<ExportResult, AppError>`

```typescript
// Frontend invoke
const result = await invoke<ExportResult>("export_database", { filePath });

// ExportResult
interface ExportResult {
  textCount: number;
  tagCount: number;
}
```

**Behavior**:
1. Read all texts, tags, and text_tags from database
2. Build ExportPayload with version=1 and current timestamp
3. Serialize to JSON
4. Write to `file_path`
5. Return counts on success

**Errors**:
- `AppError::Database` — read failure
- `AppError::Io` — file write failure (disk full, permission denied)

---

## Command: `import_database`

**Purpose**: Replace all library data with contents of a JSON export file.

**Direction**: Frontend → Rust backend

**Parameters**:
| Name | Type | Required | Description |
|------|------|----------|-------------|
| file_path | string | yes | Absolute path to the `.json` file to import (from native open dialog) |

**Returns**: `Result<ImportResult, AppError>`

```typescript
// Frontend invoke
const result = await invoke<ImportResult>("import_database", { filePath });

// ImportResult
interface ImportResult {
  textCount: number;
  tagCount: number;
}
```

**Behavior**:
1. Read and parse the file as JSON
2. Validate: version field, required arrays, referential integrity
3. Begin transaction
4. Delete all text_tags, tags, texts (in order)
5. Insert all texts, tags, text_tags from payload (preserving original IDs)
6. Commit transaction
7. Return counts on success

**Errors**:
- `AppError::Io` — file read failure
- `AppError::Validation` — invalid format, version mismatch, referential integrity failure
- `AppError::Database` — insert/delete failure (triggers rollback)

---

## Command: `reset_database`

**Purpose**: Delete all library data (texts, tags, tag assignments).

**Direction**: Frontend → Rust backend

**Parameters**: None

**Returns**: `Result<(), AppError>`

```typescript
// Frontend invoke
await invoke("reset_database");
```

**Behavior**:
1. Begin transaction
2. Delete all text_tags
3. Delete all tags
4. Delete all texts
5. Commit transaction

**Errors**:
- `AppError::Database` — delete failure (triggers rollback)

---

## Frontend Component Contract: DataManagementDropdown

**Props**:
```typescript
interface DataManagementDropdownProps {
  onExportComplete: (result: ExportResult) => void;
  onImportComplete: (result: ImportResult) => void;
  onResetComplete: () => void;
}
```

**Behavior**:
- Renders a button with a database-related icon (e.g., `HardDrive` or `Database` from lucide-react)
- On click: toggles a dropdown with 3 menu items (Export, Import, Reset)
- Export: opens native save dialog → calls `export_database` → calls `onExportComplete`
- Import: opens native open dialog → shows native confirm dialog → calls `import_database` → calls `onImportComplete`
- Reset: shows native confirm dialog → calls `reset_database` → calls `onResetComplete`
- Closes on click-outside or option selection
- Follows PaletteSelector accessibility pattern (ARIA listbox, keyboard navigation)

**TitleBar Integration**:
- Visible only when `showAddButton` is true (library view)
- Positioned in the right section, between the tags manager button and PaletteSelector
