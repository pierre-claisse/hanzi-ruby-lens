# Feature Specification: Library Context Menu Refinement

**Feature Branch**: `035-library-menu-refine`
**Created**: 2026-04-04
**Status**: Draft
**Input**: User description: "Remove the info icon (hover tooltip) and lock toggle icon from Library view cards. Move their functionality into the right-click context menu: display Created/Modified dates as a non-clickable header section above Tags, and add a Lock/Unlock entry below Tags."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - View text metadata via context menu (Priority: P1)

A user right-clicks a text card in the Library view and sees the Created and Modified dates displayed as a non-interactive footer section at the bottom of the context menu, visually separated from the actionable entries above.

**Why this priority**: This replaces the info icon tooltip — without it, users lose access to date metadata entirely.

**Independent Test**: Can be tested by right-clicking any text card and verifying the date information appears at the bottom of the menu.

**Acceptance Scenarios**:

1. **Given** a text card in Library view, **When** the user right-clicks on it, **Then** the context menu shows a non-clickable section at the bottom displaying "Created: YYYY-MM-DD HH:mm"
2. **Given** a text card that has been modified, **When** the user right-clicks on it, **Then** the context menu also displays "Modified: YYYY-MM-DD HH:mm" below the Created date
3. **Given** a text card that has never been modified, **When** the user right-clicks on it, **Then** only the Created date is shown (no Modified line)
4. **Given** the metadata section in the context menu, **When** the user clicks on it, **Then** nothing happens (it is not interactive)
5. **Given** the metadata section, **Then** it is visually separated from the Delete entry above by a divider

---

### User Story 2 - Lock/Unlock text via context menu (Priority: P1)

A user right-clicks a text card and uses a new Lock/Unlock entry in the context menu to toggle the locked state, instead of clicking a lock icon directly on the card.

**Why this priority**: This replaces the lock toggle icon — without it, users lose the ability to lock/unlock texts.

**Independent Test**: Can be tested by right-clicking a text card, selecting Lock, and verifying the text becomes locked.

**Acceptance Scenarios**:

1. **Given** an unlocked text card, **When** the user right-clicks and selects "Lock", **Then** the text becomes locked and the card reflects the locked state
2. **Given** a locked text card, **When** the user right-clicks and selects "Unlock", **Then** the text becomes unlocked and the card reflects the unlocked state
3. **Given** the context menu for an unlocked text, **Then** the lock/unlock entry appears below the Tags entry
4. **Given** multiple selected text cards with mixed lock states, **When** the user right-clicks and selects "Lock", **Then** all selected texts become locked
5. **Given** multiple selected text cards that are all locked, **When** the user right-clicks and selects "Unlock", **Then** all selected texts become unlocked

---

### User Story 3 - Cleaner Library card appearance (Priority: P1)

The info icon and lock toggle icon are removed from the text preview cards, resulting in a cleaner, less cluttered Library view.

**Why this priority**: This is the visual cleanup that motivates the entire feature — removing the icons is essential to the refined appearance.

**Independent Test**: Can be tested by viewing Library cards and verifying no info icon or lock icon appears on them.

**Acceptance Scenarios**:

1. **Given** the Library view, **When** the user views any text card, **Then** no info icon (ⓘ) is visible on the card
2. **Given** the Library view, **When** the user views any text card, **Then** no lock/unlock toggle icon is visible on the card
3. **Given** a locked text card, **Then** the card displays a subtle border or background tint change to indicate locked state, without any icon
4. **Given** a locked text card viewed in any theme (light, dark) or color palette, **Then** the locked visual treatment remains clearly distinguishable

---

### Edge Cases

- When right-clicking multiple selected cards with different Created/Modified dates, the metadata section displays dates only for the specific card that was right-clicked (consistent with the single-card context).
- When a card has no Modified date, only the Created line appears in the metadata section.
- When a locked card is also selected (Ctrl+Click), both the locked tint and the selection ring must remain visually distinguishable without conflict.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST remove the info icon and its hover tooltip from all text preview cards in the Library view
- **FR-002**: System MUST remove the interactive lock/unlock toggle icon from all text preview cards in the Library view
- **FR-003**: The right-click context menu MUST display a non-clickable metadata section below the Delete entry, showing the Created date and (if present) Modified date of the right-clicked text
- **FR-004**: The metadata section MUST be visually separated from the Delete entry above it by a divider line
- **FR-005**: The right-click context menu MUST include a Lock/Unlock entry below the Tags entry
- **FR-006**: The Lock/Unlock menu entry MUST display "Lock" for unlocked texts and "Unlock" for locked texts
- **FR-007**: When multiple texts are selected, the Lock/Unlock entry MUST apply to all selected texts
- **FR-008**: When multiple texts with mixed lock states are selected, the entry MUST display "Lock" (to lock all); when all are locked, it MUST display "Unlock"
- **FR-009**: The metadata section MUST use the same date format as the previous tooltip (YYYY-MM-DD HH:mm)
- **FR-012**: The context menu MUST be wide enough that date lines (e.g., "Created: YYYY-MM-DD HH:mm") render as single lines without wrapping
- **FR-010**: Locked text cards MUST be visually distinguishable via a subtle border or background tint change (not an icon)
- **FR-011**: The locked card visual treatment MUST render correctly across all supported themes (light mode, dark mode, and all color palettes)

## Clarifications

### Session 2026-04-04

- Q: How should locked cards be visually distinguished after the lock icon is removed? → A: Subtle border or background tint change for locked cards

## Assumptions

- The existing context menu positioning logic can accommodate the additional entries without viewport overflow issues.
- Multi-select + right-click behavior for the new Lock/Unlock entry follows the same pattern as the existing Tags and Delete entries.
- The locked card tint/border must use theme-aware CSS variables to work across all themes and palettes.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Library text cards display zero interactive icons (info and lock icons fully removed)
- **SC-002**: All date metadata previously available via tooltip is accessible through the context menu within one right-click
- **SC-003**: Users can lock and unlock texts via the context menu with the same number of interactions as before (one right-click + one click)
- **SC-004**: Context menu entries appear in the correct order: Tags, Lock/Unlock, Delete, metadata footer
- **SC-005**: The feature works correctly with both single and multi-select scenarios
