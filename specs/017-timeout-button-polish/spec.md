# Feature Specification: CLI Timeout & Button Focus Polish

**Feature Branch**: `017-timeout-button-polish`
**Created**: 2026-02-17
**Status**: Draft
**Input**: User description: "règle le problème de timeout et sois généreux ; que l'état visuel focus des boutons 'Edit', 'Process', 'Cancel' et 'Submit' soit accordé à celui des boutons de la barre"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Generous Processing Timeout (Priority: P1)

The user pastes a long Chinese text (500+ characters, up to full articles) and submits it for segmentation. The processing completes successfully without hitting a timeout, even for lengthy texts that require extended processing time.

**Why this priority**: The current timeout causes processing to fail outright for long texts, making the core feature unusable for real-world content like news articles or book excerpts.

**Independent Test**: Can be tested by submitting a long Chinese text (~1000 characters) and verifying it completes without a timeout error.

**Acceptance Scenarios**:

1. **Given** a long Chinese text (~1000 characters), **When** the user submits it for processing, **Then** the processing completes successfully without a timeout error.
2. **Given** a short Chinese text (~50 characters), **When** the user submits it for processing, **Then** the processing completes within a reasonable time.
3. **Given** a text that genuinely cannot be processed within the generous limit, **When** the timeout is reached, **Then** a clear timeout error message is displayed with a retry option.

---

### User Story 2 - Consistent Button Focus States (Priority: P2)

When navigating the application with a keyboard, all interactive buttons throughout the app display the same focus ring style. Currently the title bar buttons show a visible focus ring, but the action buttons (Edit, Process, Retry, Cancel, Submit, Enter Text) do not display any focus indicator.

**Why this priority**: Visual consistency and keyboard accessibility. Focus states that differ across the app feel unfinished and hinder keyboard navigation.

**Independent Test**: Can be tested by tabbing through all buttons in each view (empty, input, processing, reading) and verifying a consistent focus ring appears on every button.

**Acceptance Scenarios**:

1. **Given** the processing view with error state, **When** the user tabs to the "Retry" or "Edit" button, **Then** a focus ring matching the title bar button style is displayed.
2. **Given** the processing idle view, **When** the user tabs to the "Process" or "Edit" button, **Then** a focus ring matching the title bar button style is displayed.
3. **Given** the text input view, **When** the user tabs to "Cancel" or "Submit", **Then** a focus ring matching the title bar button style is displayed.
4. **Given** the empty state view, **When** the user tabs to "Enter Text", **Then** a focus ring matching the title bar button style is displayed.

---

### Edge Cases

- What happens when processing takes exactly the timeout duration? The timeout is generous enough that this is extremely unlikely for normal usage.
- What happens when the user's network is slow? The timeout covers total processing time including network latency; the generous limit accommodates slow connections.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST allow processing of long texts (up to 2000 Chinese characters) without timing out under normal conditions.
- **FR-002**: The system MUST display a timeout error only after a generous waiting period sufficient for most real-world texts.
- **FR-003**: All action buttons ("Edit", "Process", "Retry", "Cancel", "Submit", "Enter Text") MUST display the same focus ring style as the title bar buttons when focused via keyboard.
- **FR-004**: The focus ring style MUST be consistent across all views: empty state, text input, processing (spinner, error, idle), and reading view.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A 1000-character Chinese text processes successfully without a timeout error.
- **SC-002**: 100% of interactive buttons display a visible, consistent focus indicator when navigated to via keyboard.
- **SC-003**: The focus ring appearance is visually identical across all buttons in every application view.

## Assumptions

- The title bar button focus style (outline-none, ring, accent color, offset) is the reference style to match.
- "Generous timeout" means at least 5 minutes per attempt, sufficient for long text processing.
- The retry mechanism already in place remains unchanged; only the timeout duration increases.
