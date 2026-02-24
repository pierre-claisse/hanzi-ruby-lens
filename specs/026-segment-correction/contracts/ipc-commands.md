# IPC Command Contracts: Segment Correction

**Branch**: `026-segment-correction` | **Date**: 2026-02-24

## Existing Commands (unchanged)

### `update_pinyin`

```
invoke("update_pinyin", { textId: i64, segmentIndex: usize, newPinyin: string }) → void
```

No changes. Continues to work on the mutated segment array after split/merge.

### `load_text`

```
invoke("load_text", { textId: i64 }) → Text | null
```

No changes. Used to reload the full text after split/merge.

---

## New Commands

### `split_segment`

Splits a word segment into two at a given character boundary.

**Invocation**:
```typescript
await invoke("split_segment", {
  textId: number,       // i64 — the text to modify
  segmentIndex: number, // usize — index in the segments array
  splitAfterCharIndex: number // usize — 0-based character index to split after
});
```

**Parameters**:

| Name | Type | Description |
|------|------|-------------|
| `textId` | `i64` | ID of the text containing the segment |
| `segmentIndex` | `usize` | Position of the word segment in the segments array |
| `splitAfterCharIndex` | `usize` | 0-based index of the character after which to split. Range: `[0, word.char_count - 2]` |

**Returns**: `void` (unit) on success.

**Errors**:

| Condition | Error |
|-----------|-------|
| Text not found | `Validation("Text with id {id} not found")` |
| Segment index out of bounds | `Validation("Segment index {i} out of bounds (length {n})")` |
| Segment is not a Word | `Validation("Segment at index {i} is not a word")` |
| Split point out of range | `Validation("Split point {p} out of range for word with {n} characters")` |
| Pinyin tokenization failed | `Validation("Cannot split pinyin '{pinyin}' into {n} syllables")` |

**Side effects**:
- The segment at `segmentIndex` is replaced by two Word segments in the database.
- All segment indices after `segmentIndex` shift by +1.

**Example**:
```typescript
// Word "法國人" (pinyin "fǎguórén") at segment index 2
await invoke("split_segment", { textId: 1, segmentIndex: 2, splitAfterCharIndex: 0 });
// Result: segment 2 = Word("法", "fǎ"), segment 3 = Word("國人", "guórén")
// All former segments at index 3+ are now at index 4+
```

---

### `merge_segments`

Merges two adjacent word segments into one.

**Invocation**:
```typescript
await invoke("merge_segments", {
  textId: number,       // i64 — the text to modify
  segmentIndex: number  // usize — index of the LEFT word segment
});
```

**Parameters**:

| Name | Type | Description |
|------|------|-------------|
| `textId` | `i64` | ID of the text containing the segments |
| `segmentIndex` | `usize` | Position of the left word segment. The segment at `segmentIndex + 1` is the right word to merge into it. |

**Returns**: `void` (unit) on success.

**Errors**:

| Condition | Error |
|-----------|-------|
| Text not found | `Validation("Text with id {id} not found")` |
| Segment index out of bounds | `Validation("Segment index {i} out of bounds (length {n})")` |
| Left segment is not a Word | `Validation("Segment at index {i} is not a word")` |
| Right segment does not exist | `Validation("No segment after index {i} to merge with")` |
| Right segment is not a Word | `Validation("Segment at index {i+1} is not a word")` |
| Result exceeds 12 characters | `Validation("Merged word would have {n} characters, exceeding the 12-character limit")` |

**Side effects**:
- The segments at `segmentIndex` and `segmentIndex + 1` are replaced by a single Word segment.
- All segment indices after `segmentIndex + 1` shift by -1.

**Example**:
```typescript
// Word "法" (pinyin "fǎ") at index 2, Word "國" (pinyin "guó") at index 3
await invoke("merge_segments", { textId: 1, segmentIndex: 2 });
// Result: segment 2 = Word("法國", "fǎguó"), former segment 4 is now at index 3
```

---

## Frontend Calling Patterns

### Split flow

```typescript
// In useTextLoader hook
const splitSegment = useCallback(async (segmentIndex: number, splitAfterCharIndex: number) => {
  if (!activeText) return;
  await invoke("split_segment", {
    textId: activeText.id,
    segmentIndex,
    splitAfterCharIndex,
  });
  // Reload to get correct indices
  const reloaded = await invoke<Text>("load_text", { textId: activeText.id });
  if (reloaded) setActiveText(reloaded);
}, [activeText]);
```

### Merge flow

```typescript
// In useTextLoader hook
const mergeSegments = useCallback(async (segmentIndex: number) => {
  if (!activeText) return;
  await invoke("merge_segments", {
    textId: activeText.id,
    segmentIndex,
  });
  // Reload to get correct indices
  const reloaded = await invoke<Text>("load_text", { textId: activeText.id });
  if (reloaded) setActiveText(reloaded);
}, [activeText]);
```
