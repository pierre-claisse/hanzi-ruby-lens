# Data Model: Library Context Menu Refinement

**Feature**: 035-library-menu-refine
**Date**: 2026-04-04

## Summary

No data model changes required. This feature is a pure UI refactoring.

## Existing Entities (unchanged)

### TextPreview

Already contains all fields needed by both the card and context menu:

| Field       | Type            | Usage in this feature                          |
|-------------|-----------------|------------------------------------------------|
| id          | number          | Context menu target identification             |
| title       | string          | Card display (unchanged)                       |
| createdAt   | string (ISO)    | Moved from tooltip to context menu header      |
| modifiedAt  | string \| null  | Moved from tooltip to context menu header      |
| tags        | Tag[]           | Context menu Tags entry (unchanged)            |
| locked      | boolean         | Card tint styling + context menu Lock/Unlock   |

### Tag

Unchanged. Used by existing Tags submenu.

## State Changes

No new state variables needed at the domain level. The only state change is UI-local:

- `contextMenu` state in `LibraryScreen` already stores `ids` — sufficient to look up `createdAt`, `modifiedAt`, and `locked` from the `previews` array.

## Commands / Queries (unchanged)

- **toggle_lock** (command): Already exists. Will be called from context menu instead of card icon.
- **assign_tag / remove_tag** (commands): Unchanged.
- No new Tauri commands required.
