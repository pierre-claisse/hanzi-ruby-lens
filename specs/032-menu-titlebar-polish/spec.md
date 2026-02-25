# Feature Specification: Menu Positioning & Title Bar Polish

**Feature Branch**: `032-menu-titlebar-polish`
**Created**: 2026-02-25
**Status**: Draft
**Input**: User description: "The quadrant positioning rules for contextual menu in reading view must also apply to the contextual menu in library view. Moreover, the tags submenu in library view must enforce it too. Also, in library view, the app title in the bar must be entirely replaced by 'Library', and in the reading view, it must be entirely replaced by the text title, which will then not be in the middle any longer, but on the left before the zoom indicator."

## User Scenarios & Testing

### User Story 1 — Consistent Menu Positioning in Library View (Priority: P1)

When the user right-clicks a text card in the library, the context menu and its tags submenu open in the correct viewport quadrant — the same quadrant-aware logic already used by the reading view's word context menu. This prevents menus from being clipped by viewport edges regardless of where the card is on screen.

**Why this priority**: Menus that overflow off-screen make actions unreachable. Applying the existing quadrant logic to library menus eliminates a usability gap that exists today.

**Independent Test**: Right-click a text card located in each of the four viewport quadrants. Verify the context menu opens toward the center of the screen (never clipped). Hover "Tags" — the submenu also opens toward the center, flipping left/right and above/below as needed.

**Acceptance Scenarios**:

1. **Given** a text card in the bottom-right quadrant, **When** the user right-clicks it, **Then** the context menu opens above-left of the click point.
2. **Given** a text card in the top-left quadrant, **When** the user right-clicks it, **Then** the context menu opens below-right of the click point.
3. **Given** the context menu is open in the right half of the screen, **When** the user hovers "Tags", **Then** the tags submenu opens to the left of the main menu.
4. **Given** the context menu is open in the left half of the screen, **When** the user hovers "Tags", **Then** the tags submenu opens to the right of the main menu.
5. **Given** the context menu is open in the bottom half of the screen, **When** the user hovers "Tags", **Then** the tags submenu opens above (or aligned top) rather than overflowing below the viewport.
6. **Given** the context menu is open in the top half of the screen, **When** the user hovers "Tags", **Then** the tags submenu opens below (or aligned top) normally.

---

### User Story 2 — Title Bar Shows "Library" in Library View (Priority: P2)

In the library view, the application title "Hanzi Ruby Lens" in the title bar is replaced by the word "Library". This provides a clear visual indicator of the current view.

**Why this priority**: Simple, self-contained change that improves navigation clarity. No data logic involved.

**Independent Test**: Open the app to the library view. The title bar displays "Library" instead of "Hanzi Ruby Lens".

**Acceptance Scenarios**:

1. **Given** the user is on the library view, **When** they look at the title bar, **Then** the title displays "Library".
2. **Given** the user navigates from reading view back to the library, **When** the library view renders, **Then** the title bar shows "Library".

---

### User Story 3 — Title Bar Shows Text Title in Reading View (Priority: P3)

In the reading view, the application title "Hanzi Ruby Lens" is replaced by the title of the text currently being read. The text title is left-aligned, placed before the zoom indicator, instead of being centered.

**Why this priority**: Builds on US2's title bar changes. Completes the contextual title bar by showing the current text name in reading view.

**Independent Test**: Open a text in reading view. The title bar displays the text's title left-aligned before the zoom indicator, not "Hanzi Ruby Lens".

**Acceptance Scenarios**:

1. **Given** the user opens a text titled "三國演義" in reading view, **When** the reading view renders, **Then** the title bar displays "三國演義" left-aligned before the zoom indicator.
2. **Given** the text title is very long, **When** the reading view renders, **Then** the title is truncated with an ellipsis so it does not overlap other title bar elements.
3. **Given** the user navigates back to the library and opens a different text, **When** the new reading view renders, **Then** the title bar updates to show the new text's title.
4. **Given** the user is in reading view, **When** they look at the center of the title bar, **Then** the previously centered text title is no longer there (it has moved to the left).

---

### Edge Cases

- What happens when the context menu is opened near the exact center of the screen? The menu defaults to below-right (same behavior as reading view).
- What happens when there are many tags and the submenu is very tall? The submenu is clamped to the viewport bounds (no overflow beyond screen edges).
- What happens when the text title in reading view is extremely long (100+ characters)? It is truncated with an ellipsis to prevent overlapping the zoom indicator or toolbar buttons.
- What happens when the browser/window is resized while a menu is open? Existing behavior (menu closes on outside click/scroll) is acceptable; no repositioning during resize is required.

## Requirements

### Functional Requirements

- **FR-001**: The library view's context menu MUST use the same quadrant-based positioning algorithm as the reading view's word context menu. The menu opens in the direction of the screen center relative to the click point.
- **FR-002**: The tags submenu in the library view MUST use quadrant-based positioning to decide whether to open left or right of the main menu, and whether to align its top edge above or below.
- **FR-003**: Both the library context menu and tags submenu MUST be clamped to viewport bounds so they never overflow off-screen.
- **FR-004**: In the library view, the title bar MUST display the text "Library" in place of the application name.
- **FR-005**: In the reading view, the title bar MUST display the current text's title in place of the application name.
- **FR-006**: In the reading view, the text title MUST be left-aligned, placed immediately before the zoom indicator (not centered).
- **FR-007**: The text title in reading view MUST be truncated with an ellipsis if it would overflow its available space.
- **FR-008**: The previously centered text title overlay in reading view MUST be removed (no duplicate title display).

## Success Criteria

### Measurable Outcomes

- **SC-001**: Context menus in the library view never overflow outside the visible window area, regardless of where the user right-clicks.
- **SC-002**: Tags submenus in the library view never overflow outside the visible window area, regardless of the main menu position.
- **SC-003**: 100% of library context menu openings position the menu in the direction of the screen center (matching reading view behavior).
- **SC-004**: The title bar displays "Library" when the library view is active, in every navigation path to the library.
- **SC-005**: The title bar displays the text title when reading view is active, matching the title stored in the database.
- **SC-006**: Text titles longer than the available title bar space are truncated with an ellipsis, with no visual overflow or overlap.

## Assumptions

- The existing quadrant positioning function from the reading view can be reused or adapted for the library context menu. The positioning logic is not expected to change — only to be applied more broadly.
- The tags submenu follows the same horizontal quadrant rule (open left if click is in right half, open right if in left half) and the same vertical rule (open above if click is in bottom half, open below if in top half).
- The "Library" title is a static string, not user-configurable.
- The text title shown in reading view is the same title field already available in the loaded text object.
- The zoom indicator remains in its current position and style; the text title is placed before it in the same left-aligned group.
- The reading view no longer shows the centered text title overlay that previously appeared in the middle of the title bar.
