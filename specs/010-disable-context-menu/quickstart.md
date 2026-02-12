# Quickstart: Disable Context Menu (010-disable-context-menu)

**Date**: 2026-02-13

## Overview

Suppress the default browser context menu on right-click across the entire application. Single document-level `contextmenu` event listener in App.tsx, following the existing Space key suppression pattern.

## Modified Files

| File | Change |
|------|--------|
| `src/App.tsx` | Add `useEffect` with document-level `contextmenu` event listener |

## Implementation Pattern

Add a `useEffect` in App.tsx alongside the existing Space key suppression:

```typescript
// Suppress context menu on right-click (FR-001)
useEffect(() => {
  const handler = (e: MouseEvent) => {
    e.preventDefault();
  };
  document.addEventListener("contextmenu", handler);
  return () => document.removeEventListener("contextmenu", handler);
}, []);
```

This follows the identical structure as the Space key suppression already in App.tsx:

```typescript
// Suppress Space key on all buttons (FR-028 from 009)
useEffect(() => {
  const handler = (e: KeyboardEvent) => {
    if (e.key === " " && e.target instanceof HTMLButtonElement) {
      e.preventDefault();
    }
  };
  document.addEventListener("keydown", handler);
  return () => document.removeEventListener("keydown", handler);
}, []);
```

## Key Details

- **No conditional logic**: Every `contextmenu` event is suppressed unconditionally (blanket suppression per spec)
- **No new files**: Single modification to existing App.tsx
- **No new dependencies**: Uses standard DOM API
- **No test changes**: Existing test suite unaffected (button count unchanged, no new components)
- **Cleanup on unmount**: `removeEventListener` in the effect cleanup function
