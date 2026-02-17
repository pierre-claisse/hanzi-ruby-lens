# Feature Specification: Text Input UI

**Feature Branch**: `015-text-input-ui`
**Created**: 2026-02-17
**Status**: Draft
**Input**: User description: "Text input UI: textarea component, submit action, empty state"

## Clarifications

### Session 2026-02-17

- Q: After submission (before LLM processing exists), what does the reading view show? → A: A "text saved, awaiting processing" placeholder message — not the raw text, since unsegmented display is neither implemented nor planned.
- Q: What happens to the hardcoded sample text fallback? → A: Remove it. The empty state replaces it as the first-time user experience.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Empty State Welcome (Priority: P1)

When the application has no saved Text, the user is greeted with a clear, inviting empty state that encourages them to paste or type Chinese content. The empty state communicates what the app does and provides a direct path to input.

**Why this priority**: Without this, a first-time user sees nothing meaningful and has no way to interact with the application. This is the entry point for all future functionality.

**Independent Test**: Can be fully tested by launching the app with an empty database and verifying the empty state appears with a clear call to action.

**Acceptance Scenarios**:

1. **Given** the application has no saved Text, **When** the user opens the app, **Then** an empty state is displayed with a placeholder message and a way to enter text.
2. **Given** the application has no saved Text, **When** the user views the empty state, **Then** the interface clearly communicates the app's purpose (paste Chinese text to read with pinyin annotations).

---

### User Story 2 - Text Entry and Submission (Priority: P1)

The user can enter or paste Chinese text into a text area and submit it to save it as the application's Text. After submission, the raw input is persisted and a confirmation state is displayed ("text saved, awaiting processing").

**Why this priority**: This is the core interaction of the feature — without it, the user cannot provide content to the application. Co-equal with the empty state as neither is useful without the other.

**Independent Test**: Can be fully tested by entering Chinese text, submitting, and verifying it persists across app restarts.

**Acceptance Scenarios**:

1. **Given** the user is in the input view, **When** they type or paste Chinese text and submit, **Then** the raw input is saved and a confirmation state is displayed ("text saved, awaiting processing").
2. **Given** the user has entered text, **When** they submit, **Then** the submitted text persists across application restarts.
3. **Given** the user is in the input view, **When** they submit with an empty text area, **Then** the submission is accepted and the empty state is shown (saving an empty Text is permitted per constitution).
4. **Given** the user is in the input view, **When** they have not yet submitted, **Then** they can cancel and return to their previous view without changes.

---

### User Story 3 - Edit Existing Text (Priority: P2)

A user who already has saved Text can choose to edit or replace it. The input view opens pre-filled with the previously saved raw input, allowing modification or full replacement.

**Why this priority**: Editing is essential for a complete workflow but depends on the input mechanism from P1 stories already working.

**Independent Test**: Can be fully tested by saving text, triggering edit, modifying the text, submitting, and verifying the updated content persists.

**Acceptance Scenarios**:

1. **Given** the user has a saved Text and is in the reading view, **When** they trigger the edit action, **Then** the input view appears pre-filled with the saved raw input.
2. **Given** the user is editing existing Text, **When** they modify the content and submit, **Then** the updated raw input replaces the previous one.
3. **Given** the user is editing existing Text, **When** they cancel, **Then** the original Text remains unchanged and the reading view is restored.

---

### Edge Cases

- What happens when the user pastes extremely long text (e.g., an entire book chapter)? The text area should handle large content gracefully without freezing.
- What happens when the user pastes non-Chinese content (e.g., English, numbers, punctuation)? The app accepts any text — filtering is not the responsibility of the input UI. LLM processing (future feature) will handle mixed content.
- What happens if the save operation fails (e.g., database error)? The user should see a clear error message and their input should not be lost.
- What happens if the user navigates away mid-input without submitting? Unsaved input is discarded — no draft persistence is needed for this feature.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The application MUST display an empty state when no Text is saved, clearly communicating the app's purpose and providing a path to text entry. The hardcoded sample text fallback MUST be removed; the empty state is the first-time user experience.
- **FR-002**: The application MUST provide a text input area where the user can type or paste content.
- **FR-003**: The text input area MUST support multiline content.
- **FR-004**: The user MUST be able to submit entered text, which saves it as the application's Text (raw input).
- **FR-005**: Submitting an empty text area MUST be permitted (per constitution: "Saving an empty Text MUST be permitted").
- **FR-006**: After successful submission, the application MUST display a confirmation state indicating the text is saved and awaiting processing. Once LLM processing is available (future feature), this state will transition to the annotated reading view instead.
- **FR-007**: The user MUST be able to cancel text entry and return to the previous view without saving.
- **FR-008**: When a saved Text exists, the user MUST have access to an edit action from the reading view.
- **FR-009**: The edit action MUST open the input view pre-filled with the previously saved raw input.
- **FR-010**: If the save operation fails, the user MUST see an error message and their input MUST be preserved in the text area.
- **FR-011**: The input view MUST respect the current theme (light/dark) and color palette.

### Key Entities

- **Text**: The aggregate root. Holds the raw user input and its processed segments. In this feature, only the raw input is written; segments remain unchanged until LLM processing is implemented in a future feature.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A first-time user can go from opening the app to having saved text in under 30 seconds.
- **SC-002**: Saved text persists across application restarts with no data loss.
- **SC-003**: The input view is visually consistent with the reading view (same theme, palette, typography standards).
- **SC-004**: The user can paste a 5,000-character Chinese text and submit it without noticeable delay.
- **SC-005**: All user actions (submit, cancel, edit) provide immediate visual feedback.

## Assumptions

- This feature saves the raw input only. Generating Words (segments with pinyin) from the saved Text is the responsibility of the future Claude API integration feature (016). Until then, the application displays a "saved, awaiting processing" confirmation state after submission.
- The application continues to hold exactly one Text (per constitution). Submitting new text replaces any previously saved Text entirely.
- No autosave during input — the user explicitly submits. Autosave applies to the Text once saved, not to the input draft.
- The edit trigger will be accessible from the title bar or reading view — exact placement is a planning concern, not a spec concern.
