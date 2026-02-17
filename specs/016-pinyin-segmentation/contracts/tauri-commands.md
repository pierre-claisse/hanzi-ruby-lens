# Tauri Commands Contract: Pinyin Segmentation

## New Command: `process_text`

### Signature

```
process_text(raw_input: String) → Result<Text, AppError>
```

### Description

Processes raw Chinese text through Claude Code CLI to generate Word segments with pinyin annotations. Saves the processed Text (with segments) to the database and returns it.

### Input

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| raw_input | String | Yes | Raw Chinese text to process. May be empty (returns empty segments). |

### Output (Success)

Returns the complete `Text` object with populated segments:

```json
{
  "rawInput": "今天天氣很好。",
  "segments": [
    { "type": "word", "word": { "characters": "今天", "pinyin": "jīntiān" } },
    { "type": "word", "word": { "characters": "天氣", "pinyin": "tiānqì" } },
    { "type": "word", "word": { "characters": "很好", "pinyin": "hěnhǎo" } },
    { "type": "plain", "text": "。" }
  ]
}
```

### Output (Error)

Returns serialized `AppError` string:

| Error Case | Message Pattern |
|-----------|----------------|
| CLI not found | "Processing error: Claude CLI not found..." |
| CLI timeout (120s) | "Processing error: Processing timed out..." |
| CLI exit non-zero | "Processing error: CLI failed..." |
| Malformed response | "Processing error: Failed to parse response..." |
| Empty input | No error — returns `{ rawInput: "", segments: [] }` |

### Behavior

1. If `raw_input` is empty, save `{ rawInput: "", segments: [] }` and return immediately (no CLI invocation).
2. Build segmentation prompt from `raw_input`.
3. Spawn Claude CLI process: `claude -p --model opus --output-format json --max-turns 1 --no-session-persistence --system-prompt "..." --json-schema "..." "<raw_input>"`.
4. Wait for completion with 120-second timeout.
5. Parse JSON response, extract `structured_output` field as `Vec<TextSegment>`.
6. Construct `Text { raw_input, segments }` and save to database via `save_text`.
7. Return the saved `Text`.

### Side Effects

- Saves processed Text to database (replaces any existing text).
- Spawns an external process (Claude CLI) which requires network access.

### Frontend Invocation

```typescript
const processedText = await invoke<Text>("process_text", { rawInput });
```

---

## Existing Commands (unchanged)

### `save_text`

```
save_text(text: Text) → Result<(), AppError>
```

No changes. Used by frontend to save rawInput before processing, and internally by `process_text` to persist results.

### `load_text`

```
load_text() → Result<Option<Text>, AppError>
```

No changes. Returns null when no text saved, or the saved Text (which may or may not have segments).

---

## Error Type Extension

```rust
pub enum AppError {
    Database(rusqlite::Error),
    Io(std::io::Error),
    Processing(String),  // NEW: Claude CLI processing errors
}
```

The `Processing` variant covers all CLI-related failures (not found, timeout, malformed output, non-zero exit).

---

## Test Expectations

### Frontend (vitest)

Mock `invoke("process_text", { rawInput })`:
- Success: resolve with `{ rawInput, segments: [...] }`
- Failure: reject with error string

### Backend (cargo test)

Test pure functions:
- `build_prompt("今天天氣很好")` → valid prompt string containing the text
- `parse_claude_response(valid_json)` → `Vec<TextSegment>` with correct structure
- `parse_claude_response(malformed_json)` → `Err(AppError::Processing(...))`
- `parse_claude_response(empty_structured_output)` → `Err(AppError::Processing(...))`
