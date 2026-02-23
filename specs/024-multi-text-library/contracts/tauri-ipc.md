# Tauri IPC Contracts: Multi-Text Library

**Feature**: 024-multi-text-library
**Date**: 2026-02-23

## Overview

All commands are invoked via Tauri's `invoke()` bridge. Commands are Rust functions annotated with `#[tauri::command]`, registered in `lib.rs`. The frontend calls them via `@tauri-apps/api/core::invoke<T>(commandName, args)`.

## Commands (Writes)

### `create_text`

Creates a new text by processing raw Chinese input and saving it atomically.

**Invocation**: `invoke<Text>("create_text", { title, rawInput })`

| Parameter | Type | Constraints |
|-----------|------|-------------|
| title | string | Non-empty |
| rawInput | string | Must contain ≥1 Chinese character |

**Returns**: `Text` (full object with id, title, createdAt, rawInput, segments)

**Side effects**:
- Processes rawInput through the segmentation + pinyin pipeline
- Inserts a new row in `texts` table with generated `id` and `created_at`

**Errors**:
- Empty title → `AppError`
- No Chinese characters in rawInput → `AppError`
- Database write failure → `AppError`

**Replaces**: `save_text` + `process_text` (combined into atomic operation)

---

### `update_pinyin`

Updates the pinyin of a specific segment in a text.

**Invocation**: `invoke<void>("update_pinyin", { textId, segmentIndex, newPinyin })`

| Parameter | Type | Constraints |
|-----------|------|-------------|
| textId | number | Must reference an existing text |
| segmentIndex | number | Must be a valid index into segments array, must point to a "word" segment |
| newPinyin | string | Non-empty |

**Returns**: void (success) or error

**Side effects**:
- Loads segments JSON for the given text
- Patches the pinyin at `segmentIndex`
- Writes updated segments back to the database

**Errors**:
- Text not found → `AppError`
- Invalid segment index → `AppError`
- Segment is not a "word" type → `AppError`

**Replaces**: `save_text` (no longer re-saves entire Text object)

---

### `delete_text`

Permanently removes a text and all its data.

**Invocation**: `invoke<void>("delete_text", { textId })`

| Parameter | Type | Constraints |
|-----------|------|-------------|
| textId | number | Must reference an existing text |

**Returns**: void (success) or error

**Side effects**:
- Deletes the row from `texts` table where `id = textId`

**Errors**:
- Text not found → `AppError`
- Database write failure → `AppError`

---

## Queries (Reads)

### `list_texts`

Returns lightweight previews of all texts for the library screen.

**Invocation**: `invoke<TextPreview[]>("list_texts")`

**Parameters**: None

**Returns**: `TextPreview[]` — array of `{ id, title, createdAt }`, ordered by `created_at DESC` (most recent first)

**Side effects**: None (read-only)

**Notes**: Does not load `rawInput` or `segments` — optimized for library display.

**Replaces**: `load_text` (which returned a single optional Text)

---

### `load_text`

Loads a full text by ID for the reading screen.

**Invocation**: `invoke<Text | null>("load_text", { textId })`

| Parameter | Type | Constraints |
|-----------|------|-------------|
| textId | number | Must be a positive integer |

**Returns**: `Text | null` (full object with all segments, or null if not found)

**Side effects**: None (read-only)

---

## Type Definitions (TypeScript)

```typescript
interface Text {
  id: number;
  title: string;
  createdAt: string;    // ISO 8601
  rawInput: string;
  segments: TextSegment[];
}

interface TextPreview {
  id: number;
  title: string;
  createdAt: string;    // ISO 8601
}

type TextSegment =
  | { type: "word"; word: Word }
  | { type: "plain"; text: string };

interface Word {
  characters: string;
  pinyin: string;
}
```

## Type Definitions (Rust)

```rust
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Text {
    pub id: i64,
    pub title: String,
    pub created_at: String,
    pub raw_input: String,
    pub segments: Vec<TextSegment>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TextPreview {
    pub id: i64,
    pub title: String,
    pub created_at: String,
}

// Word and TextSegment unchanged from current implementation
```

## Command Registration

```rust
// lib.rs
tauri::generate_handler![
    commands::create_text,
    commands::list_texts,
    commands::load_text,
    commands::update_pinyin,
    commands::delete_text,
]
```

**Removed commands**: `save_text`, `process_text` (replaced by `create_text`)

## CQRS Alignment

| Command/Query | Type | Constitution Principle |
|---------------|------|----------------------|
| create_text | Command | III. DDD/CQRS — write operation |
| update_pinyin | Command | III. DDD/CQRS — write operation |
| delete_text | Command | III. DDD/CQRS — write operation |
| list_texts | Query | III. DDD/CQRS — read projection |
| load_text | Query | III. DDD/CQRS — read operation |
