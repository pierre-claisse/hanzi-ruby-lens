# Quickstart: UI Polish

## Scenario 1: Library View with Grid and Title Bar Add Button

1. Launch the app (library view appears)
2. **Verify**: Title bar shows "Hanzi Ruby Lens" in a readable font (text-base, not text-sm)
3. **Verify**: Title bar right section shows add button (Plus icon) before palette selector
4. **Verify**: No floating action button exists at bottom-right of screen
5. Add 4+ texts via the title bar add button
6. **Verify**: Library shows cards in a multi-column grid (at least 2 columns on standard window)
7. **Verify**: All cards have identical width
8. **Verify**: Card titles are displayed in text-lg (larger than before)

## Scenario 2: Reading View with Centered Title

1. From library, click a text preview card
2. **Verify**: Title bar shows the text's title centered between left and right elements
3. **Verify**: No `<h2>` heading appears above the text content area
4. **Verify**: Long titles are truncated with ellipsis in the title bar
5. **Verify**: The centered title is non-selectable with default cursor
6. **Verify**: Zoom indicator `({zoomLevel}%)` appears alongside zoom buttons
7. Click back to library
8. **Verify**: Add button reappears in title bar, centered title disappears

## Scenario 3: Responsive Grid Behavior

1. With 5+ texts in library, resize window to narrow width
2. **Verify**: Grid collapses to fewer columns (down to 1 column)
3. Resize to wide width
4. **Verify**: Grid expands to more columns
5. **Verify**: Card width remains consistent regardless of column count

## Scenario 4: No Regressions

1. **Verify**: Dark mode and all 6 palettes render correctly
2. **Verify**: Pinyin toggle, zoom in/out work in reading view
3. **Verify**: Text creation flow (add → title + content → submit → reading) works
4. **Verify**: Right-click delete on library cards works
5. **Verify**: All keyboard shortcuts (Ctrl+/-, Ctrl+P, F11) work
