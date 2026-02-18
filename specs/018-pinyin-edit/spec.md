# Feature Specification: Pinyin Edit

**Feature Branch**: `018-pinyin-edit`
**Created**: 2026-02-17
**Status**: Draft
**Input**: Allow users to correct errors in pinyin ruby annotations in the reading view

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Correct a Word's Pinyin (Priority: P1)

While reading a processed Chinese text, the user notices that a word's pinyin annotation is incorrect (wrong tone, wrong reading, or wrong segmentation result). The user activates the word's context menu, selects an "Edit Pinyin" action, and an inline input field appears in place of the pinyin annotation. The input is pre-filled with the current pinyin. The user types the corrected pinyin, confirms the edit, and the reading view immediately displays the corrected annotation. The correction is saved permanently.

**Why this priority**: This is the core and only purpose of the feature. Without it, the user is stuck with whatever the automated segmentation produced, even if it contains errors. The ability to correct pinyin is essential for the tool to be trustworthy as a reading aid.

**Independent Test**: Open the app with a previously processed text, navigate to any word, edit its pinyin via the context menu, confirm, then restart the app and verify the corrected pinyin is still displayed.

**Acceptance Scenarios**:

1. **Given** a processed text is displayed in the reading view, **When** the user opens the context menu on a word and selects "Edit Pinyin", **Then** an inline input field replaces the pinyin annotation, pre-filled with the current value.
2. **Given** the inline pinyin input is visible, **When** the user types a new pinyin and confirms (Enter), **Then** the annotation updates immediately and the correction is persisted.
3. **Given** the inline pinyin input is visible, **When** the user cancels the edit (Escape), **Then** the original pinyin is restored and no changes are saved.
4. **Given** a pinyin correction was confirmed and saved, **When** the user restarts the application, **Then** the corrected pinyin is still displayed.
5. **Given** the inline pinyin input is visible, **When** the user submits an empty value, **Then** the edit is rejected and the original pinyin is kept.

---

### Edge Cases

- What happens when the user clicks outside the inline input while editing? The edit is cancelled, original pinyin restored (same behavior as Escape).
- What happens when the user edits a word's pinyin, then edits the same word again? The input is pre-filled with the most recently saved pinyin (the previous correction).
- What happens when the user re-processes the text after making corrections? All corrections are overwritten by the new processing result (the user is re-segmenting the text from scratch).
- What happens when the user edits the raw text (via Edit) and re-submits? Corrections from the previous segmentation are lost (new text = new segments).
- What happens when pinyin is hidden and the user selects "Edit Pinyin"? Pinyin visibility is turned on globally, then the inline input appears as normal.

## Clarifications

### Session 2026-02-18

- Q: Should "Edit Pinyin" be available when pinyin is hidden (toggle off)? → A: Always available; activating it also turns pinyin visibility on globally.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST provide an "Edit Pinyin" action in the existing word context menu.
- **FR-002**: Selecting "Edit Pinyin" MUST display an inline input field in the position of the pinyin annotation, pre-filled with the current pinyin value.
- **FR-003**: The inline input MUST accept confirmation via Enter and cancellation via Escape.
- **FR-004**: Clicking outside the inline input MUST cancel the edit (same as Escape).
- **FR-005**: Confirming an edit MUST immediately update the displayed pinyin annotation.
- **FR-006**: Confirming an edit MUST persist the correction so it survives application restart.
- **FR-007**: System MUST reject empty pinyin input (no blank annotations allowed).
- **FR-008**: The "Edit Pinyin" action MUST be accessible via both mouse (context menu click) and keyboard (context menu navigation + Enter).
- **FR-009**: After confirming or cancelling an edit, focus MUST return to the reading view's word navigation on the edited word.
- **FR-010**: If pinyin is hidden when the user activates "Edit Pinyin", the system MUST turn pinyin visibility on globally before displaying the inline input.

### Key Entities

- **Word**: Existing entity with characters and pinyin attributes. The pinyin attribute is the one being edited. No new entities are introduced.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: User can correct a word's pinyin in under 10 seconds (from context menu activation to confirmed save).
- **SC-002**: 100% of words in the reading view are editable (every word's context menu contains "Edit Pinyin").
- **SC-003**: Corrected pinyin persists across application restart with 100% reliability.
- **SC-004**: The entire edit flow (activate, type, confirm) is completable using keyboard only, without requiring a mouse.

## Assumptions

- The pinyin input accepts free-form text. No automated validation of pinyin format is performed (the user is the authority on correct pinyin).
- Only the pinyin annotation of a word can be edited, not the characters themselves or the word segmentation boundaries.
- The existing context menu structure (3 entries: MOE Dictionary, Google Translate, Copy) gains a 4th entry: "Edit Pinyin".
