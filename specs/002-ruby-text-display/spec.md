# Feature Specification: Ruby Text Display

**Feature Branch**: `002-ruby-text-display`
**Created**: 2026-02-09
**Status**: Draft
**Input**: Display hardcoded Chinese Words with pinyin ruby annotations — frontend-only, no LLM, no persistence.

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Read Chinese Text with Pinyin (Priority: P1)

A learner opens the application and sees a body of Chinese text with pinyin
annotations displayed above each Word. The text is hardcoded sample content
that demonstrates the ruby rendering. The learner reads through the text,
using the pinyin to guide pronunciation.

**Why this priority**: This is the only story. Ruby rendering of Words is the
entire visual identity of the application. Nothing else can be built until
this foundation exists.

**Independent Test**: Open the application. A block of Chinese text appears
with pinyin ruby annotations above each Word. The pinyin is visually smaller
than the Chinese characters and uses the accent color.

**Acceptance Scenarios**:

1. **Given** the application is launched, **When** the main view loads,
   **Then** the user sees a Text composed of multiple Words, each with
   Chinese characters and pinyin displayed as a ruby annotation above them.

2. **Given** a Word contains multiple Chinese characters (e.g., 現在),
   **When** the Word is rendered, **Then** the pinyin is displayed as a
   single unit (e.g., "xiànzài") above the entire Word, not split per
   character.

3. **Given** a Word contains a single Chinese character (e.g., 我),
   **When** the Word is rendered, **Then** the pinyin is displayed above
   that character (e.g., "wǒ").

4. **Given** the Text contains non-Word content (e.g., punctuation,
   numbers, spaces), **When** it is rendered, **Then** it appears inline
   without any ruby annotation. This includes Chinese punctuation
   (。，！？), which is Chinese but has no pinyin.

5. **Given** the application window is resized above 400px width,
   **When** the text reflows, **Then** Words wrap naturally at word
   boundaries and ruby annotations remain correctly aligned above their
   respective Words.

6. **Given** the application window is resized below 400px width,
   **When** the threshold is crossed, **Then** the Text is hidden and a
   full-screen overlay appears asking the user to increase the window
   size. When the window is enlarged past 400px again, the overlay
   disappears and the Text is visible.

7. **Given** the user hovers over a Word, **When** the cursor enters the
   Word area, **Then** the Word receives a subtle warm background
   highlight and the pinyin gains slightly more visual presence (opacity
   or size). The transition is gentle (200–300 ms). When the cursor
   leaves, the Word returns to its default state with the same
   transition.

---

### Edge Cases

- What happens when the window is too narrow to maintain constitutional
  spacing and readable ruby annotations? Below a minimum width (400px),
  the entire view MUST be replaced by a full-screen overlay asking the
  user to increase the window size. Constitutional adherence (generous
  whitespace, proper font sizing) takes priority over responsiveness.
- What happens when a Word has unusually long pinyin? The real concern
  is multi-character Words where each character has long pinyin, producing
  a combined unit that far exceeds the base text width (e.g.,
  乘風破浪/chéngfēngpòlàng — 16 Latin characters above 4 Chinese
  characters). The ruby annotation MUST not cause layout shifts or
  overlap adjacent Words.
- What happens when the sample Text is empty? The UI MUST display a
  placeholder message.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The application MUST display a hardcoded Text as a sequence
  of Words with pinyin ruby annotations.
- **FR-002**: Each Word MUST render its Chinese characters as base text
  and its pinyin as a ruby annotation above the base text.
- **FR-003**: Pinyin MUST be displayed as a single unit per Word (e.g.,
  "xiànzài" for 現在), not split per character.
- **FR-004**: Non-Word content (punctuation, numbers, spaces) MUST render
  inline without ruby annotations. Note: Chinese punctuation (。，！？「」)
  is Chinese content but has no pinyin and therefore is not a Word.
- **FR-005**: The Text MUST reflow correctly when the window is resized
  (above minimum width), with ruby annotations staying aligned above
  their Words. The layout MUST follow a standard page (portrait)
  proportion, not landscape.
- **FR-006**: When the window width falls below 400px, the application
  MUST replace the entire view with a full-screen overlay instructing the
  user to increase the window size. The overlay MUST disappear
  automatically when the window exceeds 400px again. Constitutional
  spacing and readability take priority over responsiveness.
- **FR-007**: Chinese text MUST use Noto Sans CJK TC (per constitution
  visual identity).
- **FR-008**: Pinyin text MUST use Inter or system sans-serif (per
  constitution visual identity).
- **FR-009**: Ruby annotations MUST render at roughly 50% of the base
  Chinese font size (per constitution visual identity).
- **FR-010**: Ruby annotations MUST use the accent color (vermillion) for
  visual distinction (per constitution visual identity).
- **FR-011**: The UI MUST display a placeholder when the Text is empty.
- **FR-012**: The visual direction MUST follow the Ink & Vermillion
  (水墨風) aesthetic: warm rice-paper background in light mode, deep ink
  background in dark mode, soft ink-black text, and vermillion as the
  accent color. The feel is traditional Chinese calligraphy — paper and
  fresh ink — warm yet restrained.
- **FR-013**: Both light and dark modes MUST be supported as first-class
  (per constitution). Light: warm off-white background, soft ink text.
  Dark: deep ink background, warm cream text. The accent color (vermillion)
  MUST work in both modes.
- **FR-014**: When the user hovers over a Word, the Word MUST receive a
  subtle background highlight (vermillion at low opacity) and the pinyin
  MUST gain slightly more visual presence. The transition MUST be gentle
  (200–300 ms ease, per constitution). The effect conveys that the Word
  responds to the reader's attention.

### Assumptions

- The hardcoded sample Text contains a mix of multi-character Words,
  single-character Words, and punctuation to exercise all rendering paths.
- The sample content uses traditional Chinese characters (consistent with
  the project origin: 知識的365堂課).
- No user interaction is required beyond viewing and hovering — no
  editing, no correction, no persistence.
- No backend (Rust) logic is needed for this feature; all data is
  frontend-only.
- No LLM integration; Words are statically defined in the frontend code.

### Key Entities

- **Text**: The complete body of Chinese content. In this feature, a single
  hardcoded instance containing sample traditional Chinese text.
- **Word**: An ordered segment of the Text, consisting of one or more
  Chinese characters and exactly one pinyin string. In this feature, Words
  are statically defined as part of the hardcoded data.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: When the application launches, the user sees Chinese text
  with pinyin annotations within 2 seconds.
- **SC-002**: 100% of Words in the sample Text display their pinyin as a
  single unit above the Chinese characters (no split pinyin).
- **SC-003**: Non-Word content (punctuation, numbers, spaces — including
  Chinese punctuation) renders inline without spurious ruby annotations.
- **SC-004**: At window widths of 400px and above, the text remains
  legible and correctly laid out. Below 400px, the minimum-width overlay
  is displayed instead of the text.
- **SC-005**: Hovering over any Word produces a visible but subtle
  highlight within 300 ms. Leaving the Word reverses the effect within
  300 ms.
