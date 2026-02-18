# Research: Pinyin Edit

**Feature**: 018-pinyin-edit
**Date**: 2026-02-18

## Decision 1: Persistence Approach

**Decision**: Mutate the in-memory `Text.segments` array in the frontend and call the existing `save_text` Tauri command with the full `Text` object.

**Rationale**: The existing architecture already saves the entire `Text` as a JSON blob in the `texts` table (single row, id=1). The `save_text` command accepts a full `Text` object. Adding a dedicated `update_word_pinyin` Rust command would create a second write path for the same data, violating KISS. The frontend already holds the full `Text` in React state (`useTextLoader`), so mutating one field and re-saving is trivial.

**Alternatives considered**:
- Dedicated Rust command `update_word_pinyin(segment_index, new_pinyin)`: More surgical but adds unnecessary Rust code when the frontend can achieve the same result with the existing command. Rejected per Principled Simplicity.
- Separate corrections table (word_id, corrected_pinyin): Would decouple corrections from the main segments. But the constitution says "Words are ephemeral: they MUST be fully regenerated when their parent Text is saved." A separate corrections table would require reconciliation logic on each regeneration — overcomplicating what should be a simple in-place mutation. Rejected.

## Decision 2: Inline Edit UI Approach

**Decision**: Replace the `<rt>` content in `RubyWord` with an `<input>` element when the word is in edit mode. The input is positioned in the annotation space above the characters.

**Rationale**: The spec says "an inline input field appears in place of the pinyin annotation" (FR-002). Rendering the input inside the `<rt>` element (or replacing it) keeps the edit visually anchored to the word. This is the most natural placement and avoids popups or modals that would add chrome and violate Content-First Design.

**Alternatives considered**:
- Floating popup input near the word: Would require absolute positioning logic and z-index management. Adds visual chrome. Rejected.
- Modal dialog: Heavy-handed for a single text field edit. Violates Content-First Design. Rejected.

## Decision 3: State Management for Edit Mode

**Decision**: Add an `editingWordIndex: number | null` state to `TextDisplay`. When non-null, the `RubyWord` at that index renders an input instead of static pinyin. No global state or context needed.

**Rationale**: Edit mode is local to the reading view and applies to exactly one word at a time. Local component state in `TextDisplay` is the simplest solution. The `useWordNavigation` hook doesn't need to know about edit mode — it just dispatches the menu action (entry index 3), and `TextDisplay` handles the rest.

**Alternatives considered**:
- State in `useWordNavigation` hook: Would couple navigation logic with edit logic. The hook's responsibility is keyboard/mouse navigation, not content editing. Rejected per single-responsibility.
- React Context: Overkill for a single boolean-like state that only two components need (`TextDisplay` and `RubyWord`). Rejected.

## Decision 4: Pinyin Toggle Interaction (FR-010)

**Decision**: When the user activates "Edit Pinyin" while pinyin is hidden, the system turns pinyin visibility on globally before showing the inline input.

**Rationale**: Per the clarification session (2026-02-18), Option C was chosen. This requires the `TextDisplay` to call back to `App` to toggle `showPinyin` to `true`. The `App` component already manages the `showPinyin` state and passes it as a prop. A new callback `onShowPinyin` (or reuse of the existing toggle) will be threaded down.

**Alternatives considered**:
- Only show "Edit Pinyin" when pinyin is visible: Simpler but reduces discoverability. Rejected by user choice.
- Temporarily show pinyin for just the edited word: Inconsistent UX — the user would see one word with pinyin and the rest without. Rejected.

## Decision 5: No New Rust Code

**Decision**: The entire feature is implemented in the frontend (TypeScript/React). No new Tauri commands, no Rust changes, no schema changes.

**Rationale**: The existing `save_text` command already accepts a full `Text` object and persists it. The frontend holds the `Text` in state, can mutate it, and re-save. The domain types (`Word`, `TextSegment`, `Text`) are already mirrored between Rust and TypeScript. Adding Rust code would be speculative complexity.

**Alternatives considered**: See Decision 1.
