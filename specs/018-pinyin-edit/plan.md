# Implementation Plan: Pinyin Edit

**Branch**: `018-pinyin-edit` | **Date**: 2026-02-18 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `specs/018-pinyin-edit/spec.md`

## Summary

Allow users to correct pinyin annotations on any Word in the reading view. A 4th context menu entry ("Edit Pinyin") triggers an inline input field replacing the `<rt>` annotation. The user edits the pinyin, confirms with Enter (or cancels with Escape / click-outside), and the correction is persisted to SQLite via the existing `save_text` command. No new Rust commands or schema changes are needed — the frontend mutates the in-memory `Text.segments` array and saves the full object.

## Technical Context

**Language/Version**: Rust stable (backend, no changes), TypeScript 5.5 (frontend)
**Primary Dependencies**: Tauri 2, React 18.3, Tailwind CSS 3.4, lucide-react 0.563
**Storage**: SQLite (existing `texts` table, no schema changes — segments stored as JSON blob)
**Testing**: Vitest + @testing-library/react (frontend), cargo test (backend, no new tests needed)
**Target Platform**: Windows desktop (Tauri + WebView2)
**Project Type**: Tauri desktop app (Rust backend + React frontend)
**Performance Goals**: Pinyin edit flow completable in <10 seconds (SC-001)
**Constraints**: Offline-capable, single-document app (one Text with id=1)
**Scale/Scope**: Single user, single document, ~100-500 Words per Text

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Content-First Design | PASS | Inline editing keeps focus on the text. No new chrome or panels. Input appears in the annotation position. |
| II. Offline-First Data | PASS | Correction persisted to local SQLite. No network needed. |
| III. DDD with CQRS | PASS | Editing pinyin is a command (write). Constitution explicitly mandates: "A Word's pinyin MUST be individually correctable by the user" and "A Word's corrected pinyin MUST autosave." |
| IV. Principled Simplicity | PASS | Reuses existing `save_text` command. No new Rust code. No abstractions beyond what's needed. |
| V. Test-First Imperative | PASS | Frontend tests for edit flow. Backend unchanged — existing tests cover persistence. |
| VI. Docker-Only Execution | PASS | Tests run in Docker via existing `npm run test` pipeline. |
| Domain Language | PASS | Uses "Text" and "Word" consistently. Pinyin is a Word attribute. |

No violations. No Complexity Tracking needed.

## Project Structure

### Documentation (this feature)

```text
specs/018-pinyin-edit/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
└── tasks.md             # Phase 2 output (/speckit.tasks)
```

### Source Code (files touched)

```text
src/
├── components/
│   ├── WordContextMenu.tsx   # Add "Edit Pinyin" entry (4th item)
│   ├── RubyWord.tsx          # Inline input mode for pinyin editing
│   └── TextDisplay.tsx       # Edit state management, action dispatch
├── hooks/
│   ├── useWordNavigation.ts  # Bump MENU_ENTRY_COUNT to 4
│   └── useTextLoader.ts      # Expose updatePinyin callback
└── App.tsx                   # Thread updatePinyin from hook to TextDisplay

tests/
└── components/
    └── RubyWord.test.tsx     # Test inline edit render, confirm, cancel
```

**Structure Decision**: Existing Tauri desktop structure. Frontend-only changes. No new files except one test file. All modifications to existing components and hooks.
