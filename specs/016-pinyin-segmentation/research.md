# Research: Pinyin Segmentation

## Decision 1: CLI Invocation Method

**Decision**: Use `claude -p` (print mode) with `--output-format json` and `--json-schema` for structured output.

**Rationale**: The Claude Code CLI's print mode (`-p`) provides non-interactive, single-turn execution that returns structured JSON. Combined with `--json-schema`, the CLI validates the response against the TextSegment[] schema before returning, guaranteeing parseable output. The `--max-turns 1` flag prevents agentic loops. `--no-session-persistence` avoids polluting session history.

**Alternatives considered**:
- **Anthropic HTTP API** (`api.anthropic.com`): Requires separate API billing (per-token). Pierre uses Max x5 plan which covers Claude Code CLI but not the API. Also requires API key management UI.
- **Claude SDK from Rust** (Anthropic Rust SDK): No official Rust SDK. Would need HTTP client + API key, same billing issue.
- **Subprocess with raw text parsing**: Using `--output-format text` and parsing freeform output. Rejected — fragile, no schema validation.

## Decision 2: Prompt Strategy

**Decision**: Custom system prompt via `--system-prompt` flag (full replacement of default Claude Code prompt). User message contains the raw Chinese text.

**Rationale**: Claude Code's default system prompt instructs it to be a coding assistant with tool access. For text segmentation, we need a focused language processing tool with no tools. `--system-prompt` replaces the default entirely, and `--max-turns 1` ensures no tool use even if tools were somehow available.

**Alternatives considered**:
- `--append-system-prompt`: Keeps Claude Code defaults, adds our instructions on top. Rejected — unnecessary complexity, default prompt is irrelevant.
- Pipe text to stdin: `echo "text" | claude -p "segment this"`. Rejected — less control over prompt structure, harder to include system prompt.

## Decision 3: Async Command in Rust

**Decision**: Use `tokio::process::Command` inside an `async` Tauri command for non-blocking CLI execution.

**Rationale**: Processing takes 10-60 seconds. A synchronous `std::process::Command` would block the Tauri event loop, freezing the UI. Tauri 2 runs on tokio and natively supports async commands. `tokio::process::Command` integrates cleanly with the existing async runtime.

**Alternatives considered**:
- `std::process::Command` in sync command: Would block UI thread for 10-60s. Rejected.
- `std::thread::spawn` with sync command: Works but more manual than async. Rejected — tokio already available.
- Frontend-side `tauri-plugin-shell`: Would keep all logic in TypeScript. Rejected — domain logic belongs in backend per DDD (constitution III).

## Decision 4: View State Machine

**Decision**: Replace `"saved"` with `"processing"` in `AppView`. `AppView = "empty" | "input" | "processing" | "reading"`.

**Rationale**: The "saved" state from 015 was explicitly a placeholder ("SavedState is a transitional component — will be replaced when LLM integration (016) adds segment generation"). The "processing" state covers both active processing (spinner) and the fallback on app restart (text saved but not yet processed — shows retry/process button).

**Alternatives considered**:
- Keep "saved" + add "processing" (5 states): More states, more transitions, more complexity. The "saved without processing" case is identical to "processing not yet started". Rejected — YAGNI.
- Keep "saved" and add processing logic inside it: Confusing naming — "saved" doesn't describe what the user sees. Rejected — clarity matters.

## Decision 5: Timeout and Retry

**Decision**: 120-second timeout per CLI invocation. On timeout or failure, show error message with retry button. No automatic retry.

**Rationale**: 60s is the target for 500 characters (SC-001), but long texts or slow connections may take longer. 120s provides headroom. Automatic retry risks infinite loops on persistent failures. User-triggered retry gives control.

**Alternatives considered**:
- 60s timeout: Too tight — Claude CLI has startup overhead + network latency. Rejected.
- Automatic retry (up to 3): Risks burning through rate limits on persistent failures. Rejected.
- No timeout: Process could hang indefinitely. Rejected.

## Decision 6: JSON Schema for Structured Output

**Decision**: Use `--json-schema` flag with a schema matching `TextSegment[]` to get validated structured output from `.structured_output` field.

**Rationale**: The `--json-schema` flag makes Claude Code validate the response against the schema. The validated data is in the `.structured_output` field of the JSON response. This eliminates manual JSON parsing and validation — if `.structured_output` exists and is non-null, it's guaranteed to match the schema.

**Alternatives considered**:
- Parse `.result` as raw JSON: No schema validation, fragile. Rejected.
- Post-process with manual validation: Redundant if `--json-schema` handles it. Rejected.

## Decision 7: Testing Strategy

**Decision**: Test pure functions (prompt building, response parsing) in Docker via cargo test. Mock `process_text` invoke in frontend vitest tests. No E2E CLI test in Docker.

**Rationale**: Claude CLI requires Anthropic authentication and network. Docker containers don't have this. The testable surface is: (1) prompt string construction, (2) JSON response parsing into TextSegment[], (3) frontend view transitions. All three are testable without the real CLI.

**Alternatives considered**:
- Install Claude CLI in Docker image: Requires auth tokens in Docker, huge image size, network in CI. Rejected — excessive for a personal desktop app.
- Mock `claude` binary in Docker: Script that returns canned JSON. Possible but adds complexity for marginal value. Rejected — pure function tests cover the important logic.
