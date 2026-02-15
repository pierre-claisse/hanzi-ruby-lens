# Contract: save_text

**Type**: Tauri Command (Write / CQRS Command)

## Signature

### Rust (Backend)

```rust
#[tauri::command]
fn save_text(app_handle: tauri::AppHandle, text: Text) -> Result<(), AppError>
```

### TypeScript (Frontend Invocation)

```typescript
import { invoke } from "@tauri-apps/api/core";
import type { Text } from "../types/domain";

async function saveText(text: Text): Promise<void> {
  await invoke("save_text", { text });
}
```

## Input

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `text` | `Text` | Yes | The complete Text object to persist |

### Text Shape (JSON)

```json
{
  "rawInput": "西元前2000年左右...",
  "segments": [
    { "type": "word", "word": { "characters": "西元前", "pinyin": "xīyuánqián" } },
    { "type": "plain", "text": "2000" },
    ...
  ]
}
```

## Output

| Case | Response | Description |
|------|----------|-------------|
| Success | `void` (no return value) | Text saved atomically |
| Failure | Error string | Database or I/O error message |

## Behavior

1. Open a SQLite transaction
2. DELETE all rows from `texts` table
3. INSERT the new Text (id=1, raw_input, segments as JSON)
4. COMMIT the transaction
5. If any step fails, the transaction rolls back — previous data preserved

## Preconditions

- Database connection is initialized (setup hook completed)
- `text.segments` is a valid JSON-serializable array

## Postconditions

- The `texts` table contains exactly one row with the provided Text
- Any previously saved Text is gone
- The database file is fsync'd (WAL mode)

## Error Cases

| Error | Behavior |
|-------|----------|
| Serialization failure | Returns error, no DB change |
| Transaction failure | Rolls back, previous data preserved (FR-006) |
| Disk full | Transaction fails, previous data preserved |
