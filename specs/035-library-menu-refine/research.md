# Research: Library Context Menu Refinement

**Feature**: 035-library-menu-refine
**Date**: 2026-04-04

## Decision 1: Locked card visual treatment

**Decision**: Use a subtle background tint via Tailwind utility classes with the existing `content` CSS variable.

**Rationale**: The project already defines `content` as a theme-aware color (mapped to `--color-text` in all 12 theme combos). Using `bg-content/5` (5% opacity of the text color) provides a universally visible but subtle tint that automatically adapts to every palette in both light and dark modes — no additional CSS variables needed.

**Alternatives considered**:
- Dedicated CSS variable for locked tint: Rejected — adds 12 new variable declarations (6 palettes × 2 modes) for a single use case. Violates Principled Simplicity.
- Border color change: Rejected — the selected state already uses `border-accent`, so adding another border semantic risks visual confusion.
- Accent-tinted background: Rejected — accent colors vary dramatically across palettes (red, green, blue, pink, gold, gray) and a tint from some would be too strong or clash.

## Decision 2: Context menu metadata section styling

**Decision**: Render Created/Modified as small, muted text (`text-xs text-content/50`) in a footer section below Delete, preceded by a `border-t border-content/10` divider. Non-interactive (no hover effects, no cursor pointer). Menu widened to `w-56` so date lines render as single lines.

**Rationale**: Placing metadata at the bottom keeps actionable items (Tags, Lock/Unlock, Delete) prominent at the top. Using slightly smaller and more muted text differentiates the info footer from actionable items. The wider menu prevents date wrapping. The divider creates clear visual separation per FR-004.

**Alternatives considered**:
- Metadata at top of menu: Rejected — pushes actionable items down; user requested bottom placement.
- Same text size as menu items but grayed out: Rejected — could be confused with a disabled menu item.

## Decision 3: Lock/Unlock label logic for multi-select

**Decision**: Display "Lock" when any selected text is unlocked. Display "Unlock" only when all selected texts are locked. Use Lock/Unlock icons from lucide-react alongside the label.

**Rationale**: Follows the "lock all" mental model — if any are unlocked, the primary action is to lock them. This mirrors how Tags already work (toggle based on "all have tag" state). Consistent with FR-008.

**Alternatives considered**:
- Separate "Lock all" / "Unlock all" entries: Rejected — clutters the menu and is inconsistent with the Tags pattern.

## Decision 4: Context menu entry count for positioning

**Decision**: Update the `menuEntryCount` calculation in `LibraryScreen.tsx` to account for the new metadata section and Lock/Unlock entry.

**Rationale**: The existing `computeContextMenuPosition` uses entry count to estimate menu height for viewport-aware placement. The metadata section adds ~2 lines of small text plus a divider, and Lock/Unlock adds 1 standard entry. The count should increase accordingly to prevent menu clipping.

**Alternatives considered**:
- Measure actual DOM height after render: Rejected — overengineered for a static menu with predictable content. Current estimation approach is consistent with existing code.
