# Quickstart: Segment Correction

**Branch**: `026-segment-correction` | **Date**: 2026-02-24

## Prerequisites

- Application built and running (via `npm run build` or dev mode in Docker)
- At least one text loaded in the library with Chinese content

## Testing the Feature

### 1. Split a word

1. Open any text in the reading view.
2. Find a multi-character word (e.g., a 2+ character word with ruby annotation).
3. Right-click the word.
4. The context menu shows split options: "Split after X" for each internal character boundary.
5. Click a split option.
6. Verify: the word is now two separate words, each with correct pinyin.
7. Navigate away (back to library) and reopen the text — the split is preserved.

### 2. Merge two words

1. In the reading view, find two adjacent words that should be one word.
2. Right-click the right word.
3. The context menu shows "Merge with previous word".
4. Click it.
5. Verify: the two words are now one word with concatenated pinyin.
6. Navigate away and reopen — the merge is preserved.

### 3. Verify edge cases

- Right-click a single-character word → no split options shown.
- Right-click the first word in the text → no "Merge with previous word" option.
- Right-click the last word in the text → no "Merge with next word" option.
- Right-click a word next to punctuation → no merge option toward the punctuation side.
- Keyboard navigation: use arrow keys and Enter to navigate the context menu and execute split/merge actions.

### 4. Verify 12-character limit

1. Merge several adjacent words to build up a long word (approach 12 characters).
2. When a merge would exceed 12 characters, verify the merge option is not shown.

### 5. Run tests

```sh
npm test         # Full test suite (frontend + Rust)
cargo test       # Rust tests only (pinyin tokenizer, split/merge database operations)
```

## Expected Test Coverage

- **Rust unit tests**: Pinyin syllable tokenizer with various inputs (standard, toned, edge cases).
- **Rust unit tests**: `split_segment_db` and `merge_segments_db` database functions.
- **Frontend contract tests**: `split_segment` and `merge_segments` IPC commands.
- **Frontend integration tests**: Split → verify UI → merge → verify UI round-trip.
