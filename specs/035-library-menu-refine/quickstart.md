# Quickstart: Library Context Menu Refinement

**Feature**: 035-library-menu-refine

## What changes

Two React components are modified:

1. **TextPreviewCard.tsx** — Remove the info icon + tooltip and the lock toggle icon. Add a conditional `bg-content/5` tint for locked cards.

2. **LibraryScreen.tsx** — Add a metadata header section (Created/Modified dates) and a Lock/Unlock entry to the existing right-click context menu. Remove the `onToggleLock` prop passed to `TextPreviewCard`.

## Key files

| File | Change |
|------|--------|
| `src/components/TextPreviewCard.tsx` | Remove icons, add locked tint |
| `src/components/LibraryScreen.tsx` | Extend context menu |
| `src/utils/formatDateTime.ts` | Reuse (no changes) |
| `src/utils/menuPositioning.ts` | Reuse (no changes) |

## No backend changes

- No new Tauri commands
- No database schema changes
- `toggle_lock` command already exists and is reused

## Testing approach

- Unit tests: card renders without icons, locked card has tint class
- Integration tests: context menu shows metadata + Lock/Unlock entry
- Manual: verify across all 12 theme combinations (6 palettes × light/dark)
