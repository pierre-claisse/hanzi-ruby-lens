# Quickstart: Native Pinyin Processing

**Feature Branch**: `023-native-pinyin-processing`

## What Changes

Replace the Claude CLI-based Chinese text processing with native Rust libraries. The backend `process_text` command stops spawning a `claude` subprocess and instead uses:

- **jieba-rs** for Chinese word segmentation
- **chinese_dictionary** for word-level pinyin lookup (CC-CEDICT)
- **pinyin** for character-level pinyin fallback

## Files Modified

### Rust Backend (src-tauri/src/)

| File | Change |
|------|--------|
| `processing.rs` | **Rewrite**: Remove Claude CLI prompt/parsing. Implement native segmentation + pinyin pipeline. |
| `commands.rs` | **Simplify**: Remove async CLI subprocess, timeout, retry, JSON envelope parsing. Call synchronous native processing. |
| `Cargo.toml` | **Update**: Add `jieba-rs`, `chinese_dictionary`, `pinyin`. Remove `tokio` (no longer needed for process spawning). |

### Files Removed / Cleaned

- `SYSTEM_PROMPT` constant in processing.rs
- `build_prompt()` function
- `parse_claude_response()` function
- `strip_code_fences()` function
- All Claude CLI error handling (NotFound, timeout, envelope parsing)

### Files NOT Modified

- `domain.rs` — unchanged (Text, Word, TextSegment)
- `database.rs` — unchanged
- `error.rs` — unchanged (AppError::Processing still used)
- `state.rs` — unchanged
- `lib.rs` — unchanged (same command registration)
- All frontend files — unchanged
- All TypeScript types — unchanged

## New Dependencies (Cargo.toml)

```toml
jieba-rs = { version = "0.8", features = ["default-dict"] }
chinese_dictionary = "2.1"
pinyin = "0.11"
```

## Dependencies Potentially Simplified

```toml
# tokio: may be reducible — check if still needed by Tauri 2 or other commands
# If process_text was the only async command, it can become synchronous
```

## Processing Pipeline

```
raw_input (String)
    │
    ▼
┌─────────────────┐
│  Classify chars  │  Scan input, split into Chinese runs and non-Chinese runs
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  jieba-rs cut   │  Segment Chinese runs into Words
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Pinyin lookup  │  CC-CEDICT word lookup → fallback to pinyin crate
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Assemble       │  Build Vec<TextSegment> from tokens
└────────┬────────┘
         │
         ▼
Vec<TextSegment>
```

## Testing Strategy

- **Unit tests**: Test segmentation pipeline with known inputs (existing test cases from processing.rs can be adapted).
- **Contract tests**: Verify `process_text` IPC command returns correct structure.
- **Integration tests**: End-to-end from raw input to reading view (existing frontend tests remain valid).
- **Accuracy tests**: Curated list of polyphonic words to verify correct pinyin resolution.
