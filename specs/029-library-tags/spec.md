# Feature Specification: Library Tags

**Feature Branch**: `029-library-tags`
**Created**: 2026-02-24
**Status**: Draft
**Input**: User description: "On ajoute les tags : un tag est une étiquette disposant d'un label et d'une couleur. On peut créer, modifier et supprimer les tags dans la bibliothèque. Un ou plusieurs tags peuvent être attribués ou désattribués à un ou plusieurs textes dans la bibliothèque. Dans la bibliothèque, on peut filtrer les Textes affichés par tag (sélection multiple) ou bien ne pas les filter et tous les afficher. On peut également trier les textes affichés par date de création, ordre ascendant ou descendant."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Tag CRUD in the Library (Priority: P1)

As a reader, I want to create, rename, recolor, and delete Tags directly from the library so that I can organize my collection of Texts with personal labels.

**Why this priority**: Tags are the foundational data behind every other story. Without tag management, no text can be tagged, and no filtering can occur.

**Independent Test**: Can be fully tested by opening the library and performing create, edit, and delete operations on Tags — verifiable without any Texts being tagged.

**Acceptance Scenarios**:

1. **Given** the library is displayed, **When** the user clicks the "Manage Tags" button in the title bar, **Then** a modal dialog opens listing all existing Tags with options to create, rename, recolor, and delete.
2. **Given** an existing Tag, **When** the user edits its label, **Then** the Tag displays the new label everywhere it appears.
3. **Given** an existing Tag, **When** the user edits its color, **Then** the Tag displays the new color everywhere it appears.
4. **Given** an existing Tag that is assigned to one or more Texts, **When** the user deletes the Tag from the Manage Tags dialog, **Then** the Tag is removed from all Texts and from the dialog.
5. **Given** the user attempts to create or rename a Tag with an empty label, **Then** the system rejects the operation and the previous state is preserved.
6. **Given** the user attempts to create or rename a Tag with a label that already exists (case-insensitive), **Then** the system rejects the operation and informs the user.

---

### User Story 2 - Assigning and Removing Tags on Texts (Priority: P2)

As a reader, I want to assign one or more Tags to a Text, and remove Tags from a Text, so that each Text in my library carries the labels I chose.

**Why this priority**: Assigning Tags to Texts is the bridge between tag management (US1) and filtering (US3). Without assignment, filtering has nothing to act on.

**Independent Test**: Can be tested by creating Tags (US1 prerequisite), then assigning and removing them on individual Texts, and verifying the Tags appear on the corresponding library cards.

**Acceptance Scenarios**:

1. **Given** a Text with no Tags, **When** the user right-clicks its card and checks a Tag in the "Tags" submenu, **Then** the Tag's colored label appears on the Text's card in the library.
2. **Given** a Text with one or more Tags, **When** the user right-clicks its card and unchecks a Tag in the "Tags" submenu, **Then** the Tag's label disappears from the Text's card.
3. **Given** multiple Texts selected in the library, **When** the user right-clicks the selection and checks a Tag in the "Tags" submenu, **Then** all selected Texts receive the Tag.
4. **Given** multiple Texts selected in the library, **When** the user right-clicks the selection and unchecks a Tag, **Then** the Tag is removed from all selected Texts that had it.
5. **Given** a Text that already has a particular Tag, **When** the user checks the same Tag again via the submenu, **Then** the operation is idempotent — no duplicate is created.

---

### User Story 3 - Filtering Texts by Tag (Priority: P3)

As a reader, I want to filter the Texts displayed in the library by selecting one or more Tags, so that I can quickly find Texts that belong to a category of interest.

**Why this priority**: Filtering is the primary payoff of the tagging system — it turns Tags into a navigational tool. It depends on US1 and US2 being in place.

**Independent Test**: Can be tested by ensuring several Texts have Tags, then activating tag filters and verifying only the matching Texts appear in the grid.

**Acceptance Scenarios**:

1. **Given** the library with no active tag filter, **When** the user views the library, **Then** all Texts are displayed.
2. **Given** the library, **When** the user selects a single Tag from the filter dropdown, **Then** only Texts that carry that Tag are displayed.
3. **Given** the library, **When** the user selects multiple Tags from the filter dropdown, **Then** Texts that carry **any** of the selected Tags are displayed (union / OR logic).
4. **Given** an active tag filter, **When** the user clears the dropdown selection, **Then** all Texts are displayed again.
5. **Given** an active tag filter that matches no Texts, **When** the user views the library, **Then** an appropriate empty state message is shown.

---

### User Story 4 - Sorting Texts by Creation Date (Priority: P4)

As a reader, I want to sort the Texts displayed in the library by creation date in ascending or descending order, so that I can browse my collection chronologically in either direction.

**Why this priority**: Sorting is an independent enhancement to library navigation. Currently Texts are always shown newest-first; this adds user control. It has no dependency on Tags.

**Independent Test**: Can be tested by adding several Texts and toggling the sort order, verifying the grid reorders correctly.

**Acceptance Scenarios**:

1. **Given** the library with multiple Texts, **When** the user clicks the sort toggle button (arrow pointing down), **Then** Texts appear from most recent to oldest creation date.
2. **Given** the library with multiple Texts, **When** the user clicks the sort toggle button to flip it (arrow pointing up), **Then** Texts appear from oldest to most recent creation date.
3. **Given** the library defaults, **When** the library is opened for the first time, **Then** Texts are sorted by creation date descending (preserving current behavior).
4. **Given** the user has changed the sort order and also has an active tag filter, **When** both are applied, **Then** the displayed Texts are both filtered by tag and sorted by the chosen order.

---

### Edge Cases

- What happens when the user deletes a Tag that is currently active as a filter? The filter is cleared (or the deleted Tag is removed from the active filter set), and the library refreshes to show all remaining matching Texts.
- What happens when all Tags are deleted? The tag filter area shows an empty state, and the library displays all Texts unfiltered.
- What happens when the user creates many Tags (e.g., 50+)? The tag management area must remain scrollable and usable without breaking the library layout.
- What happens when a Text has more Tags than can fit in the card layout? Tags overflow gracefully (e.g., a "+N more" indicator or horizontal scroll).
- What happens when sorting and filtering are combined? Sorting applies to the filtered subset; the combination is commutative.

## Requirements *(mandatory)*

### Functional Requirements

**Tag Management**

- **FR-001**: The system MUST allow the user to create a Tag with a label (non-empty string) and a color.
- **FR-002**: Tag labels MUST be unique (case-insensitive comparison). The system MUST reject duplicate labels.
- **FR-003**: The system MUST provide a predefined set of colors for Tag creation and editing.
- **FR-004**: The system MUST allow the user to rename an existing Tag's label.
- **FR-005**: The system MUST allow the user to change an existing Tag's color.
- **FR-006**: The system MUST allow the user to delete a Tag. Deleting a Tag MUST remove it from all Texts it was assigned to.
- **FR-007**: A Tag MUST persist independently of any Text: a Tag with no assigned Texts MUST continue to exist until explicitly deleted.

**Tag Assignment**

- **FR-008**: The system MUST allow the user to assign Tags to a Text via a "Tags" submenu in the right-click context menu on a library card, showing checkboxes for each existing Tag.
- **FR-009**: The system MUST allow the user to remove a Tag from a Text by unchecking it in the same "Tags" submenu.
- **FR-010**: When multiple Texts are selected, right-clicking the selection MUST show the same "Tags" submenu, applying tag changes to all selected Texts at once (bulk operation).
- **FR-011**: Assigning a Tag to a Text that already has it MUST be idempotent — no duplicate assignment is created.
- **FR-012**: Each Text's card in the library grid MUST visually display all Tags assigned to it, showing each Tag's label and color.

**Filtering**

- **FR-013**: The library title bar MUST display a multiselect dropdown (centered, in the same position as the text title in reading view) showing all existing Tags for filtering.
- **FR-014**: The user MUST be able to select one or more Tags from the dropdown to filter the displayed Texts.
- **FR-015**: When one or more Tags are selected as filters, the library MUST show only Texts that carry at least one of the selected Tags (OR / union logic).
- **FR-016**: The user MUST be able to clear the active tag filter to display all Texts.
- **FR-017**: When the active filter matches no Texts, the library MUST display an informative empty state message.

**Sorting**

- **FR-018**: The library title bar MUST display a toggle button (arrow icon) near the filter dropdown that switches between ascending (oldest first) and descending (newest first) sort order. The arrow points up for ascending and down for descending.
- **FR-019**: The default sort order MUST be descending (newest first), preserving the current behavior.
- **FR-020**: Sorting MUST combine with tag filtering: the sort order applies to whichever Texts are currently visible after filtering.

### Key Entities

- **Tag**: A label (non-empty, unique string) and a color (chosen from a predefined palette). Tags exist independently and have a many-to-many relationship with Texts.
- **Text–Tag Assignment**: The association between a Text and a Tag. A Text may have zero or more Tags; a Tag may be assigned to zero or more Texts.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A user can create, rename, recolor, and delete a Tag within the library in under 5 seconds per operation.
- **SC-002**: A user can assign or remove a Tag from a Text in under 3 seconds.
- **SC-003**: Filtering by Tag produces the correct subset of Texts instantly (no perceptible delay for libraries of up to 500 Texts).
- **SC-004**: Sorting toggles between ascending and descending order instantly with no perceptible delay.
- **SC-005**: Tags are fully visible on library cards — the user can identify at a glance which Tags a Text carries.
- **SC-006**: All tag operations (create, edit, delete, assign, remove) persist across application restarts.
- **SC-007**: Bulk tag assignment or removal on up to 50 selected Texts completes within 2 seconds.

## Clarifications

### Session 2026-02-24

- Q: Where in the library UI does tag management live? → A: A "Manage Tags" button (opening a modal dialog) placed to the right of the "add text" button in the title bar, visible only in library view. Tag filtering uses a multiselect dropdown in the center of the title bar (same position as the text title in reading view), visible only in library view.
- Q: How does the user assign/remove Tags on Texts? → A: Right-click context menu on library card(s) — a "Tags" submenu shows checkboxes for each existing Tag, allowing toggle assignment. Works on single card or multi-selected cards.
- Q: Where is the sort control placed? → A: A toggle button in the title bar (near the filter dropdown) showing an arrow icon that flips between up (ascending) and down (descending).

## Assumptions

- The predefined color palette for Tags is a curated set of 8–12 distinct, visually accessible colors — not a free-form color picker. This keeps the UI simple and ensures readability in both light and dark themes.
- "Multiple selection" of Texts in the library for bulk tag operations uses a standard interaction pattern (e.g., checkboxes or Ctrl/Shift+click).
- Tag filter state (which Tags are selected) is session-only — it resets when the application is restarted. The sort order preference also resets to the default (descending) on restart.
- The predefined Tag colors are theme-aware: they look good in both light and dark modes.
- The maximum number of Tags is not explicitly limited, but the UI should remain usable with up to 50 Tags.
