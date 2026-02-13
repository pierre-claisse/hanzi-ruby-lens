# Research: Text Keyboard Navigation

**Feature**: 011-text-keyboard-nav
**Date**: 2026-02-13

## Status: No Unknowns

All technical decisions can be resolved from existing codebase patterns and standard web platform APIs. No external research needed.

## Design Decisions

### 1. Tab Order: DOM Reordering

**Decision**: Move TextDisplay wrapper before TitleBar in App.tsx DOM order.

**Rationale**: TitleBar uses `fixed top-0 left-0 right-0 ... z-50` positioning, so its visual position is independent of DOM order. By placing TextDisplay first in the DOM, it naturally receives focus first when the user presses Tab. This avoids positive `tabIndex` values, which are a well-known accessibility anti-pattern (they create unpredictable focus sequences when mixed with natural tab order).

**Alternatives considered**:
- `tabIndex={1}` on TextDisplay → Rejected: positive tabIndex is an anti-pattern, breaks natural focus flow for screen readers.
- CSS `order` property → Rejected: only works in flex/grid containers, would require wrapping both components in a flex parent and adds unnecessary complexity.

### 2. Controlled Highlight vs CSS Hover

**Decision**: When TextDisplay is focused, replace CSS `hover:bg-accent/24` with a controlled `isHighlighted` prop on RubyWord. When TextDisplay is not focused, keep existing CSS hover behavior.

**Rationale**: CSS hover and state-controlled highlight would conflict visually — if word 3 is tracked (state highlight) but mouse is on word 7 (CSS hover), both words appear highlighted simultaneously until the state update propagates. By disabling CSS hover in focus mode and relying solely on the controlled prop, exactly one word is highlighted at any time.

**Alternatives considered**:
- Keep CSS hover always, add state highlight on top → Rejected: causes brief double-highlight during state updates (visual glitch).
- Use only CSS hover + `:focus-within` → Rejected: CSS cannot express "highlight word at index N" — arrow key navigation requires state tracking.

### 3. useWordNavigation Hook

**Decision**: Extract navigation state into a custom hook (`useWordNavigation`) rather than managing it inline in TextDisplay.

**Rationale**: The hook manages 4 pieces of state (trackedIndex, isFocused, menuOpen, menuFocusedIndex) and handles keyboard events (7+ key combinations), mouse events, and menu lifecycle. Extracting it keeps TextDisplay focused on rendering and makes the navigation logic independently testable.

**Alternatives considered**:
- Inline state in TextDisplay → Rejected: component would exceed 150 lines mixing render logic with complex keyboard/mouse event handling.
- Separate context provider → Rejected: YAGNI. Only TextDisplay and its children need this state; no cross-component sharing required.

### 4. Context Menu: React Component (not native)

**Decision**: Render a custom React `WordContextMenu` component positioned near the highlighted word. The global `contextmenu` event listener continues suppressing the native browser menu.

**Rationale**: The native browser context menu cannot be customized (only suppressed). The existing global suppression from feature 010 remains active. Our custom menu is pure React state — `onContextMenu` handler on words sets `menuOpen=true`, and the menu renders as an absolutely-positioned element near the word.

**Alternatives considered**:
- Tauri native context menu API → Rejected: Tauri's menu API is for app-level menus (tray, system menu), not inline word-level menus. Also adds Rust-side changes unnecessarily.
- Re-enable native context menu selectively → Rejected: native menus cannot contain custom entries ("Option 1", "Option 2").

### 5. Word Index Tracking (not Word identity)

**Decision**: Track the highlighted word by its index in the filtered word-only segments array, not by any Word identity.

**Rationale**: Words in the sample text have no unique ID — they are plain `{ characters, pinyin }` objects. Duplicate words exist (e.g., two instances of 很). Index-based tracking is simple, correct, and aligns with Left/Right arrow sequential navigation. The word list is static within a render cycle.

**Alternatives considered**:
- Add unique IDs to Word objects → Rejected: changes the domain type (`domain.ts`) for a UI-only concern, violates constitutional domain language ("Characters are the string content of a Word, nothing more").
- Use segment index (including plain text) → Rejected: plain text segments are not navigable, so the index must skip them. A filtered "word-only" index is cleaner.
