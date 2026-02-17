# Feature Specification: Pinyin Segmentation

**Feature Branch**: `016-pinyin-segmentation`
**Created**: 2026-02-17
**Status**: Draft
**Input**: User description: "Claude CLI integration for pinyin segmentation of Chinese text"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Text Processing (Priority: P1)

The user submits Chinese text and the system automatically processes it into Word segments with pinyin annotations. After submitting text, the user sees a processing indicator, and once complete, the text is displayed in reading view with pinyin ruby annotations above each Word.

**Why this priority**: This is the core value proposition of the app. Without automatic pinyin generation, users must manually annotate text, which defeats the purpose.

**Independent Test**: Submit Chinese text (e.g., "今天天氣很好") via the input view. After processing completes, verify the reading view shows ruby annotations with correct pinyin (e.g., "jīntiān" above 今天, "tiānqì" above 天氣, "hěnhǎo" above 很好).

**Acceptance Scenarios**:

1. **Given** the user has entered Chinese text, **When** they submit, **Then** the system processes the text into Words with pinyin and displays the reading view with ruby annotations.
2. **Given** the user submits text, **When** processing is in progress, **Then** a loading indicator is shown and the user cannot re-submit until processing completes.
3. **Given** the user submits text containing punctuation and non-Chinese characters, **When** processing completes, **Then** punctuation and non-Chinese characters appear as plain text (not annotated) while Chinese Words receive pinyin.

---

### User Story 2 - Processing Errors (Priority: P2)

When processing fails (the language model is unavailable, returns invalid output, or times out), the user sees a clear error message and can retry. The raw text they entered is never lost.

**Why this priority**: Error handling is essential for a reliable user experience. The language model may be temporarily unavailable or return unexpected output.

**Independent Test**: Simulate a processing failure. Verify the error message is shown, the user's raw text is preserved, and a retry option is available.

**Acceptance Scenarios**:

1. **Given** the user submits text, **When** the language model is unavailable, **Then** an error message is displayed and the raw text is preserved in the database.
2. **Given** processing fails, **When** the user clicks retry, **Then** the system re-attempts processing with the same raw text.
3. **Given** the language model returns malformed output, **When** the system detects invalid data, **Then** it treats it as a processing error and shows an error message.

---

### User Story 3 - Re-Processing on Edit (Priority: P2)

When the user edits previously saved text and re-submits, the system regenerates all Words from scratch. Previously generated pinyin annotations are replaced entirely by the new processing result.

**Why this priority**: Constitutional requirement — Words are ephemeral and MUST be fully regenerated when their parent Text is saved. This ensures pinyin accuracy for modified text.

**Independent Test**: Submit text, see reading view. Edit the text (modify or replace it), re-submit. Verify new Words replace old ones and pinyin matches the new content.

**Acceptance Scenarios**:

1. **Given** the user has text with existing Words displayed, **When** they edit and re-submit, **Then** the system regenerates all Words and the reading view shows updated pinyin.
2. **Given** the user submits a shorter text replacing a longer one, **When** processing completes, **Then** only Words for the new text are shown (old Words are gone).

---

### Edge Cases

- What happens when the user submits extremely long text (e.g., an entire chapter)? The system MUST process it, though it may take longer. A progress indicator remains visible throughout.
- What happens when the text is entirely non-Chinese (e.g., pure English or numbers)? All content is treated as plain segments with no pinyin annotations.
- What happens when the text mixes traditional and simplified characters? Both character sets MUST be processed correctly with appropriate pinyin.
- What happens when the system is processing and the user closes the app? The raw text is already saved. On next launch, the system detects saved text with no segments and shows the processing state (not reading view).
- What happens when the language model produces incorrect pinyin for a word? This feature does not include pinyin correction — that is a future feature. The user can edit and re-submit the text to trigger re-processing.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST automatically process submitted Chinese text into Word segments with pinyin annotations.
- **FR-002**: System MUST display a loading indicator during processing that communicates progress to the user.
- **FR-003**: System MUST transition to the reading view with pinyin ruby annotations after successful processing.
- **FR-004**: System MUST handle punctuation and non-Chinese characters as plain (unannotated) segments.
- **FR-005**: System MUST determine pinyin at the Word level (not character level), respecting context-dependent pronunciation (e.g., 覺 is "jué" in 覺得 but "jiào" in 睡覺).
- **FR-006**: System MUST display pinyin as a single concatenated string per Word (e.g., "xiànzài" for 現在, not "xiàn zài").
- **FR-007**: System MUST persist the generated segments to the database after successful processing.
- **FR-008**: System MUST show an error message when processing fails, with a retry option.
- **FR-009**: System MUST preserve the raw text in the database regardless of processing outcome.
- **FR-010**: System MUST fully regenerate all Words when text is re-submitted (no incremental updates).
- **FR-011**: System MUST support both traditional and simplified Chinese characters.
- **FR-012**: System MUST handle mixed-language text (Chinese interspersed with English, numbers, punctuation) by annotating only the Chinese Words.

### Key Entities

- **Text**: The aggregate root. Contains raw input (user's original Chinese text) and an ordered list of segments. After processing, segments contain Words and plain text segments. Existing entity — unchanged by this feature.
- **Word**: A segment of one or more Chinese characters with a single pinyin string. Produced by language model analysis. Existing entity — unchanged by this feature.
- **TextSegment**: Either a Word (with characters + pinyin) or a plain text segment (punctuation, non-Chinese). Existing entity — unchanged by this feature.

## Assumptions

- The language model (Claude CLI) is installed and accessible on the user's machine. This is a desktop app for personal use, not a distributed system.
- The user's machine has internet connectivity when processing is needed (the language model requires network access).
- Processing a typical paragraph (100-500 characters) completes within 60 seconds.
- The language model can reliably segment Chinese text and produce correct pinyin for common vocabulary and grammar patterns.

## Scope Boundaries

**In scope**:
- Automatic text-to-segments processing via language model
- Loading state during processing
- Error handling and retry
- Persist processed segments
- Re-processing on text edit

**Out of scope** (future features):
- User correction of individual Word pinyin
- Batch processing of multiple texts
- Offline processing (language model requires network)
- Processing progress percentage (only a spinner/indicator)
- Caching or incremental re-processing

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can submit Chinese text and see pinyin annotations within 60 seconds for a paragraph of up to 500 characters.
- **SC-002**: 95% of common Chinese words receive correct pinyin annotation on first processing (measured against standard dictionaries).
- **SC-003**: Processing errors display a user-friendly message within 5 seconds of failure, with a one-click retry option.
- **SC-004**: After successful processing, the reading view renders all Words with pinyin annotations immediately (no further loading required).
- **SC-005**: Re-submitting edited text produces a complete fresh set of Word segments within the same time bounds as initial processing.
