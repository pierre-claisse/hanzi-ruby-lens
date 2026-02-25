# Research: Timestamps, Sort Persistence & System Theme

**Feature Branch**: `030-timestamps-sort-theme`
**Date**: 2026-02-25

## R1: Timestamp Storage and Display

**Decision**: Keep existing ISO 8601 storage format (`%Y-%m-%dT%H:%M:%S`); change display only.

**Rationale**: The database already stores `created_at` with full time precision via `Local::now().format("%Y-%m-%dT%H:%M:%S")` in `insert_text()`. The current `TextPreviewCard` uses `toLocaleDateString()` which strips the time. Changing the format function to show `YYYY-MM-DD HH:mm` is sufficient — no database migration needed for creation timestamps.

**Alternatives considered**:
- Store as UNIX timestamp: Rejected — ISO strings are human-readable in DB inspection and already established.
- Store with seconds: Current format includes seconds but display omits them per spec (HH:mm only).

## R2: Last Modified Column

**Decision**: Add nullable `modified_at TEXT` column to the `texts` table via `ALTER TABLE` in `initialize()`.

**Rationale**: SQLite supports `ALTER TABLE ... ADD COLUMN` for adding nullable columns to existing tables. Existing rows get `NULL` by default, which maps cleanly to `Option<String>` in Rust and `string | null` in TypeScript. The three correction functions (`update_segments`, `split_segment_db`, `merge_segments_db`) each need a single extra `UPDATE texts SET modified_at = ? WHERE id = ?` after their main operation.

**Alternatives considered**:
- Separate `text_modifications` table with history: Rejected — YAGNI; we only need the latest modification time.
- Trigger-based approach: Rejected — explicit updates in each function are simpler and more transparent.

## R3: Sort Persistence

**Decision**: Persist `sortAsc` boolean to localStorage, following the `useColorPalette` pattern.

**Rationale**: The existing `useColorPalette.ts` hook uses `localStorage.getItem("colorPalette")` in a lazy `useState` initializer and `localStorage.setItem()` in a `useEffect`. This is the established pattern in the codebase. The sort preference is a simple boolean — store as `"true"` or `"false"` string under key `"sortAsc"`.

**Alternatives considered**:
- Store in SQLite: Rejected — this is a UI preference, not domain data. localStorage is appropriate.
- Store alongside other preferences in a single JSON object: Rejected — current pattern uses individual keys; consistency trumps consolidation.

## R4: System Theme Detection

**Decision**: Replace localStorage-based theme persistence with `window.matchMedia("(prefers-color-scheme: dark)")` for initial detection and live monitoring.

**Rationale**: The CSS media query API is universally supported in modern browsers (including Tauri's WebView2 on Windows). `matchMedia` returns a `MediaQueryList` with a `.matches` boolean and an `addEventListener("change", callback)` method for live updates. This replaces the current `useTheme` hook's localStorage read/write with:
1. Initial state from `matchMedia.matches`
2. `useEffect` with `addEventListener("change", ...)` for live OS changes
3. Manual toggle still calls `setTheme()` but no localStorage write
4. OS change overrides manual toggle by re-reading `matchMedia.matches`

**Alternatives considered**:
- CSS `@media (prefers-color-scheme: dark)` only: Rejected — Tailwind uses `darkMode: "selector"` (class-based), so we need JS to toggle the `.dark` class.
- Tauri's window theme API: Considered but unnecessary — the browser's `matchMedia` works correctly in WebView2 and is simpler.

## R5: Details Tooltip UX

**Decision**: Use a native `title` attribute or custom CSS tooltip on an Info icon (from lucide-react) for the details hover.

**Rationale**: A lightweight CSS tooltip avoids adding a tooltip library dependency. The Info icon from lucide-react is already available (the project uses lucide-react extensively). The tooltip shows 1-2 lines of text (created date, optionally modified date) — simple enough for a CSS-only approach.

**Alternatives considered**:
- Native `title` attribute: Simplest but poor styling control and slow appearance delay.
- Radix/Headless UI tooltip: Rejected — adds dependency for a simple hover text.
- Custom CSS tooltip with `::after` pseudo-element: Selected — lightweight, consistent with existing UI patterns, no new dependencies.
