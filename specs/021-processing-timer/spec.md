# Feature Specification: Processing Elapsed Timer

**Feature Branch**: `021-processing-timer`
**Created**: 2026-02-22
**Status**: Draft
**Input**: User description: "Je souhaite ajouter un petit indicateur à côté de 'Processing text...' qui indique entre parenthèses le temps écoulé depuis le début du processus, par exemple : '36s' ou '1m 24s', etc."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Elapsed Time During Processing (Priority: P1)

As a user, when I submit Chinese text for pinyin processing, I see a live elapsed-time counter displayed next to the "Processing text..." message so I know the operation is still running and how long it has taken.

**Why this priority**: This is the core and only feature — providing real-time feedback during a potentially long-running operation (Claude CLI processing can take 30s–2min+). Without it, users have no sense of progress and may think the app is frozen.

**Independent Test**: Can be fully tested by submitting any Chinese text and observing the processing screen — the elapsed counter should appear immediately and tick every second.

**Acceptance Scenarios**:

1. **Given** the user submits text for processing, **When** processing begins, **Then** the message reads "Processing text... (0s)" and the counter increments every second.
2. **Given** processing has been running for 75 seconds, **When** the user observes the processing screen, **Then** the displayed time reads "Processing text... (1m 15s)".
3. **Given** processing completes or fails, **When** the view transitions away from the processing state, **Then** the timer stops and resets (no residual timer state).

---

### User Story 2 - Timer Resets on Retry (Priority: P2)

As a user, when processing fails and I click "Retry", I see the elapsed timer restart from 0s so I can track the duration of the new attempt independently.

**Why this priority**: Ensures the timer remains accurate and meaningful across retry attempts, avoiding confusion from a stale counter.

**Independent Test**: Can be tested by triggering a processing error, observing the timer stops, then clicking Retry and verifying the timer restarts from 0s.

**Acceptance Scenarios**:

1. **Given** processing failed and the error view is shown, **When** the user clicks "Retry", **Then** the timer restarts from "0s".
2. **Given** the user navigates back to edit and resubmits, **When** processing begins again, **Then** the timer starts fresh from "0s".

---

### Edge Cases

- What happens at exactly 60 seconds? Displays "(1m 0s)".
- What happens for very long durations (10+ minutes)? Timer continues counting (e.g., "10m 5s") with no upper bound.
- What happens if processing completes in under 1 second? The user briefly sees "(0s)" before the view transitions.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST display the elapsed time in parentheses immediately after the "Processing text..." label, formatted as "(Xs)" for durations under 60 seconds and "(Xm Ys)" for durations of 60 seconds or more.
- **FR-002**: The elapsed counter MUST start at 0s when processing begins and increment by 1 every second.
- **FR-003**: The elapsed counter MUST stop when processing completes (success or failure) and not leave residual intervals running.
- **FR-004**: The elapsed counter MUST reset to 0s when the user retries processing or submits new text.
- **FR-005**: The elapsed time display MUST use the same visual style (color, size, font) as the existing "Processing text..." label — no additional visual weight or distraction.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: The elapsed timer is visible within 1 second of processing starting.
- **SC-002**: The displayed time is accurate to within ±1 second of actual elapsed wall-clock time.
- **SC-003**: The timer stops immediately (within 1 second) when processing ends.
- **SC-004**: On retry, the timer visibly resets to "0s" before counting up again.
