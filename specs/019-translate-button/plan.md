# Implementation Plan: Google Translate Button

**Branch**: `019-translate-button` | **Date**: 2026-02-20 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/019-translate-button/spec.md`

## Summary

Add a translate button to the title bar (between the edit button and the pinyin toggle) that opens the full raw text in Google Translate (zh-TW → en) in the system browser. The button is always visible, enabled when `Text.rawInput` is non-empty, and disabled/grayed when empty. Uses the existing `Languages` icon from lucide-react and the `openUrl` function from `@tauri-apps/plugin-opener`. URL-encoded text is truncated at 5,000 characters.

## Technical Context

**Language/Version**: TypeScript 5.5 (frontend), Rust stable (Tauri backend — no changes)
**Primary Dependencies**: React 18.3, Tailwind CSS 3.4, lucide-react 0.563 (`Languages` icon), @tauri-apps/plugin-opener 2.0
**Storage**: N/A (no persistence changes)
**Testing**: Vitest + @testing-library/react (frontend only, no Rust changes)
**Target Platform**: Windows desktop (Tauri 2)
**Project Type**: Single (Tauri hybrid — frontend-only change)
**Performance Goals**: N/A (trivial URL construction + browser open)
**Constraints**: Google Translate URL text parameter capped at 5,000 URL-encoded characters
**Scale/Scope**: One button, one component, one prop addition to TitleBar

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Content-First Design | PASS | Button uses minimal chrome (same styling as edit button), subtle border, doesn't compete with text |
| II. Offline-First Data | PASS | No data persistence changes. Button opens external URL — same pattern as existing context menu. Translation requires network, but this is a new action, not re-reading previously processed content |
| III. DDD with CQRS | PASS | No domain model changes. Reads `Text.rawInput` (query). No commands. |
| IV. Principled Simplicity | PASS | Single component, no abstractions, reuses existing icon and openUrl pattern |
| V. Test-First Imperative | PASS | Tests written before implementation, run in Docker |
| VI. Docker-Only Execution | PASS | All tests run via `npm test` in Docker |

**Note on Principle II (Offline-First)**: The translate button opens Google Translate in the browser, which requires network. This is acceptable because (a) the existing word-level "Google Translate" context menu entry already establishes this pattern, and (b) translation is a new action, not re-reading of previously processed content. The SHOULD rule ("No feature SHOULD require network connectivity for previously processed content") is not violated — translation is not "previously processed content."

## Project Structure

### Documentation (this feature)

```text
specs/019-translate-button/
├── plan.md              # This file
├── spec.md              # Feature specification
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
└── checklists/
    └── requirements.md  # Spec quality checklist
```

### Source Code (repository root)

```text
src/
├── components/
│   ├── TitleBar.tsx              # MODIFIED — add TranslateButton between edit and PinyinToggle
│   └── TranslateButton.tsx       # NEW — translate button component
└── App.tsx                       # MODIFIED — pass rawInput to TitleBar

tests/
└── unit/
    └── TranslateButton.test.tsx  # NEW — component tests
```

**Structure Decision**: Frontend-only change. One new component (`TranslateButton.tsx`) following the exact same pattern as `ZoomInButton.tsx`. TitleBar receives a new `rawInput` prop to determine enabled/disabled state and build the URL. No Rust backend changes.

## Architecture

### Data Flow

```
App.tsx (text?.rawInput)
  → TitleBar (rawInput prop)
    → TranslateButton (rawInput prop)
      → onClick: build Google Translate URL from rawInput
      → openUrl(url) — opens system browser
```

### TranslateButton Component

Follows the `ZoomInButton` pattern exactly:
- Props: `rawInput: string` (to build URL and determine disabled state)
- Disabled when: `rawInput` is empty string
- Styling: Same classes as ZoomInButton with `disabled:opacity-50 disabled:cursor-not-allowed`
- Icon: `Languages` from lucide-react (same as WordContextMenu)
- Tooltip: `aria-label="Translate text"` + `title="Google Translate"`
- onClick: Constructs URL `https://translate.google.com/?sl=zh-TW&tl=en&text=${encodeURIComponent(rawInput)}`, truncates encoded text to 5,000 chars, calls `openUrl(url)`

### URL Truncation Strategy

The `encodeURIComponent(rawInput)` result is checked. If it exceeds 5,000 characters, the raw text is progressively shortened (character by character from the end) until the encoded form fits. This ensures no broken multi-byte sequences in the URL.

### TitleBar Changes

- New prop: `rawInput?: string` (defaults to `""`)
- TranslateButton inserted between the edit button and PinyinToggle
- Always rendered (not conditional like edit button)
- Disabled state driven by `rawInput === ""`

### App.tsx Changes

- Pass `rawInput={text?.rawInput ?? ""}` to TitleBar
