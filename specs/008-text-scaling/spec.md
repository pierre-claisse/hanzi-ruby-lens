# Feature Specification: Text Scaling Controls

**Feature Branch**: `008-text-scaling`
**Created**: 2026-02-12
**Status**: Draft
**Input**: User description: "I want to be able to scale the text (and only the text, not the title bar) up and down to address readability concerns using web-like Ctrl+ and Ctrl-. Add title bar buttons with zoom-in and zoom-out icons. Display current zoom level in grey text next to title. Button order: Pinyin toggle > Zoom in > Zoom out > Theme > Fullscreen > Close. No Ctrl+0 reset."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Zoom In for Better Readability (Priority: P1)

As a reader with vision concerns or reading on a high-resolution display, I need to increase the text size of Chinese characters and pinyin annotations using either the keyboard shortcut Ctrl+ or a title bar button, to improve readability without affecting the title bar size.

**Why this priority**: This is the core value proposition - enabling users to read comfortably regardless of their vision capabilities or display characteristics. Providing both keyboard and button access ensures usability for all users.

**Independent Test**: Can be fully tested by pressing Ctrl+ or clicking the zoom-in button multiple times and verifying that Chinese text and pinyin annotations scale up proportionally while title bar remains unchanged.

**Acceptance Scenarios**:

1. **Given** text is displayed at default size (100%), **When** user presses Ctrl+, **Then** text size increases to 110% AND pinyin annotations scale proportionally AND title bar remains unchanged
2. **Given** text is at 100%, **When** user clicks the zoom-in button in title bar, **Then** text size increases to 110% AND pinyin annotations scale proportionally AND title bar remains unchanged
3. **Given** text is at 100%, **When** user presses Ctrl+ five times, **Then** text size increases to 150%
4. **Given** text is at maximum zoom (200%), **When** user views title bar, **Then** zoom-in button appears visibly disabled
5. **Given** text is at maximum zoom (200%), **When** user presses Ctrl+ or clicks zoom-in button, **Then** text remains at 200% (no further increase)

---

### User Story 2 - Zoom Out to See More Content (Priority: P2)

As a reader who wants to see more content at once or has zoomed in too far, I need to decrease the text size using either the keyboard shortcut Ctrl- or a title bar button, to fit more content on screen while maintaining readability.

**Why this priority**: While less critical than zooming in (most users need larger text), this provides flexibility and recovery from over-zooming. Providing both keyboard and button access ensures usability for all users.

**Independent Test**: Can be fully tested by pressing Ctrl- or clicking the zoom-out button multiple times and verifying that Chinese text and pinyin annotations scale down proportionally while title bar remains unchanged.

**Acceptance Scenarios**:

1. **Given** text is displayed at 150%, **When** user presses Ctrl-, **Then** text size decreases to 140% AND pinyin annotations scale proportionally AND title bar remains unchanged
2. **Given** text is at 150%, **When** user clicks the zoom-out button in title bar, **Then** text size decreases to 140% AND pinyin annotations scale proportionally AND title bar remains unchanged
3. **Given** text is at 200%, **When** user presses Ctrl- ten times, **Then** text size decreases to 100%
4. **Given** text is at minimum zoom (100%), **When** user views title bar, **Then** zoom-out button appears visibly disabled
5. **Given** text is at minimum zoom (100%), **When** user presses Ctrl- or clicks zoom-out button, **Then** text remains at 100% (no further decrease)

---

### User Story 3 - Visual Zoom Level Indicator (Priority: P2)

As a reader adjusting zoom levels, I need to see the current zoom percentage displayed next to the title so I know exactly what zoom level I'm at without guessing.

**Why this priority**: Provides immediate feedback when adjusting zoom, helping users understand their current setting and make informed decisions about further adjustments. The subdued styling ensures it doesn't distract from content.

**Independent Test**: Change zoom to any level and verify that the percentage is displayed next to the title in subdued (grey) font within parentheses.

**Acceptance Scenarios**:

1. **Given** zoom is at 100%, **When** user views the title bar, **Then** "(100%)" appears next to the title in subdued styling
2. **Given** user changes zoom to 150%, **When** zoom level updates, **Then** indicator updates to "(150%)" with smooth transition
3. **Given** zoom is at 130%, **When** user views the title bar, **Then** "(130%)" appears next to the title in subdued styling
4. **Given** zoom changes from any level to another, **When** the change occurs, **Then** indicator updates with smooth transition (animated change, not instant)

---

### User Story 4 - Title Bar Button Ordering (Priority: P3)

As a user navigating the title bar with keyboard or mouse, I need the zoom buttons positioned logically between pinyin toggle and theme toggle, following a consistent left-to-right ordering.

**Why this priority**: Consistent button ordering improves usability and keyboard navigation. While not critical to functionality, it enhances user experience and maintains interface predictability.

**Independent Test**: Navigate title bar buttons with Tab key and verify order matches: Pinyin toggle → Zoom in → Zoom out → Theme toggle → Fullscreen toggle → Close button.

**Acceptance Scenarios**:

1. **Given** user views title bar, **When** buttons are displayed, **Then** order from left to right is: Pinyin toggle, Zoom in, Zoom out, Theme toggle, Fullscreen toggle, Close button
2. **Given** user presses Tab key starting from pinyin toggle, **When** tabbing through buttons, **Then** focus moves in order: Pinyin → Zoom in → Zoom out → Theme → Fullscreen → Close
3. **Given** any title bar button has focus, **When** user presses Shift+Tab, **Then** focus moves to previous button in reverse order

---

### User Story 5 - Persist Zoom Preference (Priority: P1)

As a reader with consistent readability needs, I need the app to remember my preferred zoom level across sessions so I don't have to readjust every time I open the app.

**Why this priority**: Readers with vision concerns or specific readability preferences need consistent zoom levels. Following the established pattern of persisting theme and fullscreen preferences, zoom must also persist to avoid forcing users to readjust on every launch.

**Independent Test**: Set zoom to 150%, restart the app, verify zoom is restored to 150%.

**Acceptance Scenarios**:

1. **Given** user sets zoom to 150%, **When** app is closed and reopened, **Then** zoom level is restored to 150%
2. **Given** user sets zoom to 130%, **When** app is closed and reopened, **Then** zoom level is restored to 130%
3. **Given** user has never set zoom (no saved preference), **When** app opens, **Then** zoom defaults to 100%

---

### Edge Cases

- What happens when user presses Ctrl+ or clicks zoom-in button at 200% zoom? → No action, remains at 200%, AND zoom-in button appears visibly disabled
- What happens when user presses Ctrl- or clicks zoom-out button at 100% zoom? → No action, remains at 100%, AND zoom-out button appears visibly disabled
- What happens when zoom level is stored as intermediate value (e.g., 115%)? → INVALID STATE - zoom level must always be a multiple of 10 between 100% and 200%
- What happens when window is resized while zoomed? → Text maintains zoom level, reflows naturally
- What happens when text content changes while zoomed? → New text renders at current zoom level
- What happens when user tries Ctrl+Plus vs Ctrl+Equals (both generate + on most keyboards)? → Both should work identically
- What happens when user holds down Ctrl+ or Ctrl- continuously? → Zoom increments rapidly with keyboard repeat rate
- What happens when user rapidly clicks zoom buttons? → Each click registers and increments/decrements by 10%
- What happens to zoom indicator when zoom level changes? → Updates immediately with smooth transition to reflect new percentage

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST support keyboard shortcut Ctrl+ (Ctrl+Plus or Ctrl+Equals) to increase text zoom level
- **FR-002**: System MUST support keyboard shortcut Ctrl- (Ctrl+Minus) to decrease text zoom level
- **FR-003**: Title bar MUST include a zoom-in button that increases text zoom level when clicked
- **FR-004**: Title bar MUST include a zoom-out button that decreases text zoom level when clicked
- **FR-005**: Zoom-in button and Ctrl+ shortcut MUST produce identical zoom behavior
- **FR-006**: Zoom-out button and Ctrl- shortcut MUST produce identical zoom behavior
- **FR-007**: Text zoom MUST apply to Chinese character content only (not title bar, not window chrome)
- **FR-008**: Text zoom MUST apply to pinyin ruby annotations proportionally with Chinese text
- **FR-009**: Zoom level MUST increment/decrement in 10% steps (100% → 110% → 120%, etc.)
- **FR-010**: Zoom level MUST be constrained between 100% minimum and 200% maximum
- **FR-011**: System MUST ignore zoom commands (keyboard or button) when at minimum (100%) or maximum (200%) boundaries
- **FR-012**: Default zoom level MUST be 100% when no saved preference exists
- **FR-013**: Zoom changes MUST apply immediately without requiring page reload or content refresh
- **FR-014**: Keyboard shortcuts MUST work consistently regardless of current focus within the text area
- **FR-015**: System MUST handle both Ctrl+Plus and Ctrl+Equals (same physical key on most keyboards)
- **FR-016**: Zoom level MUST persist to user preferences (following established pattern for theme and fullscreen)
- **FR-017**: Zoom level MUST restore from saved preference on app initialization
- **FR-018**: When no saved preference exists, zoom level MUST initialize to 100%
- **FR-019**: Current zoom percentage MUST be displayed next to the title in the title bar
- **FR-020**: Zoom percentage indicator MUST be styled in subdued (grey) color and enclosed in parentheses
- **FR-021**: Zoom percentage indicator MUST update with smooth transition when zoom level changes
- **FR-022**: Zoom-in button MUST appear visibly disabled when zoom level is at 200% maximum
- **FR-023**: Zoom-out button MUST appear visibly disabled when zoom level is at 100% minimum
- **FR-024**: Zoom level MUST always be a multiple of 10 (100, 110, 120, ..., 190, 200) - intermediate values are invalid
- **FR-025**: Title bar buttons MUST be ordered left to right as: Pinyin toggle, Zoom in, Zoom out, Theme toggle, Fullscreen toggle, Close button
- **FR-026**: Keyboard tab navigation MUST follow the same order as visual button layout
- **FR-027**: All hooks implementing zoom functionality MUST achieve 100% test coverage (statements, branches, functions, lines) following established testing patterns

### Key Entities

- **Text Scale Level**: Percentage value (100-200%) representing current zoom level, default 100%, increments of 10%
- **Text Content Area**: The region displaying Chinese text and pinyin annotations (excludes title bar and controls)
- **Zoom Boundaries**: Minimum 100%, maximum 200%, enforced at both keyboard and button interactions
- **Zoom In Button**: Title bar button with zoom-in icon that increases text scale level by 10%
- **Zoom Out Button**: Title bar button with zoom-out icon that decreases text scale level by 10%
- **Zoom Level Indicator**: Visual display of current zoom percentage shown next to title in subdued styling

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: User can increase text size from 100% to 200% in 10 keypresses (Ctrl+ pressed 10 times) OR 10 button clicks
- **SC-002**: User can decrease text size from 200% to 100% in 10 keypresses (Ctrl- pressed 10 times) OR 10 button clicks
- **SC-003**: Zoom changes apply instantly (under 100ms from keypress or button click to visible resize)
- **SC-004**: Chinese text and pinyin annotations maintain correct proportional sizing at all zoom levels (pinyin ≈50% of base character size)
- **SC-005**: Title bar buttons and text remain unchanged in size across all zoom levels
- **SC-006**: Text reflow handles zoom changes smoothly without layout breaks or overlapping elements at all zoom levels (100% to 200%)
- **SC-007**: Zoom controls work reliably across 100 consecutive rapid interactions (keypresses or button clicks) without dropped commands or state errors
- **SC-008**: Zoom level indicator updates with smooth visible transition when zoom changes (not instant snap)
- **SC-009**: Zoom level indicator is always visible and displays current percentage accurately
- **SC-010**: Zoom-in button appears visibly disabled when zoom is at 200% maximum
- **SC-011**: Zoom-out button appears visibly disabled when zoom is at 100% minimum
- **SC-012**: Zoom level is always a multiple of 10 between 100% and 200% (no intermediate values like 115% or 125%)
- **SC-013**: Title bar buttons appear in correct order (Pinyin toggle → Zoom in → Zoom out → Theme → Fullscreen → Close)
- **SC-014**: Keyboard tab navigation follows visual button order without skipping or reversing
- **SC-015**: All hooks implementing zoom functionality achieve 100% test coverage (statements, branches, functions, lines) matching existing hook testing standards

## Scope

### In Scope

- Implementing keyboard shortcuts: Ctrl+ (zoom in), Ctrl- (zoom out)
- Implementing title bar buttons: zoom-in button and zoom-out button with appropriate icons
- Visibly disabling zoom-in button at 200% maximum and zoom-out button at 100% minimum
- Displaying current zoom percentage indicator next to title in subdued styling
- Smooth transition animation for zoom indicator when percentage changes
- Establishing title bar button ordering: Pinyin toggle → Zoom in → Zoom out → Theme → Fullscreen → Close
- Scaling Chinese text content and pinyin annotations proportionally
- Enforcing zoom boundaries (100% minimum, 200% maximum)
- Ensuring zoom level is always a multiple of 10 (100, 110, 120, ..., 200)
- Zoom increments of 10% per keyboard press or button click
- Applying zoom only to text content area (excluding title bar elements)
- Handling both Ctrl+Plus and Ctrl+Equals for zoom in
- Persisting zoom level across app sessions
- Restoring zoom level on app initialization
- Keyboard tab navigation following visual button order
- Comprehensive hook testing achieving 100% coverage (statements, branches, functions, lines)

### Out of Scope

- Keyboard shortcut to reset zoom to 100% (Ctrl+0 not implemented)
- Mouse/trackpad pinch-to-zoom gestures
- Zoom controls in menus or context menus (only title bar buttons and keyboard shortcuts)
- Zoom increments other than 10% (no arbitrary zoom levels or slider controls)
- Per-text or per-word zoom (zoom is global to all displayed content)
- Animated zoom transition for text content (text resize is instant, only zoom indicator has smooth transition)
- Accessibility announcements for zoom changes (screen reader support)
- Zoom affecting title bar button sizes or title bar height
- Mobile/touch device zoom gestures (Windows desktop only)
- Detailed tooltip explanations on zoom buttons (icon should be self-explanatory)

## Assumptions

- Users are familiar with web browser zoom conventions (Ctrl+, Ctrl-) and/or icon-based zoom buttons
- The text content area is clearly separable from title bar UI elements
- Zoom level is a single global value (not per-paragraph or per-section)
- Both Ctrl+Plus and Ctrl+Equals generate the same zoom-in action (standard keyboard behavior)
- Minimum 100% zoom maintains sufficient readability for most content
- Maximum 200% zoom is sufficient for users with vision concerns
- Zoom preference persistence follows established pattern for other user preferences (theme, fullscreen)
- Zoom indicator in subdued styling is visible but not distracting (balances content-first design with user feedback)
- Title bar has sufficient space to accommodate two additional buttons without crowding
- Zoom-in and zoom-out icons are universally recognizable (magnifying glass with + and - symbols)

## Dependencies

- Existing text display component structure
- Existing title bar component structure (with other toggle buttons)
- Keyboard event handling capability
- User preference persistence mechanism (same as theme and fullscreen preferences)

## Constraints

- Zoom MUST NOT affect title bar button sizes or title bar height (only text content)
- Zoom keyboard shortcuts MUST follow web browser conventions (Ctrl+, Ctrl-)
- Zoom range MUST be constrained to 100%-200% to prevent unusable UI states
- Zoom level MUST always be a multiple of 10 between 100 and 200 (100, 110, 120, ..., 190, 200) - no intermediate values permitted
- Zoom increments MUST be 10% to provide predictable, manageable steps
- Zoom-in button MUST appear visibly disabled at 200% maximum
- Zoom-out button MUST appear visibly disabled at 100% minimum
- Zoom indicator MUST be subdued (grey styling) to minimize visual distraction while providing user feedback
- Zoom indicator MUST use smooth transition animation when percentage changes (not instant snap)
- Text and pinyin MUST maintain proportional sizing at all zoom levels (per Visual Identity section)
- Zoom preference persistence MUST follow established pattern for user preferences
- Title bar button ordering MUST remain consistent: Pinyin toggle → Zoom in → Zoom out → Theme → Fullscreen → Close
- Zoom buttons MUST use universally recognizable icons (magnifying glass with + and - symbols)
- All hooks implementing zoom functionality MUST achieve 100% test coverage following established hook testing patterns
