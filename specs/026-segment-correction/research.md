# Research: Segment Correction

**Branch**: `026-segment-correction` | **Date**: 2026-02-24

## Decision 1: Pinyin Syllable Splitting Strategy

**Decision**: Write a greedy pinyin syllable tokenizer in Rust that splits a concatenated pinyin string into exactly N syllables (where N = number of Chinese characters in the word).

**Rationale**:
- The spec requires splitting the *current* pinyin (which may have been manually corrected), not re-looking up pinyin from the dictionary. This rules out simply calling `lookup_pinyin_paranoid` on the sub-words.
- Pinyin syllables follow a finite, well-defined grammar. A greedy longest-match tokenizer over the known syllable table is deterministic and handles all valid pinyin.
- The `pinyin` crate already enumerates valid syllable forms, providing a reference table. Combined with tone mark awareness (ā/á/ǎ/à → a), the tokenizer can normalize before matching and preserve original tone marks in output.
- Character count provides the expected syllable count, enabling validation: if the tokenizer produces a different count, the split can be rejected gracefully.

**Alternatives considered**:

| Alternative | Why rejected |
|-------------|-------------|
| Re-lookup pinyin via `lookup_pinyin_paranoid` for each sub-word | Violates FR-004: would discard user's manual corrections and produce different pinyin |
| Store pinyin as space-separated syllables internally | Breaking change to existing data format; all existing texts would need migration |
| Use regex-based splitting | Fragile with edge cases (e.g., "ér", "ā" standalone vowels); syllable table approach is more reliable |
| Rely on character-level lookup as fallback only | Doesn't handle the case where user manually corrected pinyin to a non-dictionary value |

**Tokenizer design**:
1. Build a static set of all valid pinyin syllables (without tones) from the `pinyin` crate finals/initials tables.
2. Strip tone marks from input to get a normalized form for matching.
3. Greedily match longest syllable at each position.
4. Preserve original characters (with tones) in output by tracking byte offsets.
5. Validate: output syllable count must equal Chinese character count.
6. On failure: return an error that prevents the split (the operation is refused, not silently degraded).

## Decision 2: Menu Architecture

**Decision**: Make `WordContextMenu` accept a dynamic list of entries instead of a hardcoded `MENU_ENTRIES` array. The parent (`TextDisplay`) computes applicable entries based on the current word's context (character count, adjacent segments).

**Rationale**:
- FR-008 requires that inapplicable options are completely absent (not just disabled). A static list with conditional visibility is less clean than a dynamic list.
- The number of split options depends on character count (a 5-character word has 4 split options). A static array cannot accommodate this.
- The existing `onAction(index)` dispatch pattern works with dynamic entries if each entry carries a typed action discriminator instead of relying on positional index.

**Alternatives considered**:

| Alternative | Why rejected |
|-------------|-------------|
| Keep static `MENU_ENTRIES` + conditional rendering | Cannot handle variable split count; code becomes complex with index shifting |
| Sub-menu for split options | Over-engineered for a short list; adds interaction latency counter to SC-001 (5 seconds) |
| Separate context menus for split vs merge | Inconsistent UX; user expects a single menu per right-click |

**Menu entry structure**:
```typescript
type MenuAction =
  | { type: "dictionary" }
  | { type: "translate" }
  | { type: "editPinyin" }
  | { type: "copy" }
  | { type: "split"; splitAfterIndex: number }
  | { type: "mergeWithPrevious" }
  | { type: "mergeWithNext" };

interface MenuEntry {
  label: string;
  icon: LucideIcon;
  action: MenuAction;
}
```

## Decision 3: Segment Mutation Strategy

**Decision**: After a split or merge IPC call, reload the full text from the database (via `load_text`) rather than applying optimistic updates to the frontend state.

**Rationale**:
- Split changes array length and all subsequent indices. Optimistic updates must correctly recompute `wordIndexMap`, `wordToSegmentIndex`, and `trackedIndex`. A reload avoids this complexity and guarantees consistency.
- The existing `update_pinyin` uses optimistic updates because it's a single-field patch. Split/merge are structural mutations that change the segment array shape.
- Performance is acceptable: loading a text from SQLite and deserializing its JSON segments is sub-millisecond for texts up to 10k characters.

**Alternatives considered**:

| Alternative | Why rejected |
|-------------|-------------|
| Optimistic frontend update (like `updatePinyin`) | Error-prone for structural mutations; index recalculation is fragile |
| Return updated segments from the IPC command | Adds complexity to the command API; reload is simpler and reuses existing `load_text` |

## Decision 4: Pinyin Tokenizer Failure Handling

**Decision**: If the pinyin syllable tokenizer cannot split the concatenated pinyin into exactly N syllables (where N = character count), the split operation is refused entirely. The user is not shown an error dialog — the split options are simply not offered for that word.

**Rationale**:
- This can only happen if the user manually corrected pinyin to a non-standard string that doesn't parse as valid concatenated pinyin syllables.
- Offering a split with incorrectly partitioned pinyin would violate FR-004 ("preserving all syllables and tones exactly").
- The user can first fix the pinyin (via "Edit Pinyin") to valid pinyin, then split.
- This is an extremely rare edge case and does not warrant UI complexity.

**Implementation**: The backend `split_segment` command performs tokenization. If it fails, it returns a validation error. The frontend catches this and does nothing (the menu option should ideally not be shown, but the backend guards against it as defense-in-depth). To pre-validate, the frontend can call a lightweight `can_split_segment` query before building the menu. However, for simplicity, the initial implementation will show split options for all multi-character words and handle the rare failure gracefully by closing the menu without action.

**Alternatives considered**:

| Alternative | Why rejected |
|-------------|-------------|
| Show error toast on split failure | Confusing to users; they wouldn't understand "pinyin tokenization failed" |
| Fall back to re-lookup pinyin | Violates FR-004; would silently overwrite user's corrected pinyin |
| Always show split options, skip pinyin on failure | Violates FR-004; would produce words with empty or incorrect pinyin |
