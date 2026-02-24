# Quickstart: 028-quadrant-menu-position

## Overview

Extend the context menu positioning from vertical-only (top/bottom) to full quadrant-based positioning, and fix inconsistent icon stroke weight.

## Files to Modify

| File | Change |
|------|--------|
| `src/components/TextDisplay.tsx` | Extend `getMenuPosition()` to compute horizontal midpoint and return quadrant-based `left` position |
| `src/components/WordContextMenu.tsx` | Add `strokeWidth={1.5}` to `<Icon>` renders |

## File to Add

| File | Purpose |
|------|---------|
| `tests/unit/menuPosition.test.ts` | Unit tests for the extracted quadrant positioning pure function |

## Key Constants

- Menu width: `w-48` = 192px (Tailwind)
- Menu item height: 36px (used in existing height calculation)
- Menu padding: 8px vertical
- Gap between word and menu: 4px

## Implementation Sequence

1. Extract quadrant positioning logic as a pure function in TextDisplay.tsx
2. Add horizontal midpoint detection and 4-way branching
3. Add viewport clamping to the computed position
4. Add `strokeWidth={1.5}` to icon rendering in WordContextMenu.tsx
5. Write unit tests for the pure positioning function
6. Run `npm test` in Docker to verify

## Verification

```sh
npm test          # All tests pass in Docker
```

Manual: right-click words in each quadrant and verify menu appears in the correct position.
