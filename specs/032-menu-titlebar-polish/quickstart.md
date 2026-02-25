# Quickstart: Menu Positioning & Title Bar Polish

**Feature Branch**: `032-menu-titlebar-polish`
**Date**: 2026-02-25

## Integration Test Scenarios

### Scenario 1: Library Context Menu — Quadrant Positioning

**Setup**: Open the app with at least one text in the library.

1. **Bottom-right quadrant**: Right-click a card in the bottom-right corner of the screen.
   - **Expected**: Context menu opens above and to the left of the click point.
   - **Verify**: Menu is fully visible — no clipping at right or bottom edges.

2. **Top-left quadrant**: Right-click a card in the top-left area.
   - **Expected**: Context menu opens below and to the right of the click point.
   - **Verify**: Menu is fully visible — no clipping at left or top edges.

3. **Top-right quadrant**: Right-click a card in the top-right area.
   - **Expected**: Context menu opens below and to the left of the click point.

4. **Bottom-left quadrant**: Right-click a card in the bottom-left area.
   - **Expected**: Context menu opens above and to the right of the click point.

### Scenario 2: Tags Submenu — Quadrant-Aware Direction

**Setup**: At least one tag exists. Open library context menu on a text card.

1. **Menu in left half**: Right-click a card on the left side. Hover "Tags".
   - **Expected**: Tags submenu opens to the right of the main menu.

2. **Menu in right half**: Right-click a card on the right side. Hover "Tags".
   - **Expected**: Tags submenu opens to the left of the main menu.

3. **Menu near bottom**: Right-click a card near the bottom of the screen. Hover "Tags".
   - **Expected**: Tags submenu does not overflow below the viewport. It shifts upward if needed.

4. **Many tags**: Create 10+ tags. Open submenu near the bottom.
   - **Expected**: Submenu is clamped to viewport bounds — fully visible and scrollable or shifted.

### Scenario 3: Title Bar — Library View

**Setup**: Open the app (starts in library view).

1. **Library title**: Look at the title bar.
   - **Expected**: Title bar displays "Library" where "Hanzi Ruby Lens" used to be.
   - **Verify**: No "Hanzi Ruby Lens" text visible anywhere in the title bar.

2. **Return to library**: Open a text, then click the back button.
   - **Expected**: Title bar returns to showing "Library".

### Scenario 4: Title Bar — Reading View

**Setup**: Open a text (e.g., titled "三國演義") in reading view.

1. **Text title displayed**: Look at the title bar.
   - **Expected**: "三國演義" appears left-aligned, before the zoom indicator (e.g., "三國演義 (100%)").
   - **Verify**: No centered text title in the middle of the title bar.

2. **Long title truncation**: Open a text with a very long title (50+ characters).
   - **Expected**: Title is truncated with an ellipsis. Zoom indicator and right-side buttons remain fully visible.

3. **Switch texts**: Return to library, open a different text.
   - **Expected**: Title bar updates to show the new text's title.

### Scenario 5: Reading View Menu Unchanged

**Setup**: Open a text in reading view.

1. **Word context menu**: Right-click or keyboard-navigate to a word, open the context menu.
   - **Expected**: Menu positioning behaves exactly as before (quadrant-based, no regression).
   - **Verify**: The `computeMenuPosition()` extraction to a shared utility did not change behavior.
