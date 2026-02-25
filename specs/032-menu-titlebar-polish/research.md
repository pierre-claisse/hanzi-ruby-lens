# Research: Menu Positioning & Title Bar Polish

**Feature Branch**: `032-menu-titlebar-polish`
**Date**: 2026-02-25

## Decision 1: Shared Positioning Utility vs. Inline Logic

**Decision**: Extract `computeMenuPosition()` and its constants to `src/utils/menuPositioning.ts`.

**Rationale**: The function is currently in `TextDisplay.tsx` (lines 12-62). `LibraryScreen.tsx` needs the same quadrant algorithm. Extracting to a shared utility avoids duplication and ensures both menus behave identically.

**Alternatives considered**:
- **Copy the function into LibraryScreen** — rejected because it violates DRY and would drift over time.
- **Create a shared hook `useMenuPosition()`** — rejected as over-engineering; the function is pure (no React state) and doesn't need hook semantics.

## Decision 2: Library Menu Positioning Strategy (Fixed vs. Absolute)

**Decision**: Keep `position: fixed` for the library context menu. Compute quadrant-adjusted coordinates using `computeMenuPosition()` with `containerRect = { top: 0, left: 0 }` (viewport origin).

**Rationale**: The library context menu is rendered at the root of `LibraryScreen`, not inside a scrollable container. Using `fixed` positioning with viewport-relative coordinates is simpler and avoids needing a container ref. The existing `computeMenuPosition()` already accepts a `containerRect` parameter — passing `{ top: 0, left: 0 }` makes the output coordinates viewport-relative, which is exactly what `position: fixed` expects.

**Alternatives considered**:
- **Switch to `position: absolute` with a container ref** — rejected as unnecessary complexity for a menu that doesn't scroll with content.
- **Create a separate `computeFixedMenuPosition()` function** — rejected; the existing function handles this case naturally via the `containerRect` parameter.

## Decision 3: Tags Submenu Positioning

**Decision**: Compute submenu position dynamically based on the main menu's position in the viewport.

**Rationale**: The current implementation uses `absolute left-full top-0 ml-1` which always opens the submenu to the right of the main menu. When the main menu is in the right half of the screen, this causes the submenu to overflow off-screen. A new `computeSubmenuPosition()` function will compute the submenu's left/top values based on:
- Horizontal: if main menu center X > viewport midpoint → open left (submenu right edge = main menu left edge - gap). Otherwise → open right (submenu left edge = main menu right edge + gap).
- Vertical: if the submenu's projected bottom would exceed viewport height → shift upward so bottom aligns with viewport bottom. Clamp top to 0.

**Alternatives considered**:
- **Use CSS `right-full` class conditionally** — rejected because Tailwind class-based positioning doesn't handle dynamic clamping.
- **Use a portal-based approach** — rejected as over-engineering for two static menus.

## Decision 4: TitleBar Title Text Approach

**Decision**: Replace the hardcoded "Hanzi Ruby Lens" `<h1>` text with a `titleText` prop. Remove the separately-rendered centered text title.

**Rationale**: The current TitleBar has two title elements: (1) "Hanzi Ruby Lens" in the left-aligned `<h1>`, and (2) the text title centered via `absolute left-1/2 -translate-x-1/2`. The spec requires the title bar to show contextual text ("Library" or the text's title). Replacing the `<h1>` content with a prop-driven value and removing the centered overlay is the simplest approach.

In reading view, the title will be left-aligned in the `<h1>`, followed by the zoom indicator. The title gets `truncate` (Tailwind) with a `max-width` to prevent overflow into the right-side controls. The previously centered title is removed entirely (FR-008).

**Alternatives considered**:
- **Keep "Hanzi Ruby Lens" and add the view name as a subtitle** — rejected because the spec explicitly says to "entirely replace" the app title.
- **Use a separate component for the title** — rejected as unnecessary abstraction for a single `<h1>` element.

## Decision 5: Adapting computeMenuPosition for Click-Point Menus

**Decision**: Create a lightweight wrapper `computeContextMenuPosition()` that adapts the click-point `{x, y}` into a synthetic `wordRect` for the existing `computeMenuPosition()`.

**Rationale**: The existing function expects a `wordRect` (bounding box of the trigger element). For the library context menu, the trigger is a mouse click at `{clientX, clientY}`. We create a zero-size rect at the click point: `{ top: y, bottom: y, left: x, right: x, width: 0, height: 0 }`. This feeds naturally into the existing algorithm and produces the correct quadrant-based offset.

**Alternatives considered**:
- **Modify `computeMenuPosition()` to accept either a rect or a point** — rejected to avoid changing the existing API that TextDisplay relies on.
- **Duplicate the quadrant logic inline in LibraryScreen** — rejected (DRY violation).
