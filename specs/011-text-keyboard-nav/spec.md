# Feature Specification: Text Keyboard Navigation

**Feature Branch**: `011-text-keyboard-nav`
**Created**: 2026-02-13
**Status**: Draft
**Input**: User description: "I want to be able to Tab/Mouse focus the Text too. New Tab order is Text > Pinyin toggle > Zoom in button > Zoom out button > Palette toggle > Theme toggle > Fullscreen toggle > Close button. When focus is on the text, a word is highlighted like on mouse over. Left and right arrows are used to 'hover highlight' to the previous and next words relatively to the currently focused word. If the mouse physically hovers a Word, its gets highlight priority. Hitting Space does NOTHING, as always. Hitting Enter or RIGHT-clicking on a focused word opens a contextual menu, with only two dummy entries inside. Up and down arrows similarly are used to navigate the entries of the contextual menu, similarly to the palette selection. Contextual menu closes on Tab-away of click elsewhere."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Keyboard Word Navigation (Priority: P1)

A user tabs into the text area and navigates between words using the keyboard. When the text area receives focus, the first word is visually highlighted using the same style as mouse hover. The user presses the Right arrow key to move the highlight forward through the words, and the Left arrow key to move it backward. If the user physically moves their mouse over a different word, that word becomes the new tracked word — the mouse overrides and sets the keyboard-tracked position, not just the visual highlight.

**Why this priority**: This is the foundational interaction that all other features (contextual menu, tab order) depend on. Without word-level keyboard focus and navigation, nothing else works.

**Independent Test**: Can be fully tested by tabbing into the text area and pressing Left/Right arrow keys to observe word highlighting behavior.

**Acceptance Scenarios**:

1. **Given** the app is loaded, **When** the user presses Tab, **Then** the text area receives focus and the first word is highlighted with the same visual style as mouse hover
2. **Given** the text area is focused with a word highlighted, **When** the user presses the Right arrow key, **Then** the next word in reading order becomes highlighted and the previous word loses its highlight
3. **Given** the text area is focused with a word highlighted, **When** the user presses the Left arrow key, **Then** the previous word in reading order becomes highlighted and the current word loses its highlight
4. **Given** the first word is highlighted via keyboard, **When** the user presses the Left arrow key, **Then** nothing happens (highlight stays on the first word)
5. **Given** the last word is highlighted via keyboard, **When** the user presses the Right arrow key, **Then** nothing happens (highlight stays on the last word)
6. **Given** a word is highlighted via keyboard, **When** the user hovers the mouse over a different word, **Then** the hovered word becomes the new tracked word (keyboard-tracked position is updated to the hovered word)
7. **Given** the mouse has moved the tracked position to a word, **When** the mouse leaves the text area or moves off all words, **Then** the highlight remains on the last mouse-tracked word (the position does not revert)
8. **Given** the text area is focused, **When** the user presses Space, **Then** nothing happens (no scrolling, no activation, no effect)

---

### User Story 2 - Word Contextual Menu (Priority: P2)

A user opens a contextual menu on a highlighted word by pressing Enter or right-clicking. The menu appears near the word and contains two placeholder entries. The user navigates between menu entries using the Up and Down arrow keys, with visual feedback indicating which entry is currently focused. Pressing Enter on a menu entry does nothing for now (the menu stays open). The menu closes when the user tabs away, clicks elsewhere, or presses Left/Right arrow keys.

**Why this priority**: The contextual menu provides the interaction layer on top of word navigation. It requires P1 to function but is independently testable once navigation works.

**Independent Test**: Can be tested by focusing a word and pressing Enter, then using Up/Down arrows to navigate menu entries, and pressing Tab or clicking elsewhere to dismiss.

**Acceptance Scenarios**:

1. **Given** a word is highlighted (via keyboard or mouse hover), **When** the user presses Enter, **Then** a contextual menu appears near the highlighted word with exactly two entries
2. **Given** a word is highlighted (via keyboard or mouse hover), **When** the user right-clicks on the highlighted word, **Then** a contextual menu appears near the word with exactly two entries (the default browser context menu remains suppressed)
3. **Given** the contextual menu is open, **When** the user presses the Down arrow key, **Then** the next menu entry is focused (wrapping from last to first)
4. **Given** the contextual menu is open, **When** the user presses the Up arrow key, **Then** the previous menu entry is focused (wrapping from first to last)
5. **Given** the contextual menu is open, **When** the user presses Tab, **Then** the menu closes and focus moves to the next element in the tab order
6. **Given** the contextual menu is open, **When** the user clicks anywhere outside the menu, **Then** the menu closes
7. **Given** the contextual menu is open, **When** the user presses Escape, **Then** nothing happens (Escape does not close the menu)
8. **Given** the contextual menu is open, **When** the user presses Left or Right arrow, **Then** the menu closes and word navigation resumes in the corresponding direction
9. **Given** the contextual menu is open with a menu entry focused, **When** the user presses Enter, **Then** nothing happens (the menu stays open, the entry remains focused)

---

### User Story 3 - Revised Tab Order (Priority: P3)

The tab order is updated so that the text area is the first focusable element, followed by all title bar controls. This lets a keyboard user interact with the reading content before the toolbar controls.

**Why this priority**: Tab order is a configuration concern. It adjusts the sequence in which elements receive focus but does not introduce new interactive behavior.

**Independent Test**: Can be tested by pressing Tab repeatedly from page load and verifying the focus sequence.

**Acceptance Scenarios**:

1. **Given** the app is loaded and no element is focused, **When** the user presses Tab, **Then** the text area receives focus (first in tab order)
2. **Given** the text area is focused, **When** the user presses Tab, **Then** focus moves to the Pinyin toggle button
3. **Given** the Pinyin toggle is focused, **When** the user presses Tab repeatedly, **Then** focus moves through: Zoom in > Zoom out > Palette selector > Theme toggle > Fullscreen toggle > Close button (in that exact order)

---

### Edge Cases

- What happens when the contextual menu is open and the user presses Left or Right arrow? The menu closes and the word highlight moves in the arrow direction (returning to word navigation mode)
- What happens when the user right-clicks on a non-word area (punctuation, spaces)? No contextual menu opens; the default browser context menu remains suppressed. If a contextual menu is already open, it closes (any click outside the menu dismisses it)
- What happens if the text area loses focus while the contextual menu is open? The contextual menu closes
- What happens when the user right-clicks a word that is not the currently keyboard-tracked word? The clicked word becomes the highlighted word and its contextual menu opens

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The text area MUST be focusable via keyboard Tab key
- **FR-002**: The tab order MUST follow this sequence: Text area > Pinyin toggle > Zoom in > Zoom out > Palette selector > Theme toggle > Fullscreen toggle > Close button
- **FR-003**: When the text area receives keyboard focus, the first word MUST be visually highlighted using the same style as mouse hover (accent background)
- **FR-004**: Pressing the Right arrow key while the text area is focused MUST move the highlight to the next word in reading order
- **FR-005**: Pressing the Left arrow key while the text area is focused MUST move the highlight to the previous word in reading order
- **FR-006**: Arrow key navigation MUST stop at the first and last word boundaries (no wrapping)
- **FR-007**: When the mouse hovers over a word while the text area is focused, the hovered word MUST become the new tracked word (overriding and updating the keyboard-tracked position)
- **FR-008**: When the mouse leaves all words (or leaves the text area), the highlight MUST remain on the last tracked word (the position does not revert)
- **FR-009**: Pressing Space while the text area is focused MUST have no effect
- **FR-010**: Pressing Enter while a word is highlighted MUST open a contextual menu near that word
- **FR-011**: Right-clicking a highlighted word MUST open a contextual menu near that word (the default browser context menu remains suppressed globally)
- **FR-012**: The contextual menu MUST contain exactly two placeholder entries (dummy items with labels but no functional action)
- **FR-012a**: Pressing Enter on a contextual menu entry MUST have no effect (menu stays open, entry remains focused)
- **FR-013**: Up and Down arrow keys MUST navigate between contextual menu entries, wrapping at boundaries (consistent with the palette selector behavior)
- **FR-014**: The contextual menu MUST close when focus leaves the menu area (Tab-away)
- **FR-015**: The contextual menu MUST close when the user clicks outside the menu
- **FR-016**: Pressing Escape while the contextual menu is open MUST have no effect (Escape does not close the menu)
- **FR-017**: Pressing Left or Right arrow while the contextual menu is open MUST close the menu and resume word navigation in the corresponding direction
- **FR-018**: Right-clicking a word that is not the current keyboard-tracked word MUST highlight that word and open its contextual menu
- **FR-019**: When the contextual menu is open and the mouse hovers over a different word, the menu MUST close and the hovered word MUST become the new tracked word
- **FR-020**: When the mouse hovers over a contextual menu entry, that entry MUST receive the same focused visual feedback as keyboard Up/Down navigation

### Key Entities

- **Word**: A Chinese word unit rendered as a ruby element with characters and pinyin. The smallest navigable unit in the text area.
- **Contextual Menu**: A floating menu anchored to a highlighted word, containing a list of actionable entries. Currently holds two dummy entries.
- **Menu Entry**: A single selectable item within the contextual menu. For this feature, entries are non-functional placeholders.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: All words in the text area are reachable via Left/Right arrow key navigation from the first word to the last word without skipping any word
- **SC-002**: The contextual menu opens within one user action (single Enter press or single right-click) on any highlighted word
- **SC-003**: The contextual menu closes within one user action (single Tab, Left/Right arrow, or click-away) every time
- **SC-004**: The complete tab order cycle (Text > Pinyin > Zoom in > Zoom out > Palette > Theme > Fullscreen > Close) is traversable using only the Tab key
- **SC-005**: Mouse hover always updates the tracked word position when the cursor is over a word, with smooth transition and no flicker or delay perceptible to the user

## Assumptions

- "Words" refers to the Word entities rendered as `<ruby>` elements — plain text segments (punctuation, spaces, numbers) are not navigable units
- The first word highlighted when the text area receives focus is the first word in document/reading order (top-left)
- The two dummy contextual menu entries have simple text labels (e.g., "Option 1", "Option 2") with no functional behavior when selected
- Pressing Enter on a dummy menu entry has no effect — the menu stays open and the entry remains focused
- The contextual menu positioning follows the same visual pattern as the palette selector dropdown (anchored near the triggering element)
- When the mouse hovers over a word, it permanently updates the tracked position — subsequent arrow key navigation continues from the mouse-set word, not the previous keyboard position
- Escape key has no effect on the contextual menu (non-standard, per user requirement)
