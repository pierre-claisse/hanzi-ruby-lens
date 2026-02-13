# Implementation Plan: Context Menu Actions

**Branch**: `012-context-menu-actions` | **Date**: 2026-02-13 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/012-context-menu-actions/spec.md`

## Summary

Replace the two dummy contextual menu entries ("Option 1", "Option 2") with three functional actions: "MOE Dictionary" (with BookSearch icon) opens the focused word in the MOE Revised Chinese Dictionary via the default browser, "Google Translate" (with Languages icon) opens Google Translate with Traditional Chinese (zh-TW) to English, and "Copy" (with Copy icon) copies the word's Chinese characters to the system clipboard. All actions close the menu after execution. Requires two Tauri plugins: `opener` (for browser launch) and `clipboard-manager` (for clipboard write).

## Technical Context

**Language/Version**: TypeScript 5.5 (frontend), Rust stable (Tauri backend — no changes)
**Primary Dependencies**: React 18.3, Tailwind CSS 3.4, lucide-react 0.563.0, @tauri-apps/api 2.0, @tauri-apps/plugin-opener (new), @tauri-apps/plugin-clipboard-manager (new)
**Storage**: N/A (no persistence for this feature)
**Testing**: Vitest + @testing-library/react (happy-dom), Tauri plugin APIs mocked in tests
**Target Platform**: Windows (Tauri 2 desktop)
**Project Type**: Single project (Tauri + React frontend)
**Performance Goals**: N/A (single-shot user actions)
**Constraints**: Plugin calls are async; menu must close immediately after action dispatch
**Scale/Scope**: 3 menu entries, 2 Tauri plugins, modifications to 4-5 existing files

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Content-First Design | PASS | Menu actions serve the text; icons are functional indicators, not decorative chrome |
| II. Offline-First Data | PASS | Dictionary lookup and Google Translate require internet but are external reference tools, not stored data. Copy is fully offline. No violation — principle targets generated/processed content. |
| III. DDD with CQRS | PASS | Menu actions are UI-layer operations (open URL, copy text). Chinese variant detection is a pure utility function. No domain logic changes. |
| IV. Principled Simplicity | PASS | Two plugins added, both justified by concrete requirements. Google Translate always uses zh-TW — no variant detection needed. |
| V. Test-First Imperative | PASS | Plugin APIs mocked; URL construction and character extraction tested as pure functions. Tests run in Docker. |
| VI. Docker-Only Execution | PASS | npm packages installed in Docker container. Rust crates resolved during Docker build. |
| Tech Stack (Tauri 2 + React + TS) | PASS | No deviation from constitutional tech stack. |

**Gate result**: PASS — no violations.

## Project Structure

### Documentation (this feature)

```text
specs/012-context-menu-actions/
├── plan.md              # This file
├── research.md          # Phase 0 output (Tauri plugin + variant detection decisions)
├── quickstart.md        # Phase 1 output (integration scenarios)
├── checklists/
│   └── requirements.md  # Spec quality checklist
└── tasks.md             # Phase 2 output (/speckit.tasks)
```

### Source Code (repository root)

```text
src/
├── components/
│   ├── WordContextMenu.tsx    # Modified: icons (BookSearch, Languages, Copy), 3 entries, new labels
│   └── TextDisplay.tsx        # Modified: Google Translate action, import variant detection
├── hooks/
│   └── useWordNavigation.ts   # Modified: MENU_ENTRY_COUNT = 3
├── data/
│   └── sample-text.ts         # Unchanged
└── types/
    └── domain.ts              # Unchanged (Word.characters already available)

src-tauri/
├── Cargo.toml                 # Already configured: tauri-plugin-opener, tauri-plugin-clipboard-manager
├── src/
│   └── lib.rs                 # Already configured: opener and clipboard-manager plugins
└── tauri.conf.json            # Already configured: opener and clipboard-manager permissions

tests/
├── unit/
│   └── useWordNavigation.test.ts     # Modified: test 3-entry menu wrapping
└── integration/
    └── text-keyboard-nav.test.tsx    # Modified: test 3 entries, Google Translate with zh-TW
```

**Structure Decision**: No new files needed. All changes are modifications to existing files. Tauri plugin setup already complete from previous implementation.

## Complexity Tracking

No constitution violations — no entries needed.
