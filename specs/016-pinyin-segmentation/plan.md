# Implementation Plan: Pinyin Segmentation

**Branch**: `016-pinyin-segmentation` | **Date**: 2026-02-17 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/016-pinyin-segmentation/spec.md`

## Summary

Add automatic Chinese text segmentation with pinyin annotation via Claude Code CLI. When the user submits text, a new Rust Tauri command spawns `claude -p` with a segmentation prompt and structured JSON schema, parses the response into `TextSegment[]`, persists segments to SQLite, and returns the processed `Text` to the frontend. The "saved" view state is replaced by a "processing" state with loading indicator, error handling, and retry.

## Technical Context

**Language/Version**: Rust stable (backend, new command), TypeScript 5.5 (frontend)
**Primary Dependencies**: Tauri 2, React 18.3, tokio (for async process spawning — already included by Tauri)
**Storage**: SQLite via existing `save_text`/`load_text` commands (no schema changes)
**Testing**: vitest (frontend — 233 tests), cargo test (backend — 9 tests)
**Target Platform**: Windows desktop (Tauri + WebView2)
**Project Type**: Desktop app (Tauri: Rust backend + React frontend)
**Performance Goals**: Process 500 characters within 60 seconds (SC-001)
**Constraints**: Claude Code CLI must be installed on host machine, requires internet
**Scale/Scope**: Single user, single text, one processing request at a time

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Content-First Design | PASS | Processing UI is minimal: spinner + status text. No competing chrome. |
| II. Offline-First Data | PASS | Processed segments stored in SQLite. Reading view works offline after processing. |
| III. DDD with CQRS | PASS | `process_text` is a command. Uses existing Text aggregate root. Segments are domain entities. |
| IV. Principled Simplicity | PASS | No new abstractions. Single Rust command + prompt builder + response parser. |
| V. Test-First Imperative | PASS | Pure functions (prompt building, response parsing) testable in Docker. Frontend mocks CLI. |
| VI. Docker-Only Execution | JUSTIFIED | Claude CLI unavailable in Docker. Pure function tests run in Docker. E2E with real CLI is manual. |
| Domain Language: Text | PASS | Text aggregate root unchanged. Words regenerated on save per constitution. |
| Domain Language: Word | PASS | Word-level pinyin, concatenated, context-dependent — all per constitution. |
| Tech Stack: Claude CLI with Opus | PASS | Constitutionally mandated. Uses `claude -p --model opus`. |

**Justified violation (VI)**: Claude Code CLI requires Anthropic authentication and network access. Docker containers don't have this configured. Mitigation: all parseable logic is tested in Docker; only the process spawning is integration-tested on host.

## Project Structure

### Documentation (this feature)

```text
specs/016-pinyin-segmentation/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── tauri-commands.md
└── tasks.md
```

### Source Code (repository root)

```text
src-tauri/src/
├── commands.rs          # Add process_text command
├── processing.rs        # NEW: prompt builder + response parser + CLI executor
├── error.rs             # Add Processing error variant
├── lib.rs               # Register process_text command
├── domain.rs            # Unchanged
├── database.rs          # Unchanged
└── state.rs             # Unchanged

src/
├── hooks/
│   └── useTextLoader.ts # Add processText(), replace "saved" with "processing" in AppView
├── components/
│   ├── ProcessingState.tsx  # NEW: replaces SavedState.tsx — spinner, error, retry
│   ├── SavedState.tsx       # DELETED (replaced by ProcessingState)
│   ├── App.tsx              # Wire processing flow
│   └── ...                  # Unchanged
└── types/
    └── domain.ts            # Unchanged

tests/
├── integration/
│   ├── text-input-flow.test.tsx  # Update for processing flow
│   └── ...
```

**Structure Decision**: Existing Tauri project structure. New Rust module `processing.rs` encapsulates all Claude CLI interaction (prompt building, CLI spawning, response parsing). Frontend changes are minimal: new component + hook extension + wiring.

## Architecture

### Data Flow

```
User submits text
  → Frontend: handleSubmit(rawInput)
    → invoke("save_text", { rawInput, segments: [] })  // persist raw text first
    → setView("processing")
    → invoke("process_text", { rawInput })              // async, may take 10-60s
      → Rust: build_prompt(rawInput)
      → Rust: spawn "claude -p ..." with JSON schema
      → Rust: parse response → Vec<TextSegment>
      → Rust: save_text(conn, Text { rawInput, segments })
      → Return Text to frontend
    → setText(processedText)
    → setView("reading")

On error:
    → Show error message in ProcessingState
    → Retry button re-invokes process_text
    → Edit button returns to input view
```

### AppView State Machine Change

**Before (015)**: `"empty" | "input" | "saved" | "reading"`
**After (016)**: `"empty" | "input" | "processing" | "reading"`

```
deriveView(text):
  null           → "empty"
  segments > 0   → "reading"
  rawInput exists → "processing"   (was "saved")
```

### Claude CLI Invocation

```bash
claude -p \
  --model opus \
  --output-format json \
  --max-turns 1 \
  --no-session-persistence \
  --system-prompt "<segmentation prompt>" \
  --json-schema '<TextSegment[] schema>' \
  "<raw Chinese text>"
```

Flags:
- `--model opus`: Constitution mandates Opus
- `--output-format json`: Get structured JSON wrapper
- `--max-turns 1`: Single response, no agentic loop
- `--no-session-persistence`: No history pollution
- `--system-prompt`: Custom prompt replaces default (no tool use needed)
- `--json-schema`: Structured output validation

### Prompt Design

System prompt instructs Claude to segment Chinese text into an ordered array of TextSegments. The user message is the raw Chinese text. The JSON schema enforces the exact `TextSegment[]` structure matching the Rust domain model.

Key prompt rules:
- Group characters into natural Chinese words (lexical units)
- Pinyin at word level, not character level (context-dependent)
- Concatenated syllables (e.g., "xiànzài" not "xiàn zài")
- Tone marks, not tone numbers
- Both traditional and simplified supported
- Punctuation/non-Chinese as "plain" segments
- Every input character appears in exactly one segment

### Error Handling

| Error | Detection | User Message |
|-------|-----------|-------------|
| CLI not found | `Command` spawn fails with NotFound | "Claude CLI not found. Please install it." |
| CLI timeout (120s) | `tokio::time::timeout` expires | "Processing timed out. Please try again." |
| CLI exit non-zero | Non-zero exit code | "Processing failed. Please try again." |
| Malformed response | JSON parse error on stdout | "Processing returned invalid data. Please try again." |

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| Docker-Only (VI) for CLI integration test | Claude CLI requires auth + network on host | Mock scripts in Docker add complexity without testing real integration |
