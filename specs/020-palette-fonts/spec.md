# Feature Specification: Palette Fonts

**Feature Branch**: `020-palette-fonts`
**Created**: 2026-02-20
**Status**: Draft
**Input**: User description: "Include the fonts in the palettes (Vermillion Scroll = Noto Serif CJK TC, Jade Garden = LXGW WenKai TC, Indigo Silk = Chiron Hei HK, Plum Blossom = jf Open Huninn, Golden Pavilion = Chiron Sung HK, Ink Wash = Noto Sans CJK TC)"
**Revised**: 2026-02-21 — Latin fonts removed. CJK fonts cover the entire UI (Chinese text, pinyin, and interface elements).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Palette switches fonts (Priority: P1)

As a user, when I select a color palette, the font used for all text
(Chinese characters, pinyin annotations, and UI elements) changes to match
that palette's typographic identity. Each palette offers a unique visual
atmosphere through the combination of colors and a single CJK font that
covers the entire interface.

**Why this priority**: This is the entire feature. Without it, palettes
only change colors and fonts remain static.

**Independent Test**: Switch between all six palettes and verify that all
text (Chinese characters, pinyin annotations, and UI elements) visually
changes typeface each time.

**Acceptance Scenarios**:

1. **Given** the app displays Chinese text with pinyin annotations in any
   palette, **When** the user selects a different palette, **Then** all
   text (Chinese, pinyin, and UI) renders in that palette's designated
   CJK font.
2. **Given** the user has selected a palette, **When** the app is closed
   and reopened, **Then** the previously selected palette's fonts are
   applied on launch without delay.
3. **Given** the user switches palette, **Then** the font transition is
   smooth — no flash of unstyled or fallback text is visible.

---

### User Story 2 - Pinyin diacritics render correctly (Priority: P2)

As a user, pinyin annotations with tone marks — including rare combined
diacritics (ǎ, ě, ǐ, ǒ, ǔ, ǖ, ǘ, ǚ, ǜ) — render correctly in every
palette without missing glyphs or fallback boxes.

**Why this priority**: Correct pinyin rendering is essential for a
Mandarin learning tool. CJK fonts include Latin glyphs with diacritics,
but coverage must be verified for all palettes.

**Independent Test**: Display a Text containing all four tones on each
vowel (including ü variants) and switch through all six palettes, verifying
no missing or substituted glyphs appear.

**Acceptance Scenarios**:

1. **Given** a Text containing words with 3rd-tone pinyin (e.g., nǚ, lǚ),
   **When** the user views it in any of the six palettes, **Then** the
   caron diacritics and ü+tone combinations render using the palette's
   CJK font without fallback.
2. **Given** a Text containing all standard pinyin vowels with all four
   tones, **When** the user cycles through every palette, **Then** no
   tofu (missing glyph) rectangles appear.

---

### Edge Cases

- What happens if a font file is missing or fails to load? The system
  falls back to the browser's generic sans-serif. In practice, all fonts
  are bundled locally — loading failures are effectively impossible.
- How does the system handle the font transition between palettes? The
  change MUST NOT cause a visible layout reflow or flash of unstyled text
  (FOUT).
- Different CJK fonts have different metrics (x-height, ascender, weight).
  Ruby annotation sizing (50% of base per constitution) MUST remain
  visually consistent across palettes — the proportion applies to whichever
  CJK font is active.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Each palette MUST define a CJK font for all text (Chinese
  characters, pinyin annotations, and UI elements), in addition to its
  existing color definitions.
- **FR-002**: The palette font assignments MUST be:

  | Palette           | CJK Font           |
  |-------------------|-------------------:|
  | Vermillion Scroll | Cactus Classical Serif |
  | Jade Garden       | LXGW WenKai TC     |
  | Indigo Silk       | Chiron Hei HK      |
  | Plum Blossom      | jf Open Huninn     |
  | Golden Pavilion   | Chiron Sung HK     |
  | Ink Wash          | Chocolate Classical Sans |

- **FR-003**: When the user selects a palette, the application MUST apply
  that palette's CJK font to all text display (Chinese characters, pinyin
  annotations, and UI elements).
- **FR-004**: Every CJK font MUST fully support the Unicode Latin
  Extended-B range required for pinyin diacritics (specifically: ǎ, ě, ǐ,
  ǒ, ǔ, ǖ, ǘ, ǚ, ǜ and their uppercase equivalents).
- **FR-005**: If a palette's designated font cannot be loaded, the system
  MUST fall back gracefully to the browser's generic sans-serif without
  user-visible errors. (In practice, all fonts are bundled locally in
  the Tauri desktop app, making loading failures effectively impossible.)
- **FR-006**: The font change MUST be persisted as part of the palette
  selection — no separate font preference exists.
- **FR-007**: All fonts MUST be bundled with the application. No runtime
  network requests for font loading are permitted.

### Key Entities

- **Palette**: Gains a new attribute — a CJK font name — alongside its
  existing color definitions (background, text, accent) for both light and
  dark modes. The font is the same in both light and dark modes of a given
  palette.

### Assumptions

- Font choice is tied to the palette, not user-configurable independently.
  Users who want different fonts switch palettes.
- The six font assignments listed above are final and not user-extensible
  in this release.
- Bundling all six CJK fonts will increase the application installer size
  significantly (estimated 40-50 MB of additional font data). This tradeoff
  is accepted.
- The existing palette persistence mechanism (which already saves the
  selected palette ID) is sufficient — no new persistence is needed for
  fonts since they are derived from the palette.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Switching palettes changes the visible typeface of all text
  (Chinese, pinyin, and UI) within 300 ms, with no flash of fallback
  fonts.
- **SC-002**: All pinyin diacritics (including ǖ, ǘ, ǚ, ǜ) render
  correctly in 100% of the six palettes — zero missing-glyph fallbacks.
- **SC-003**: The application starts with the correct palette fonts applied
  on launch (no momentary display of wrong fonts before the saved palette
  loads).
- **SC-004**: Font fallback activates gracefully if a font file is
  corrupted or missing — the user sees readable text in the default fonts,
  not broken rendering.
