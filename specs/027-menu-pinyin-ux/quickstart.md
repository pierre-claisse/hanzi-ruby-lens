# Quickstart: Adaptive Menu Positioning & Numbered Pinyin Input

**Feature**: 027-menu-pinyin-ux

## Prerequisites

- A text with Chinese content already loaded in reading view
- Text long enough to have words in both upper and lower halves of the viewport

## Scenario 1: Adaptive Menu Positioning

1. Open a text in reading view
2. Scroll so that some words are near the bottom of the viewport
3. Right-click a word in the **upper half** of the window
4. **Verify**: Context menu appears **below** the word
5. Right-click a word in the **lower half** of the window
6. **Verify**: Context menu appears **above** the word, fully visible
7. Resize the window to be shorter, then repeat
8. **Verify**: Position adapts to new viewport dimensions

## Scenario 2: Numbered Pinyin Display in Input

1. Right-click any word and select "Edit Pinyin"
2. **Verify**: The input field shows numbered tones (e.g., "xi3huan1") not diacritics ("xǐhuān")
3. Press Escape to cancel
4. Right-click a different word and select "Edit Pinyin"
5. **Verify**: Numbered format is consistent across all words

## Scenario 3: Numbered-to-Diacritical Conversion on Submit

1. Right-click a word and select "Edit Pinyin"
2. Clear the input and type a known value: "hao3"
3. Press Enter
4. **Verify**: The ruby annotation shows "hǎo" (diacritical), not "hao3"
5. Right-click the same word and select "Edit Pinyin" again
6. **Verify**: The input now shows "hao3" (numbered round-trip)

## Scenario 4: v/ü Handling

1. Right-click a word and select "Edit Pinyin"
2. Type "nv3" and press Enter
3. **Verify**: Ruby annotation shows "nǚ" (ü with tone 3)
4. Right-click same word, select "Edit Pinyin"
5. **Verify**: Input shows "nv3"

## Scenario 5: Pasting Diacritical Pinyin

1. Copy "xǐhuān" to clipboard
2. Right-click a word, select "Edit Pinyin"
3. Paste the clipboard content
4. Press Enter
5. **Verify**: Ruby annotation shows "xǐhuān" (no double conversion)

## Scenario 6: Neutral Tone

1. Right-click a word, select "Edit Pinyin"
2. Type "de" (no tone number) and press Enter
3. **Verify**: Ruby annotation shows "de" (no diacritical mark)
