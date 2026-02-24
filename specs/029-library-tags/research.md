# Research: Library Tags

**Feature Branch**: `029-library-tags`
**Created**: 2026-02-24

## Decision 1: Tag Storage Strategy

**Decision**: Separate `tags` table + `text_tags` junction table in SQLite.

**Rationale**: A many-to-many relationship between Texts and Tags demands a normalized schema. A junction table (`text_tags`) cleanly expresses the relationship, supports efficient queries from both directions (texts-for-tag, tags-for-text), and allows ON DELETE CASCADE for automatic cleanup when a Tag or Text is deleted.

**Alternatives considered**:
- **JSON column on texts table**: Simpler reads, but impossible to query "all texts with tag X" without scanning every row. Breaks normalization.
- **Tags as comma-separated string**: Even worse query ergonomics. No referential integrity.

---

## Decision 2: Tag Color Representation

**Decision**: Store Tag color as a string identifier (e.g., `"red"`, `"blue"`, `"amber"`) referencing a predefined palette defined in the frontend. The database stores only the color key, not the hex values.

**Rationale**: The spec requires theme-aware colors that look good in both light and dark modes. Storing a key and resolving to hex on the frontend means the palette can be tuned without database migration. Keeping 8–12 named colors keeps the picker simple.

**Alternatives considered**:
- **Store hex value directly**: Would require storing both light and dark variants or computing one from the other. Complicates theme switching.
- **Store index into an array**: Fragile if palette order changes.

---

## Decision 3: Filtering Strategy (Backend vs. Frontend)

**Decision**: Backend filtering via parameterized SQL query. The `list_texts` command accepts optional tag IDs and sort order, returning only matching previews.

**Rationale**: With up to 500 Texts (SC-003), database-level filtering is more efficient and avoids transferring unnecessary data across the IPC boundary. SQL's `IN` clause with a subquery on `text_tags` is straightforward. Sort order (`ASC`/`DESC`) is trivially added to the `ORDER BY` clause.

**Alternatives considered**:
- **Frontend filtering**: Load all previews + all tag assignments, filter in React. Works for small collections but wastes IPC bandwidth and RAM at scale. Also violates CQRS — filtering logic would live in the UI layer rather than the query side.

---

## Decision 4: Tag Assignment via Context Menu

**Decision**: Extend the existing right-click context menu in `LibraryScreen` with a "Tags" submenu showing checkboxes for each Tag. Reuse the existing context menu positioning pattern (fixed position at mouse coordinates).

**Rationale**: The library already has a right-click context menu for "Delete". Adding a "Tags" submenu extends the existing pattern without introducing new UI surfaces. Checkboxes provide clear toggle semantics (checked = assigned, unchecked = not assigned). For multi-select, the same submenu applies to all selected cards.

**Alternatives considered**:
- **Inline "+" button on cards**: Adds visual noise to every card; conflicts with Content-First Design principle.
- **Dedicated tag assignment dialog**: Over-engineered for a simple toggle operation.

---

## Decision 5: Manage Tags Modal Dialog

**Decision**: A modal dialog opened from the "Manage Tags" button in the title bar. The dialog lists all Tags with inline editing (label + color), a "create" row at the bottom, and delete buttons per Tag.

**Rationale**: A modal isolates tag management from the library grid. It provides enough space for CRUD operations without cluttering the main view. The title bar placement (next to the "+" button) follows the existing pattern of library-only controls.

**Alternatives considered**:
- **Sidebar panel**: Consumes horizontal space permanently or requires collapse logic. Over-engineered for an occasional management task.
- **Settings page**: Too hidden — tags are a frequent operation.

---

## Decision 6: Multiselect Filter Dropdown

**Decision**: A custom multiselect dropdown component in the center of the title bar (same position as `textTitle` in reading view). Each Tag appears as a colored chip. Selected Tags act as OR filters. An "All" state (no selection) shows everything.

**Rationale**: The center of the title bar is currently used for the text title (reading view only) and is empty in library view. Placing the filter there maximizes visibility without adding new layout sections. A multiselect dropdown is the standard pattern for faceted filtering.

**Alternatives considered**:
- **Tag chip bar below title bar**: Adds a new UI row, pushing content down. Wastes space when no tags exist.
- **Filter inside the Manage Tags dialog**: Too hidden — filtering should be immediately accessible.

---

## Decision 7: Sort Toggle Button

**Decision**: A single icon button (ArrowUpDown or ArrowUp/ArrowDown from Lucide) near the filter dropdown in the title bar. Clicking toggles between ascending and descending sort order. Default: descending (newest first).

**Rationale**: Sort is a binary toggle (two states), so a single button with a flipping icon is the most compact control. Placing it near the filter dropdown groups related library controls together.

**Alternatives considered**:
- **Dropdown with "Newest first" / "Oldest first"**: Takes more space for only two options.
- **Combined with filter**: Confusing — sort and filter are orthogonal concerns.

---

## Decision 8: Multi-Selection Pattern for Bulk Tag Operations

**Decision**: Ctrl+Click to toggle individual card selection, Shift+Click for range selection. Selected cards show a visual highlight (e.g., ring or checkmark overlay). Right-click on selected cards shows the Tags submenu applying to all.

**Rationale**: This is the standard desktop multi-selection pattern (Windows Explorer, file managers). Users expect this behavior. No additional UI surface needed — selection state is purely visual on the existing cards.

**Alternatives considered**:
- **Checkbox column**: Adds permanent visual noise; conflicts with grid layout and Content-First Design.
- **"Select mode" toggle button**: Extra step to enter/exit selection; not worth the complexity for a simple operation.

---

## Decision 9: Tag Color Palette Definition

**Decision**: 10 predefined colors chosen for distinctiveness and accessibility in both light and dark themes. Colors are named with semantic keys. The palette is defined as a TypeScript constant on the frontend.

**Rationale**: 10 colors provide enough variety (spec says 8–12) while staying manageable in a color picker grid. Named keys are durable across theme changes. Defining in TypeScript keeps the palette co-located with the UI that renders it.

**Alternatives considered**:
- **Tailwind color classes**: Ties palette to Tailwind specifics; harder to map to colored dots in a picker.
- **CSS custom properties**: Overkill for a static palette; tag colors are independent of the app theme palette.
