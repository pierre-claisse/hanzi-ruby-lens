# Feature Specification: Paranoid Pinyin Pipeline

**Feature Branch**: `023-paranoid-pinyin-pipeline`
**Created**: 2026-02-22
**Status**: Draft
**Input**: User description: "Améliorer la qualité de segmentation et de pinyin du pipeline de traitement natif Rust, avec cross-validation et fallback multi-niveaux, en mode paranoïaque"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Accurate Pinyin for Every Word (Priority: P1)

A learner pastes a Chinese text and reads the annotated result. Every word displayed must have the correct pinyin above it. When the pinyin syllable count does not match the character count, or when a syllable is not a valid reading for its corresponding character, the system must detect the mismatch and resolve it by falling back to more granular lookup strategies.

**Why this priority**: Incorrect pinyin directly misleads learners and undermines the core value proposition of the application. A single wrong tone or missing syllable can cause confusion and erode trust.

**Independent Test**: Process a curated set of 50 common words (including polyphonic characters like 了, 覺, 行, 長, 地, 得) and verify that every word produces the contextually correct pinyin with exactly one syllable per character.

**Acceptance Scenarios**:

1. **Given** the text "覺得睡覺", **When** processed, **Then** 覺得 produces "juéde" (2 syllables for 2 characters) and 睡覺 produces "shuìjiào" (2 syllables for 2 characters)
2. **Given** any processed word, **When** the pinyin is returned, **Then** the number of pinyin syllables equals the number of Chinese characters in that word
3. **Given** a word where the first dictionary entry has a syllable-count mismatch, **When** processed, **Then** the system tries alternative entries or falls back to character-level lookup rather than returning incomplete pinyin
4. **Given** a word where the dictionary returns a syllable that is not a valid pronunciation for the corresponding character, **When** processed, **Then** the system rejects that entry and falls back to a validated alternative

---

### User Story 2 - Better Word Segmentation (Priority: P2)

A learner pastes a Chinese text and the system segments it into correct word boundaries. Words that belong together should not be split apart, and separate words should not be merged together. The system should prefer conservative, dictionary-validated segmentation over speculative guesses.

**Why this priority**: Incorrect segmentation causes incorrect pinyin (wrong word boundaries lead to wrong dictionary lookups), but segmentation is the upstream prerequisite — fixing it first prevents cascading errors.

**Independent Test**: Process a curated set of texts containing known segmentation challenges (short function words, four-character idioms, mixed simplified/traditional) and verify that word boundaries match expected segmentation.

**Acceptance Scenarios**:

1. **Given** a text containing common multi-character words, **When** processed, **Then** the segmentation matches standard dictionary word boundaries (e.g., "今天" is one word, not "今" + "天")
2. **Given** a text where two different segmentation strategies produce different results, **When** processed, **Then** the system chooses the segmentation where more words are recognized in the dictionary
3. **Given** a text mixing simplified and traditional characters, **When** processed, **Then** words from both character sets are correctly segmented

---

### User Story 3 - Graceful Handling of Rare and Unknown Characters (Priority: P3)

A learner pastes a text containing rare characters, archaic forms, or characters not found in any dictionary. The system must never produce empty or missing pinyin — it must always provide the best available approximation.

**Why this priority**: While rare characters appear infrequently, producing blank or broken pinyin for them degrades the user experience and signals unreliability.

**Independent Test**: Process a set of 10 rare CJK Extension characters and verify that every one produces non-empty pinyin.

**Acceptance Scenarios**:

1. **Given** a rare character with no word-level dictionary entry, **When** processed, **Then** the system falls back to single-character dictionary lookup, then to phonetic database lookup, and always produces non-empty pinyin
2. **Given** a character from CJK Extension B-H ranges, **When** processed, **Then** pinyin is produced (even if approximate) rather than returning the character itself unchanged
3. **Given** a character that exists in no phonetic database at all, **When** processed, **Then** the character is returned as its own representation (identity fallback) rather than crashing or returning empty output

---

### Edge Cases

- What happens when a dictionary returns multiple entries for a word, and none of them pass syllable-count validation? The system falls back to character-by-character lookup.
- How does the system handle a single character that is polyphonic (e.g., 了 can be "le" or "liǎo")? Without sentence-level context, the system uses the most common reading from the dictionary.
- What happens when processing 10,000+ characters? The system completes processing and maintains accuracy at scale.
- What happens with zero-width characters, combining marks, or non-standard Unicode? They pass through as plain segments without affecting adjacent Chinese character processing.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST validate that the number of pinyin syllables returned for a word equals the number of Chinese characters in that word before accepting a dictionary result
- **FR-002**: System MUST cross-validate each pinyin syllable against the known possible pronunciations of its corresponding character, rejecting entries where a syllable is not a valid reading
- **FR-003**: System MUST iterate through all available dictionary entries for a word (not just the first one) until finding an entry that passes both syllable-count and cross-validation checks
- **FR-004**: System MUST implement a multi-level fallback for pinyin lookup: word-level dictionary, then single-character dictionary, then phonetic database, then identity fallback
- **FR-005**: System MUST compare two segmentation strategies (conservative dictionary-only and expanded recognition) and select the one where more resulting words are found in the dictionary
- **FR-006**: System MUST produce lowercase pinyin with tone marks (diacritics) for all output
- **FR-007**: System MUST preserve all input characters in the output — the concatenation of all segment characters must equal the original input
- **FR-008**: System MUST handle both simplified and traditional Chinese characters without requiring the user to specify which character set is being used
- **FR-009**: System MUST never return empty pinyin for any Chinese character — there must always be a non-empty fallback

### Key Entities

- **Word**: A segmented unit of Chinese text consisting of one or more characters paired with their concatenated pinyin annotation
- **TextSegment**: Either a Word (Chinese characters with pinyin) or Plain text (non-Chinese content passed through unchanged)
- **Dictionary Entry**: A word-level record containing character forms, pinyin syllables, and definitions, used for lookup and validation

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of processed words have a pinyin syllable count that matches their character count (zero mismatches permitted)
- **SC-002**: Polyphonic characters in common words (覺得/睡覺, 長大/長度, 行走/銀行) produce the contextually correct pinyin reading in at least 95% of tested cases
- **SC-003**: Processing 500 characters completes in under 5 seconds (relaxed from 2 seconds to accommodate additional validation)
- **SC-004**: Processing 5,000 characters completes in under 30 seconds (relaxed from 10 seconds to accommodate additional validation)
- **SC-005**: No Chinese character in the output has empty pinyin — 100% of characters produce a non-empty annotation
- **SC-006**: All input characters are preserved in the output without loss or reordering — lossless round-trip guarantee

## Assumptions

- The existing dictionary databases (word-level and character-level) are sufficient for the vast majority of modern Chinese text; no new dictionary data sources are required
- Performance degradation from additional validation passes is acceptable (up to 3x-5x slower) given that the base pipeline processes 5,000 characters in under 1 second
- The "most common reading" heuristic (first valid dictionary entry) is an acceptable disambiguation strategy for polyphonic characters when sentence-level context analysis is not available
- This feature is purely a backend processing improvement — no frontend UI changes are required
- The output format (concatenated pinyin with tone marks, lowercase, no spaces) remains unchanged
