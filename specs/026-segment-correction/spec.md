# Feature Specification: Segment Correction

**Feature Branch**: `026-segment-correction`
**Created**: 2026-02-24
**Status**: Draft
**Input**: User description: "Add the ability to correct word segmentation via the context menu. Right-clicking a word reveals split and merge options. Splitting divides a word at a chosen character boundary; merging concatenates a word with its neighbor. Pinyin annotations are split or joined accordingly without altering syllables or tones."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Split a Word into Two (Priority: P1)

A learner is reading a Chinese text and notices that the automatic segmentation has incorrectly grouped characters together. For example, "法國人" is displayed as a single word but should be "法國" and "人" (or "法" and "國人"). The learner right-clicks the word and selects a split option to divide it at the correct boundary. The two resulting words each carry their corresponding portion of the original pinyin, and the correction is saved immediately.

**Why this priority**: Incorrect segmentation directly harms comprehension — a learner who sees the wrong word boundaries cannot properly learn vocabulary or understand structure. Splitting is the most common correction needed because automatic segmenters tend to over-group characters.

**Independent Test**: Can be fully tested by right-clicking any multi-character word and splitting it. The display updates immediately with two separate ruby-annotated words, and reloading the text confirms persistence.

**Acceptance Scenarios**:

1. **Given** a reading view with the word "法國人" (pinyin: "fǎguórén"), **When** the user right-clicks and selects "Split after 法", **Then** the word is replaced by two words: "法" (pinyin: "fǎ") and "國人" (pinyin: "guórén").
2. **Given** a reading view with the word "法國人" (pinyin: "fǎguórén"), **When** the user right-clicks and selects "Split after 國", **Then** the word is replaced by two words: "法國" (pinyin: "fǎguó") and "人" (pinyin: "rén").
3. **Given** a reading view with a single-character word "人", **When** the user right-clicks, **Then** no split options are shown (a single character cannot be split).
4. **Given** a split has been performed, **When** the user navigates away and returns to the text, **Then** the corrected segmentation is preserved.

---

### User Story 2 - Merge a Word with Its Neighbor (Priority: P1)

A learner notices that characters which should form a single word have been split into separate words. For example, "法" and "國" appear as two separate words but should be "法國". The learner right-clicks one of the words and selects the option to merge it with its neighbor. The resulting word carries the concatenation of both pinyin strings.

**Why this priority**: Under-segmentation is equally harmful to learners — seeing "法" and "國" as separate words obscures the compound word "法國" (France). Merge is the complementary operation to split and equally critical for accurate reading.

**Independent Test**: Can be fully tested by right-clicking a word and merging it with a neighbor. The display updates immediately with a single combined ruby-annotated word, and reloading confirms persistence.

**Acceptance Scenarios**:

1. **Given** two adjacent words "法" (pinyin: "fǎ") and "國" (pinyin: "guó"), **When** the user right-clicks "國" and selects "Merge with previous word", **Then** a single word "法國" (pinyin: "fǎguó") is displayed.
2. **Given** two adjacent words "法" (pinyin: "fǎ") and "國" (pinyin: "guó"), **When** the user right-clicks "法" and selects "Merge with next word", **Then** a single word "法國" (pinyin: "fǎguó") is displayed.
3. **Given** a word that is the first word segment in the text, **When** the user right-clicks, **Then** no "Merge with previous word" option is shown.
4. **Given** a word that is the last word segment in the text, **When** the user right-clicks, **Then** no "Merge with next word" option is shown.
5. **Given** a merge has been performed, **When** the user navigates away and returns to the text, **Then** the corrected segmentation is preserved.
6. **Given** a 10-character word adjacent to a 4-character word, **When** the user right-clicks either word, **Then** the merge option toward the other is not shown (result would be 14, exceeding the 12-character limit).
7. **Given** a 12-character word adjacent to any other word, **When** the user right-clicks the 12-character word, **Then** no merge options are shown at all.

---

### User Story 3 - Context Menu Presents Correct Options (Priority: P2)

When a learner right-clicks any word, the context menu dynamically shows the applicable segmentation options alongside the existing actions (dictionary, translate, edit pinyin, copy). Split options only appear for multi-character words, and merge options only appear when an adjacent word neighbor exists.

**Why this priority**: The context menu is the sole entry point for segmentation correction. If the options are confusing, unavailable when needed, or available when nonsensical, learners will struggle or make errors.

**Independent Test**: Can be tested by right-clicking words in various positions (first, middle, last, single-character, multi-character) and verifying the menu shows exactly the correct set of options.

**Acceptance Scenarios**:

1. **Given** a 3-character word "法國人", **When** the user right-clicks, **Then** the context menu shows 2 split options: "Split after 法" and "Split after 國" (one for each internal boundary).
2. **Given** a 2-character word "法國", **When** the user right-clicks, **Then** the context menu shows 1 split option: "Split after 法".
3. **Given** a word with both a previous and a next word neighbor, **When** the user right-clicks, **Then** both "Merge with previous word" and "Merge with next word" options appear.
4. **Given** a word separated from neighbors by plain text (punctuation, whitespace), **When** the user right-clicks, **Then** merge options are only shown for directions where an adjacent word segment exists without intervening plain text.

---

### Edge Cases

- What happens when a word has previously had its pinyin manually corrected, and is then split? The corrected pinyin is used as the source for splitting — the system splits the current pinyin, not the original automatic pinyin.
- What happens when two words are merged and one or both had corrected pinyin? The corrected pinyin values are concatenated to form the merged word's pinyin.
- What happens when the user splits a word and then wants to undo? There is no dedicated undo. The user can merge the resulting words back together manually, restoring the original segmentation.
- What happens when a word is adjacent to a plain text segment (punctuation, space)? Merge is not offered across plain text boundaries — only adjacent word segments can be merged.
- What happens when the user repeatedly merges words to form an increasingly long word? A Word MUST NOT exceed 12 Chinese characters. If a word already has 12 characters, or if the result of a merge would exceed 12 characters, the merge option is not shown. This prevents unbounded word growth.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The context menu MUST offer split options for any word containing 2 or more characters, with one option per internal character boundary.
- **FR-002**: Each split option MUST clearly indicate the split point using the actual characters (e.g., "Split after 法").
- **FR-003**: Splitting a word MUST produce exactly two new word segments that replace the original word in the segments list, preserving their position.
- **FR-004**: The pinyin of a split word MUST be divided into two portions matching the character counts of the resulting words, preserving all syllables and tones exactly.
- **FR-005**: The context menu MUST offer "Merge with previous word" when the immediately preceding segment is a word.
- **FR-006**: The context menu MUST offer "Merge with next word" when the immediately following segment is a word.
- **FR-007**: Merging two words MUST produce a single word whose characters are the concatenation of both words' characters, and whose pinyin is the concatenation of both words' pinyin strings.
- **FR-008**: Merge and split options MUST NOT appear when the operation is not applicable (single-character word for split; no adjacent word neighbor for merge; merge result would exceed 12 characters).
- **FR-012**: A Word MUST NOT exceed 12 Chinese characters. Merge options MUST be hidden when the resulting word would contain more than 12 characters.
- **FR-009**: All segmentation corrections MUST be persisted immediately and permanently — they MUST NOT be overwritten by any automatic process.
- **FR-010**: Segmentation corrections MUST be navigable via keyboard, consistent with the existing context menu keyboard interaction.
- **FR-011**: The raw Chinese text MUST remain unchanged by any segmentation correction — only segment boundaries and their associated pinyin strings are affected.

### Key Entities

- **Word**: Extended to support boundary corrections — its characters and pinyin can be redefined through split and merge operations, but the underlying Chinese characters of the Text remain immutable. A Word contains between 1 and 12 Chinese characters (inclusive).
- **TextSegment**: The ordered list of segments within a Text is mutable with respect to word boundaries (split increases segment count, merge decreases it) while the total character content remains constant.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can correct any segmentation error (split or merge) in under 5 seconds via two interactions: right-click then menu selection.
- **SC-002**: After a segmentation correction, the total character content of the text remains identical — no characters are added, removed, or reordered.
- **SC-003**: After a segmentation correction, all pinyin syllables and tones are preserved exactly — only their grouping across words changes.
- **SC-004**: Segmentation corrections persist across application restarts with 100% fidelity.
- **SC-005**: The context menu shows only applicable options — no disabled or greyed-out segmentation entries; irrelevant options are absent entirely.

## Assumptions

- The constitution has been amended to v3.1.0 to support this feature: (1) correctability now extends to segmentation boundaries (split/merge), and (2) a Word MUST contain between 1 and 12 Chinese characters.
- Pinyin strings stored per word are concatenated syllables (e.g., "fǎguórén" for "法國人"). The system is assumed capable of parsing concatenated pinyin into per-character syllables to support accurate splitting.
- There is no undo/redo mechanism. Users reverse a split by merging, and reverse a merge by splitting. This is acceptable given the low frequency and simplicity of these operations.
- Split and merge operations are saved immediately (no autosave — the operation itself is the explicit user action, consistent with the existing pinyin correction model).
