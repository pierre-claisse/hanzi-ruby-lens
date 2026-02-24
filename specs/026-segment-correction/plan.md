# Implementation Plan: Segment Correction

**Branch**: `026-segment-correction` | **Date**: 2026-02-24 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/026-segment-correction/spec.md`

## Summary

Add word segmentation correction (split and merge) to the reading view context menu. When a user right-clicks a word, the menu dynamically shows split options (one per internal character boundary) and merge options (with adjacent word neighbors). Split divides a word at a character boundary and partitions its pinyin into matching syllable groups. Merge concatenates two adjacent words and their pinyin. All corrections persist immediately to the SQLite database. The feature extends the existing `update_pinyin` pattern with two new Tauri IPC commands (`split_segment`, `merge_segments`) and a Rust pinyin syllable tokenizer for accurate splitting.

## Technical Context

**Language/Version**: Rust (stable) + TypeScript 5.9
**Primary Dependencies**: Tauri 2, React 19, jieba-rs, chinese_dictionary, pinyin crate, rusqlite 0.38
**Storage**: SQLite — segments stored as JSON blob in `texts.segments` column
**Testing**: Vitest + @testing-library/react (frontend), cargo test (Rust)
**Target Platform**: Windows (Tauri desktop)
**Project Type**: Desktop app (Tauri: Rust backend + React frontend)
**Performance Goals**: Segmentation correction completes in under 5 seconds (SC-001); typically <100ms for a single split/merge operation
**Constraints**: Offline-capable, all data local, no network for previously processed content
**Scale/Scope**: Single user, texts up to ~10k characters, segments stored as JSON array

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Content-First Design | PASS | No new UI chrome — options integrate into existing context menu |
| II. Offline-First Data | PASS | All operations are local SQLite mutations |
| III. DDD with CQRS | PASS | Split/merge are commands (writes); reading view is a query. Text remains the aggregate root |
| IV. Principled Simplicity | PASS | No new abstractions — extends existing `update_segments` pattern |
| V. Test-First Imperative | PASS | Rust unit tests for split/merge logic; frontend contract/integration tests |
| VI. Docker-Only Execution | PASS | All tests run in Docker |
| Domain: Text immutability | PASS | Raw Chinese characters unchanged; only segment boundaries and pinyin grouping mutate |
| Domain: Word 1–12 chars | PASS | Split validated (result ≥1 char each); merge validated (result ≤12 chars) |
| Domain: Explicit persistence | PASS | Each split/merge is an explicit user action that persists immediately |

No violations. No Complexity Tracking needed.

## Project Structure

### Documentation (this feature)

```text
specs/026-segment-correction/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   └── ipc-commands.md  # Tauri IPC command contracts
└── tasks.md             # Phase 2 output (/speckit.tasks)
```

### Source Code (repository root)

```text
src-tauri/src/
├── commands.rs          # +split_segment, +merge_segments commands
├── database.rs          # +split_segment_db, +merge_segments_db functions
├── processing.rs        # +tokenize_pinyin syllable parser (public)
├── domain.rs            # unchanged
├── lib.rs               # +register new commands
├── error.rs             # unchanged
└── state.rs             # unchanged

src/
├── components/
│   ├── WordContextMenu.tsx  # dynamic menu entries (split/merge)
│   └── TextDisplay.tsx      # +split/merge action dispatch, +segment context
├── hooks/
│   ├── useTextLoader.ts     # +splitSegment, +mergeSegments IPC calls
│   └── useWordNavigation.ts # +updated menu entry count
├── types/domain.ts          # unchanged
└── App.tsx                  # +pass split/merge callbacks

tests/
├── contract/               # +split/merge IPC contract tests
├── integration/             # +split→read, merge→read flow tests
└── unit/                    # +pinyin tokenizer unit tests (Rust)
```

**Structure Decision**: Existing Tauri desktop app structure. No new directories needed — all changes are modifications to existing files plus one new contracts doc.
