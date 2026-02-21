# Quickstart: Palette Fonts

**Feature**: 020-palette-fonts
**Date**: 2026-02-20
**Revised**: 2026-02-21 — Latin fonts removed. Single CJK font per palette covers all text.

## Scenario 1: Font changes when switching palettes

**Setup**: Application running with Chinese text displayed in reading view.

**Steps**:
1. Open the palette selector in the title bar.
2. Select "Jade Garden" palette.
3. Observe all text — Chinese characters, pinyin annotations, and UI
   elements should all display in LXGW WenKai TC (a handwritten style),
   distinctly different from the default serif.
4. Select "Vermillion Scroll" palette.
5. All text should switch to Cactus Classical Serif (a Ming-style serif
   with orthodox TC glyph forms).

**Expected**: Each palette switch visibly changes the font for all text.
The change is immediate (< 300 ms), with no flash of incorrect fonts.

## Scenario 2: Pinyin diacritics in all palettes

**Setup**: Process a Text containing: 女 (nǚ), 旅 (lǚ), 現在 (xiànzài),
爸爸 (bàba), 嗎 (ma).

**Steps**:
1. In reading view, cycle through all six palettes.
2. For each palette, inspect the pinyin annotations for:
   - 3rd tone caron: ǚ in nǚ and lǚ
   - 4th tone grave: à in xiànzài and bàba
   - Neutral tone (no diacritic): ma

**Expected**: All diacritics render correctly in every palette. No tofu
boxes, no fallback to a different font for specific characters.

## Scenario 3: Persistence across restart

**Steps**:
1. Select "Golden Pavilion" palette.
2. Verify all text shows in Chiron Sung HK (editorial serif).
3. Close the application.
4. Reopen the application.

**Expected**: The application launches directly with Golden Pavilion's
font. No momentary flash of default fonts before the saved palette loads.

## Scenario 4: Visual consistency of ruby sizing

**Steps**:
1. Switch to "Plum Blossom" palette (uses jf Open Huninn — a rounded
   CJK font with different metrics than the default).
2. Inspect the pinyin annotations above the Chinese characters.

**Expected**: Pinyin annotations render at approximately 50% of the base
CJK font size (per constitution). The proportion should look consistent
regardless of which CJK font is active, even though different fonts have
different natural metrics.

## Scenario 5: All six palettes visually distinct

**Steps**: Cycle through all palettes and note the typographic identity:

| Palette           | Font style                   |
|-------------------|------------------------------|
| Vermillion Scroll | Ming serif (orthodox TC)      |
| Jade Garden       | Handwritten (organic)        |
| Indigo Silk       | Sans-serif (HK modern)       |
| Plum Blossom      | Rounded (warm, TW)           |
| Golden Pavilion   | Serif (HK editorial)         |
| Ink Wash          | Sans-serif (orthodox TC)     |

**Expected**: Each palette is typographically distinguishable from the
others. The font reinforces the palette's visual mood established by its
color scheme. The same CJK font is used for Chinese text, pinyin, and
UI elements within each palette.
