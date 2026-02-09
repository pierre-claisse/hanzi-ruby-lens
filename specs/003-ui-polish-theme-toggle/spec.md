# Feature Specification: UI Polish & Theme Toggle

**Feature Branch**: `003-ui-polish-theme-toggle`
**Created**: 2026-02-09
**Status**: Draft
**Input**: User description: "UI polish and theme toggle: adjust line spacing, word padding, hover visibility, ruby vertical gap, and add dark/light mode toggle button"

## Clarifications

### Session 2026-02-09

- Q: Where should the theme toggle button be positioned in the app layout? → A: Top-right corner, fixed position
- Q: Should the theme toggle support keyboard navigation and screen reader announcements? → A: Keyboard only (Tab to focus, Enter/Space to toggle, no screen reader announcements)
- Q: What visual style should the theme toggle button use? → A: Sun/moon icons (sun for light mode, moon for dark mode)
- Q: When localStorage fails to save theme preference, should the app show a warning or silently fall back? → A: Silent fallback to light mode with no user-facing warning (log error internally)

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Theme Toggle Control (Priority: P1)

A learner wants to switch between light and dark modes based on their reading environment (bright room vs. dim room) to reduce eye strain and maintain comfortable reading conditions.

**Why this priority**: Theme preference directly impacts readability and user comfort. Users currently cannot switch modes without system-level changes, creating friction. This is the most user-visible improvement and delivers immediate value.

**Independent Test**: Launch the app, click the theme toggle button, and verify the app switches between light mode (rice paper background, ink text) and dark mode (deep ink background, cream text) with the toggle state persisting across app restarts.

**Acceptance Scenarios**:

1. **Given** the app is open in light mode, **When** the user clicks the theme toggle button, **Then** the app switches to dark mode and the toggle reflects the new state
2. **Given** the app is in dark mode, **When** the user clicks the theme toggle button, **Then** the app switches to light mode and the toggle reflects the new state
3. **Given** the user has selected dark mode, **When** they close and reopen the app, **Then** the app opens in dark mode (preference persists)
4. **Given** the app is displaying Chinese text with ruby annotations, **When** the user toggles between modes, **Then** all text, backgrounds, and accents transition smoothly without layout shift

---

### User Story 2 - Visual Spacing Refinements (Priority: P2)

A learner finds the current text layout uncomfortable because lines are too far apart, Words feel cramped, and ruby annotations sit too close to the characters, making extended reading sessions difficult.

**Why this priority**: Spacing directly affects reading comfort and comprehension. Poor spacing causes eye strain during extended use. This is a quality-of-life improvement that enhances the core reading experience established in 002.

**Independent Test**: Launch the app and verify that: (a) lines of text have comfortable vertical spacing (not too far apart), (b) individual Words have horizontal breathing room (visible padding), and (c) ruby annotations have adequate vertical separation from characters.

**Acceptance Scenarios**:

1. **Given** the app displays multiple lines of text, **When** the user reads the content, **Then** lines are vertically spaced to feel natural (neither cramped nor excessively spread)
2. **Given** multiple Words appear adjacent to each other, **When** the user reads the text, **Then** each Word has visible horizontal padding creating clear separation between Words
3. **Given** Words display ruby annotations, **When** the user reads the pinyin, **Then** there is adequate vertical space between the Chinese characters and the pinyin above them (neither touching nor excessively distant)
4. **Given** long-pinyin Words like 乘風破浪 are displayed, **When** spacing adjustments are applied, **Then** annotations remain properly aligned without overflow or overlap

---

### User Story 3 - Enhanced Hover Visibility (Priority: P3)

A learner hovers over Words to focus on specific vocabulary but finds the current hover highlight so subtle it's barely noticeable, reducing the effectiveness of the interaction.

**Why this priority**: Hover feedback provides visual confirmation of which Word the user is examining. If the highlight is invisible, users lose this affordance. Lower priority than spacing because it's a secondary interaction, not the primary reading flow.

**Independent Test**: Launch the app, hover over any Word, and verify a clearly visible highlight appears (distinctly more visible than the current 8% opacity vermillion wash).

**Acceptance Scenarios**:

1. **Given** the app is open, **When** the user hovers over any Word, **Then** a clearly visible highlight appears (vermillion wash with increased opacity)
2. **Given** multiple Words are displayed, **When** the user moves the cursor between Words, **Then** the highlight transitions smoothly (200-300ms) to the new Word
3. **Given** the app is in light mode, **When** the user hovers over a Word, **Then** the highlight is visible against the rice paper background
4. **Given** the app is in dark mode, **When** the user hovers over a Word, **Then** the highlight is visible against the deep ink background

---

### Edge Cases

- What happens when the user toggles theme mode rapidly (multiple clicks within 1 second)? System should debounce or ignore rapid toggles to prevent flickering.
- How does the theme toggle behave when the window is below minimum width (overlay shown)? Toggle should remain accessible or gracefully hide if space is constrained.
- What happens if localStorage fails to persist the theme preference? System should silently fall back to light mode as the default (no user-facing warning, log error internally) and continue to allow session-only theme switching.

## Requirements *(mandatory)*

### Functional Requirements

#### Theme Toggle (US1)

- **FR-001**: System MUST provide a visible toggle button positioned in the top-right corner (fixed position) using sun/moon iconography (sun icon for light mode, moon icon for dark mode) to switch between themes
- **FR-002**: System MUST apply the selected theme immediately upon toggle (no page reload required)
- **FR-003**: System MUST persist the user's theme preference so it survives app restarts; if persistence fails, silently fall back to light mode default without user-facing warnings (log errors internally using console.error)
- **FR-004**: System MUST ensure the toggle control itself is visible in both light and dark modes
- **FR-005**: Theme toggle MUST update the document root to add/remove the `dark` class, triggering CSS variable overrides
- **FR-006**: Theme toggle MUST be keyboard accessible (Tab to focus, Enter or Space to activate)

#### Visual Spacing Refinements (US2)

- **FR-007**: System MUST reduce the vertical line spacing from `leading-[2.8]` to `leading-[2.5]` for more comfortable reading (2.5 is within optimal range 2.5-3.0 for ruby-annotated text per CJK typography research)
- **FR-008**: System MUST add horizontal padding to Word elements (`<ruby>`) to create breathing room between adjacent Words
- **FR-009**: System MUST maintain adequate vertical spacing between Chinese characters and their ruby annotations (currently feels too close)
- **FR-010**: Spacing adjustments MUST NOT cause layout overflow or misalignment for long-pinyin Words (e.g., 乘風破浪/chéngfēngpòlàng)

#### Enhanced Hover Visibility (US3)

- **FR-011**: System MUST increase the hover highlight opacity from the current 8% to a more visible level
- **FR-012**: Hover highlight MUST remain visually distinct in both light and dark modes
- **FR-013**: Hover transition timing (200-300ms) MUST remain unchanged to preserve smooth interaction feel

### Key Entities

- **Theme Preference**: User's selected mode (light or dark), persisted locally
- **Toggle Control**: UI element for switching themes (button, switch, or icon)

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can toggle between light and dark modes with a single click, and the theme changes instantly (< 100ms perceived delay)
- **SC-002**: Theme preference persists across app sessions (100% retention rate after restart)
- **SC-003**: Line spacing adjustment reduces vertical gap by approximately 10-15% compared to the current `leading-[2.8]` implementation
- **SC-004**: Word padding creates visually distinct separation (at least 4-6px horizontal space between adjacent Words)
- **SC-005**: Hover highlight is clearly visible in both light and dark modes (subjective: users can identify the highlighted Word without effort)
- **SC-006**: Hover opacity increase makes the highlight at least 50-100% more noticeable than the current 8% opacity
- **SC-007**: All spacing adjustments preserve the structural integrity of long-pinyin edge cases (no overflow, overlap, or misalignment)

## Assumptions *(if applicable)*

- Theme preference will be stored in localStorage (browser-based persistence)
- Default theme is light mode if no preference is found
- Spacing adjustments will be iterative CSS tweaks, validated visually rather than with precise measurements
- Hover opacity will likely land in the 12-16% range for optimal visibility without overwhelming the content
- The toggle control will be a small, unobtrusive icon button using sun/moon iconography, positioned in the top-right corner with fixed positioning (remains visible during scrolling)

## Out of Scope

- System-level theme detection (automatically matching OS dark mode preference) — deferred to a future feature
- Animated theme transitions (fade, slide, etc.) — simple instant toggle only
- Customizable spacing presets (compact, comfortable, spacious) — single optimized spacing only
- Custom theme colors beyond the Ink & Vermillion palette — constitution v1.1.0 locks the palette
