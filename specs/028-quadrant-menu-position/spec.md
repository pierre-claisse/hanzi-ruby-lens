# Feature Specification: Quadrant-Based Context Menu Positioning

**Feature Branch**: `028-quadrant-menu-position`
**Created**: 2026-02-24
**Status**: Draft
**Input**: User description: "Positional adjustment for the word context menu: when opened on a word in the left half of the screen, the menu opens to the right of the word; when opened on a word in the right half, it opens to the left. These rules combine with the existing top/bottom rules, creating 4 quadrant-based positions (top-left, top-right, bottom-left, bottom-right)."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Quadrant-Aware Menu Positioning (Priority: P1)

As a reader, when I right-click a word anywhere on screen, the context menu should open in the direction that keeps it fully visible and avoids overlapping the clicked word. The menu position adapts based on which screen quadrant the word occupies.

**Why this priority**: This is the core and only feature — ensuring the menu always opens in a direction with maximum available space, combining horizontal and vertical awareness.

**Independent Test**: Can be fully tested by right-clicking words in each of the four screen quadrants and verifying the menu appears in the expected position relative to the word.

**Acceptance Scenarios**:

1. **Given** a word in the top-left quadrant of the screen, **When** the user right-clicks it, **Then** the menu opens below and to the right of the word.
2. **Given** a word in the top-right quadrant of the screen, **When** the user right-clicks it, **Then** the menu opens below and to the left of the word.
3. **Given** a word in the bottom-left quadrant of the screen, **When** the user right-clicks it, **Then** the menu opens above and to the right of the word.
4. **Given** a word in the bottom-right quadrant of the screen, **When** the user right-clicks it, **Then** the menu opens above and to the left of the word.

---

### User Story 2 - Consistent Positioning Across Navigation Methods (Priority: P2)

As a reader, the quadrant-based menu positioning should work regardless of how the menu is triggered — whether via right-click or keyboard navigation.

**Why this priority**: Ensures a coherent experience across all interaction methods, but secondary to the core positioning logic.

**Independent Test**: Can be tested by navigating to words in different quadrants using keyboard and triggering the menu, then verifying position matches the quadrant rules.

**Acceptance Scenarios**:

1. **Given** a word selected via keyboard navigation in the bottom-right quadrant, **When** the user opens the context menu, **Then** the menu opens above and to the left of the word.
2. **Given** a word selected via keyboard navigation in the top-left quadrant, **When** the user opens the context menu, **Then** the menu opens below and to the right of the word.

---

### User Story 3 - Uniform Menu Icon Sizes (Priority: P3)

As a reader, when I open the context menu on a word that has both "Merge with previous word" and "Merge with next word" entries, both icons should appear at the same size and weight — neither should look bolder or larger than the other.

**Why this priority**: Minor visual consistency fix bundled with this menu polish pass.

**Independent Test**: Can be tested by right-clicking a word that has both merge options and visually comparing the two icons.

**Acceptance Scenarios**:

1. **Given** a context menu showing both "Merge with previous word" and "Merge with next word", **When** the user looks at the icons, **Then** both icons appear at the same size and stroke weight.

---

### Edge Cases

- What happens when a word is exactly at the horizontal or vertical midpoint of the viewport? The system treats midpoint words as belonging to the top-left quadrant (default bias toward below-right).
- What happens when the menu would still overflow the viewport even after quadrant-based positioning (e.g., very long menu near the edge)? The menu is clamped to remain within the visible viewport bounds.
- What happens when the window is resized while the menu is open? The menu closes on window resize (existing behavior).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST determine the screen quadrant of the clicked word by comparing the word's center position against the viewport horizontal and vertical midpoints.
- **FR-002**: For words in the left half of the viewport, the menu MUST open to the right of the word (menu left edge aligned near the word's right edge).
- **FR-003**: For words in the right half of the viewport, the menu MUST open to the left of the word (menu right edge aligned near the word's left edge).
- **FR-004**: For words in the top half of the viewport, the menu MUST open below the word (existing behavior preserved).
- **FR-005**: For words in the bottom half of the viewport, the menu MUST open above the word (existing behavior preserved).
- **FR-006**: The horizontal and vertical rules MUST combine to produce four distinct positioning behaviors corresponding to the four screen quadrants.
- **FR-007**: Words positioned exactly at the midpoint (horizontal or vertical) MUST be treated as top-left quadrant (menu opens below-right).
- **FR-008**: The menu MUST remain fully within the visible viewport regardless of quadrant positioning — if the computed position would cause overflow, the menu position MUST be clamped to viewport bounds.
- **FR-009**: All context menu icons MUST render at the same visual size and stroke weight. The "Merge with next word" and "Merge with previous word" icons MUST appear identical in size and boldness.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Context menu is fully visible on screen for 100% of word positions across all four quadrants.
- **SC-002**: Menu never overlaps the clicked word — the menu is always positioned adjacent to the word, not on top of it.
- **SC-003**: Users perceive no delay in menu appearance — positioning calculation adds no perceptible latency compared to current behavior.
- **SC-004**: Menu positioning is consistent across all supported interaction methods (right-click, keyboard).

## Assumptions

- The viewport midpoint is calculated dynamically based on the current container/scroll viewport dimensions, not the full document size.
- "Left/right of the word" means the menu's edge is aligned near the corresponding edge of the word, with a small gap for visual clarity (consistent with the existing vertical gap).
- The existing vertical positioning logic (top/bottom half) is correct and only needs to be extended, not rewritten.
