# Research: Disable Context Menu (010-disable-context-menu)

**Date**: 2026-02-13

## No Unknowns

No NEEDS CLARIFICATION items were identified in the Technical Context. This feature has a well-established implementation pattern.

## Decision: Document-Level contextmenu Event Listener

**Decision**: Use a document-level `contextmenu` event listener with `preventDefault()` in a React `useEffect` hook in App.tsx.

**Rationale**: This is the standard web approach for suppressing the browser context menu. It follows the identical pattern already used in App.tsx for Space key suppression (document-level `keydown` listener). A single listener on `document` covers all elements — no per-component handling needed.

**Alternatives considered**:

| Alternative | Why Rejected |
|-------------|--------------|
| Tauri `tauri.conf.json` `withGlobalTauri` / webview config | Tauri 2 doesn't expose a simple config flag to disable the context menu. Would require Rust-side changes for a trivial frontend concern. |
| CSS `pointer-events` manipulation | Would break left-click and other pointer interactions (violates FR-003). |
| Per-component `onContextMenu` props | Violates Principled Simplicity. Would require touching every component. The document-level approach covers everything with one listener. |
| `<body oncontextmenu="return false">` in index.html | Works but is not React-idiomatic. Cannot be cleaned up on unmount. Inconsistent with existing patterns in App.tsx. |
