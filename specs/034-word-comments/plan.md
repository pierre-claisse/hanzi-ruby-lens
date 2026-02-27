# Implementation Plan: Word Comments

**Branch**: `034-word-comments` | **Date**: 2026-02-27 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/034-word-comments/spec.md`

## Summary

Add per-Word comments to the reading view. Users right-click a Word and select "Comment" from the context menu to open a dialog for adding/editing/deleting a plain-text note (up to 5000 characters). Comments are stored inline in the Word struct (optional `comment` field in the segments JSON blob). A collapsible side panel on the right of the reading view lists all comments in document order. Words with comments show a subtle accent-colored dot indicator. Split and merge are blocked on Words with comments. No new dependencies or database schema changes required.

## Technical Context

**Language/Version**: TypeScript 5.9 + Rust (stable) via Tauri 2
**Primary Dependencies**: React 19, Tailwind CSS 3.4, rusqlite 0.38, serde/serde_json, lucide-react
**Storage**: SQLite (local, `%APPDATA%\com.hanzirubylens.app\hanzi-ruby-lens.db`) — no schema changes, comments stored inline in existing `segments TEXT` column
**Testing**: Vitest + @testing-library/react (frontend), cargo test (Rust) — all in Docker
**Target Platform**: Windows 11 (Tauri 2 desktop)
**Project Type**: Desktop app (Tauri: Rust backend + React frontend)
**Performance Goals**: Comment save <500ms, panel render <1s for up to 500 Words
**Constraints**: Offline-only, single-user, no new tables, backward-compatible JSON
**Scale/Scope**: Single user, personal library (~500 texts max), 1 new Tauri command, 2 new components, 1 modified command contract

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Content-First Design | PASS | Side panel sits beside (not over) text. Visual indicator is a subtle dot — minimal UI chrome. Dialog is modal only during editing. |
| II. Offline-First Data | PASS | Comments stored locally in SQLite. No network needed. Inline storage means no additional export/import logic. |
| III. DDD with CQRS | PASS | `update_word_comment` is a Command (write via `db_mut`). Reading comments is a Query (part of `load_text_by_id` which already returns segments). |
| IV. Principled Simplicity | PASS | Inline storage avoids a new table, JOIN queries, and migration complexity. One new command, two new components. No speculative features. |
| V. Test-First Imperative | PASS | Contract and integration tests planned. |
| VI. Docker-Only Execution | PASS | All tests run in Docker. No local toolchain changes. |
| Domain Language | PASS | Uses constitutional terms: Text (aggregate root), Word (segment). Comment is a new value attached to Word, not a new entity. |

**Post-Phase 1 Re-check**: All gates still pass. No deviations from constitution.

## Project Structure

### Documentation (this feature)

```text
specs/034-word-comments/
├── plan.md              # This file
├── spec.md              # Feature specification
├── research.md          # Phase 0: decisions and alternatives
├── data-model.md        # Phase 1: entity changes
├── quickstart.md        # Phase 1: setup guide
├── contracts/           # Phase 1: IPC command contracts
│   └── tauri-commands.md
├── checklists/
│   └── requirements.md  # Spec quality checklist
└── tasks.md             # Phase 2 output (via /speckit.tasks)
```

### Source Code (repository root)

```text
src-tauri/src/
├── commands.rs          # +1 command: update_word_comment
├── database.rs          # +1 function: update_word_comment_db; modified: split_segment_db, merge_segments_db
├── domain.rs            # Modified: Word struct gains optional comment field
└── lib.rs               # Register 1 new command

src/
├── types/domain.ts      # Modified: Word interface gains optional comment field
├── components/
│   ├── WordCommentDialog.tsx   # New: modal dialog for comment CRUD
│   ├── CommentsPanel.tsx       # New: collapsible side panel
│   ├── TextDisplay.tsx         # Modified: add "Comment" menu entry, comment checks on split/merge
│   ├── WordContextMenu.tsx     # Modified: add "comment" to MenuAction type
│   ├── RubyWord.tsx            # Modified: add visual indicator dot for commented Words
│   └── App.tsx                 # Modified: reading view layout for side panel, comment state
├── hooks/
│   └── useTextLoader.ts        # Modified: add updateComment function
```

**Structure Decision**: Follows the existing Tauri 2 desktop app structure. No new directories needed — new code integrates into existing files plus two new component files. Consistent with how all previous features were added.

## Complexity Tracking

No constitution violations. No complexity deviations needed.
