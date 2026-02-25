# Quickstart: Timestamps, Sort Persistence & System Theme

**Feature Branch**: `030-timestamps-sort-theme`
**Date**: 2026-02-25

## Scenario 1: Details Tooltip with Creation Time

1. Create a new text in the library
2. Return to library view
3. Preview card shows **only title and tags** (no date visible)
4. Hover over the **Info icon** on the card
5. Tooltip appears showing: `Created: 2026-02-25 14:32`
6. Move mouse away — tooltip disappears

## Scenario 2: Last Modified Date Appears After Correction

1. Open a text in reading view
2. Correct a word's pinyin (e.g., click a word, type new pinyin)
3. Return to library view
4. Hover over the text's Info icon
5. Tooltip now shows two lines:
   - `Created: 2026-02-25 14:32`
   - `Modified: 2026-02-25 15:10`

## Scenario 3: Last Modified Hidden When Never Corrected

1. Create a new text (no corrections)
2. Hover over its Info icon
3. Tooltip shows only: `Created: 2026-02-25 14:32`
4. No "Modified" line is shown

## Scenario 4: Sort Order Persists Across Restart

1. Open the library (default: newest first)
2. Click the sort toggle button (switches to oldest first)
3. Close the application
4. Reopen the application
5. Library displays texts in ascending order (oldest first) — persisted

## Scenario 5: Theme Follows OS at Startup

1. Set Windows to Light mode
2. Open the application → app is in Light mode
3. Manually toggle to Dark mode in-app → app switches to Dark
4. Close the application
5. Reopen → app is in Light mode (matches OS, ignores previous manual toggle)

## Scenario 6: Theme Reacts to Live OS Change

1. Set Windows to Light mode, open the app → Light mode
2. Manually toggle to Dark mode in-app → Dark mode
3. Change Windows to Dark mode while app is running
4. App immediately switches to Dark mode (re-syncs with OS)
5. Change Windows back to Light mode
6. App immediately switches to Light mode

## Scenario 7: Legacy Text Compatibility

1. Open an app with texts created before this feature (date-only `created_at`)
2. Library shows cards normally (title + tags)
3. Hover over Info icon → tooltip shows the date portion correctly
4. No crash or error — graceful handling of date-only values
