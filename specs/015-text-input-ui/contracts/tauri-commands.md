# Tauri Command Contracts: Text Input UI

**Feature**: 015-text-input-ui
**Date**: 2026-02-17

## Overview

No new Tauri commands are introduced. This feature reuses the existing `save_text` and `load_text` commands from feature 013 (SQLite foundation). The contracts below document how this feature uses them.

## save_text (existing — reused)

**Command**: `save_text`
**Direction**: Frontend → Rust backend
**Purpose**: Save user-entered raw text with empty segments (pre-LLM processing)

### Invocation

```typescript
import { invoke } from "@tauri-apps/api/core";

await invoke("save_text", {
    text: {
        rawInput: userInput,   // string from textarea
        segments: []            // empty — no LLM processing yet
    }
});
```

### Contract

| Field | Type | Constraints |
|-------|------|-------------|
| `text.rawInput` | `string` | Any string including empty. No length limit enforced. |
| `text.segments` | `TextSegment[]` | Always `[]` for this feature. |

### Responses

| Case | Return | Action |
|------|--------|--------|
| Success | `void` (undefined) | Transition to "saved" view |
| Failure | Rejects with error string | Show error message, preserve textarea content |

### Behavior

- Replaces any previously saved Text (DELETE + INSERT with id=1)
- Empty rawInput is valid (FR-005, constitution: "Saving an empty Text MUST be permitted")
- Transaction-wrapped (existing implementation)

## load_text (existing — reused)

**Command**: `load_text`
**Direction**: Frontend → Rust backend
**Purpose**: Load saved Text on app startup to determine initial view state

### Invocation

```typescript
import { invoke } from "@tauri-apps/api/core";

const result = await invoke<Text | null>("load_text");
```

### Responses

| Case | Return | Derived View State |
|------|--------|--------------------|
| No saved text (first launch) | `null` | `"empty"` |
| Saved text, no segments | `Text { rawInput: "...", segments: [] }` | `"saved"` |
| Saved text, with segments | `Text { rawInput: "...", segments: [...] }` | `"reading"` |
| Database error | Rejects with error string | Fallback to `"empty"` with console error |
