# Feature Specification: Google Translate Button

**Feature Branch**: `019-translate-button`
**Created**: 2026-02-20
**Status**: Draft
**Input**: User description: "Ajouter un bouton dans la barre de titre entre le bouton d'edition et l'interrupteur de pinyin. Meme icone lucide-react que l'entree Google Translate du menu contextuel. Cliquer ouvre le texte brut complet dans Google Translate, traduit en anglais par defaut."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Translate Full Text via Title Bar (Priority: P1)

A learner has entered Chinese text and wants to quickly see the full translation in English. The text does not need to have been segmented or annotated with pinyin — as soon as raw text exists, the translate button is available. The learner clicks the button in the title bar and their default browser opens Google Translate with the entire raw text pre-filled, translated from Chinese to English.

**Why this priority**: This is the sole feature — a single-action shortcut that provides immediate text-level comprehension. It is independent of the pinyin segmentation pipeline and available from any view where raw text exists.

**Independent Test**: Can be fully tested by entering any text in the editing textarea, clicking the translate button, and verifying that the system browser opens Google Translate with the complete raw input text and the correct language pair.

**Acceptance Scenarios**:

1. **Given** a Text exists (raw text is non-empty), **When** the user clicks the translate button in the title bar, **Then** the system browser opens Google Translate with the full raw text, source language set to Traditional Chinese, and target language set to English.
2. **Given** a Text exists, **When** the user hovers over the translate button, **Then** a tooltip indicates the button's purpose.
3. **Given** no Text exists (empty state or empty raw input), **When** the user looks at the translate button, **Then** it is visible but disabled and grayed out, and clicking it has no effect.
4. **Given** the user is in the input view editing text, **When** they look at the title bar, **Then** the translate button is available if raw text is present, without requiring prior segmentation.

---

### Edge Cases

- What happens when the raw text is extremely long? Google Translate has a URL length limit (~5,000 characters via URL parameter). For texts exceeding this limit, the URL MUST be truncated to the maximum safe length. No error message is needed — partial translation is still useful.
- What happens when the raw text is empty (zero-length string)? The button MUST appear but be disabled and visually grayed out, following the same disabled styling as the zoom buttons when they reach their limit.
- What happens when the raw text contains special characters (punctuation, line breaks, mixed scripts)? All content MUST be properly URL-encoded before being sent to Google Translate.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The title bar MUST display a translate button positioned between the edit button and the pinyin toggle.
- **FR-002**: The translate button MUST use the `Languages` icon from lucide-react, matching the existing Google Translate context menu entry.
- **FR-003**: The translate button MUST be visible whenever the title bar is shown. It MUST be enabled when raw text (`Text.rawInput`) is non-empty, regardless of whether the text has been segmented. It MUST be disabled and visually grayed out (following the same disabled styling as the zoom buttons) when no raw text exists.
- **FR-004**: Clicking the translate button MUST open the user's default browser with a Google Translate URL.
- **FR-005**: The Google Translate URL MUST contain the full raw text (`Text.rawInput`), URL-encoded, with source language `zh-TW` (Traditional Chinese) and target language `en` (English).
- **FR-006**: The translate button MUST have a tooltip describing its purpose.
- **FR-007**: The translate button MUST follow the same visual styling as the existing edit button (border, padding, hover/focus states, transitions).
- **FR-008**: If the URL-encoded text would exceed 5,000 characters in the URL, the text MUST be truncated to fit within this limit.

### Key Entities

- **Text**: Existing aggregate root. The `rawInput` property (the complete user-entered Chinese content) is used as the translation source. No changes to the entity.

### Assumptions

- The translation language pair (zh-TW to en) is hardcoded. No user-configurable language selection is needed for this feature.
- Google Translate's URL-based interface (`https://translate.google.com/?sl=zh-TW&tl=en&text=...`) is the integration method — no API key or authentication required.
- The existing URL-opening mechanism (used by the context menu) is reused to open the browser.
- The button is always visible in the title bar. Its enabled/disabled state depends solely on whether raw text exists, not on whether segmentation has occurred.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can trigger a full-text translation to English in a single click from any view where raw text exists.
- **SC-002**: The translate button is always visible in the title bar, positioned consistently between the edit and pinyin toggle controls, and is enabled whenever raw text exists.
- **SC-003**: The full raw text content is correctly transmitted to Google Translate with no encoding errors for texts containing traditional Chinese characters, punctuation, and line breaks.
- **SC-004**: Texts up to 5,000 URL-encoded characters are fully translated; longer texts are gracefully truncated.
