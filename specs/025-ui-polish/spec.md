# Feature Specification: UI Polish

**Feature Branch**: `025-ui-polish`
**Created**: 2026-02-23
**Status**: Draft
**Input**: User description: "Améliorer l'apparence de l'interface : bouton d'ajout dans la barre de titre, grille pour la bibliothèque, polices plus lisibles, titre du texte centré dans la barre de titre en vue de lecture."

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Add Button in Title Bar (Priority: P1)

In the library view, the user sees the add-text button integrated into the title bar, positioned immediately before the palette selector button. The button uses the same visual style (size, border, padding, icon) as other title bar buttons. The floating action button (FAB) at the bottom-right of the library screen is removed.

**Why this priority**: The add button's current placement as a floating action button is inconsistent with the title bar button pattern used for all other actions. Moving it to the title bar creates visual consistency and frees up screen space.

**Independent Test**: Open the app to library view. Verify the add button appears in the title bar before the palette button, with the same styling as adjacent buttons. Verify no floating button exists at the bottom-right.

**Acceptance Scenarios**:

1. **Given** the user is on the library screen, **When** they look at the title bar, **Then** they see an add button (Plus icon) positioned before the palette selector, styled identically to other title bar buttons (same padding, border, icon size)
2. **Given** the user is on the library screen, **When** they look at the bottom-right of the screen, **Then** no floating action button is present
3. **Given** the user is on the reading view, **When** they look at the title bar, **Then** the add button is not visible (it is library-view only)

---

### User Story 2 — Grid Layout for Library Previews (Priority: P1)

In the library view, text preview cards are displayed in a responsive grid layout instead of a single-column list. All cards have the same fixed width, narrower than the current full-width cards. The grid fills available horizontal space with as many columns as fit.

**Why this priority**: A grid layout makes better use of screen space, lets users scan more texts at once, and gives the library a more polished, app-like feel.

**Independent Test**: Open the library with 5+ texts. Verify cards are arranged in a multi-column grid, all cards have equal width, and the grid is narrower per card than the current full-width layout.

**Acceptance Scenarios**:

1. **Given** the library contains multiple texts, **When** the user views the library screen, **Then** text preview cards are displayed in a grid with multiple columns
2. **Given** the library is displayed, **When** the user inspects any two cards, **Then** both cards have the same width
3. **Given** the library has only one text, **When** the user views the library screen, **Then** the single card is displayed at the standard card width (not stretched to full width)

---

### User Story 3 — Improved Font Readability (Priority: P1)

The application title "Hanzi Ruby Lens" in the title bar and the text titles in the library preview cards are displayed in a larger, more readable font size than currently.

**Why this priority**: Readability is a core usability concern. Slightly larger text for titles improves scannability and overall visual comfort.

**Independent Test**: Open the library. Verify the title bar application name and preview card titles are visibly larger than before, while remaining proportionate to their containers.

**Acceptance Scenarios**:

1. **Given** the user is on any screen, **When** they read the title bar, **Then** the "Hanzi Ruby Lens" title is displayed in a larger, more readable font than the previous small size
2. **Given** the library contains texts, **When** the user scans the preview cards, **Then** each card's title is displayed in a larger, more readable font than the previous size

---

### User Story 4 — Reading View Title in Title Bar (Priority: P1)

In the reading view, the active text's title is displayed centered in the title bar, equidistant between the left-side elements (app title + back button) and the right-side buttons. The title is no longer displayed as a heading above the text content area.

**Why this priority**: Placing the text title in the title bar reduces visual clutter in the reading area and makes the title bar more informative. Centering creates visual balance.

**Independent Test**: Open a text in reading view. Verify the text's title appears centered in the title bar. Verify no separate title heading exists above the text content.

**Acceptance Scenarios**:

1. **Given** the user opens a text in reading view, **When** they look at the title bar, **Then** the text's title is displayed centered between the left and right elements of the title bar
2. **Given** the user is in reading view, **When** they look at the content area, **Then** no separate title heading appears above the annotated text
3. **Given** the text has a long title, **When** displayed in the title bar, **Then** the title is truncated with ellipsis to avoid overlapping with adjacent buttons

---

### Edge Cases

- What happens when the text title is very long in the reading view title bar? It is truncated with ellipsis to prevent overlap with left and right elements.
- What happens when the library grid has only 1 or 2 texts? They display at standard card width without stretching; empty grid cells are not rendered.
- What happens when the window is very narrow? The grid collapses to fewer columns (down to 1 column minimum).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The add-text button MUST appear in the title bar, positioned immediately before the palette selector button, using the same visual style (padding, border, icon size) as other title bar buttons
- **FR-002**: The add-text button in the title bar MUST be visible only in the library view
- **FR-003**: The floating action button (FAB) at the bottom-right of the library screen MUST be removed
- **FR-004**: Library text preview cards MUST be displayed in a responsive grid layout with multiple columns
- **FR-005**: All grid cards MUST have the same fixed width, narrower than the current full-width layout
- **FR-006**: The grid MUST be responsive, showing fewer columns on narrow windows and more on wider ones
- **FR-007**: The application title "Hanzi Ruby Lens" in the title bar MUST be displayed in a larger, more readable font size than the current small size
- **FR-008**: Text titles in library preview cards MUST be displayed in a larger, more readable font size
- **FR-009**: In reading view, the active text's title MUST be displayed centered in the title bar, visually equidistant between the left-side and right-side elements
- **FR-010**: In reading view, the text title heading above the content area MUST be removed
- **FR-011**: Long titles in the reading view title bar MUST be truncated with ellipsis to prevent overlap
- **FR-012**: The text title in the title bar MUST be non-selectable and show a default cursor

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: The add button in the title bar is visually indistinguishable in style from adjacent title bar buttons (same padding, border, icon size)
- **SC-002**: Library displays at least 2 columns of preview cards on a standard desktop window (>= 800px wide)
- **SC-003**: All preview cards in the grid have identical width regardless of title length
- **SC-004**: The title bar application name and preview card titles are at least 20% larger in font size than the previous version
- **SC-005**: In reading view, the text title appears centered in the title bar and no heading exists above the text content
- **SC-006**: All existing functionality (text creation, navigation, pinyin editing, deletion, dark mode, palettes) continues working without regression

### Assumptions

- The add button uses the existing Plus icon from lucide-react, matching other title bar button styling
- Grid card width is a design decision; a reasonable default of approximately 240-280px per card is assumed
- "Larger font" means increasing the title bar app name from the current small size (e.g., text-sm) to a medium size (e.g., text-base), and preview card titles similarly
- The zoom level percentage indicator in the title bar should only be visible in reading view (alongside the zoom buttons it relates to)
