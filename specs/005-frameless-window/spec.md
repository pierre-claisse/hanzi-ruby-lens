# Feature Specification: Frameless Window with Custom Title Bar

**Feature Branch**: `005-frameless-window`
**Created**: 2026-02-11
**Status**: Draft
**Input**: User description: "Now I want the app to be borderless, and by that I mean hiding the native Windows window chrome. We will then add a internal title bar stuck to the top of the window with the app title on the top left "Hanzi Ruby Lens" (not too big, it should not attract the attention more than the main Chinese text of the page) and three buttons on the top-right : the already existing theme toggle, a new fullscreen toggle, and a new close button. The two new buttons must have the same look as the existing theme toggle, except for their specific icons. The new title bar acts as a drag area for the window. Title is not selectable, and over the entire drag area title bar, we set cursor: grab; (except on the clickable buttons) and when dragging, we set to cursor: grabbing;. The drag area title bar is always shown. We can navigate through the three buttons with the following Tab order : Theme toggle > Fullscreen toggle > Close button. Each button is also clickable by hitting Enter. Fullscreen (when on) can also be turned Off by hitting Escape. None (zero) other interactions on the drag area title bar. Namely, double clicking on this area, does NOTHING, so no need to capture the event. The only way to toggle fullscreen is the button."

## Clarifications

### Session 2026-02-11

- Q: Window resize capability - With frameless window design, how should users resize the window? → A: Use system-provided resize zones with a thin native border (1-2px) that preserves native Windows resize behavior while maintaining a mostly borderless aesthetic
- Q: Title bar height - What specific height should the title bar have? → A: 48px (3rem)
- Q: Minimum window size - What are the minimum dimensions to prevent unusable layouts? → A: 800px width × 600px height (increased from current 400px minimum to accommodate title bar and content)
- Q: Default window size - What should the initial window dimensions be on first launch? → A: 1024px width × 768px height
- Q: Minimum size enforcement - Should the minimum be enforced at OS/window level or show overlay when crossed? → A: Enforce at OS/window level (users cannot resize below 800×600px); MinWidthOverlay component and related code should be removed
- Q: Title text size - What specific font size for the application title "Hanzi Ruby Lens"? → A: 14px (0.875rem / text-sm) - subtle but readable, smaller than body text to avoid competing with main content

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Window Dragging and Repositioning (Priority: P1)

Users need to move the application window to different positions on their screen while reading Chinese text, as they may want to position it alongside other reference materials, dictionaries, or note-taking applications.

**Why this priority**: This is the most fundamental interaction users will have with the frameless window. Without the ability to reposition the window, users lose basic desktop window management capabilities. This is the core value proposition of having a custom title bar.

**Independent Test**: Can be fully tested by launching the app, clicking and dragging anywhere on the title bar area (except buttons), and verifying the window moves smoothly with visual cursor feedback. Delivers immediate value as a functional desktop application.

**Acceptance Scenarios**:

1. **Given** the application is open, **When** the user hovers over the title bar area (not on buttons), **Then** the cursor changes to a grab hand icon
2. **Given** the cursor is over the title bar area, **When** the user clicks and holds the mouse button, **Then** the cursor changes to a grabbing hand icon
3. **Given** the user is holding down the mouse button on the title bar, **When** the user moves the mouse, **Then** the window repositions to follow the mouse movement
4. **Given** the user is dragging the window, **When** the user releases the mouse button, **Then** the window remains at the new position and the cursor returns to the grab hand icon
5. **Given** the cursor is over a button in the title bar, **When** the user hovers, **Then** the cursor remains as the default pointer (not grab hand)

---

### User Story 2 - Window Control Operations (Priority: P2)

Users need to control the application window state (close, fullscreen) using visible, accessible controls, since the native Windows controls are hidden in the frameless design.

**Why this priority**: Essential functionality for basic window management. Users must be able to close the application and toggle fullscreen mode. Without these controls, the application would be unusable.

**Independent Test**: Can be tested independently by clicking each button and verifying: close button terminates the app, fullscreen button toggles between windowed and fullscreen states with the preference persisted across launches. Delivers complete window management capabilities.

**Acceptance Scenarios**:

1. **Given** the application is open, **When** the user clicks the close button, **Then** the application terminates gracefully
2. **Given** the application is in windowed mode, **When** the user clicks the fullscreen toggle button, **Then** the application enters fullscreen mode
3. **Given** the application is in fullscreen mode, **When** the user clicks the fullscreen toggle button, **Then** the application returns to windowed mode
4. **Given** the application is in fullscreen mode, **When** the user presses the Escape key, **Then** the application returns to windowed mode
5. **Given** the user has set a fullscreen preference, **When** the application is closed and reopened, **Then** the fullscreen state is restored to the last used setting

---

### User Story 3 - Keyboard Navigation and Accessibility (Priority: P3)

Users who prefer keyboard navigation need to access all window controls without using the mouse, ensuring the application is accessible to users with different interaction preferences and abilities.

**Why this priority**: Enhances accessibility and provides alternative interaction methods. While important for inclusive design, it's less critical than the core window management (P1, P2) for the initial user experience.

**Independent Test**: Can be tested independently by pressing Tab repeatedly and verifying focus moves through the three buttons in order (Theme → Fullscreen → Close), then pressing Enter on each to verify activation. Delivers keyboard-only navigation capability.

**Acceptance Scenarios**:

1. **Given** the application has focus, **When** the user presses Tab, **Then** focus moves to the theme toggle button
2. **Given** focus is on the theme toggle button, **When** the user presses Tab, **Then** focus moves to the fullscreen toggle button
3. **Given** focus is on the fullscreen toggle button, **When** the user presses Tab, **Then** focus moves to the close button
4. **Given** focus is on any button, **When** the user presses Enter, **Then** the button's action is triggered (theme switches, fullscreen toggles, or app closes)
5. **Given** the application is in fullscreen mode and focus is on any element, **When** the user presses Escape, **Then** the application exits fullscreen mode

---

### Edge Cases

- What happens when the user double-clicks on the title bar drag area? (Expected: nothing - no event handling required)
- What happens when the title bar is dragged to the edge of the screen? (Expected: standard Windows edge snapping behavior applies)
- What happens when the user drags the window partially off-screen? (Expected: window follows mouse, standard OS behavior)
- How does the title bar appear when the window loses focus? (Expected: standard inactive window styling)
- What happens if the user tries to drag from the title text itself? (Expected: same as dragging from the title bar area - window moves, text is not selectable)
- What happens when the user resizes the window to very small dimensions? (Expected: window cannot be resized below 800×600px - OS/window manager enforces the minimum constraint and resize handles stop at the limit)
- How does resize interact with fullscreen mode? (Expected: resize is disabled in fullscreen mode, only available in windowed mode)

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST hide the native Windows window chrome (title bar, system buttons) while preserving a thin border (1-2px) for native resize functionality
- **FR-002**: System MUST display a custom title bar fixed to the top of the window with a height of 48px (3rem)
- **FR-021**: System MUST allow users to resize the window using native Windows resize zones at window edges and corners
- **FR-003**: System MUST display the application name "Hanzi Ruby Lens" on the left side of the title bar at 14px (0.875rem / text-sm) font size
- **FR-004**: System MUST display three buttons on the right side of the title bar: theme toggle, fullscreen toggle, and close button (left to right)
- **FR-005**: System MUST style the fullscreen toggle and close button consistently with the existing theme toggle button (same dimensions, padding, border, hover states)
- **FR-006**: System MUST use distinct, recognizable icons for each button (theme: sun/moon, fullscreen: expand/compress, close: X)
- **FR-007**: System MUST make the entire title bar area (excluding buttons) function as a drag region for window repositioning
- **FR-008**: System MUST display a grab hand cursor when hovering over the drag region
- **FR-009**: System MUST display a grabbing hand cursor when actively dragging the window
- **FR-010**: System MUST NOT display grab/grabbing cursors when hovering over or interacting with buttons
- **FR-011**: System MUST make the title text non-selectable (user cannot highlight or copy the text)
- **FR-012**: System MUST keep the title bar visible at all times (no auto-hide behavior)
- **FR-013**: System MUST implement Tab navigation order as: Theme toggle → Fullscreen toggle → Close button
- **FR-014**: System MUST allow each button to be activated by pressing Enter when focused
- **FR-015**: System MUST allow fullscreen mode to be exited by pressing Escape key
- **FR-016**: System MUST NOT respond to double-click events on the title bar drag area
- **FR-017**: System MUST persist fullscreen preference across application launches
- **FR-018**: Close button MUST terminate the application gracefully
- **FR-019**: Fullscreen toggle MUST switch between windowed and fullscreen modes
- **FR-020**: Theme toggle MUST maintain its existing functionality (switching between light and dark themes)
- **FR-022**: System MUST enforce a minimum window size of 800px width × 600px height at the OS/window level (users cannot manually resize below this threshold)
- **FR-023**: System MUST set the default window size to 1024px width × 768px height on first launch
- **FR-024**: System MUST remove the MinWidthOverlay component and related minimum width detection logic (useMinWidth hook) as window-level enforcement makes it obsolete

### Key Entities

- **Title Bar**: A persistent horizontal UI element at the top of the window containing the application name and window control buttons
- **Drag Region**: The interactive area of the title bar (excluding buttons) that enables window repositioning with visual cursor feedback
- **Window Control Buttons**: Three clickable elements (theme toggle, fullscreen toggle, close) that provide window management and appearance controls

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can reposition the window by clicking and dragging anywhere on the title bar (except buttons) within 1 second of attempting
- **SC-002**: All three window control buttons respond to both mouse clicks and keyboard Enter key activation
- **SC-003**: Fullscreen state preference persists across 100% of application restarts
- **SC-004**: Visual cursor feedback (grab/grabbing) appears consistently during all drag interactions
- **SC-005**: Keyboard Tab navigation moves through all three buttons in the specified order with visible focus indicators
- **SC-006**: The new buttons (fullscreen, close) are visually indistinguishable from the existing theme toggle button in terms of styling (same size, spacing, hover effects, borders)
- **SC-007**: Pressing Escape exits fullscreen mode in under 200ms
- **SC-008**: Users can resize the window using native cursor feedback at edges and corners with standard Windows resize behavior
