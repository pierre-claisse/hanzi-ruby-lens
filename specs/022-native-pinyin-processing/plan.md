# Implementation Plan: Native Pinyin Processing

**Branch**: `023-native-pinyin-processing` | **Date**: 2026-02-22 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/023-native-pinyin-processing/spec.md`

## Summary

Replace the Claude CLI (LLM) text processing pipeline with native Rust libraries for Chinese word segmentation and pinyin annotation. The processing command (`process_text`) will use jieba-rs for segmentation, chinese_dictionary (CC-CEDICT) for word-level pinyin lookup with polyphonic disambiguation, and the pinyin crate as a character-level fallback. The domain model, IPC contract, database schema, and frontend remain unchanged.

## Technical Context

**Language/Version**: Rust (stable), TypeScript 5.9
**Primary Dependencies**: jieba-rs 0.8, chinese_dictionary 2.1, pinyin 0.11 (new); Tauri 2, rusqlite 0.38 (existing)
**Storage**: SQLite (unchanged)
**Testing**: cargo test (Rust), Vitest (frontend) — all inside Docker
**Target Platform**: Windows (Tauri 2 desktop)
**Project Type**: Desktop app (Tauri: Rust backend + React frontend)
**Performance Goals**: <100ms for 500 chars, <1s for 5,000 chars, <2s for 10,000 chars
**Constraints**: Fully offline, no network calls, deterministic output
**Scale/Scope**: Single processing command rewrite; 3 Rust files modified, 0 frontend files modified

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Content-First Design | PASS | No UI changes. Reading experience identical. |
| II. Offline-First Data | PASS | Improves compliance — processing now fully offline (was network-dependent). |
| III. DDD with CQRS | PASS | Domain model unchanged. Processing is infrastructure, not domain logic. |
| IV. Principled Simplicity | PASS | Removes complex LLM integration (subprocess, timeout, retry, envelope parsing) in favor of direct library calls. |
| V. Test-First Imperative | PASS | Existing test patterns apply. New unit tests for native pipeline. |
| VI. Docker-Only Execution | PASS | All testing/building remains in Docker. |
| Domain Language: Text | PASS | Unchanged. |
| Domain Language: Word | **AMENDMENT NEEDED** | Constitution says "Words are produced by LLM analysis." Must amend to "Words are produced by text processing at creation time." |
| Technical Stack: LLM integration | **AMENDMENT NEEDED** | Constitution mandates "Claude CLI with the latest Sonnet model." This feature removes that dependency. Must amend to remove or replace with native library reference. |

**Gate result**: PASS with 2 deferred constitution amendments. The amendments are non-blocking for planning — they change descriptive text, not architectural constraints. Amendment should be executed via `/speckit.constitution` before or during implementation.

### Post-Phase 1 Re-check

All design decisions comply with constitution principles. The two amendment items remain as noted above.

## Project Structure

### Documentation (this feature)

```text
specs/023-native-pinyin-processing/
├── plan.md              # This file
├── spec.md              # Feature specification
├── research.md          # Phase 0: library research and decisions
├── data-model.md        # Phase 1: data model (unchanged entities + new pipeline)
├── quickstart.md        # Phase 1: implementation guide
├── contracts/           # Phase 1: IPC contract changes
│   └── process-text.md  # process_text command contract
├── checklists/          # Spec quality checklist
│   └── requirements.md
└── tasks.md             # Phase 2 output (/speckit.tasks)
```

### Source Code (repository root)

```text
src-tauri/src/
├── commands.rs          # MODIFY: simplify process_text (remove async CLI, add native call)
├── processing.rs        # REWRITE: native segmentation + pinyin pipeline
├── domain.rs            # UNCHANGED
├── database.rs          # UNCHANGED
├── error.rs             # UNCHANGED
├── state.rs             # UNCHANGED
├── lib.rs               # UNCHANGED (may remove tokio if no longer needed)
└── main.rs              # UNCHANGED

src-tauri/
└── Cargo.toml           # MODIFY: add jieba-rs, chinese_dictionary, pinyin; evaluate tokio removal

src/                     # UNCHANGED (all frontend files)
tests/                   # UNCHANGED (existing tests remain valid)
```

**Structure Decision**: Existing Tauri desktop app structure. Changes scoped to `src-tauri/src/processing.rs` (rewrite), `src-tauri/src/commands.rs` (simplify), and `src-tauri/Cargo.toml` (new deps). No new files or directories in source code.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| Constitution amendment (LLM clause) | LLM approach is dysfunctional for long texts. Native libraries solve the core problem. | Keeping LLM as fallback adds complexity for no benefit — the user explicitly requested full removal. |
