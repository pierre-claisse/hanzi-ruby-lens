# Research: Google Translate Button

**Feature Branch**: `019-translate-button`
**Date**: 2026-02-20

## R1: Google Translate URL Interface

**Decision**: Use the URL parameter interface `https://translate.google.com/?sl=zh-TW&tl=en&text={encoded}`.

**Rationale**: This is the same pattern already used in the word-level context menu (`TextDisplay.tsx` line 121). No API key or authentication required. Works by opening the system browser via `openUrl` from `@tauri-apps/plugin-opener`.

**Alternatives considered**:
- Google Translate API (v3): Rejected — requires API key, billing, and adds complexity for a feature that simply needs to open a browser tab.
- Clipboard + manual paste: Rejected — worse UX, requires two user actions instead of one.

## R2: URL Length Limit

**Decision**: Cap the URL-encoded text parameter at 5,000 characters. Truncate raw text from the end until the encoded form fits.

**Rationale**: While modern browsers support URLs up to ~2MB, Google Translate's web interface has practical input limits (~5,000 characters in the text field). The URL parameter approach shares this limit. Truncation from the end preserves the beginning of the text (title, opening sentences), which is the most useful context for translation.

**Alternatives considered**:
- No limit: Rejected — extremely long URLs may fail silently or be rejected by Google's servers.
- Hard character count on raw text: Rejected — URL encoding of Chinese characters (3 bytes UTF-8 → 9 chars `%XX%XX%XX`) makes raw character count unreliable as a proxy for URL length.

## R3: Component Pattern

**Decision**: Create a standalone `TranslateButton.tsx` component following the `ZoomInButton.tsx` pattern.

**Rationale**: The `ZoomInButton` is the closest existing precedent — a simple button with an icon, disabled state, and tooltip. Using the same pattern ensures visual and behavioral consistency. The `Languages` icon from lucide-react is already imported in `WordContextMenu.tsx`, confirming it's available in the project.

**Alternatives considered**:
- Inline button directly in TitleBar: Rejected — the edit button is inline in TitleBar, but all other buttons are separate components. A dedicated component is cleaner and testable.
- Shared "IconButton" abstraction: Rejected — YAGNI. The button count doesn't justify an abstraction. Copy the pattern.

## R4: Button Visibility and Enabled State

**Decision**: Always visible in the title bar. Enabled when `Text.rawInput` is non-empty. Disabled and grayed out otherwise.

**Rationale**: Per user clarification, the button does not depend on pinyin segmentation. It depends solely on raw text existence. This means it works from input view, processing view, and reading view — any state where the user has entered text. The disabled styling (`disabled:opacity-50 disabled:cursor-not-allowed`) matches the zoom buttons exactly.

**Alternatives considered**:
- Hidden when no text: Rejected — user explicitly requested visible-but-disabled pattern matching zoom buttons.
- Conditionally shown like edit button (`showEdit` prop): Rejected — edit button is hidden in empty/input views, but translate button should always be visible per spec.

## R5: Passing Raw Text to TitleBar

**Decision**: Add a `rawInput` prop (type `string`, default `""`) to `TitleBarProps`. `App.tsx` passes `text?.rawInput ?? ""`.

**Rationale**: This is the simplest change. `App.tsx` already has access to `text` from `useTextLoader()`. The `rawInput` prop serves dual purpose: drives the enabled/disabled state and provides the text for URL construction. No new hooks or state management needed.

**Alternatives considered**:
- Pass entire `Text` object to TitleBar: Rejected — TitleBar doesn't need segments, only rawInput. Minimal surface area.
- New hook `useTranslate()`: Rejected — YAGNI. The logic is trivial (URL construction + openUrl call). A hook adds unnecessary indirection for a stateless action.
