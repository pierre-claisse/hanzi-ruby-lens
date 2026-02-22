# Implementation Plan: Paranoid Pinyin Pipeline

**Branch**: `023-paranoid-pinyin-pipeline` | **Date**: 2026-02-22 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/023-paranoid-pinyin-pipeline/spec.md`

## Summary

Replace the naive pinyin lookup (take first CC-CEDICT entry blindly) with a paranoid 4-tier validated pipeline. Add dual segmentation (precise vs HMM, pick best by dictionary coverage). Cross-validate every pinyin syllable against character-level heteronym data. Guarantee syllable-character count parity for 100% of output.

## Technical Context

**Language/Version**: Rust (stable), edition 2021
**Primary Dependencies**: jieba-rs 0.8, chinese_dictionary 2.1, pinyin 0.11 (add `heteronym` feature)
**Storage**: SQLite (unchanged — processing pipeline only)
**Testing**: cargo test (Docker-only per constitution)
**Target Platform**: Windows (Tauri 2 desktop)
**Project Type**: Single project (Tauri: Rust backend + React frontend)
**Performance Goals**: 500 chars in <5s, 5000 chars in <30s (relaxed from 2s/10s)
**Constraints**: Fully offline, no new crate dependencies, output format unchanged
**Scale/Scope**: Single file change (processing.rs) + Cargo.toml feature flag

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Content-First Design | PASS | No UI changes |
| II. Offline-First Data | PASS | All processing remains fully offline |
| III. DDD with CQRS | PASS | Domain model (Word, TextSegment, Text) unchanged |
| IV. Principled Simplicity | PASS | No new abstractions; refactors existing function |
| V. Test-First Imperative | PASS | New validation tests added, all run in Docker |
| VI. Docker-Only Execution | PASS | All tests/builds via Docker Compose |
| Domain: Word | PASS | Pinyin determined at Word level per constitution |
| Domain: Text | PASS | Text remains immutable aggregate root |
| Tech: Native Rust libraries | PASS | Uses same crates, adds one feature flag |

No violations. Gate passed.

## Project Structure

### Documentation (this feature)

```text
specs/023-paranoid-pinyin-pipeline/
├── plan.md              # This file
├── spec.md              # Feature specification
├── research.md          # Phase 0: research decisions
├── data-model.md        # Phase 1: entity documentation
├── quickstart.md        # Phase 1: test scenarios
├── contracts/           # Phase 1: API contracts
│   └── process-text.md  # IPC command contract (unchanged signature)
├── checklists/
│   └── requirements.md  # Spec quality checklist
└── tasks.md             # Phase 2: ordered implementation tasks
```

### Source Code (files to modify)

```text
src-tauri/
├── Cargo.toml           # Enable heteronym feature on pinyin crate
└── src/
    └── processing.rs    # Core change: paranoid pipeline implementation
```

**Structure Decision**: This feature modifies exactly 2 files. No new files, no structural changes. The processing.rs file is refactored in-place with new internal functions replacing `lookup_pinyin`.

## Architecture

### Dual Segmentation

```text
segment_chinese_run(jieba, run):
  words_precise = jieba.cut(run, false)     // no HMM — conservative
  words_hmm     = jieba.cut(run, true)      // HMM — discovers unknown words

  score_precise = count words in CC-CEDICT
  score_hmm     = count words in CC-CEDICT

  return precise if score >= hmm            // prefer conservative on tie
  return hmm otherwise
```

### 4-Tier Pinyin Lookup

```text
lookup_pinyin_paranoid(word):

  TIER 1: CC-CEDICT word-level
    for each entry in query_by_chinese(word):
      syllables = entry.pinyin_marks.split_whitespace()
      if syllables.len() != cjk_char_count: skip
      if any syllable not in char.to_pinyin_multi(): skip
      return syllables.join("").to_lowercase()  ← ACCEPT

  TIER 2: CC-CEDICT char-by-char
    for each char in word:
      entries = query_by_chinese(char_as_string)
      if valid single-syllable entry found: use it
      else: fall to TIER 3 for this char

  TIER 3: pinyin crate default
    char.to_pinyin().with_tone()

  TIER 4: identity
    return char itself (absolute last resort)
```

### Key API Details

- `pinyin::ToPinyinMulti` (heteronym feature): `char.to_pinyin_multi()` → `Option<PinyinMulti>`, iterable, each item has `.with_tone() -> &str`
- `chinese_dictionary::query_by_chinese(word)` → `Vec<&'static WordEntry>`, searches both simplified and traditional
- `WordEntry.pinyin_marks` → `String` with space-separated tone-marked syllables
