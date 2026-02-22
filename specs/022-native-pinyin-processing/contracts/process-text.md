# Contract: process_text Command

**Feature Branch**: `023-native-pinyin-processing`

## Overview

The `process_text` Tauri IPC command is the **only** modified contract. Its external signature (input/output types) remains unchanged. The internal implementation switches from Claude CLI to native Rust libraries.

## Command Signature (Unchanged)

```
Command: process_text
Input:   { raw_input: String }
Output:  Result<Text, AppError>
```

## Behavioral Changes

| Aspect | Before (LLM) | After (Native) |
|--------|--------------|----------------|
| Network required | Yes (Claude CLI → API) | No |
| Processing time (500 chars) | 10-60 seconds | < 100 ms |
| Processing time (5000 chars) | Often fails/times out | < 1 second |
| Max text length | ~2000 chars (practical limit) | 10,000+ chars |
| External dependency | Claude CLI in PATH | None |
| Deterministic | No (LLM varies) | Yes (dictionary-based) |

## Error Cases

| Error | Condition | AppError variant |
|-------|-----------|-----------------|
| Empty input | `raw_input` is empty string | Returns Text with empty segments (unchanged behavior) |
| Processing failure | Internal library error | `AppError::Processing(message)` |

## Removed Behaviors

- No more `Command::new("claude")` subprocess spawning
- No more 600-second timeout
- No more JSON envelope parsing (`result` field extraction)
- No more code fence stripping
- No more retry logic
- No more `SYSTEM_PROMPT` constant

## Invariants (Preserved)

- Every character in `raw_input` appears in exactly one segment, in order
- No characters are added, removed, or reordered
- Chinese characters produce Word segments; non-Chinese content produces Plain segments
- Pinyin uses tone marks (e.g., "jīntiān"), not tone numbers
- Pinyin is concatenated per word (e.g., "xiànzài" not "xiàn zài")
- Result is saved to database before returning (unchanged)
