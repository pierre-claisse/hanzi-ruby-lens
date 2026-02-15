# Contract: load_text

**Type**: Tauri Command (Read / CQRS Query)

## Signature

### Rust (Backend)

```rust
#[tauri::command]
fn load_text(app_handle: tauri::AppHandle) -> Result<Option<Text>, AppError>
```

### TypeScript (Frontend Invocation)

```typescript
import { invoke } from "@tauri-apps/api/core";
import type { Text } from "../types/domain";

async function loadText(): Promise<Text | null> {
  return await invoke<Text | null>("load_text");
}
```

## Input

None.

## Output

| Case | Response | Description |
|------|----------|-------------|
| Text exists | `Some(Text)` / `Text` object | The persisted Text with all segments |
| No text saved | `None` / `null` | First launch or empty table |
| Database error | Error string | Corruption, missing file, etc. |

### Text Shape (JSON response)

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

## Behavior

1. Query `SELECT raw_input, segments FROM texts WHERE id = 1`
2. If row exists: deserialize segments JSON, return `Some(Text)`
3. If no row: return `None`
4. If query or deserialization fails: return error

## Preconditions

- Database connection is initialized (setup hook completed)

## Postconditions

- No database state changes (read-only query)

## Error Cases

| Error | Behavior |
|-------|----------|
| No database file | Connection setup should have created it; if somehow missing, error propagates |
| Corrupted database | Returns error; frontend falls back to sampleText (FR-010) |
| Invalid JSON in segments column | Deserialization error; frontend falls back to sampleText |

## Frontend Fallback Logic

```typescript
// In useTextLoader hook:
const [text, setText] = useState<Text>(sampleText);

useEffect(() => {
  loadText()
    .then((loaded) => {
      if (loaded) setText(loaded);
      // null → keep sampleText (first launch)
    })
    .catch((err) => {
      console.error("Failed to load text:", err);
      // error → keep sampleText (FR-010)
    });
}, []);
```
