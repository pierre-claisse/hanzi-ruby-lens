# Feature Specification: Reading Experience Refinements

**Feature Branch**: `004-reading-experience-refinements`
**Created**: 2026-02-11
**Status**: Draft
**Input**: User description: "Refine reading experience: increase hover opacity to 24%, add vertical padding for pinyin background coverage, disable text selection, and remove horizontal padding between words"

## Clarifications

### Session 2026-02-11

- Q: Should text selection prevention also apply to touch devices (tap-and-hold to select)? → A: Yes, prevent ALL selection methods including touch (tap-and-hold to select)
- Q: What browser compatibility is required for testing these visual refinements? → A: Modern browsers only (Chrome/Edge/Firefox/Safari latest 2 versions)

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Enhanced Hover Visibility (Priority: P1)

When a user hovers over a Word (Chinese characters with pinyin annotation), the background highlight should provide clear, immediate visual feedback to indicate the word is interactive.

**Why this priority**: Hover feedback is the primary affordance for word interaction. The current 12% opacity is barely noticeable, especially in dark mode, making it unclear which word the user is focusing on. This directly impacts reading comprehension and future interactive features.

**Independent Test**: Can be fully tested by hovering over any Word element and visually confirming the background color is clearly visible at 24% opacity in both light and dark themes.

**Acceptance Scenarios**:

1. **Given** a user is viewing text with annotated Words in light mode, **When** they hover over a Word, **Then** the background highlight is clearly visible with 24% opacity vermillion color
2. **Given** a user is viewing text with annotated Words in dark mode, **When** they hover over a Word, **Then** the background highlight is clearly visible with 24% opacity vermillion color
3. **Given** a user moves their cursor across multiple Words, **When** they hover over each Word, **Then** each Word's highlight appears instantly with consistent 24% opacity

---

### User Story 2 - Complete Pinyin Background Coverage (Priority: P2)

When a user hovers over a Word, the background highlight should fully encompass both the Chinese characters and the pinyin annotation above them, creating a unified visual rectangle.

**Why this priority**: The current hover background cuts off the top of the pinyin annotation, creating a visually jarring and incomplete highlight effect. This undermines the polish of the reading experience but is less critical than the visibility issue.

**Independent Test**: Can be fully tested by hovering over Words with pinyin annotations and visually confirming the background extends fully to cover the pinyin text without clipping.

**Acceptance Scenarios**:

1. **Given** a user hovers over a Word with single-character pinyin, **When** the hover highlight appears, **Then** the background fully covers both the base characters and the pinyin annotation without clipping at the top
2. **Given** a user hovers over a Word with long combined pinyin (e.g., "chéngfēngpòlàng"), **When** the hover highlight appears, **Then** the background fully encompasses the entire pinyin annotation
3. **Given** a user hovers over a Word, **When** they inspect the visual alignment, **Then** the background has balanced vertical spacing above and below the content

---

### User Story 3 - Remove Artificial Word Spacing (Priority: P3)

Chinese text should display with continuous character flow, without artificial spacing between Words that mimics English word separators.

**Why this priority**: Chinese typography does not use spaces between words. The current horizontal padding creates false visual segmentation that violates authentic Chinese text presentation. This is important for reading authenticity but doesn't affect core interaction.

**Independent Test**: Can be fully tested by viewing text with multiple consecutive Words and confirming there is no visible gap or spacing between adjacent character groups.

**Acceptance Scenarios**:

1. **Given** a user views text with multiple consecutive Words, **When** they read the text, **Then** characters flow continuously without visible horizontal gaps between Words
2. **Given** a user compares the text to traditional Chinese typography, **When** they inspect word boundaries, **Then** there is no artificial spacing that suggests English-style word separation

---

### User Story 4 - Disable Text Selection (Priority: P4)

Users should not be able to select any text content in the reading area (Chinese characters, pinyin annotations, or punctuation) with their cursor, and the cursor should remain in default state when hovering over text, indicating passive reading rather than active selection.

**Why this priority**: Text selection is not a supported interaction in the current reading experience. Disabling it prevents confusion, removes the "web feel" from the app, and prepares for future interaction models (e.g., custom right-click menus). This is the lowest priority as it's a refinement, not a functional issue.

**Independent Test**: Can be fully tested by attempting to click-and-drag to select text and confirming that no text becomes highlighted for selection.

**Acceptance Scenarios**:

1. **Given** a user attempts to select Chinese characters by click-and-drag, **When** they release the mouse, **Then** no text is selected or highlighted
2. **Given** a user attempts to select pinyin annotations by click-and-drag, **When** they release the mouse, **Then** no text is selected or highlighted
3. **Given** a user attempts to select punctuation or spacing by click-and-drag, **When** they release the mouse, **Then** no text is selected or highlighted
4. **Given** a user hovers over any text content, **When** they observe the cursor, **Then** it remains in default arrow state (not text selection I-beam)

---

### Edge Cases

- What happens when a user hovers over a Word with extremely long pinyin that extends beyond typical annotation length?
- How does the hover background appear during rapid cursor movement across multiple Words in quick succession?
- What happens if a user tries to use keyboard shortcuts (Ctrl+A) to select all text?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The hover background for Word elements MUST use 24% opacity (increase from current 12% opacity)
- **FR-002**: The hover background MUST fully cover the pinyin annotation area without clipping at the top
- **FR-003**: Word elements MUST have sufficient vertical padding to ensure hover background encompasses both base characters and pinyin annotation
- **FR-004**: Word elements MUST NOT have horizontal padding that creates visible spacing between adjacent Words
- **FR-005**: Users MUST NOT be able to select any text content in the reading area (Chinese characters, pinyin annotations, punctuation, or spacing) using mouse click-and-drag or touch gestures (tap-and-hold)
- **FR-006**: Users MUST NOT be able to select text content in the reading area using keyboard shortcuts (e.g., Ctrl+A, Shift+arrow keys) - NOTE: Full keyboard shortcut prevention is scoped to a future feature; this feature prevents selection within the reading area only
- **FR-007**: The cursor MUST remain in default arrow state when hovering over text content in the reading area (not change to text selection I-beam)
- **FR-008**: All hover effects MUST apply consistently in both light and dark themes
- **FR-009**: Hover background transitions MUST maintain smooth animation (existing 200ms duration)

### Key Entities

- **Word**: A unit of Chinese text consisting of one or more characters with an associated pinyin annotation, displayed as a ruby element with hover interaction

### Testing Scope

- **Browser Compatibility**: Visual refinements must be validated on modern browsers (Chrome/Edge/Firefox/Safari latest 2 versions)
- **Theme Coverage**: All visual tests must pass in both light and dark themes
- **Interaction Methods**: Selection prevention must be tested via mouse, keyboard, and touch inputs

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can clearly identify which Word they are hovering over in both light and dark modes without ambiguity
- **SC-002**: 100% of Word hover backgrounds fully cover pinyin annotations without visual clipping
- **SC-003**: Chinese text displays with authentic continuous character flow, matching traditional Chinese typography standards
- **SC-004**: Users cannot select text using any standard selection method (mouse drag, keyboard shortcuts, touch gestures)
- **SC-005**: Cursor remains in default state across all text content, indicating passive reading interaction model
