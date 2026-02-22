# Contract: process_text Command

**Feature**: 023-paranoid-pinyin-pipeline

## Command Signature (Unchanged)

```
process_text(app_handle, raw_input: String) -> Result<Text, AppError>
```

The Tauri IPC command signature remains identical. This is a purely internal quality improvement — the contract between frontend and backend does not change.

## Input

| Field     | Type   | Constraints          |
|-----------|--------|----------------------|
| raw_input | String | Any UTF-8 string     |

## Output

| Field     | Type              | Constraints                              |
|-----------|-------------------|------------------------------------------|
| raw_input | String            | Echo of input, unchanged                 |
| segments  | Vec\<TextSegment\>| Ordered segments covering all input chars |

### TextSegment::Word

| Field      | Type   | Constraints                                           |
|------------|--------|-------------------------------------------------------|
| characters | String | One or more CJK characters                            |
| pinyin     | String | Concatenated, lowercase, tone marks, no spaces, non-empty |

### TextSegment::Plain

| Field | Type   | Constraints                  |
|-------|--------|------------------------------|
| text  | String | Non-CJK content, non-empty   |

## Quality Guarantees (New)

1. **Syllable parity**: For every Word, `count_pinyin_syllables(pinyin) == count_cjk_chars(characters)`
2. **Cross-validation**: Each pinyin syllable is a valid reading for its corresponding character (when validation data is available)
3. **Non-empty pinyin**: No Word has an empty pinyin string
4. **Lossless**: `segments.map(text).join("") == raw_input`

## Error Conditions (Unchanged)

| Condition    | Result                |
|--------------|-----------------------|
| Empty input  | Ok(Text with empty segments) |
| DB save fail | Err(AppError::Database) |
