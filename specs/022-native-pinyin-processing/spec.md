# Feature Specification: Native Pinyin Processing

**Feature Branch**: `023-native-pinyin-processing`
**Created**: 2026-02-22
**Status**: Draft
**Input**: User description: "Abandon Claude CLI text processing entirely. Replace LLM-based approach with existing software libraries for Chinese text segmentation and pinyin annotation. Same input/output from user perspective, different technical approach."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Process Chinese Text Into Annotated Words (Priority: P1)

As a Mandarin Chinese learner, I paste raw Chinese text (traditional or simplified) and receive it segmented into Words with accurate pinyin annotations, so I can read and study the text with pronunciation guides.

**Why this priority**: This is the core function of the application. Without reliable text processing, no other feature has value.

**Independent Test**: Can be fully tested by pasting a Chinese text and verifying that the result displays correctly segmented Words with appropriate pinyin annotations.

**Acceptance Scenarios**:

1. **Given** the user has entered a Chinese text containing common vocabulary (e.g., "今天天氣很好"), **When** processing completes, **Then** the text is segmented into natural Chinese Words (e.g., 今天 / 天氣 / 很 / 好) with correct pinyin using tone marks (e.g., jīntiān, tiānqì, hěn, hǎo).
2. **Given** the user has entered a text mixing Chinese characters with punctuation, numbers, and non-Chinese text (e.g., "Hello世界！2025年"), **When** processing completes, **Then** Chinese portions are segmented into Words with pinyin while non-Chinese portions become plain segments preserving their original content.
3. **Given** the user has entered a text in traditional characters (e.g., "覺得" vs. "睡覺"), **When** processing completes, **Then** context-dependent pronunciation is correctly assigned (e.g., "jué" in 覺得, "jiào" in 睡覺).

---

### User Story 2 - Process Long Texts Reliably (Priority: P1)

As a user, I can paste texts of any reasonable length (including multi-page articles and book chapters) and have them processed successfully without failures or timeouts, so I am not limited to short excerpts.

**Why this priority**: The inability to process long texts reliably is the primary reason for replacing the current system. This is equally critical as basic processing.

**Independent Test**: Can be tested by pasting progressively longer texts (500, 2000, 5000+ characters) and verifying all complete successfully.

**Acceptance Scenarios**:

1. **Given** the user has entered a text of 5,000+ Chinese characters, **When** processing is triggered, **Then** the full text is processed successfully without errors or truncation.
2. **Given** the user has entered a text of any supported length, **When** processing is triggered, **Then** processing completes within a predictable and reasonable time proportional to text length.

---

### User Story 3 - Fast Processing Feedback (Priority: P2)

As a user, I expect text processing to feel responsive, so I am not left waiting for extended periods wondering if the application is working.

**Why this priority**: The current LLM-based approach involves significant latency. A software-based solution should be dramatically faster, improving the user experience.

**Independent Test**: Can be tested by measuring processing time for texts of various lengths and verifying it remains within acceptable bounds.

**Acceptance Scenarios**:

1. **Given** the user has entered a short text (under 500 characters), **When** processing is triggered, **Then** results appear near-instantly (under 2 seconds).
2. **Given** the user has entered a long text (5,000+ characters), **When** processing is triggered, **Then** results appear within 10 seconds.

---

### User Story 4 - Offline Processing (Priority: P2)

As a user, I can process new Chinese texts without any internet connection, so I can use the application anywhere.

**Why this priority**: The current system requires network access to call the Claude CLI. A native software solution eliminates this dependency, aligning with the Offline-First Data principle.

**Independent Test**: Can be tested by disabling network connectivity and verifying that text processing still works.

**Acceptance Scenarios**:

1. **Given** the machine has no internet connection, **When** the user enters and processes a Chinese text, **Then** the text is segmented and annotated with pinyin successfully.

---

### Edge Cases

- What happens when the text contains rare or archaic Chinese characters not found in standard dictionaries? The system should produce a best-effort pinyin or fall back to individual character readings.
- What happens when the text contains a mix of simplified and traditional characters in the same passage? Both must be handled correctly.
- How does the system handle text with only punctuation and no Chinese characters? It should produce plain segments only.
- What happens with characters that have multiple valid pronunciations depending on context (polyphonic characters like 了, 地, 得)? The system should resolve based on context where possible.
- How does the system handle very short inputs (single character)? It should produce a single Word segment with the character's default pronunciation.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST segment raw Chinese text into natural lexical Words (multi-character word units, not individual characters) with their corresponding pinyin.
- **FR-002**: System MUST produce pinyin with tone marks (e.g., "jīntiān"), not tone numbers (e.g., "jin1tian1").
- **FR-003**: System MUST produce a single concatenated pinyin string per Word (e.g., "xiànzài" for 現在, not "xiàn zài").
- **FR-004**: System MUST handle both traditional and simplified Chinese characters.
- **FR-005**: System MUST preserve non-Chinese content (punctuation, whitespace, numbers, Latin text) as plain segments in their original positions.
- **FR-006**: System MUST process the text entirely on the local machine without network calls.
- **FR-007**: System MUST handle context-dependent pronunciation for polyphonic characters (e.g., 覺 is "jué" in 覺得 but "jiào" in 睡覺).
- **FR-008**: System MUST produce the same output data structure as the current system (Words with characters + pinyin, and plain text segments) so the reading experience is unchanged.
- **FR-009**: System MUST handle texts of at least 10,000 Chinese characters without failure.
- **FR-010**: System MUST NOT require the Claude CLI or any external LLM service to be installed or available.

### Key Entities

- **Text**: The aggregate root — raw Chinese input and its processed segments. Unchanged from current domain model.
- **Word**: An ordered segment consisting of one or more Chinese characters and their pinyin as a single unit. Unchanged from current domain model.
- **TextSegment**: Either a Word (Chinese characters + pinyin) or a plain text segment. Unchanged from current domain model.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can process a 500-character Chinese text in under 2 seconds.
- **SC-002**: Users can process a 5,000-character Chinese text in under 10 seconds.
- **SC-003**: Users can process texts of 10,000+ characters without any failures.
- **SC-004**: Processing works fully offline with no internet connection required.
- **SC-005**: Pinyin accuracy for common vocabulary is comparable to established Chinese learning tools (above 95% correctness for the 5,000 most frequent words).
- **SC-006**: Context-dependent pronunciation (polyphonic characters) is correctly resolved in the majority of common cases.
- **SC-007**: The reading experience (display of Words with ruby annotations) is identical to the current system from the user's perspective.

## Assumptions

- Existing open-source Chinese NLP libraries provide sufficient accuracy for the target use case of language learners reading general-interest texts.
- Perfect accuracy for all polyphonic characters is not expected — reasonable accuracy for common cases is acceptable, with user correction available for any errors.
- The domain model (Text, Word, TextSegment) does not need to change; only the backend processing pipeline is replaced.
- The user-facing behavior (paste text, trigger processing, see annotated reading view) remains identical.
- The elapsed timer displayed during processing will continue to work, though processing will be much faster.
