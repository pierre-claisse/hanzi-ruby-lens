# Feature Specification: Adaptive Menu Positioning & Numbered Pinyin Input

**Feature Branch**: `027-menu-pinyin-ux`
**Created**: 2026-02-24
**Status**: Draft
**Input**: User description: "Context menu opens below words in the upper half of the window and above words in the lower half. Pinyin correction input displays numbered tones instead of diacritics, and converts back to diacritics on submission."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Adaptive Context Menu Positioning (Priority: P1)

When a user right-clicks (or opens the context menu via keyboard) on a word in the reading view, the menu appears in the direction where there is more screen space. For words in the upper half of the viewport, the menu opens downward (below the word). For words in the lower half, the menu opens upward (above the word). This prevents the menu from being clipped or pushed off-screen when the user interacts with words near the bottom of the window.

**Why this priority**: Currently the menu always opens below the word. For words near the bottom of the viewport, the menu may overflow or be partially hidden, making it unusable. This is a usability blocker.

**Independent Test**: Can be tested by scrolling to the bottom of a long text, right-clicking a word near the bottom edge, and verifying the menu appears above the word with all entries visible.

**Acceptance Scenarios**:

1. **Given** a word is located in the upper half of the viewport, **When** the user opens its context menu, **Then** the menu appears below the word with a small gap.
2. **Given** a word is located in the lower half of the viewport, **When** the user opens its context menu, **Then** the menu appears above the word with a small gap.
3. **Given** a word is near the vertical midpoint of the viewport, **When** the user opens its context menu, **Then** the menu appears in whichever direction provides more available space (below by default if equidistant).
4. **Given** the user resizes the window while a menu is closed, **When** the user opens a context menu on a word, **Then** the position calculation uses the current viewport dimensions.

---

### User Story 2 - Numbered Pinyin in Correction Input (Priority: P2)

When a user opens the pinyin correction input for a word, the input field displays the existing pinyin using tone numbers instead of diacritical marks (e.g., "xi3huan1" instead of "xihuān"). This makes it easier for users to type corrections since standard keyboards cannot easily produce tone diacritics. The user types their correction using tone numbers (1-4 for the four tones, 5 or no number for neutral tone).

**Why this priority**: Entering diacritical pinyin requires special keyboard layouts or copy-pasting. Numbered tone input is the standard method for typing pinyin on regular keyboards, removing a major friction point in the correction workflow.

**Independent Test**: Can be tested by opening the pinyin edit input for any word and verifying the displayed value uses tone numbers; then typing a correction with tone numbers and verifying it is accepted.

**Acceptance Scenarios**:

1. **Given** a word with pinyin "xihuān", **When** the user activates the "Edit Pinyin" action, **Then** the input field displays "xi3huan1".
2. **Given** a word with pinyin "rn", **When** the user activates the "Edit Pinyin" action, **Then** the input field displays "ren2".
3. **Given** the input displays numbered pinyin, **When** the user modifies and presses Enter, **Then** the system accepts the numbered format.
4. **Given** a word with neutral-tone pinyin (no diacritics), **When** the user activates the "Edit Pinyin" action, **Then** the input displays the pinyin as-is (no tone number appended, or with "5" for neutral tone).

---

### User Story 3 - Diacritical Display After Numbered Input (Priority: P3)

After the user submits a pinyin correction using tone numbers, the reading view displays the corrected pinyin with proper diacritical marks (tone accents on the appropriate vowels), not with numbers. The conversion from numbered format to diacritical format follows standard pinyin tone placement rules.

**Why this priority**: The reading view must remain visually clean and follow standard Chinese language typography. Displaying numbered tones would be distracting and non-standard for readers.

**Independent Test**: Can be tested by editing the pinyin of a word to a known numbered value (e.g., "zhong1guo2") and verifying the reading view shows "zhonggu" after submission.

**Acceptance Scenarios**:

1. **Given** the user types "zhong1guo2" in the correction input, **When** they press Enter, **Then** the reading view displays "zhonggu" with the correct diacritics.
2. **Given** the user types "nv3" in the correction input, **When** they press Enter, **Then** the reading view displays "n" (u-umlaut with tone 3).
3. **Given** the user types "lv4shi1" in the correction input, **When** they press Enter, **Then** the reading view displays "lsh" with correct diacritics on the appropriate vowels.
4. **Given** the user types "hao3" in the correction input, **When** they press Enter, **Then** the reading view displays "ho" (tone mark on 'a' per standard placement rules: a/e always take the mark; otherwise the second vowel in a pair).

---

### Edge Cases

- What happens when the context menu would overflow horizontally near the right edge of the viewport? (Assumption: left alignment is preserved; horizontal overflow is out of scope for this feature.)
- What happens if the user types pinyin with invalid tone numbers (e.g., "xi7huan9")? The system treats unrecognized digits as literal characters; the conversion is best-effort.
- What happens if the user types already-diacritical pinyin in the input (e.g., pasting "xihuān")? The system accepts it as-is; no double conversion occurs.
- What happens if the user enters a bare syllable with no tone number (e.g., "hao" without a digit)? It is stored as neutral tone (no diacritics).
- How is "v" handled? "v" in numbered pinyin represents "u" and is converted to "u" with the appropriate tone mark.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST determine the vertical position of the target word relative to the viewport center before opening the context menu.
- **FR-002**: If the word is in the upper half of the viewport (word center above viewport midpoint), the context menu MUST open below the word.
- **FR-003**: If the word is in the lower half of the viewport (word center below viewport midpoint), the context menu MUST open above the word.
- **FR-004**: When opening above, the menu MUST be positioned so its bottom edge is just above the word's top edge (with a small gap matching the existing below-gap).
- **FR-005**: The pinyin correction input MUST display existing pinyin in numbered-tone format (e.g., "xi3huan1") when the user activates "Edit Pinyin".
- **FR-006**: The frontend MUST convert stored diacritical pinyin to numbered-tone format for input display (diacritical-to-numbered conversion), without involving the backend.
- **FR-007**: The frontend MUST convert user-entered numbered-tone pinyin to diacritical format before submitting to the backend (numbered-to-diacritical conversion). The backend receives and stores diacritical pinyin only.
- **FR-008**: Tone placement in diacritical output MUST follow standard pinyin rules: (1) "a" or "e" always receives the tone mark; (2) in "ou", the "o" receives it; (3) otherwise the second vowel in a vowel cluster receives it.
- **FR-009**: The letter "v" in numbered input MUST be interpreted as "u" and converted accordingly.
- **FR-010**: If the user submits pinyin that is already in diacritical format (e.g., pasted), the system MUST accept it without double-converting.
- **FR-011**: A syllable with no trailing tone number MUST be treated as neutral tone (tone 5, no diacritical mark).
- **FR-012**: Tone numbers MUST be 1 through 5, where 5 represents neutral tone (no mark).

### Key Entities

- **Numbered Pinyin**: A string representation where tone is indicated by a trailing digit (1-4) after each syllable, e.g., "zhong1guo2". Tone 5 (neutral) has no digit or an explicit "5".
- **Diacritical Pinyin**: A string representation where tone is indicated by a Unicode accent mark on the appropriate vowel, e.g., "zhonggu". This is the display and storage format.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of context menus opened on words in the bottom quarter of the viewport are fully visible without scrolling or clipping.
- **SC-002**: 100% of pinyin correction inputs display numbered-tone format, never diacritical marks.
- **SC-003**: 100% of numbered-tone submissions produce correct diacritical output matching standard pinyin tone placement rules.
- **SC-004**: Round-trip fidelity: converting diacritical pinyin to numbered format and back produces the identical original string for all valid pinyin syllables.

## Clarifications

### Session 2026-02-24

- Q: Where should the numbered-to-diacritical conversion happen? → A: Frontend only (TypeScript), before calling the existing `update_pinyin` backend command. No new backend command needed.

## Assumptions

- Horizontal menu overflow (near the right edge) is out of scope; left alignment is preserved.
- The viewport midpoint is calculated from the browser viewport height, not the scrollable content height.
- The existing 4px gap between word and menu is preserved for both above and below positions.
- Neutral tone (tone 5) is represented with no digit in numbered format (e.g., "de" not "de5"), but "de5" is also accepted as input.
- The conversion utilities operate on the full concatenated pinyin string of a word (not per-syllable in the UI).
- "v" is the only special letter mapping; standard ASCII pinyin otherwise.
