# Data Model: Processing Elapsed Timer

**Branch**: `021-processing-timer` | **Date**: 2026-02-22

## Summary

No data model changes. This feature is entirely ephemeral UI state — no entities, database columns, or persisted state are added or modified.

## Ephemeral State

| State | Type | Scope | Lifecycle |
|-------|------|-------|-----------|
| `elapsed` | `number` (seconds) | `useElapsedTime` hook | Created when `isRunning` becomes `true`; reset to 0 on each `false→true` transition; incremented every 1s while running; frozen when `isRunning` becomes `false` |
| `formatted` | `string` | Derived from `elapsed` | Recomputed on each `elapsed` change via `formatElapsed()` |

## Existing Entities (unchanged)

- **Text**: No changes.
- **Word / TextSegment**: No changes.
- **SQLite schema**: No changes.
