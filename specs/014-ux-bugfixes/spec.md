# Feature Specification: UX Bugfixes

**Feature Branch**: `014-ux-bugfixes`
**Created**: 2026-02-15
**Status**: Draft
**Input**: User description: "Fix 4 UX bugs: wide layout, context menu hover, pinyin ruby spacing, scrollbar styling"

## Clarifications

### Session 2026-02-15

- Q: How wide should the reading layout be? → A: Centered max-w-5xl container with side padding. Default window opens at 800×600 (same as minimum).

### Session 2026-02-15 (Round 2)

- Min window size reverted to 800×600 (default stays 1600×900); horizontal scrollbar must be themed like vertical
- Pinyin ruby-align fix did NOT work — ruby-align property is unsupported in Chromium/WebView2. Flex-based layout also failed twice (breaks baseline alignment with non-word inline elements). Solution: native ruby rendering with `<span>` wrapper around base characters to prevent Chromium annotation distribution.
- Context menu must close on ANY outside click (left or right), not only on clicks outside the text container
- Title/subtitle detection: short text blocks between paragraph breaks should render larger for visual hierarchy
- Layout needs moderate centered margins (between old too-narrow and current edge-to-edge)
- Text must be justified (text-align: justify) for clean edges

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Wider Reading Layout (Priority: P1)

The reading area currently has narrow side margins and a constrained maximum width, wasting screen space on a desktop application. The user wants the content to flow to the window edges with only side padding — no max-width cap. The default window size is also increased to 1600×900 to take advantage of the wider layout.

**Why this priority**: Affects the entire reading experience at all times. Most visible change.

**Independent Test**: Open the app, verify the text content flows edge-to-edge (minus padding) and the window opens at 1600×900 by default.

**Acceptance Scenarios**:

1. **Given** the app launches for the first time, **When** the window appears, **Then** it opens at 1600×900
2. **Given** the app is open at any window size, **When** the user views the reading area, **Then** the text content flows to the window edges with only side padding (no max-width constraint)
3. **Given** the app is open, **When** the user resizes the window, **Then** the text content remains readable and does not overflow horizontally

---

### User Story 2 - Context Menu Hover Gap (Priority: P1)

At 120% zoom and below, when the user right-clicks a word to open the context menu, the menu appears directly below the word. To reach the menu with the mouse, the cursor path crosses over the word on the next line, which triggers a hover on that word. This changes the tracked word, which repositions or closes the menu before the user can interact with it.

**Why this priority**: Makes the context menu unusable at common zoom levels — a functional regression.

**Independent Test**: At 100% zoom, right-click a word in the middle of a paragraph. Move the mouse downward to reach the context menu. The menu must remain stable and clickable.

**Acceptance Scenarios**:

1. **Given** the user right-clicks a word to open the context menu, **When** the user moves the mouse downward toward the menu entries, **Then** the menu stays anchored to the original word and does not close or reposition
2. **Given** the context menu is open, **When** the mouse passes over adjacent words while moving toward the menu, **Then** those words do not become the new tracked word
3. **Given** the context menu is open, **When** the user clicks away from the menu (not on a menu entry), **Then** the menu closes normally

---

### User Story 3 - Pinyin Ruby Alignment (Priority: P2)

For multi-character words like 埃及 (āijí), the pinyin annotation renders with excessive spacing between syllables — it looks like "ā    ijí" instead of "āijí". The browser's default ruby layout distributes the annotation text evenly across the characters, splitting at arbitrary points within the pinyin string.

**Why this priority**: Breaks readability of pinyin annotations. Affects learning accuracy — a misaligned pinyin can confuse learners about syllable boundaries.

**Independent Test**: Open the app, find 埃及 in the sample text, verify the pinyin reads "āijí" without excessive internal spacing.

**Acceptance Scenarios**:

1. **Given** a multi-character word with a single pinyin string (e.g., 埃及 / āijí), **When** the word is rendered, **Then** the pinyin text appears as a single visually cohesive unit without abnormal spacing between syllable parts
2. **Given** a multi-character word, **When** rendered at different zoom levels (80%–200%), **Then** the pinyin remains correctly spaced at all sizes
3. **Given** a long-pinyin word (e.g., 象形文字 / xiàngxíngwénzì), **When** rendered, **Then** the pinyin annotation does not split mid-syllable

---

### User Story 4 - Themed Scrollbar (Priority: P3)

The default browser scrollbar looks unstyled and breaks visual cohesion with the palette/theme system. The user wants a scrollbar that matches the active color palette and respects dark/light mode.

**Why this priority**: Cosmetic polish. Lower impact than functional bugs, but improves perceived quality.

**Independent Test**: Switch between palettes and light/dark mode. Verify the vertical scrollbar track and thumb colors match the current palette.

**Acceptance Scenarios**:

1. **Given** a color palette is active, **When** the user views the scrollbar, **Then** the scrollbar thumb and track colors harmonize with the palette's accent and surface colors
2. **Given** the user switches between light and dark mode, **When** the scrollbar is visible, **Then** the scrollbar updates to match the new theme
3. **Given** the user switches palettes, **When** the scrollbar is visible, **Then** the scrollbar updates immediately to match the new palette

---

### Edge Cases

- What happens when the text content is too short to trigger a scrollbar? The scrollbar should simply not appear (auto behavior).
- What happens to the context menu near the bottom edge of the window? The menu should not extend below the viewport (existing behavior is acceptable for now).
- What happens with single-character words and pinyin? No change needed — single-character pinyin already aligns correctly.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The reading area MUST use a centered max-width container (~1024px) for comfortable reading margins
- **FR-002**: The default window size MUST be 800×600 (same as minimum); the minimum window size MUST be 800×600
- **FR-003**: The context menu MUST remain anchored to its originating word while it is open, regardless of mouse movement outside the menu
- **FR-004**: Word hover tracking MUST be suppressed while the context menu is open
- **FR-005**: The context menu MUST close when the user clicks anywhere outside the menu (left or right click), or presses Escape
- **FR-006**: Pinyin annotations for multi-character words MUST render as a single cohesive unit without abnormal inter-syllable spacing (using native ruby with `<span>` wrapper around base characters, since CSS ruby-align is unsupported in Chromium and flex-based layout breaks baseline alignment)
- **FR-007**: Both vertical and horizontal scrollbars MUST use colors derived from the active palette
- **FR-008**: The scrollbar MUST update when the palette or theme changes
- **FR-009**: All existing tests MUST continue to pass after changes
- **FR-010**: Short text blocks (titles, subtitles, section names) MUST render in a larger font size for visual hierarchy
- **FR-011**: Body text paragraphs MUST use justified alignment (text-align: justify)

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: The reading area uses a centered content container with visible margins on both sides at 1600px width
- **SC-002**: The app window opens at 800×600 by default (same as minimum size)
- **SC-003**: The user can right-click any word and reliably reach the context menu; any left or right click outside the menu closes it
- **SC-004**: Pinyin annotations for all multi-character words (埃及, 象形文字, etc.) render without visible spacing artifacts
- **SC-005**: Both vertical and horizontal scrollbars visually match the active palette in both light and dark modes across all 6 palettes
- **SC-006**: All existing vitest and Rust tests pass
- **SC-007**: Docker build succeeds
- **SC-008**: The first line and section titles in the text render visibly larger than body text
- **SC-009**: Body text paragraphs have justified alignment with clean left and right edges

### Assumptions

- The wider layout targets a typical desktop window (1024px+) — this app is not used on mobile
- The pinyin spacing fix targets the rendering behavior, not the pinyin data itself (the data is correct)
- Scrollbar styling uses the rendering engine's pseudo-elements, which the app's WebView supports
