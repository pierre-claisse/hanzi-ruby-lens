# Implementation Plan: Multi-Text Library

**Branch**: `024-multi-text-library` | **Date**: 2026-02-23 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/024-multi-text-library/spec.md`

## Summary

Transform the application from a single-text singleton model to a multi-text library. A new library screen becomes the entry point, listing all texts by title and creation date. Users add texts (title + Chinese content), which are atomically processed and saved. Texts are immutable after creation (no edit/regenerate button); only pinyin corrections remain possible. Texts can be deleted via right-click context menu. Navigation flows between library and reading screens via click-to-open and back button.

## Technical Context

**Language/Version**: TypeScript 5.9 (frontend), Rust stable (backend)
**Primary Dependencies**: React 19, Tauri 2, jieba-rs, chinese_dictionary, pinyin, rusqlite 0.38 (bundled)
**Storage**: SQLite — `%APPDATA%\com.hanzirubylens.app\hanzi-ruby-lens.db`
**Testing**: Vitest + @testing-library/react (frontend), cargo test (Rust) — all in Docker
**Target Platform**: Windows 11 (Tauri desktop)
**Project Type**: Desktop app (Tauri: Rust backend + React frontend)
**Performance Goals**: Library loads within 1s, view transitions within 300ms (SC-002, SC-003)
**Constraints**: Offline-capable, single SQLite connection (Mutex), no network for processed content
**Scale/Scope**: Single user, unbounded number of texts, ~1500 chars max per text

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Content-First Design | PASS | Library uses minimal chrome (title + date only). Delete is hidden in context menu. Reading screen focuses on text. |
| II. Offline-First Data | PASS | All data in local SQLite. No network needed for browsing, reading, or deleting. |
| III. DDD with CQRS | PASS | Text remains aggregate root. Commands: create_text, delete_text, update_pinyin. Queries: list_texts, load_text. Clear separation. |
| IV. Principled Simplicity | PASS | No speculative features. TextPreview is a lightweight projection, not a separate aggregate. |
| V. Test-First Imperative | PASS | Contract, integration, and unit tests planned for all layers. Docker execution. |
| VI. Docker-Only Execution | PASS | All testing and building in Docker containers. |
| Domain Language: Text | PASS | Text has id, title, created_at, raw_input, segments. Immutable after creation. Collection with no limit. |
| Domain Language: Word | PASS | Word unchanged. Pinyin correctable, corrections persist permanently. |
| Technology Stack | PASS | Tauri 2, React+TS, Tailwind, SQLite via Rust backend. All constitutional. |

**Gate result**: ALL PASS — proceeding to Phase 0.

**Post-Phase 1 re-check**: ALL PASS. Data model uses Text as sole aggregate root with TextPreview as a read projection. IPC contracts cleanly separate 3 commands (create_text, update_pinyin, delete_text) and 2 queries (list_texts, load_text). No new dependencies beyond `chrono` (standard Rust datetime). No constitution violations introduced.

## Project Structure

### Documentation (this feature)

```text
specs/024-multi-text-library/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
└── tasks.md             # Phase 2 output (/speckit.tasks)
```

### Source Code (repository root)

```text
src/
├── App.tsx                    # View state machine: library → input → processing → reading
├── main.tsx                   # React entry point (unchanged)
├── index.css                  # Global styles (unchanged)
├── components/
│   ├── LibraryScreen.tsx      # NEW — library grid with add button, empty state
│   ├── TextPreviewCard.tsx    # NEW — individual text card (title + date, right-click delete)
│   ├── TextDisplay.tsx        # MODIFIED — show title as header
│   ├── TextInputView.tsx      # MODIFIED — add title input field
│   ├── TitleBar.tsx           # MODIFIED — remove Edit button, add Back button
│   ├── ProcessingState.tsx    # KEPT — used during text creation
│   ├── RubyWord.tsx           # UNCHANGED
│   ├── WordContextMenu.tsx    # UNCHANGED
│   ├── EmptyState.tsx         # REMOVED — replaced by LibraryScreen empty state
│   └── ...                    # Other components unchanged
├── hooks/
│   ├── useTextLoader.ts       # REWRITTEN — multi-text state management
│   └── ...                    # Other hooks unchanged
├── types/
│   └── domain.ts              # MODIFIED — add id, title, createdAt to Text; add TextPreview
└── data/
    └── palettes.ts            # UNCHANGED

src-tauri/src/
├── lib.rs                     # MODIFIED — register new commands
├── commands.rs                # REWRITTEN — new IPC command surface
├── database.rs                # REWRITTEN — new schema, multi-row operations
├── processing.rs              # UNCHANGED — stateless pipeline
├── domain.rs                  # MODIFIED — add id, title, created_at; add TextPreview
├── error.rs                   # UNCHANGED
├── state.rs                   # UNCHANGED
└── main.rs                    # UNCHANGED

tests/
├── contract/                  # MODIFIED — new IPC command contracts
├── integration/               # MODIFIED — library → input → reading flows
└── unit/                      # MODIFIED — new view derivation logic
```

**Structure Decision**: Existing Tauri hybrid structure (React frontend + Rust backend) is preserved. Two new components are added to `src/components/`. No new directories needed.

## Complexity Tracking

> No constitution violations to justify. All gates pass.
