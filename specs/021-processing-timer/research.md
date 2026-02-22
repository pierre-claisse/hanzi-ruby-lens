# Research: Processing Elapsed Timer

**Branch**: `021-processing-timer` | **Date**: 2026-02-22

## Decision 1: Timer Implementation Strategy

**Decision**: Use a custom `useElapsedTime(isRunning: boolean)` hook with `setInterval` at 1-second cadence, returning the elapsed seconds as a number.

**Rationale**: This is the simplest approach that meets the ±1s accuracy requirement. React's `useState` + `setInterval` is the standard pattern for second-precision counters. No external library needed — the project already uses this pattern style in existing hooks (e.g., `useTextZoom`, `useTheme`).

**Alternatives considered**:
- `requestAnimationFrame` loop — overkill for 1s precision, wastes CPU cycles.
- `Date.now()` delta on each tick — slightly more accurate for long durations but adds unnecessary complexity for a display that only shows whole seconds.
- External timer library (e.g., `use-timer`) — adds a dependency for trivial logic; violates Principled Simplicity.

## Decision 2: Time Formatting

**Decision**: Pure function `formatElapsed(seconds: number): string` that returns `"Xs"` for <60s and `"Xm Ys"` for >=60s. Exported from the hook file for direct unit testing.

**Rationale**: Simple integer division and modulo. No need for a date/time library. The format matches the user's examples ("36s", "1m 24s").

**Alternatives considered**:
- `Intl.DurationFormat` — not widely supported yet, and formatting is trivial.
- Displaying hours (e.g., "1h 2m 3s") — YAGNI; processing never takes hours.

## Decision 3: Hook API Design

**Decision**: `useElapsedTime(isRunning: boolean)` returns `{ elapsed: number, formatted: string }`. The hook auto-resets to 0 when `isRunning` transitions from `false` to `true`.

**Rationale**: The `isProcessing` boolean from `useTextLoader` already drives the processing view. Passing it directly to `useElapsedTime` keeps the API minimal and the wiring in `App.tsx` trivial. Auto-reset on `false→true` transition handles both retry and new submission without extra props.

**Alternatives considered**:
- Manual `reset()` function — requires explicit call sites, easy to forget on retry.
- Timer inside `ProcessingState` component — couples timer lifecycle to component mount/unmount rather than processing state; less testable.
