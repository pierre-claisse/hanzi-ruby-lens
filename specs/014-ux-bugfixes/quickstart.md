# Quickstart: UX Bugfixes

## Verification Scenarios

### 1. Wide Layout + Window Size

1. Build and launch the app (`npm run build`)
2. Verify the window opens at 1600×900 (not the old 1024×768)
3. Verify the text content flows edge-to-edge with side padding only — no narrow centered column
4. Resize the window narrower and wider — text should reflow without overflow

### 2. Context Menu Hover

1. Open the app at 100% zoom (default)
2. Click into the text area to activate focus mode
3. Right-click a word in the middle of a paragraph to open the context menu
4. Move the mouse slowly downward from the word toward the menu entries
5. Verify the menu stays anchored — it does NOT close or jump to a different word
6. Click a menu entry — verify it works
7. Right-click a different word — verify the menu opens for that word
8. Click away from the menu — verify it closes

### 3. Pinyin Ruby Alignment

1. Open the app with pinyin visible (default)
2. Find 埃及 in the text (appears multiple times)
3. Verify the pinyin "āijí" renders as a cohesive unit — no excessive gap between "ā" and "ijí"
4. Check 象形文字 (xiàngxíngwénzì) — pinyin should not split mid-syllable
5. Zoom in and out — spacing should remain correct at all zoom levels

### 4. Themed Scrollbar

1. Open the app with enough text to show a scrollbar
2. Verify the scrollbar is thin and styled (not the default Windows scrollbar)
3. Verify the scrollbar thumb color matches the current palette's text color (at low opacity)
4. Switch to dark mode — verify the scrollbar updates
5. Switch palettes — verify the scrollbar updates for each of the 6 palettes
6. Hover over the scrollbar thumb — verify a subtle highlight effect

## Test Verification

```bash
# All existing tests must pass
npm run test

# Docker build must succeed
npm run build
```

## Files Modified

| File | Change |
|------|--------|
| `src-tauri/tauri.conf.json` | Window size 1024×768 → 1600×900 |
| `src/App.tsx` | Remove `max-w-2xl mx-auto` |
| `src/hooks/useWordNavigation.ts` | Early return in `handleWordHover` when menu open |
| `src/index.css` | Move `ruby-align: center` to `ruby`; add scrollbar styles |
