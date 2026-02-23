# Research: UI Polish

## R1: Grid Layout Strategy for Library Cards

**Decision**: Use Tailwind CSS `grid` with `grid-cols-[repeat(auto-fill,minmax(240px,1fr))]`

**Rationale**: `auto-fill` with `minmax` creates a responsive grid that adapts to window width without media queries. Cards fill available space with a minimum width of 240px, collapsing to fewer columns on narrow windows and expanding on wider ones. This is the standard Tailwind pattern for responsive card grids.

**Alternatives considered**:
- `flex-wrap` with fixed-width cards: Less clean — requires explicit width on cards plus gap management
- CSS `columns`: Not suitable for card grids — designed for text flow
- Explicit breakpoint-based grid (`md:grid-cols-2 lg:grid-cols-3`): More rigid, doesn't adapt to arbitrary window widths

## R2: Centered Title in Title Bar

**Decision**: Use absolute positioning with `left-1/2 -translate-x-1/2` for the centered title element, constrained by `max-w` and `truncate` for overflow.

**Rationale**: The title bar uses `justify-between` for left and right groups. A centered element needs to be visually centered relative to the full bar width, not just the remaining space between groups. Absolute positioning achieves true centering independent of left/right group widths.

**Alternatives considered**:
- Three-column flex with `flex-1` side groups: Would work but requires restructuring the entire title bar layout, and side groups would need matching widths for visual centering
- Grid with three columns: Overcomplicated for a simple centered element
- `margin: auto` on a middle flex child: Doesn't achieve true visual centering when left and right groups have different widths

## R3: Font Size Increase for Readability

**Decision**: Increase title bar app name from `text-sm` to `text-base`, and preview card titles from `text-base` to `text-lg`.

**Rationale**: One Tailwind size step up provides a noticeable readability improvement (~14px→16px for app name, ~16px→18px for card titles) without breaking proportions. These sizes remain comfortable within their containers.

**Alternatives considered**:
- Two steps up (`text-sm` → `text-lg`): Too large for the compact 48px title bar
- Custom font sizes: Unnecessary — Tailwind's scale provides appropriate increments

## R4: Add Button Placement

**Decision**: Render the add button in TitleBar as a new prop-driven element, positioned immediately before PaletteSelector in the right button group. Visible only in library view via `showAddButton` prop.

**Rationale**: Using the same button styling pattern (p-1.5, rounded-lg, border, icon) as existing title bar buttons ensures visual consistency. Conditional rendering via prop keeps TitleBar stateless regarding view logic.

**Alternatives considered**:
- Keeping add button in LibraryScreen with different styling: Defeats the purpose of moving it to title bar
- Always showing add button: Would clutter reading view; library-only is cleaner
