# Feature Specification: Color Palette System

**Feature Branch**: `009-color-palettes`
**Created**: 2026-02-12
**Status**: Draft
**Input**: User description: "Add 7 color palettes with a palette toggle dropdown in the title bar. Dropdown opens on focus, supports keyboard navigation (arrow keys + Enter), highlights selected and focused palettes, and persists preference to localStorage."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Select a Color Palette (Priority: P1)

As a reader who wants to personalize my reading environment, I need to choose from a curated set of color palettes so that I can find the visual style that best suits my preference and reduces eye strain.

**Why this priority**: This is the core feature — without the ability to select a palette, nothing else matters. Provides immediate visual customization that directly impacts user comfort during reading sessions.

**Independent Test**: Click the palette toggle button in the title bar, select "Jade Garden" from the dropdown, and verify that the entire app (background, text, and pinyin accent color) updates to the Jade Garden palette.

**Acceptance Scenarios**:

1. **Given** the app is using the default palette ("Vermillion Scroll"), **When** user clicks the palette toggle button, **Then** a vertical dropdown appears listing all 6 available palettes
2. **Given** the palette dropdown is open, **When** user clicks "Jade Garden", **Then** the app immediately updates to the Jade Garden color scheme (background, text, and accent colors all change) AND the dropdown remains open
3. **Given** the palette dropdown is open, **When** user presses Enter on a focused palette, **Then** the app immediately updates to that palette AND the dropdown remains open
4. **Given** the app is in dark mode using "Vermillion Scroll", **When** user selects "Golden Pavilion", **Then** the dark mode colors update to Golden Pavilion's dark variant (lacquer brown background, warm ivory text, bright gold accent)
5. **Given** the app is in light mode using "Plum Blossom", **When** user toggles to dark mode, **Then** the dark mode colors use Plum Blossom's dark variant (deep teal background, plum mist text, plum blossom accent)

---

### User Story 2 - Keyboard Navigation of Palette Dropdown (Priority: P1)

As a keyboard-focused user, I need to navigate the palette dropdown using arrow keys and Enter so that I can select a palette without using a mouse.

**Why this priority**: Keyboard accessibility is essential for all users and follows the established keyboard interaction patterns in the app (tab navigation, shortcuts). Co-priority with US1 because the dropdown is unusable for keyboard users without this.

**Independent Test**: Tab to the palette toggle button, press Enter to open the dropdown, use Up/Down arrow keys to move between palettes, press Enter to select one, and verify the palette changes.

**Acceptance Scenarios**:

1. **Given** the palette toggle button has focus, **When** user presses Enter, **Then** the dropdown opens AND the currently selected palette receives focus
2. **Given** the dropdown is open with "Vermillion Scroll" focused, **When** user presses Down arrow, **Then** focus moves to "Jade Garden" (the next palette in the list)
3. **Given** the dropdown is open with "Ink Wash" focused (last item), **When** user presses Down arrow, **Then** focus wraps to "Vermillion Scroll" (first item)
4. **Given** the dropdown is open with "Vermillion Scroll" focused (first item), **When** user presses Up arrow, **Then** focus wraps to "Ink Wash" (last item)
5. **Given** the dropdown is open with "Plum Blossom" focused, **When** user presses Enter, **Then** "Plum Blossom" is selected as the active palette AND the dropdown remains open

---

### User Story 3 - Visual Feedback in Palette Dropdown (Priority: P2)

As a user browsing palettes, I need to see which palette is currently active and which one I'm about to select so that I can make an informed choice without confusion.

**Why this priority**: Visual feedback is important for usability but the feature is functional without it (users can still select palettes). Distinguishing "selected" from "focused" prevents accidental selection.

**Independent Test**: Open the palette dropdown while "Vermillion Scroll" is active, use arrow keys to move focus to "Jade Garden", and verify that "Vermillion Scroll" shows a selected indicator while "Jade Garden" shows a focused highlight.

**Acceptance Scenarios**:

1. **Given** the dropdown is open and "Vermillion Scroll" is the active palette, **When** user views the list, **Then** "Vermillion Scroll" displays a visible selected indicator (e.g., checkmark or distinct background)
2. **Given** the dropdown is open and "Vermillion Scroll" is selected, **When** user moves focus to "Jade Garden" with arrow keys, **Then** "Jade Garden" displays a focused highlight (visually distinct from the selected indicator) AND "Vermillion Scroll" retains its selected indicator
3. **Given** the dropdown is open, **When** user views any palette entry, **Then** each entry displays the palette name alongside a visual preview of its colors (primary, secondary, accent swatches)

---

### User Story 4 - Title Bar Button Ordering (Priority: P2)

As a user navigating the title bar, I need the palette toggle button positioned logically between zoom controls and theme toggle, following a consistent left-to-right ordering.

**Why this priority**: Consistent button ordering prevents confusion and maintains the established navigation pattern. Important for muscle memory and keyboard tab navigation.

**Independent Test**: Tab through all title bar buttons and verify the order is: Pinyin toggle, Zoom in, Zoom out, Palette toggle, Theme toggle, Fullscreen toggle, Close button.

**Acceptance Scenarios**:

1. **Given** the title bar is visible, **When** user views the button layout, **Then** buttons appear left to right as: Pinyin toggle, Zoom in, Zoom out, Palette toggle, Theme toggle, Fullscreen toggle, Close button
2. **Given** the Zoom out button has focus, **When** user presses Tab, **Then** focus moves to the Palette toggle button
3. **Given** the Palette toggle button has focus, **When** user presses Tab, **Then** focus moves to the Theme toggle button

---

### User Story 5 - Palette Preference Persistence (Priority: P2)

As a reader who has chosen a preferred palette, I need my choice to persist across app sessions so that I don't have to reselect it every time I open the app.

**Why this priority**: Persistence is expected behavior for user preferences (matching theme and zoom persistence). Without it, users must reconfigure on every launch, which is frustrating.

**Independent Test**: Select "Golden Pavilion" palette, close and reopen the app, and verify the app loads with Golden Pavilion colors.

**Acceptance Scenarios**:

1. **Given** user selects "Plum Blossom" palette, **When** app is closed and reopened, **Then** the app loads with Plum Blossom colors
2. **Given** user has never selected a palette (no saved preference), **When** app opens, **Then** the default palette "Vermillion Scroll" is used
3. **Given** an invalid palette name is stored in preferences, **When** app opens, **Then** the app falls back to "Vermillion Scroll" (default)

---

### User Story 6 - Dropdown Dismissal (Priority: P3)

As a user who opened the palette dropdown accidentally or changed my mind, I need to dismiss the dropdown without changing my palette.

**Why this priority**: Standard dropdown behavior that users expect. Lower priority because the feature works without it (users can always just select their current palette), but its absence would feel broken.

**Independent Test**: Open the palette dropdown, then click outside it, and verify the dropdown closes without changing the palette.

**Acceptance Scenarios**:

1. **Given** the dropdown is open, **When** user clicks anywhere outside the dropdown, **Then** the dropdown closes without changing the palette
2. **Given** the dropdown is open, **When** user presses Tab, **Then** the dropdown closes AND focus moves to the next focusable element (Theme toggle)

---

### Edge Cases

- What happens when user selects the palette that is already active? --> No visual change, dropdown remains open
- What happens when localStorage is unavailable (quota exceeded, private browsing)? --> App uses default palette ("Vermillion Scroll"), palette selection still works for current session but won't persist
- What happens when stored palette name doesn't match any known palette? --> Falls back to "Vermillion Scroll" (default)
- What happens when user switches theme (light/dark) while dropdown is open? --> Dropdown and all colors update immediately to reflect the new theme variant of the current palette
- What happens when user rapidly opens and closes the dropdown? --> Each interaction completes cleanly without visual glitches
- What happens when user clicks the palette toggle button while dropdown is open? --> Dropdown closes (toggle behavior)
- What happens when window is resized while dropdown is open? --> Dropdown remains anchored to the palette toggle button and stays visible
- What happens when user scrolls while dropdown is open? --> Not applicable (no scrollable content behind the dropdown in this app)

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST provide exactly 6 color palettes: Vermillion Scroll, Jade Garden, Indigo Silk, Plum Blossom, Golden Pavilion, Ink Wash
- **FR-002**: Each palette MUST define three color tokens: background, text, and accent (highlights and pinyin annotations)
- **FR-003**: Each palette MUST provide both a light mode and a dark mode color variant
- **FR-004**: The default palette MUST be "Vermillion Scroll" when no saved preference exists
- **FR-005**: Title bar MUST include a palette toggle button that opens a vertical dropdown when activated
- **FR-006**: Palette dropdown MUST list all 6 palettes with their common name and a theme-specific variant name (e.g., "Vermillion Scroll" with "Lamplit Vellum" in light mode or "Midnight Study" in dark mode). The variant name MUST be displayed in smaller, dimmer, italic text below the common name
- **FR-007**: Palette dropdown MUST display a visual preview of each palette's colors (color swatches for background, text, accent)
- **FR-008**: Currently selected (active) palette MUST be visually indicated in the dropdown (e.g., checkmark or distinct background)
- **FR-009**: Currently focused palette MUST be visually highlighted in the dropdown, distinct from the selected indicator. Mouse-clicking a palette item MUST move both the selected AND focused indicators to that item
- **FR-010**: Selecting a palette MUST immediately apply its colors to the entire app (background, text, accent/pinyin)
- **FR-011**: Selecting a palette MUST NOT affect title bar layout, button sizes, or title bar height
- **FR-012**: Palette toggle button MUST open the dropdown on click or Enter (not Space)
- **FR-013**: Palette toggle button MUST close the dropdown on second click (toggle behavior)
- **FR-014**: Down arrow key MUST move focus to the next palette in the dropdown, wrapping from last to first
- **FR-015**: Up arrow key MUST move focus to the previous palette in the dropdown, wrapping from first to last
- **FR-016**: Enter key MUST select the focused palette. The dropdown MUST remain open after selection
- **FR-017**: Clicking outside the dropdown MUST close it without changing the palette
- **FR-018**: When the dropdown opens, the currently selected palette MUST receive focus
- **FR-019**: Tab key while dropdown is open MUST close the dropdown and move focus to the next title bar button
- **FR-020**: Palette preference MUST persist to user preferences across app sessions
- **FR-021**: Palette preference MUST restore from saved preference on app initialization
- **FR-022**: Invalid stored palette values MUST fall back to "Vermillion Scroll" (default)
- **FR-023**: Palette colors MUST work correctly with both light and dark theme modes
- **FR-024**: Title bar buttons MUST be ordered left to right as: Pinyin toggle, Zoom in, Zoom out, Palette toggle, Theme toggle, Fullscreen toggle, Close button
- **FR-025**: Keyboard tab navigation MUST follow the same order as visual button layout
- **FR-026**: All hooks implementing palette functionality MUST achieve 100% test coverage (statements, branches, functions, lines) following established testing patterns
- **FR-027**: Pinyin ruby annotations (`rt` elements) MUST use the accent color of the selected palette
- **FR-028**: Space key MUST have no effect on any button in the app. Only Enter and click activate buttons. This applies globally to all title bar buttons (Pinyin toggle, Zoom in, Zoom out, Palette toggle, Theme toggle, Fullscreen toggle, Close button)
- **FR-029**: Palette dropdown MUST only close via click outside or Tab away. Selecting a palette (by click or Enter) MUST NOT close the dropdown

### Key Entities

- **Color Palette**: A named set of three color tokens (background, text, accent) with light and dark mode variants. 6 palettes available: Vermillion Scroll, Jade Garden, Indigo Silk, Plum Blossom, Golden Pavilion, Ink Wash
- **Palette Preference**: The user's selected palette name, persisted as a string in user preferences, defaults to "Vermillion Scroll"
- **Palette Dropdown**: A vertical list UI element anchored to the palette toggle button, displaying all available palettes with selection and focus indicators

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: User can switch between all 6 palettes and see colors change immediately (under 100ms) across the entire app
- **SC-002**: User can navigate the full palette dropdown using only the keyboard (Tab to reach, Enter to open, arrows to navigate, Enter to select — dropdown stays open for browsing, Tab or click outside to dismiss)
- **SC-003**: User can visually distinguish the currently selected palette from the currently focused palette in the dropdown at all times
- **SC-004**: Palette preference persists across app restarts — selecting a palette and restarting the app restores the chosen palette
- **SC-005**: All 6 palettes render correctly in both light and dark themes (12 total color combinations produce readable text meeting WCAG AA contrast — minimum 4.5:1 for body text, 3:1 for large text). Accent-derived hover colors (e.g., `hover:bg-accent/24`) MUST remain visibly distinct against the background in all palettes
- **SC-006**: Title bar buttons appear in correct order (Pinyin toggle, Zoom in, Zoom out, Palette toggle, Theme toggle, Fullscreen toggle, Close button) with tab navigation following the same order
- **SC-007**: Palette toggle button is visually consistent with existing title bar buttons (same size, spacing, border, hover/focus styles)
- **SC-008**: Pinyin annotations use the accent color of the selected palette across all 6 palettes in both light and dark modes
- **SC-009**: All hooks implementing palette functionality achieve 100% test coverage (statements, branches, functions, lines)
- **SC-010**: Dropdown dismissal works via both methods (click outside, Tab away) without changing the active palette

## Scope

### In Scope

- Defining 6 named color palettes with light and dark mode variants (3 tokens each: background, text, accent)
- Creating a palette toggle button in the title bar with a dropdown selector
- Keyboard-accessible dropdown navigation (arrow keys, Enter, Tab)
- Visual indicators for selected and focused palettes in the dropdown
- Color swatch previews for each palette in the dropdown
- Applying selected palette colors to the entire app (background, text, accent/pinyin)
- Persisting palette preference to user preferences
- Restoring palette preference on app initialization
- Updating title bar button ordering to include palette toggle
- Comprehensive hook testing achieving 100% coverage
- Dropdown dismissal via click outside and Tab

### Out of Scope

- User-created custom palettes or color pickers
- Per-element or per-section color customization
- Animated color transitions when switching palettes
- Palette preview on hover (live preview before selection)
- Import/export of palette preferences
- System-preference-based automatic palette selection (e.g., OS accent color)
- More than 6 palettes

## Assumptions

- The 6 palettes provide sufficient variety for the target audience (readers of Chinese text)
- All 6 palettes maintain readable contrast ratios in both light and dark modes
- The palette toggle dropdown does not need to scroll (6 items fit comfortably in the viewport)
- "Vermillion Scroll" is a suitable default that matches the current app appearance
- The existing theme toggle (light/dark) remains independent from palette selection — users can combine any palette with either theme mode
- Color swatches (small colored circles or rectangles) are sufficient to preview a palette without showing a full app preview
- The dropdown appears below the palette toggle button (standard dropdown positioning)
- All existing button styling patterns (border, hover, focus ring) apply to the palette toggle button

## Dependencies

- Existing title bar component structure with established button patterns
- Existing theme system (light/dark toggle) that palette system must integrate with
- User preference persistence mechanism (localStorage, matching theme and zoom patterns)

## Constraints

- Palette MUST NOT affect title bar button sizes, title bar height, or overall layout
- Palette selection MUST work independently from theme (light/dark) selection — all 12 combinations must be valid
- Palette dropdown MUST be keyboard-accessible following WAI-ARIA listbox or menu patterns
- Palette colors MUST meet WCAG AA contrast ratios (4.5:1 body text, 3:1 large text) for both Chinese characters and pinyin annotations. Accent-derived hover colors MUST remain visibly distinct against the background
- Palette preference persistence MUST follow the established pattern used for theme and zoom preferences
- Title bar button ordering MUST remain consistent: Pinyin toggle, Zoom in, Zoom out, Palette toggle, Theme toggle, Fullscreen toggle, Close button
- Palette toggle button MUST use the same visual styling as other title bar buttons
- All hooks implementing palette functionality MUST achieve 100% test coverage following established testing patterns
- Space key MUST be globally suppressed on all buttons — only Enter and click activate

## Color Palette Definitions

The following 6 palettes are included. Each defines background, text, and accent (pinyin/highlights) tokens for both light and dark modes. **Design constraint**: light and dark themes share the same accent color. Dark themes use a background hue that contrasts with the accent hue for visual drama.

### 1. Vermillion Scroll (default)
Light variant: **Lamplit Vellum** | Dark variant: **Midnight Study**
Aged rice paper and red seal ink. Light mode glows like a scroll under lamplight; dark mode is a scholar's midnight desk, navy shadows and vermillion stamps.

| Token     | Light                     | Dark                      |
|-----------|---------------------------|---------------------------|
| background | `#FEFCF3` (warm cream)    | `#0E0E22` (deep navy)     |
| text      | `#2D2D2D` (charcoal)      | `#F5F0E8` (parchment)     |
| accent    | `#C84B31` (vermillion)    | `#C84B31` (vermillion)    |

### 2. Jade Garden
Light variant: **Bamboo Mist** | Dark variant: **Firefly Dusk**
Celadon and bamboo. Cool greens on misty paper in light mode; deep purple twilight in dark, where jade-green accents glow like fireflies in a plum orchard.

| Token     | Light                        | Dark                          |
|-----------|------------------------------|-------------------------------|
| background | `#F4F8F0` (morning mist)     | `#1A1024` (deep purple)       |
| text      | `#2A3A2E` (pine bark)        | `#D8ECDB` (pale bamboo)       |
| accent    | `#2E8B57` (jade green)       | `#2E8B57` (jade green)        |

### 3. Indigo Silk
Light variant: **Porcelain Dawn** | Dark variant: **Earthen Kiln**
Blue-and-white porcelain meets dyed fabric. Raw silk crispness by day; warm umber depth by night, where indigo accents float like cold brushstrokes on earthen paper.

| Token     | Light                        | Dark                          |
|-----------|------------------------------|-------------------------------|
| background | `#F7F5F0` (raw silk)         | `#1E120A` (warm umber)        |
| text      | `#2C2C3A` (deep slate)       | `#E0DCD6` (unbleached cotton) |
| accent    | `#4A69BD` (indigo blue)      | `#4A69BD` (indigo blue)       |

### 4. Plum Blossom
Light variant: **Blush Parchment** | Dark variant: **Teal Forest**
Tang dynasty poetry in color form. Blush parchment and dark plum by day; deep teal forest by night, where plum-pink accents bloom like flowers against dark foliage.

| Token     | Light                         | Dark                          |
|-----------|-------------------------------|-------------------------------|
| background | `#FBF5F3` (blush parchment)   | `#091E18` (deep teal)         |
| text      | `#3A2D3D` (dark plum)         | `#F0E4E8` (plum mist)         |
| accent    | `#9B2D5E` (plum blossom)      | `#9B2D5E` (plum blossom)      |

### 5. Golden Pavilion
Light variant: **Imperial Gilt** | Dark variant: **Palace Lanterns**
Forbidden City opulence distilled. Aged scrolls and imperial gold in light mode; deep navy night sky in dark, where gold accents gleam like palace lanterns.

| Token     | Light                        | Dark                          |
|-----------|------------------------------|-------------------------------|
| background | `#FDF8EE` (golden cream)     | `#0E0B1F` (deep navy)         |
| text      | `#352B1E` (dark walnut)      | `#EDE4D0` (warm ivory)        |
| accent    | `#C48820` (imperial gold)    | `#C48820` (imperial gold)     |

### 6. Ink Wash
Light variant: **Rice Paper** | Dark variant: **Fresh Ink**
Pure shuǐmò restraint. No color, only tone — grey on grey, ink on paper. Everything stripped away until nothing remains but the characters themselves.

| Token     | Light                         | Dark                         |
|-----------|-------------------------------|------------------------------|
| background | `#F5F5F2` (cold rice paper)   | `#141414` (fresh ink)        |
| text      | `#333333` (diluted ink)       | `#D9D9D6` (dry-brush grey)   |
| accent    | `#777777` (mid grey)          | `#999999` (light grey)       |
