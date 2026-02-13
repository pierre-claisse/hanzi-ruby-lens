# Feature Specification: Context Menu Actions

**Feature Branch**: `012-context-menu-actions`
**Created**: 2026-02-13
**Status**: Draft
**Input**: User description: "I want to replace the two dummy options in the word contextual menu by the following: 1) look up focused word in the online dictionary like this 'https://dict.revised.moe.edu.tw/search.jsp?md=1&word=[CHINESE WORD GOES HERE]&qMd=0&qCol=1&sound=1#radio_sound_1' and it opens a tab in the default web browser of the user's local machine, 2) copy focused Chinese word to clipboard (characters, not pinyin)"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Dictionary Lookup (Priority: P1)

A user highlights a Chinese word in the text area (via keyboard navigation or mouse hover), opens the contextual menu, and selects the first entry (with a book-search icon) to look it up in the MOE Revised Chinese Dictionary. The application constructs the dictionary URL using the word's Chinese characters and opens it in the user's default web browser as a new tab. The contextual menu closes after the action.

**Why this priority**: Dictionary lookup is the primary learning action. Users reading Chinese text need quick access to definitions, and this is the core value proposition of the contextual menu.

**Independent Test**: Focus a word, press Enter to open contextual menu, select "MOE Dictionary" entry via keyboard (Enter) or mouse click. Verify the correct dictionary URL opens in the default browser with the word's characters in the query parameter.

**Acceptance Scenarios**:

1. **Given** the contextual menu is open on a highlighted word, **When** the user selects the "MOE Dictionary" entry (first entry) via keyboard Enter, **Then** the default web browser opens a new tab with the dictionary URL containing the word's Chinese characters, and the contextual menu closes
2. **Given** the contextual menu is open on a highlighted word, **When** the user clicks the "MOE Dictionary" entry, **Then** the default web browser opens a new tab with the dictionary URL containing the word's Chinese characters, and the contextual menu closes
3. **Given** the word contains multi-character Chinese text (e.g., "勇往直前"), **When** the user selects "MOE Dictionary", **Then** the URL correctly includes the full word characters URL-encoded in the query parameter
4. **Given** the word is a single Chinese character (e.g., "我"), **When** the user selects "MOE Dictionary", **Then** the URL correctly includes the single character in the query parameter
5. **Given** the "MOE Dictionary" menu entry, **Then** it displays a book-search icon on the left side of the label

---

### User Story 2 - Google Translate (Priority: P2)

A user highlights a Chinese word, opens the contextual menu, and selects the second entry (with a languages icon) to translate the word via Google Translate. The application opens Google Translate with Traditional Chinese (zh-TW) as the source language, translating to English. The contextual menu closes after the action.

**Why this priority**: Google Translate provides quick translations complementary to the dictionary lookup. Always using Traditional Chinese (zh-TW) as the source language keeps the implementation simple and consistent.

**Independent Test**: Focus a word, select "Google Translate" entry. Verify Google Translate opens with `sl=zh-TW&tl=en` and the word's characters.

**Acceptance Scenarios**:

1. **Given** the contextual menu is open on any Chinese word, **When** the user selects "Google Translate", **Then** Google Translate opens with `sl=zh-TW&tl=en` and the word's characters
2. **Given** the "Google Translate" menu entry, **Then** it displays a languages icon on the left side of the label
3. **Given** the contextual menu is open, **Then** "Google Translate" is the second entry (between "MOE Dictionary" and "Copy")

---

### User Story 3 - Copy Word to Clipboard (Priority: P3)

A user highlights a Chinese word, opens the contextual menu, and selects the third entry (with a copy icon) to copy the word's Chinese characters (not pinyin) to the system clipboard. The contextual menu closes after the action.

**Why this priority**: Copying characters is a frequent utility action for language learners — pasting into chat, notes, or other dictionaries. It complements the lookup and translate actions and completes the core menu functionality.

**Independent Test**: Focus a word, open contextual menu, select "Copy" entry. Paste into any text field and verify only the Chinese characters appear (no pinyin).

**Acceptance Scenarios**:

1. **Given** the contextual menu is open on a highlighted word, **When** the user selects the "Copy" entry (third entry) via keyboard Enter, **Then** the word's Chinese characters are copied to the system clipboard (not pinyin), and the contextual menu closes
2. **Given** the contextual menu is open on a highlighted word, **When** the user clicks the "Copy" entry, **Then** the word's Chinese characters are copied to the system clipboard (not pinyin), and the contextual menu closes
3. **Given** the word "勇往直前" with pinyin "yǒng wǎng zhí qián" is highlighted, **When** the user selects "Copy", **Then** only "勇往直前" is placed on the clipboard
4. **Given** a single-character word "我" with pinyin "wǒ" is highlighted, **When** the user selects "Copy", **Then** only "我" is placed on the clipboard
5. **Given** the "Copy" menu entry, **Then** it displays a copy icon on the left side of the label

---

### Edge Cases

- What happens when the user selects "MOE Dictionary" but has no internet connection? The browser opens the URL regardless; connection errors are handled by the browser itself
- What happens when the user selects "Google Translate" but has no internet connection? The browser opens the URL regardless; connection errors are handled by the browser itself
- What happens when the user selects "Copy" but clipboard access fails? The copy action fails silently; no error is shown to the user (standard clipboard behavior)
- What happens when the user activates a menu entry while the menu is navigated via keyboard (Enter on focused entry)? The corresponding action executes and the menu closes
- What happens when the user clicks a menu entry directly? The corresponding action executes and the menu closes
- What happens when the contextual menu action completes? The menu closes, focus returns to the text area, and the word remains highlighted at its current position
- What happens with any Chinese word and Google Translate? Always uses Traditional Chinese (zh-TW) as the source language — no variant detection needed

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The first contextual menu entry MUST be labeled "MOE Dictionary" with a book-search icon and MUST open the focused word's dictionary URL in the user's default web browser
- **FR-002**: The dictionary URL MUST follow the pattern `https://dict.revised.moe.edu.tw/search.jsp?md=1&word=[WORD]&qMd=0&qCol=1&sound=1#radio_sound_1` where [WORD] is the focused word's Chinese characters
- **FR-003**: The Chinese characters in the dictionary URL MUST be properly URL-encoded
- **FR-004**: The second contextual menu entry MUST be labeled "Google Translate" with a languages icon and MUST open Google Translate in the user's default web browser
- **FR-005**: The Google Translate URL MUST always use `sl=zh-TW` (Traditional Chinese) with `tl=en` as the target language
- **FR-006**: The third contextual menu entry MUST be labeled "Copy" with a copy icon and MUST copy the focused word's Chinese characters (not pinyin) to the system clipboard
- **FR-007**: All three menu entries MUST execute their action when selected via keyboard Enter key while the entry is focused
- **FR-008**: All three menu entries MUST execute their action when clicked with the mouse
- **FR-009**: After any action executes, the contextual menu MUST close
- **FR-010**: After the menu closes following an action, focus MUST remain on the text area and the word highlight MUST remain on the same word
- **FR-011**: The previous dummy entries ("Option 1", "Option 2") MUST be fully replaced — no dummy entries remain
- **FR-012**: All existing contextual menu behaviors (keyboard navigation, open/close triggers, mouse hover highlighting) MUST continue to work unchanged
- **FR-013**: Each menu entry MUST display its icon on the left side of the label text
- **FR-014**: The menu entry order MUST be: MOE Dictionary, Google Translate, Copy (top to bottom)

### Key Entities

- **Menu Action**: A functional behavior bound to a contextual menu entry. Each action receives the focused word's data and performs an operation (open URL, copy to clipboard, or translate).
- **Word**: A Chinese word unit rendered as a ruby element. The word's Chinese characters (not pinyin) are used as input for all menu actions.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Selecting "MOE Dictionary" on any word opens the correct dictionary URL in the default browser within one user action (single Enter press or single click)
- **SC-002**: Selecting "Google Translate" on any word opens Google Translate with `sl=zh-TW&tl=en`
- **SC-003**: Selecting "Copy" on any word places exactly the Chinese characters on the clipboard within one user action
- **SC-004**: The contextual menu closes after every action execution, every time, with no exceptions
- **SC-005**: All existing keyboard navigation and menu behaviors from feature 011 continue to function identically
- **SC-006**: All three menu entries display their respective icons

## Assumptions

- The dictionary URL base (`https://dict.revised.moe.edu.tw/search.jsp`) is stable and does not require authentication or API keys
- The Google Translate URL base (`https://translate.google.com/`) is stable and does not require authentication or API keys
- The Word entity's Chinese characters are available as a string property from the existing data model
- Opening URLs in the default browser is a standard capability of the application's runtime environment
- Clipboard write access is available in the application's runtime environment
- Menu entry labels are in English, consistent with the existing UI language
- The menu closes after action execution; no success/failure feedback is displayed to the user
- Google Translate always uses Traditional Chinese (zh-TW) as the source language — no variant detection logic needed

## Clarifications

### Session 2026-02-13

- Q: What should the "Look up" label indicate? → A: "MOE Dictionary" — indicates the dictionary name (Ministry of Education Revised Chinese Dictionary)
- Q: What icon should each menu entry have? → A: BookSearch for MOE Dictionary, Languages for Google Translate, Copy for Copy
- Q: What Google Translate URL pattern to use? → A: `https://translate.google.com/?sl=zh-TW&tl=en&text={encoded}` — always Traditional Chinese to English
