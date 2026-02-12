# Feature Specification: Pinyin Toggle & Title Bar Improvements

**Feature Branch**: `006-pinyin-toggle`
**Created**: 2026-02-11
**Status**: Draft
**Input**: User description: "I want to fix a bug : drag does not work when the mouse press is done on the title on the left of the title bar ; it must work. I want to simplify something : scrap the grab/grabbing cursor state entirely ; let's keep the cursor neutral default everywhere except on the clickable buttons. I want to tweak something : the buttons in the title bar are too big, make them smaller to go along the small title. I want to add a new button to toggle Pinyin ruby annotations on and off, as a way to display only the characters if the user is comfortable enough with the text or want to test his knowledge without spoil during reading."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Pinyin Visibility Toggle (Priority: P1)

As a Mandarin learner, I want to toggle the visibility of Pinyin annotations on and off, so I can test my character recognition without visual hints when I'm ready, and turn them back on when I need assistance.

**Why this priority**: This is the core value-add feature. It directly supports the learning journey by enabling users to progressively reduce their dependency on phonetic aids, which is essential for developing true character literacy. This transforms the app from a passive reading aid to an active learning tool.

**Independent Test**: Can be fully tested by loading any text with Pinyin annotations, clicking the toggle button, and verifying that:
1. Pinyin disappears/reappears
2. Only Chinese characters remain visible when toggled off
3. State persists across application restarts
4. Button visual state reflects current mode

**Acceptance Scenarios**:

1. **Given** the application is displaying text with Pinyin annotations visible, **When** the user clicks the Pinyin toggle button, **Then** all Pinyin annotations disappear and only Chinese characters remain visible
2. **Given** Pinyin annotations are hidden, **When** the user clicks the Pinyin toggle button, **Then** all Pinyin annotations reappear above their corresponding Chinese characters
3. **Given** the user has set Pinyin to hidden, **When** the application is closed and reopened, **Then** Pinyin annotations remain hidden (preference persists)
4. **Given** Pinyin is visible, **When** the user observes the toggle button, **Then** the button shows an icon/state indicating Pinyin can be hidden
5. **Given** Pinyin is hidden, **When** the user observes the toggle button, **Then** the button shows an icon/state indicating Pinyin can be shown

---

### User Story 2 - Title Bar Dragging Fix (Priority: P2)

As a user, I want to be able to drag the window by clicking anywhere on the title bar (including the title text), so I can reposition the window naturally without hunting for specific draggable areas.

**Why this priority**: This is a usability bug that breaks expected desktop application behavior. Users instinctively click on title text to drag windows. The current broken behavior creates friction and confusion in basic window management.

**Independent Test**: Can be fully tested by clicking and dragging various areas of the title bar (title text, empty space, between buttons) and verifying that the window moves smoothly in all cases except when clicking buttons themselves.

**Acceptance Scenarios**:

1. **Given** the application window is visible, **When** the user clicks and drags on the title text ("Hanzi Ruby Lens"), **Then** the window moves according to mouse movement
2. **Given** the user is dragging the window by the title, **When** the mouse moves across the screen, **Then** the window follows smoothly without lag or stuttering
3. **Given** the user clicks on empty space in the title bar, **When** they drag the mouse, **Then** the window repositions correctly
4. **Given** the user clicks on a button in the title bar, **When** they attempt to drag, **Then** the button action fires and the window does NOT move

---

### User Story 3 - Title Bar Button Sizing (Priority: P3)

As a user, I want the title bar buttons to be proportionally sized to match the small title text, so the UI feels balanced and the Chinese text remains the visual focus.

**Why this priority**: This is a visual polish improvement. Oversized buttons draw unnecessary attention to chrome elements, violating the "Chinese characters are the star" principle. While not functionally critical, it affects the app's refined aesthetic.

**Independent Test**: Can be fully tested by visual inspection of the title bar, measuring button heights against title text height, and verifying proportional harmony. Success means buttons are noticeably smaller and more subtle.

**Acceptance Scenarios**:

1. **Given** the application is running, **When** the user views the title bar, **Then** button heights are proportional to the small title text size
2. **Given** multiple buttons are present in the title bar, **When** observed together, **Then** all buttons share consistent sizing
3. **Given** the title bar is displayed, **When** compared to the previous version, **Then** buttons are visibly smaller and less prominent

---

### User Story 4 - Cursor State Simplification (Priority: P4)

As a user, I want the cursor to remain neutral (default arrow) on non-interactive areas, with pointer cursors only on clickable buttons, so the UI feels simpler and less visually noisy.

**Why this priority**: This is a minor polish refinement. Removing grab/grabbing cursor states reduces visual complexity. While the previous implementation provided feedback, it's unnecessary chrome that draws attention away from content.

**Independent Test**: Can be fully tested by hovering over various UI areas and verifying cursor states: default arrow on draggable areas, pointer on buttons, no grab/grabbing cursors anywhere.

**Acceptance Scenarios**:

1. **Given** the application is running, **When** the user hovers over the title bar drag region, **Then** the cursor shows the default arrow (not grab)
2. **Given** the user hovers over any title bar button, **When** the cursor enters the button area, **Then** the cursor changes to pointer
3. **Given** the user is dragging the window, **When** the mouse moves, **Then** the cursor remains default arrow (not grabbing)
4. **Given** the cursor is over the main text area, **When** hovering over Chinese characters, **Then** the cursor shows the default arrow

---

### Edge Cases

- What happens when the user toggles Pinyin visibility while no text is loaded (empty state)?
  - The toggle button should still be functional and persist the preference, ready to apply when text is loaded
- What happens if the user rapidly clicks the Pinyin toggle button multiple times?
  - The system should debounce or handle rapid toggles gracefully without UI flicker or state corruption
- What happens when the user drags the window to screen edges or across multiple monitors?
  - The OS handles window bounds; dragging should work consistently regardless of window position
- How does the Pinyin toggle interact with text that has no Pinyin annotations yet?
  - Button is still available; toggling to "hide" has no visible effect until Pinyin exists
- What happens to keyboard focus when clicking the title bar to drag?
  - Focus should remain on the previously focused element; dragging should not steal focus from content

## Requirements *(mandatory)*

### Functional Requirements

#### Pinyin Toggle Feature

- **FR-001**: System MUST provide a toggle button in the title bar to control Pinyin visibility
- **FR-002**: When Pinyin toggle is set to "hide", all ruby annotations MUST be visually hidden while Chinese characters remain visible
- **FR-003**: When Pinyin toggle is set to "show", all ruby annotations MUST be displayed above their corresponding Chinese characters
- **FR-004**: Pinyin visibility preference MUST persist across application sessions using browser localStorage; on first run (no saved preference), Pinyin MUST be visible by default
- **FR-005**: Toggle button MUST display a visual indicator reflecting the current Pinyin visibility state using lucide-react icons: Eye icon when Pinyin is visible (indicating click will hide), EyeClosed icon when Pinyin is hidden (indicating click will show)
- **FR-006**: Clicking the toggle button MUST immediately update the display (no page refresh or delay)
- **FR-017**: Title bar buttons MUST be keyboard-navigable via Tab key in the following order: Pinyin toggle, Theme toggle, Fullscreen toggle, Close button; Enter key MUST activate the focused button

#### Title Bar Dragging Fix

- **FR-007**: Title bar MUST support window dragging when mouse press occurs on the title text element
- **FR-008**: Title bar MUST support window dragging when mouse press occurs on any empty space in the header
- **FR-009**: Clicking and dragging on title bar buttons MUST NOT initiate window dragging (buttons fire their actions instead)

#### Button Sizing Adjustment

- **FR-010**: All title bar buttons (Theme, Fullscreen, Close, Pinyin Toggle) MUST be resized to be proportionally smaller
- **FR-011**: Button sizing MUST maintain consistent dimensions across all buttons in the title bar
- **FR-012**: Reduced button size MUST still meet minimum touch/click target accessibility standards (approximately 32×32px minimum)

#### Cursor State Simplification

- **FR-013**: Title bar drag region MUST display default cursor (not grab) when hovering
- **FR-014**: Title bar drag region MUST display default cursor (not grabbing) when actively dragging
- **FR-015**: Title bar buttons MUST display pointer cursor when hovering
- **FR-016**: Main text display area MUST display default cursor

### Key Entities

- **Pinyin Visibility Preference**: A user setting stored in browser localStorage, representing whether ruby annotations are currently shown or hidden (boolean: `true` = visible, `false` = hidden)

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can toggle Pinyin visibility in under 1 second (single button click with immediate visual feedback)
- **SC-002**: Window dragging is successful from 100% of non-button areas in the title bar (including title text and empty space)
- **SC-003**: Pinyin visibility preference persists correctly across application restarts (tested over 10 consecutive restart cycles)
- **SC-004**: Title bar buttons are reduced in size by approximately 20-30% compared to current implementation while maintaining visual clarity and clickability
- **SC-005**: No grab/grabbing cursor states appear anywhere in the application during normal use
- **SC-006**: Users can successfully complete a "test yourself" workflow: hide Pinyin, attempt to read text, reveal Pinyin to check accuracy, all within 5 seconds total interaction time

## Clarifications

### Session 2026-02-11

- Q: Which icon pair from lucide-react should the Pinyin toggle button use to indicate show/hide states? → A: Eye/EyeClosed - Eye icon when Pinyin visible (click to hide), EyeClosed icon when Pinyin hidden (click to show)
- Q: When a user opens the app for the first time (no saved preference), should Pinyin be visible or hidden by default? → A: Visible by default - Helps new learners immediately and demonstrates the app's core value
- Q: Should the Pinyin toggle have a keyboard shortcut (Ctrl+P, etc.) for quick access? → A: No custom shortcut - Use standard Tab navigation (Tab to button, Enter to activate). Tab order: Pinyin toggle → Theme toggle → Fullscreen toggle → Close Button
